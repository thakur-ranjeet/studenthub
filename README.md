# StudentHub: React frontend for the secured Student microservices

React 19 + Vite dashboard for the `StudentHUB encripted with security` backend
(Eureka, API gateway with JWT login, Student service, Course service, Notification service).

## Features
- **Sign in / Register** with the gateway's JWT auth. The token is attached to every request as `Authorization: Bearer ...`
- **Role-based UI** (the gateway is what really enforces it)
  - `ROLE_ADMIN`: dashboard with statistics, full student CRUD, add/edit courses, enrolled students per course
  - `ROLE_STUDENT`: read-only course list; student records and enrolments are hidden
- Automatic sign-out when the token expires (30 minutes) or the gateway answers `401`, with a "session expired" notice
- Search and course filter, validation, toasts, loading / empty / error states, dark and light themes, responsive layout

## Run it

1. **Infrastructure** (from `APIGateway1/docker-compose.yml`): `docker compose up -d` starts Zookeeper, Kafka (9092), Kafka UI (8080) and Redis (6379). MySQL must also be running with the databases `Studentdb`, `coursedb` and `microservices_auth_db`.
2. **Backend**, in this order: `EurekaServer1` (8762), `StudentAuthenticationService` (8081), `CourseService` (8082), `NotificationService` (8084), `APIGateway1` (8083).
3. **Frontend**:
   ```bash
   npm install
   npm run dev        # http://localhost:3000
   ```

The dev server proxies `/api/...` to `http://localhost:8083` (see `vite.config.js`), so there are no CORS problems while developing.
Use `VITE_GATEWAY_URL=http://host:8083 npm run dev` to point at another gateway.

### Creating the first admin
In `npm run dev` the register page has a **Role** dropdown (Student / Admin), so just register an admin there.
Production builds hide the dropdown. To create an admin from the command line:

```bash
curl -X POST http://localhost:8083/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"choose-a-password","role":"ROLE_ADMIN"}'
```

## API used (all through the gateway on 8083)

| Action | Request | Who |
|---|---|---|
| Register / login | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` → `{ token }` | public |
| List / add / update / delete students | `GET /api/v1/students/allStudent`, `POST .../add`, `PUT .../update/{sid}`, `DELETE .../delete/{sid}` | admin (403 otherwise) |
| List courses | `GET /api/v1/courses/allcourses` | any signed-in user |
| Add / edit course | `POST /api/v1/courses/add` (saves by `cid`) | any signed-in user at the backend; the UI shows it to admins only |
| Course + students | `GET /api/v1/courses/courseswithstudent/{cid}` | any signed-in user at the backend; the UI shows students to admins only |

Student: `{ sid, sname, crsId, smail, password }` · Course: `{ cid, cname, duration }` · JWT claims: `sub` (username), `role`, `exp`.

## Structure

```
src/
  auth/         store.js (token, expiry timer, sessionStorage)
  api/          client.js (fetch + Bearer header + 401 handling), index.js (endpoints)
  hooks/        useAuth, useResource, useHashRoute
  components/   Layout, Modal, forms, toasts, states, icons
  pages/        Auth, Dashboard, Students, Courses, CourseDetail
```

Routing uses the URL hash (`#/students`, `#/courses/2`), so the built site works on any static host without rewrites.

## Production build

```bash
VITE_API_BASE_URL=http://localhost:8083 npm run build && npm run preview
```
A frontend served from another origin needs the gateway CORS fix below.

## Backend issues worth fixing

1. **Anyone can register as an admin.** `/auth/register` accepts `role` from the request body. Ignore it on the server: always create `ROLE_STUDENT`, and promote admins in the database.
2. **Course endpoints leak student data.** The gateway blocks `/api/v1/students/**` for non-admins, but `/api/v1/courses/courseswithstudent/{cid}` returns the same students (including passwords) to any signed-in user. Restrict it to admins in `AuthenticationFilter`, and return a DTO without `password`.
3. **Gateway CORS blocks the token.** `allowedHeaders` only lists `content-type`, so a browser on another origin cannot send `Authorization`. Use `allowedHeaders: "*"` (and a real `allowedOrigins` instead of `*`). The dev proxy hides this.
4. **Stale course name after editing.** `CourseServiceImpl.addCourse` evicts the `allcourses` cache but not the `courses` cache used by `getCourse`, so the course detail page can show the old name for up to 10 minutes (Redis TTL). Use `@Caching(evict = {...})` for both caches.
5. **Student passwords are still plain text** in `Studentdb` and returned by `GET`. Only the login accounts (`user_credentials`) use BCrypt.
6. **Secrets in the repo.** The MySQL root password is in every `application.properties` and in `APIGateway1/application.yml`, and the JWT secret has a hard-coded default in `JwtUtil`. Move both to environment variables, change the password, and generate a new JWT secret.
7. **Missing course returns 500** because `ApiError` has no getters. Add them to get a clean 404 body.

## Demo mode (no server needed)

The live GitHub Pages site runs in **demo mode**. A small in-browser backend (`src/demo/`) answers the same API
URLs as the Spring Boot gateway, so every page works without a server:

- Create an account, sign in, and use **Forgot password** (a simulated inbox shows the reset e-mail and link).
- Browse courses, use the wishlist and cart, pay through a **simulated** Razorpay window, see orders and receipts.
- "Try as Admin" shows students, courses, all orders and refunds.
- Data is stored only in the visitor's browser (localStorage). Use "Reset demo" in the notice to start over.

The real backend (Spring Boot microservices) lives in the separate `studenthub-backend` repository.
To run against it instead, set `VITE_API_BASE_URL` and leave `VITE_DEMO_MODE` unset.

Demo logins: `admin` / `Admin@123` and `student` / `Student@123`.
