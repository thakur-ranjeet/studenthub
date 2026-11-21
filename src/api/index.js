import { request } from './client.js';

// Student service  ->  /api/v1/students/**  (gateway route STUDENT-SERVICE)
export const studentsApi = {
  list: () => request('/api/v1/students/allStudent'),
  get: (sid) => request(`/api/v1/students/${sid}`),
  byCourse: (cid) => request(`/api/v1/students/allStudentofcrs/${cid}`),
  // add / delete return the full list of students, update returns the updated student
  add: (student) => request('/api/v1/students/add', { method: 'POST', body: student }),
  update: (sid, student) => request(`/api/v1/students/update/${sid}`, { method: 'PUT', body: student }),
  remove: (sid) => request(`/api/v1/students/delete/${sid}`, { method: 'DELETE' }),
};

// Course service  ->  /api/v1/courses/**  (gateway route COURSE-SERVICE)
export const coursesApi = {
  list: () => request('/api/v1/courses/allcourses'),
  // The backend has no auto-generated id: POST /add saves by cid, so an existing cid is overwritten (used for editing).
  save: (course) => request('/api/v1/courses/add', { method: 'POST', body: course }),
  // returns { crs: {cid, cname, duration}, studentList: [...] } (studentList is missing if the Student service is down)
  withStudents: (cid) => request(`/api/v1/courses/courseswithstudent/${cid}`),
  // course page content: tagline, description, level, language, instructor, outcomes, audience, modules
  details: (cid) => request(`/api/v1/courses/${cid}/details`),
  saveDetails: (cid, details) => request(`/api/v1/courses/${cid}/details`, { method: 'PUT', body: details }),
  // small facts for the course cards: [{ cid, tagline, level, moduleCount, lessonCount }]
  summaries: () => request('/api/v1/courses/details-summary'),
};

// Auth endpoints on the gateway (open routes, no token needed)
export const authApi = {
  login: (username, password) => request('/api/v1/auth/login', { method: 'POST', body: { username, password }, auth: false }),
  register: (payload) => request('/api/v1/auth/register', { method: 'POST', body: payload, auth: false }),
  // Forgot password: step 1 asks for a link (always the same answer), step 2 sets the new password with the token from the e-mailed link
  forgotPassword: (identifier) => request('/api/v1/auth/forgot-password', { method: 'POST', body: { identifier }, auth: false }),
  resetPassword: (token, password) => request('/api/v1/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
  sendHelp: (payload) => request('/api/v1/auth/help', { method: 'POST', body: payload }),
};

// Order service (wishlist + cart)  ->  /api/v1/shop/**  (JWT required, user comes from the token)
const shop = '/api/v1/shop';
export const shopApi = {
  state: () => request(`${shop}/state`), // { wishlist: [courseId], cart: [courseId] }
  wishlist: () => request(`${shop}/wishlist`),
  addWishlist: (cid) => request(`${shop}/wishlist/${cid}`, { method: 'POST' }),
  removeWishlist: (cid) => request(`${shop}/wishlist/${cid}`, { method: 'DELETE' }),
  moveToCart: (cid) => request(`${shop}/wishlist/${cid}/move-to-cart`, { method: 'POST' }),
  cart: () => request(`${shop}/cart`), // { items, total, currency, count }
  addCart: (cid) => request(`${shop}/cart/${cid}`, { method: 'POST' }),
  removeCart: (cid) => request(`${shop}/cart/${cid}`, { method: 'DELETE' }),
  clearCart: () => request(`${shop}/cart`, { method: 'DELETE' }),
  // payment
  config: () => request(`${shop}/config`), // { keyId, mode: 'test' | 'live' }
  checkout: () => request(`${shop}/checkout`, { method: 'POST' }), // creates the order on the server
  verify: (payment) => request(`${shop}/checkout/verify`, { method: 'POST', body: payment }),
  orders: () => request(`${shop}/orders`),
  myCourses: () => request(`${shop}/my-courses`),
  adminOrders: () => request(`${shop}/admin/orders`),
  receipt: (id) => request(`${shop}/orders/${id}/receipt`),
  refund: (id) => request(`${shop}/admin/orders/${id}/refund`, { method: 'POST' }),
  syncRefund: (id) => request(`${shop}/admin/orders/${id}/refund/sync`, { method: 'POST' }),
  refundMyOrder: (id) => request(`${shop}/orders/${id}/refund`, { method: 'POST' }),
  syncMyRefund: (id) => request(`${shop}/orders/${id}/refund/sync`, { method: 'POST' }),
};

// Chat assistant  ->  /api/v1/chat/**  (gateway route CHATBOT-SERVICE, JWT required)
// history = the earlier turns, [{ role: 'user' | 'assistant', text }]. Returns { reply, links: [{label, href}], suggestions: [], mode }.
export const chatApi = {
  send: (message, history = []) => request('/api/v1/chat/message', { method: 'POST', body: { message, history }, timeoutMs: 30000 }),
};

// AI features  ->  /api/v1/ai/**  (same gateway route as the chat). Drafts and quizzes can take a while, so longer time limits.
export const aiApi = {
  draftCourse: (courseId, notes) => request('/api/v1/ai/course-draft', { method: 'POST', body: { courseId: Number(courseId), notes }, timeoutMs: 90000 }),
  recommend: (text) => request('/api/v1/ai/recommend', { method: 'POST', body: { text }, timeoutMs: 40000 }),
  search: (text) => request('/api/v1/ai/search', { method: 'POST', body: { text }, timeoutMs: 40000 }),
  quiz: (courseId, moduleNo, count = 5) => request('/api/v1/ai/quiz', { method: 'POST', body: { courseId: Number(courseId), moduleNo, count }, timeoutMs: 70000 }),
  explain: (courseId, topic) => request('/api/v1/ai/explain', { method: 'POST', body: { courseId: Number(courseId), topic }, timeoutMs: 40000 }),
};
