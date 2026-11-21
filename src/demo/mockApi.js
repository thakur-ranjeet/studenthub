// Demo mode: a tiny "backend" that runs inside the browser, so the site works on GitHub Pages with no server.
// Accounts, courses, carts and orders are kept in this browser's localStorage. Nothing is sent anywhere.
// It answers the same URLs and returns the same JSON shapes as the real Spring Boot gateway.
import { COURSES, DETAILS, STUDENTS, DEMO_ACCOUNTS, SAMPLE_BUYERS } from './seed.js';

// Plain `import.meta.env.VITE_DEMO_MODE` is what Vite replaces at build time. The try/catch only matters when this
// file is run outside Vite (for example in a Node test), where import.meta.env does not exist.
function readDemoFlag() {
  try { return import.meta.env.VITE_DEMO_MODE === 'true'; } catch { return false; }
}
export const DEMO = readDemoFlag();

const KEY = 'studenthub.demo.v1';
const TOKEN_HOURS = 4;
const RESET_MINUTES = 30;
const memory = {};
let delayMs = 150;
let cache = null;

export const setDemoDelay = (ms) => { delayMs = ms; };

/* ---------- storage ---------- */
function readStore() {
  try { return localStorage.getItem(KEY); } catch { return memory[KEY] ?? null; }
}
function writeStore(text) {
  try { localStorage.setItem(KEY, text); } catch { memory[KEY] = text; }
}
function save() { writeStore(JSON.stringify(cache)); }

export function resetDemoData() {
  cache = null;
  delete memory[KEY];
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  try { sessionStorage.removeItem('studenthub.token'); } catch { /* ignore */ }
}

/* ---------- small helpers ---------- */
const fail = (status, message) => Object.assign(new Error(message), { status });
const clone = (x) => JSON.parse(JSON.stringify(x));
const nowIso = () => new Date().toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();
const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  (globalThis.crypto || {}).getRandomValues?.(a);
  if (!globalThis.crypto?.getRandomValues) for (let i = 0; i < bytes; i += 1) a[i] = Math.floor(Math.random() * 256);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Passwords are salted and hashed even in the demo. Never type a real password into a demo site.
async function hashPassword(password, salt) {
  const text = `${salt}:${password}`;
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 2166136261; // fallback for very old browsers: FNV-1a
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return String(h >>> 0);
}

const b64url = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const makeToken = (user) => `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + TOKEN_HOURS * 3600 })}.demo`;
function parseToken(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const c = JSON.parse(decodeURIComponent(escape(atob(part + '='.repeat((4 - (part.length % 4)) % 4)))));
    return c.exp * 1000 > Date.now() ? { username: c.sub, role: c.role } : null;
  } catch { return null; }
}

/* ---------- database ---------- */
async function makeUser(username, password, email, role) {
  const salt = randomHex(8);
  return { username, email, role, salt, hash: await hashPassword(password, salt) };
}

function makeOrder(db, username, courseIds, status, ago) {
  const items = courseIds.map((id) => {
    const c = db.courses.find((x) => x.cid === id);
    return { courseId: id, cname: c.cname, price: c.price };
  });
  const order = {
    id: db.nextOrderId, username, status, refundStatus: null,
    createdAt: daysAgo(ago), paidAt: status === 'PAID' ? daysAgo(ago) : null, refundedAt: null,
    total: items.reduce((a, i) => a + Number(i.price), 0), currency: 'INR', items,
    razorpayOrderId: `order_demo_${randomHex(7)}`, paymentId: status === 'PAID' ? `pay_demo_${randomHex(7)}` : null,
  };
  db.nextOrderId += 1;
  db.orders.push(order);
  if (status === 'PAID') courseIds.forEach((id) => db.enrollments.push({ username, courseId: id, orderId: order.id, enrolledAt: order.paidAt }));
  return order;
}

async function seed() {
  const db = {
    v: 1, courses: clone(COURSES), details: clone(DETAILS), students: STUDENTS.map((s) => ({ ...s })),
    nextSid: STUDENTS.length + 1, users: [], wishlist: {}, cart: {}, orders: [], enrollments: [], nextOrderId: 1001,
    resets: [], inbox: [], help: [],
  };
  const { admin, student } = DEMO_ACCOUNTS;
  db.users.push(await makeUser(admin.username, admin.password, admin.email, admin.role));
  db.users.push(await makeUser(student.username, student.password, student.email, student.role));
  // sample customers that exist only to fill the admin order list; nobody can sign in as them
  for (const name of SAMPLE_BUYERS) db.users.push(await makeUser(name, randomHex(12), `${name}@example.com`, 'ROLE_STUDENT'));
  makeOrder(db, 'priya', [1, 3], 'PAID', 12);
  makeOrder(db, 'arjun', [2], 'PAID', 5);
  makeOrder(db, 'meera', [4], 'PAID', 2);
  makeOrder(db, 'arjun', [6], 'CREATED', 1);
  return db;
}

async function getDb() {
  if (cache) return cache;
  const text = readStore();
  if (text) {
    try { cache = JSON.parse(text); if (cache?.v === 1) return cache; } catch { /* fall through and reseed */ }
  }
  cache = await seed();
  save();
  return cache;
}

/* ---------- views ---------- */
const publicStudent = (s) => ({ sid: s.sid, sname: s.sname, smail: s.smail, crsId: s.crsId });
const enrolledIds = (db, u) => db.enrollments.filter((e) => e.username === u).map((e) => e.courseId);
const forSale = (c) => c && c.price != null && Number(c.price) > 0;
const courseOf = (db, id) => db.courses.find((c) => c.cid === Number(id));

function shopState(db, user) {
  return { wishlist: db.wishlist[user.username] || [], cart: db.cart[user.username] || [], enrolled: enrolledIds(db, user.username) };
}

function lineOf(db, user, cid) {
  const c = courseOf(db, cid);
  return { courseId: Number(cid), cname: c?.cname || `Course #${cid}`, duration: c?.duration || null, price: c?.price ?? null, available: forSale(c) };
}

const orderView = (o) => ({ ...o, items: o.items.map((i) => ({ ...i })) });

/* ---------- search, chat and "AI" (simple keyword logic, no model) ---------- */
const STOP = new Set('a an the and or for to of in on with me my i want need find show some any good best course courses learn learning under below less than within about is are can how do you what please'.split(' '));

function haystack(db, c) {
  const d = db.details[c.cid] || {};
  return [c.cname, d.tagline, d.description, d.level, ...(d.outcomes || []), ...(d.modules || []).flatMap((m) => [m.title, ...(m.lessons || [])])].join(' ').toLowerCase();
}

function searchCourses(db, text, ownedIds = []) {
  const q = (text || '').toLowerCase();
  const budget = q.match(/(?:under|below|less than|within|upto|up to)\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*)/);
  const cap = budget ? Number(budget[1].replace(/,/g, '')) : null;
  const level = ['beginner', 'intermediate', 'advanced'].find((l) => q.includes(l)) || (/\b(scratch|new to|no experience|start)\b/.test(q) ? 'beginner' : null);
  const words = q.replace(/[^a-z0-9+# ]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w) && !/^\d+$/.test(w) && !['beginner', 'intermediate', 'advanced'].includes(w));
  const scored = db.courses.filter((c) => forSale(c) && !ownedIds.includes(c.cid) && (cap == null || c.price <= cap)).map((c) => {
    const h = haystack(db, c);
    const hits = words.filter((w) => h.includes(w));
    const d = db.details[c.cid] || {};
    const levelHit = level && (d.level || '').toLowerCase() === level;
    return { c, d, hits, score: hits.length * 3 + (levelHit ? 2 : 0) };
  });
  const useful = words.length || level ? scored.filter((s) => s.score > 0) : scored;
  useful.sort((a, b) => b.score - a.score || a.c.price - b.c.price);
  const summary = [words.join(', '), level, cap ? `under ${rupees(cap)}` : ''].filter(Boolean).join(' · ');
  return {
    summary: summary || undefined,
    picks: useful.slice(0, 3).map(({ c, d, hits }) => ({
      courseId: c.cid, name: c.cname, level: d.level || null, duration: c.duration, price: c.price,
      reason: hits.length ? `Matches: ${hits.slice(0, 4).join(', ')}` : (d.tagline || 'A good place to start'),
    })),
    mode: 'demo',
  };
}

function chatReply(db, user, raw) {
  const m = (raw || '').toLowerCase().trim();
  const link = (label, href) => ({ label, href });
  const mine = db.orders.filter((o) => o.username === user.username && o.status === 'PAID');
  const sugg = ['Show me beginner courses', "What's in my cart?", 'How do refunds work?'];
  const out = (reply, links = [], suggestions = sugg) => ({ reply, links, suggestions, mode: 'demo' });

  if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(m)) return out(`Hi ${user.username}! I can help you find a course, check your cart or explain refunds. What would you like to do?`);
  if (/demo|backend|how does this work|real (app|version)|llm|ai model/.test(m)) {
    return out('This is the demo version, so I am a scripted assistant that answers from the sample data in your browser. In the full app this widget calls a Chatbot microservice behind the API gateway, and it can use an AI model.', [link('Course list', '#/courses')]);
  }
  if (/refund|money back|cancel/.test(m)) {
    return out('Open Orders and choose "Refund order" on a paid order. Students send a request that an administrator approves; once approved, the course access is removed and the amount is returned.', [link('Go to my orders', '#/orders')]);
  }
  if (/cart|checkout|pay\b/.test(m)) {
    const ids = db.cart[user.username] || [];
    if (!ids.length) return out('Your cart is empty. Add a course and I can take you to checkout.', [link('Browse courses', '#/courses')]);
    const total = ids.reduce((a, id) => a + Number(courseOf(db, id)?.price || 0), 0);
    return out(`You have ${ids.length} course${ids.length === 1 ? '' : 's'} in your cart: ${ids.map((id) => courseOf(db, id)?.cname).join(', ')}. Total ${rupees(total)}. Payment in this demo is simulated, so no money moves.`, [link('Open my cart', '#/cart')]);
  }
  if (/wishlist|saved/.test(m)) {
    const n = (db.wishlist[user.username] || []).length;
    return out(n ? `You have ${n} saved course${n === 1 ? '' : 's'} in your wishlist.` : 'Your wishlist is empty. Tap the heart on any course to save it.', [link('Open wishlist', '#/wishlist')]);
  }
  if (/order|receipt|invoice|bought|purchase/.test(m)) {
    return out(mine.length ? `You have ${mine.length} paid order${mine.length === 1 ? '' : 's'}. Each one has a printable receipt.` : 'You have no paid orders yet. Buy a course and its receipt appears under Orders.', [link('Open my orders', '#/orders')]);
  }
  if (/admin|role|permission|student record/.test(m)) {
    return out('Admins manage students, courses and all orders. Students browse and buy courses. Everyone who signs up gets the student role; admins are set by the site owner. Try the "Try as Admin" button on the sign-in page to see the admin side.');
  }
  const found = searchCourses(db, m, enrolledIds(db, user.username));
  if (found.picks.length && /course|learn|recommend|suggest|beginner|advanced|intermediate|java|python|react|sql|spring|algorithm|data|web|under|price|cost|cheap|\d/.test(m)) {
    return out(`Here are courses that fit: ${found.picks.map((p) => `${p.name} (${rupees(p.price)})`).join(', ')}.`, found.picks.map((p) => link(p.name, `#/courses/${p.courseId}`)), ['Something cheaper', "What's in my cart?", 'How do refunds work?']);
  }
  return out('I can help with finding courses, your cart, orders and refunds. Try asking "Which course should I take to learn Python?"', [link('Browse courses', '#/courses')]);
}

function draftFor(db, courseId, notes) {
  const c = courseOf(db, courseId);
  if (!c) throw fail(404, 'Course not found.');
  const name = c.cname;
  const extra = notes ? `\n\nFocus requested by the instructor: ${notes}` : '';
  return {
    draft: {
      tagline: `Learn ${name} step by step, with practice in every lesson`,
      level: 'Beginner', language: 'English',
      description: `This course introduces ${name} in ${c.duration || 'a few weeks'}. You learn the core ideas first, then apply them in hands-on exercises and a final project.${extra}`,
      prerequisites: 'No prior experience needed. Bring curiosity and a computer.',
      outcomes: [`Explain the core concepts of ${name}`, 'Complete practical exercises on your own', `Build a small project using ${name}`, 'Know what to learn next'],
      audience: ['Beginners starting out', 'Students who want practical skills'],
      modules: [
        { title: 'Foundations', summary: 'The vocabulary and tools you need.', duration: '1 week', lessons: ['Welcome and setup', 'Key terms', 'Your first exercise'] },
        { title: 'Core concepts', summary: 'The ideas everything else builds on.', duration: '2 weeks', lessons: ['Concept 1', 'Concept 2', 'Concept 3', 'Practice set'] },
        { title: 'Hands-on practice', summary: 'Apply what you learned.', duration: '2 weeks', lessons: ['Guided exercise', 'Common mistakes', 'Challenge problems'] },
        { title: 'Final project', summary: 'Put it all together.', duration: '1 week', lessons: ['Plan the project', 'Build it', 'Review and next steps'] },
      ],
    },
    mode: 'demo',
  };
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function quizFor(db, courseId, moduleNo, count) {
  const c = courseOf(db, courseId);
  const d = db.details[Number(courseId)];
  const modules = d?.modules || [];
  if (!c || !modules.length) throw fail(400, 'This course has no modules yet, so a quiz cannot be made.');
  const otherLessons = db.courses.flatMap((x) => (db.details[x.cid]?.modules || []).flatMap((m) => m.lessons || []));
  const otherTitles = db.courses.flatMap((x) => (db.details[x.cid]?.modules || []).map((m) => m.title));
  const questions = [];

  if (moduleNo) {
    const m = modules[moduleNo - 1];
    if (!m) throw fail(400, 'That module does not exist.');
    const own = new Set(m.lessons || []);
    const wrongPool = otherLessons.filter((l) => !own.has(l));
    shuffle(m.lessons || []).slice(0, count).forEach((lesson) => {
      const options = shuffle([lesson, ...shuffle([...new Set(wrongPool)]).slice(0, 3)]);
      questions.push({ question: `Which of these is a lesson in the module "${m.title}"?`, options, answerIndex: options.indexOf(lesson), explanation: `"${lesson}" is part of "${m.title}" in ${c.cname}.` });
    });
  } else {
    const all = modules.flatMap((m) => (m.lessons || []).map((lesson) => ({ lesson, title: m.title })));
    shuffle(all).slice(0, count).forEach(({ lesson, title }) => {
      const wrong = shuffle([...new Set([...modules.map((m) => m.title), ...otherTitles])].filter((t) => t !== title)).slice(0, 3);
      const options = shuffle([title, ...wrong]);
      questions.push({ question: `In ${c.cname}, which module covers "${lesson}"?`, options, answerIndex: options.indexOf(title), explanation: `"${lesson}" is taught in the module "${title}".` });
    });
  }
  return { questions, mode: 'demo' };
}

function explainFor(db, courseId, topic) {
  const c = courseOf(db, courseId);
  if (!c) throw fail(404, 'Course not found.');
  const words = (topic || '').toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !STOP.has(w));
  const related = (db.details[c.cid]?.modules || []).flatMap((m) => (m.lessons || []).filter((l) => words.some((w) => l.toLowerCase().includes(w))).map((l) => `"${l}" (module: ${m.title})`));
  const text = [
    `Topic: ${topic}`,
    related.length ? `In ${c.cname} this connects to: ${related.slice(0, 3).join('; ')}.` : `I could not match "${topic}" to a specific lesson in ${c.cname}, so start with the course overview and the first module.`,
    'Study tip: read the lesson, write the idea in your own words, then try one small exercise.',
    'Note: this is demo mode. The text is built from templates and the course outline, not by an AI model. The full app sends this question to an AI model.',
  ];
  return { explanation: text.join('\n\n'), mode: 'demo' };
}

/* ---------- routes ---------- */
const routes = [];
const on = (method, pattern, handler, level = 'user') => routes.push({ method, re: new RegExp(`^${pattern}$`), handler, level });
const A = '/api/v1/auth';
const S = '/api/v1/students';
const C = '/api/v1/courses';
const SH = '/api/v1/shop';

// auth (open)
on('POST', `${A}/login`, async ({ db, body }) => {
  const u = db.users.find((x) => x.username.toLowerCase() === String(body?.username || '').trim().toLowerCase());
  if (!u || (await hashPassword(String(body?.password || ''), u.salt)) !== u.hash) throw fail(401, 'Wrong username or password.');
  return { token: makeToken(u) };
}, 'open');

on('POST', `${A}/register`, async ({ db, body }) => {
  const username = String(body?.username || '').trim();
  const password = String(body?.password || '');
  const email = String(body?.email || '').trim();
  if (username.length < 3) throw fail(400, 'Use at least 3 characters for the username.');
  if (password.length < 6) throw fail(400, 'Use at least 6 characters for the password.');
  if (email && !/^\S+@\S+\.\S{2,}$/.test(email)) throw fail(400, 'Enter a valid e-mail address.');
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw fail(409, 'That username is already taken. Choose another one.');
  if (email && db.users.some((u) => (u.email || '').toLowerCase() === email.toLowerCase())) throw fail(409, 'That e-mail address is already used by another account.');
  // like the real gateway, a new account is always a student, whatever the browser sends
  db.users.push(await makeUser(username, password, email || null, 'ROLE_STUDENT'));
  save();
  return { message: 'Account created. You can sign in now.' };
}, 'open');

const FORGOT_REPLY = { message: 'If an account matches, we have sent a password reset link to its e-mail address.' };
on('POST', `${A}/forgot-password`, async ({ db, body }) => {
  const id = String(body?.identifier || '').trim().toLowerCase();
  const u = id && db.users.find((x) => x.username.toLowerCase() === id || (x.email || '').toLowerCase() === id);
  if (u && u.email && !SAMPLE_BUYERS.includes(u.username)) {
    const token = randomHex(24);
    db.resets.push({ token, username: u.username, expiresAt: Date.now() + RESET_MINUTES * 60000, used: false });
    db.inbox.push({ id: randomHex(4), to: u.email, username: u.username, token, at: nowIso() });
    save();
  }
  return FORGOT_REPLY; // same answer whether or not the account exists, like the real service
}, 'open');

on('POST', `${A}/reset-password`, async ({ db, body }) => {
  const r = db.resets.find((x) => x.token === body?.token);
  if (!r || r.used || r.expiresAt < Date.now()) throw fail(400, 'This reset link is invalid or has expired. Ask for a new link.');
  const password = String(body?.password || '');
  if (password.length < 6) throw fail(400, 'Use at least 6 characters for the password.');
  const u = db.users.find((x) => x.username === r.username);
  u.salt = randomHex(8);
  u.hash = await hashPassword(password, u.salt);
  r.used = true;
  save();
  return { message: 'Your password was changed. Sign in with the new one.' };
}, 'open');

on('POST', `${A}/help`, async ({ db, user, body }) => {
  db.help.push({ ...body, username: user.username, at: nowIso() });
  save();
  return { message: 'Thanks! Your query was received. In this demo it is stored only in your browser.' };
});

// students (admin only, like the gateway)
const withoutPw = (list) => list.map(publicStudent);
on('GET', `${S}/allStudent`, ({ db }) => withoutPw(db.students), 'admin');
on('GET', `${S}/allStudentofcrs/(\\d+)`, ({ db, m }) => withoutPw(db.students.filter((s) => s.crsId === Number(m[1]))), 'admin');
on('GET', `${S}/(\\d+)`, ({ db, m }) => {
  const s = db.students.find((x) => x.sid === Number(m[1]));
  if (!s) throw fail(404, 'Student not found.');
  return publicStudent(s);
}, 'admin');
on('POST', `${S}/add`, ({ db, body }) => {
  db.students.push({ sid: db.nextSid, sname: body.sname, smail: body.smail, crsId: Number(body.crsId) });
  db.nextSid += 1;
  save();
  return withoutPw(db.students);
}, 'admin');
on('PUT', `${S}/update/(\\d+)`, ({ db, m, body }) => {
  const s = db.students.find((x) => x.sid === Number(m[1]));
  if (!s) throw fail(404, 'Student not found.');
  Object.assign(s, { sname: body.sname, smail: body.smail, crsId: Number(body.crsId) });
  save();
  return publicStudent(s);
}, 'admin');
on('DELETE', `${S}/delete/(\\d+)`, ({ db, m }) => {
  db.students = db.students.filter((x) => x.sid !== Number(m[1]));
  save();
  return withoutPw(db.students);
}, 'admin');

// courses
on('GET', `${C}/allcourses`, ({ db }) => db.courses);
on('POST', `${C}/add`, ({ db, body }) => {
  const course = { cid: Number(body.cid), cname: String(body.cname || '').trim(), duration: String(body.duration || '').trim(), price: body.price == null || body.price === '' ? null : Number(body.price) };
  const i = db.courses.findIndex((c) => c.cid === course.cid);
  if (i >= 0) db.courses[i] = course; else db.courses.push(course);
  save();
  return course;
});
on('GET', `${C}/details-summary`, ({ db }) => db.courses.map((c) => {
  const d = db.details[c.cid] || {};
  const mods = d.modules || [];
  return { cid: c.cid, tagline: d.tagline || null, level: d.level || null, moduleCount: mods.length, lessonCount: mods.reduce((n, m) => n + (m.lessons?.length || 0), 0) };
}));
on('GET', `${C}/courseswithstudent/(\\d+)`, ({ db, m }) => {
  const crs = courseOf(db, m[1]);
  if (!crs) throw fail(404, 'Course not found.');
  return { crs, studentList: withoutPw(db.students.filter((s) => s.crsId === crs.cid)) };
}, 'admin');
on('GET', `${C}/(\\d+)/details`, ({ db, m }) => db.details[Number(m[1])] || {});
on('PUT', `${C}/(\\d+)/details`, ({ db, m, body }) => {
  db.details[Number(m[1])] = body;
  save();
  return body;
}, 'admin');

// shop: wishlist, cart, checkout, orders
on('GET', `${SH}/state`, ({ db, user }) => shopState(db, user));
on('GET', `${SH}/wishlist`, ({ db, user }) => (db.wishlist[user.username] || []).map((id) => ({ ...lineOf(db, user, id), inCart: (db.cart[user.username] || []).includes(id) })));
on('POST', `${SH}/wishlist/(\\d+)`, ({ db, user, m }) => {
  const id = Number(m[1]);
  if (!courseOf(db, id)) throw fail(404, 'Course not found.');
  const list = db.wishlist[user.username] || (db.wishlist[user.username] = []);
  if (!list.includes(id)) list.push(id);
  save();
  return shopState(db, user);
});
on('DELETE', `${SH}/wishlist/(\\d+)`, ({ db, user, m }) => {
  db.wishlist[user.username] = (db.wishlist[user.username] || []).filter((x) => x !== Number(m[1]));
  save();
  return shopState(db, user);
});
on('POST', `${SH}/wishlist/(\\d+)/move-to-cart`, ({ db, user, m }) => {
  const id = Number(m[1]);
  if (!forSale(courseOf(db, id))) throw fail(400, 'This course is not for sale.');
  db.wishlist[user.username] = (db.wishlist[user.username] || []).filter((x) => x !== id);
  const cart = db.cart[user.username] || (db.cart[user.username] = []);
  if (!cart.includes(id)) cart.push(id);
  save();
  return shopState(db, user);
});
on('GET', `${SH}/cart`, ({ db, user }) => {
  const items = (db.cart[user.username] || []).map((id) => lineOf(db, user, id));
  return { items, total: items.filter((i) => i.available).reduce((a, i) => a + Number(i.price), 0), currency: 'INR', count: items.length };
});
on('POST', `${SH}/cart/(\\d+)`, ({ db, user, m }) => {
  const id = Number(m[1]);
  const c = courseOf(db, id);
  if (!c) throw fail(404, 'Course not found.');
  if (!forSale(c)) throw fail(400, 'This course is not for sale yet.');
  if (enrolledIds(db, user.username).includes(id)) throw fail(409, 'You already own this course.');
  const cart = db.cart[user.username] || (db.cart[user.username] = []);
  if (!cart.includes(id)) cart.push(id);
  save();
  return shopState(db, user);
});
on('DELETE', `${SH}/cart/(\\d+)`, ({ db, user, m }) => {
  db.cart[user.username] = (db.cart[user.username] || []).filter((x) => x !== Number(m[1]));
  save();
  return shopState(db, user);
});
on('DELETE', `${SH}/cart`, ({ db, user }) => {
  db.cart[user.username] = [];
  save();
  return shopState(db, user);
});
on('GET', `${SH}/config`, () => ({ keyId: 'rzp_test_demo', mode: 'demo' }));
on('POST', `${SH}/checkout`, ({ db, user }) => {
  const ids = (db.cart[user.username] || []).filter((id) => forSale(courseOf(db, id)));
  if (!ids.length) throw fail(400, 'Your cart is empty.');
  const order = makeOrder(db, user.username, ids, 'CREATED', 0);
  save();
  return { keyId: 'rzp_test_demo', amount: Math.round(order.total * 100), currency: 'INR', razorpayOrderId: order.razorpayOrderId, itemCount: ids.length, orderId: order.id };
});
on('POST', `${SH}/checkout/verify`, ({ db, user, body }) => {
  const o = db.orders.find((x) => x.razorpayOrderId === body?.razorpay_order_id && x.username === user.username && x.status === 'CREATED');
  if (!o) throw fail(400, 'This payment could not be verified.');
  o.status = 'PAID';
  o.paidAt = nowIso();
  o.paymentId = body.razorpay_payment_id || `pay_demo_${randomHex(7)}`;
  const ids = o.items.map((i) => i.courseId);
  ids.forEach((id) => { if (!db.enrollments.some((e) => e.username === user.username && e.courseId === id)) db.enrollments.push({ username: user.username, courseId: id, orderId: o.id, enrolledAt: o.paidAt }); });
  db.cart[user.username] = (db.cart[user.username] || []).filter((id) => !ids.includes(id));
  db.wishlist[user.username] = (db.wishlist[user.username] || []).filter((id) => !ids.includes(id));
  save();
  return { status: 'PAID', orderId: o.id };
});
const byNewest = (a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt);
on('GET', `${SH}/orders`, ({ db, user }) => db.orders.filter((o) => o.username === user.username).sort(byNewest).map(orderView));
on('GET', `${SH}/admin/orders`, ({ db }) => [...db.orders].sort(byNewest).map(orderView), 'admin');
on('GET', `${SH}/my-courses`, ({ db, user }) => db.enrollments.filter((e) => e.username === user.username).map((e) => ({ courseId: e.courseId, cname: courseOf(db, e.courseId)?.cname || `Course #${e.courseId}`, duration: courseOf(db, e.courseId)?.duration || null, enrolledAt: e.enrolledAt, orderId: e.orderId })));
on('GET', `${SH}/orders/(\\d+)/receipt`, ({ db, user, m }) => {
  const o = db.orders.find((x) => x.id === Number(m[1]) && (x.username === user.username || user.role === 'ROLE_ADMIN'));
  if (!o) throw fail(404, 'Order not found.');
  if (!o.paidAt) throw fail(409, 'This order was never paid.');
  return { receiptNumber: `SH-${new Date(o.paidAt).getFullYear()}-${String(o.id).padStart(6, '0')}`, orderId: o.id, username: o.username, status: o.status, paidAt: o.paidAt, refundedAt: o.refundedAt, testMode: true, items: o.items, total: o.total, currency: o.currency, paymentId: o.paymentId, razorpayOrderId: o.razorpayOrderId };
});

function refund(db, o) {
  o.status = 'REFUNDED';
  o.refundedAt = nowIso();
  o.refundStatus = 'processed';
  db.enrollments = db.enrollments.filter((e) => e.orderId !== o.id);
  save();
  return { status: 'REFUNDED' };
}
on('POST', `${SH}/admin/orders/(\\d+)/refund`, ({ db, m }) => {
  const o = db.orders.find((x) => x.id === Number(m[1]));
  if (!o || o.status !== 'PAID') throw fail(409, 'Only a paid order can be refunded.');
  return refund(db, o);
}, 'admin');
on('POST', `${SH}/admin/orders/(\\d+)/refund/sync`, ({ db, m }) => ({ status: db.orders.find((x) => x.id === Number(m[1]))?.status || 'PAID' }), 'admin');
on('POST', `${SH}/orders/(\\d+)/refund`, ({ db, user, m }) => {
  const o = db.orders.find((x) => x.id === Number(m[1]) && x.username === user.username);
  if (!o || o.status !== 'PAID') throw fail(409, 'Only a paid order can be refunded.');
  if (o.refundStatus) throw fail(409, 'A refund was already requested for this order.');
  o.refundStatus = 'requested';
  save();
  return { status: 'PAID', refundStatus: 'requested' };
});
on('POST', `${SH}/orders/(\\d+)/refund/sync`, ({ db, user, m }) => ({ status: db.orders.find((x) => x.id === Number(m[1]) && x.username === user.username)?.status || 'PAID' }));

// chat and AI helpers
on('POST', '/api/v1/chat/message', ({ db, user, body }) => chatReply(db, user, body?.message));
on('POST', '/api/v1/ai/search', ({ db, user, body }) => searchCourses(db, body?.text, enrolledIds(db, user.username)));
on('POST', '/api/v1/ai/recommend', ({ db, user, body }) => searchCourses(db, body?.text, enrolledIds(db, user.username)));
on('POST', '/api/v1/ai/course-draft', ({ db, body }) => draftFor(db, body?.courseId, body?.notes), 'admin');
on('POST', '/api/v1/ai/quiz', ({ db, body }) => quizFor(db, body?.courseId, body?.moduleNo, Math.min(Number(body?.count) || 5, 8)));
on('POST', '/api/v1/ai/explain', ({ db, body }) => explainFor(db, body?.courseId, body?.topic));

/* ---------- entry point used by api/client.js ---------- */
export async function demoFetch(path, { method = 'GET', body, token } = {}) {
  if (delayMs) await sleep(delayMs);
  const route = routes.map((r) => ({ r, m: r.method === method ? path.match(r.re) : null })).find((x) => x.m);
  if (!route) throw fail(404, 'This feature is not available in the demo.');
  const db = await getDb();
  let user = null;
  if (route.r.level !== 'open') {
    user = token ? parseToken(token) : null;
    if (!user) throw fail(401, 'Please sign in.');
    if (route.r.level === 'admin' && user.role !== 'ROLE_ADMIN') throw fail(403, 'Only administrators can do this.');
  }
  return clone(await route.r.handler({ db, user, body, m: route.m }));
}

/* ---------- used by the "simulated inbox" on the forgot-password page ---------- */
export async function latestResetEmail(identifier) {
  const db = await getDb();
  const id = String(identifier || '').trim().toLowerCase();
  const u = id && db.users.find((x) => x.username.toLowerCase() === id || (x.email || '').toLowerCase() === id);
  const mail = u && [...db.inbox].reverse().find((e) => e.username === u.username);
  return { matched: !!u, hasEmail: !!u?.email, mail: mail ? clone(mail) : null };
}
