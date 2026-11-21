// Sample data for the demo mode. Everything here is made up.
// Prices are in rupees. Durations are free text, like the real backend.

const mod = (title, summary, duration, lessons) => ({ title, summary, duration, lessons });

export const COURSES = [
  { cid: 1, cname: 'Java Full Stack Development', duration: '16 weeks', price: 4999 },
  { cid: 2, cname: 'Python for Beginners', duration: '8 weeks', price: 2499 },
  { cid: 3, cname: 'React and Modern Frontend', duration: '10 weeks', price: 3999 },
  { cid: 4, cname: 'Data Structures and Algorithms', duration: '12 weeks', price: 3499 },
  { cid: 5, cname: 'SQL and Database Design', duration: '6 weeks', price: 1999 },
  { cid: 6, cname: 'Spring Boot Microservices', duration: '12 weeks', price: 5499 },
];

export const DETAILS = {
  1: {
    tagline: 'Build complete web applications with Java, Spring Boot and React',
    level: 'Intermediate', language: 'English', instructor: 'Anita Verma',
    description: 'This course takes you from solid Java fundamentals to a deployed full stack application.\n\nYou will build a REST API with Spring Boot and MySQL, then a React front end that talks to it, and finish with a capstone project you can show in interviews.',
    prerequisites: 'Basic programming knowledge in any language.',
    outcomes: ['Write clean object-oriented Java', 'Design and build REST APIs with Spring Boot', 'Model data with JPA and MySQL', 'Build a React front end that uses your API'],
    audience: ['Students preparing for a software job', 'Developers moving to the Java stack'],
    modules: [
      mod('Java essentials', 'Syntax, classes and collections.', '3 weeks', ['Variables and control flow', 'Classes and interfaces', 'Collections and generics', 'Exceptions and streams']),
      mod('Spring Boot REST APIs', 'Controllers, services and validation.', '4 weeks', ['Your first REST controller', 'Dependency injection', 'Validation and error handling', 'Security with JWT']),
      mod('Databases with JPA', 'Entities, repositories and queries.', '4 weeks', ['Entities and relationships', 'Spring Data repositories', 'Transactions', 'Caching with Redis']),
      mod('React front end', 'Components, state and API calls.', '3 weeks', ['Components and props', 'State and effects', 'Calling the API', 'Deploying the app']),
    ],
  },
  2: {
    tagline: 'Learn Python from scratch and write real programs',
    level: 'Beginner', language: 'English', instructor: 'Rohan Mehta',
    description: 'A friendly start to programming. Every lesson ends with a small exercise so you practise as you learn.\n\nBy the end you will have written a command-line tool and a small data analysis script.',
    prerequisites: 'None. You only need a computer.',
    outcomes: ['Write and run your own Python programs', 'Use lists, dictionaries and functions', 'Read and write files', 'Analyse a small data set'],
    audience: ['Complete beginners', 'Students who want a first programming language'],
    modules: [
      mod('Getting started', 'Install Python and run your first script.', '1 week', ['Installing Python', 'Variables and types', 'Input and output']),
      mod('Control flow and functions', 'Decisions, loops and reusable code.', '3 weeks', ['If statements', 'Loops', 'Functions', 'Modules and imports']),
      mod('Data structures', 'Lists, tuples, dictionaries and sets.', '2 weeks', ['Lists and tuples', 'Dictionaries', 'Sets', 'Comprehensions']),
      mod('Files and mini project', 'Work with files and build a tool.', '2 weeks', ['Reading and writing files', 'Handling errors', 'Project: expense tracker']),
    ],
  },
  3: {
    tagline: 'Build fast, modern interfaces with React',
    level: 'Intermediate', language: 'English', instructor: 'Kavya Nair',
    description: 'Learn how professional teams build user interfaces today: components, hooks, routing, forms and data fetching.\n\nYou will build and deploy a multi-page dashboard.',
    prerequisites: 'HTML, CSS and basic JavaScript.',
    outcomes: ['Build reusable React components', 'Manage state with hooks', 'Handle forms and validation', 'Fetch data and show loading and error states'],
    audience: ['Web developers upgrading their skills', 'Students building a portfolio'],
    modules: [
      mod('Components and props', 'Think in components.', '2 weeks', ['JSX', 'Props and children', 'Lists and keys']),
      mod('State and hooks', 'useState, useEffect and custom hooks.', '3 weeks', ['useState', 'useEffect', 'Custom hooks', 'Context']),
      mod('Routing and forms', 'Multiple pages and user input.', '2 weeks', ['Client-side routing', 'Controlled forms', 'Validation']),
      mod('Data and deployment', 'Talk to an API and ship the app.', '3 weeks', ['Fetching data', 'Error and loading states', 'Building and deploying']),
    ],
  },
  4: {
    tagline: 'Master the problem-solving skills that interviews test',
    level: 'Intermediate', language: 'English', instructor: 'Sandeep Rao',
    description: 'A structured path through the data structures and algorithms that come up in technical interviews.\n\nEach topic has a short lesson, worked examples and practice problems that grow in difficulty.',
    prerequisites: 'Comfort in one programming language.',
    outcomes: ['Analyse time and space complexity', 'Use arrays, hash maps, stacks and queues', 'Solve problems with trees and graphs', 'Apply recursion and dynamic programming'],
    audience: ['Students preparing for placements', 'Developers practising for interviews'],
    modules: [
      mod('Complexity and arrays', 'Big-O and array techniques.', '2 weeks', ['Big-O notation', 'Two pointers', 'Sliding window']),
      mod('Hashing, stacks and queues', 'Fast lookups and ordering.', '3 weeks', ['Hash maps', 'Stacks', 'Queues', 'Monotonic stack']),
      mod('Trees and graphs', 'Hierarchies and networks.', '4 weeks', ['Binary trees', 'Binary search trees', 'Graph traversal BFS and DFS', 'Shortest paths']),
      mod('Recursion and dynamic programming', 'Break problems into smaller ones.', '3 weeks', ['Recursion', 'Memoisation', 'Classic DP problems']),
    ],
  },
  5: {
    tagline: 'Query and design relational databases with confidence',
    level: 'Beginner', language: 'English', instructor: 'Meera Pillai',
    description: 'Learn SQL by doing. You will write queries from day one and learn how to design tables that stay clean as an application grows.',
    prerequisites: 'None.',
    outcomes: ['Write SELECT queries with joins and grouping', 'Design normalised tables', 'Use indexes to speed up queries', 'Understand transactions'],
    audience: ['Beginners', 'Developers who want stronger database skills'],
    modules: [
      mod('Querying data', 'SELECT, WHERE and ORDER BY.', '2 weeks', ['SELECT basics', 'Filtering and sorting', 'Aggregates and GROUP BY']),
      mod('Joins and subqueries', 'Combine tables.', '2 weeks', ['Inner and outer joins', 'Subqueries', 'Set operations']),
      mod('Design and performance', 'Schemas, indexes and transactions.', '2 weeks', ['Normalisation', 'Indexes', 'Transactions']),
    ],
  },
  6: {
    tagline: 'Design and run a real microservices system',
    level: 'Advanced', language: 'English', instructor: 'Anita Verma',
    description: 'Build a system of small services that talk to each other: an API gateway, service discovery, event streaming and caching.\n\nThe course project is the same architecture used by StudentHub.',
    prerequisites: 'Spring Boot basics and SQL.',
    outcomes: ['Split an application into services', 'Route and secure traffic with an API gateway', 'Use Eureka for service discovery', 'Publish and consume events with Kafka', 'Cache hot data with Redis'],
    audience: ['Backend developers', 'Engineers preparing for system design interviews'],
    modules: [
      mod('Microservice foundations', 'Why and when to split.', '2 weeks', ['Monolith vs microservices', 'Service boundaries', 'Data per service']),
      mod('Gateway and discovery', 'One front door for many services.', '3 weeks', ['Spring Cloud Gateway', 'Eureka service discovery', 'JWT at the gateway']),
      mod('Events and caching', 'Asynchronous communication.', '4 weeks', ['Kafka producers and consumers', 'Redis caching', 'Idempotent consumers']),
      mod('Docker and deployment', 'Run it all.', '3 weeks', ['Dockerfiles', 'Docker Compose', 'HTTPS with a reverse proxy']),
    ],
  },
};

export const STUDENTS = [
  { sid: 1, sname: 'Priya Sharma', smail: 'priya.sharma@example.com', crsId: 1 },
  { sid: 2, sname: 'Arjun Patel', smail: 'arjun.patel@example.com', crsId: 1 },
  { sid: 3, sname: 'Meera Iyer', smail: 'meera.iyer@example.com', crsId: 2 },
  { sid: 4, sname: 'Rahul Verma', smail: 'rahul.verma@example.com', crsId: 3 },
  { sid: 5, sname: 'Sneha Reddy', smail: 'sneha.reddy@example.com', crsId: 4 },
  { sid: 6, sname: 'Karan Singh', smail: 'karan.singh@example.com', crsId: 3 },
  { sid: 7, sname: 'Divya Nair', smail: 'divya.nair@example.com', crsId: 5 },
  { sid: 8, sname: 'Aman Gupta', smail: 'aman.gupta@example.com', crsId: 6 },
];

// Accounts you can sign in to with one click. The others only exist so the admin order list has data.
export const DEMO_ACCOUNTS = {
  admin: { username: 'admin', password: 'Admin@123', email: 'admin@studenthub.demo', role: 'ROLE_ADMIN' },
  student: { username: 'student', password: 'Student@123', email: 'student@studenthub.demo', role: 'ROLE_STUDENT' },
};

export const SAMPLE_BUYERS = ['priya', 'arjun', 'meera'];
