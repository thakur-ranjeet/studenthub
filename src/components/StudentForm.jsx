import { useState } from 'react';
import Modal from './Modal.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StudentForm({ mode, initial, courses, busy, onSubmit, onCancel }) {
  const editing = mode === 'edit';
  const [v, setV] = useState({
    sname: initial?.sname ?? '',
    smail: initial?.smail ?? '',
    crsId: initial ? String(initial.crsId) : courses[0] ? String(courses[0].cid) : '',
    password: '',
  });
  const [err, setErr] = useState({});
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const knownCourse = courses.some((c) => String(c.cid) === v.crsId);

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!v.sname.trim()) next.sname = 'Name is required';
    if (!EMAIL.test(v.smail.trim())) next.smail = 'Enter a valid email address';
    if (!v.crsId) next.crsId = 'Choose a course';
    if (!editing && !v.password) next.password = 'Password is required';
    else if (v.password && v.password.length < 4) next.password = 'Use at least 4 characters';
    setErr(next);
    if (Object.keys(next).length) return;
    // The backend overwrites the password on every PUT, so keep the current one when the field is left blank.
    onSubmit({
      sname: v.sname.trim(),
      smail: v.smail.trim(),
      crsId: Number(v.crsId),
      password: v.password || initial?.password || '',
    });
  };

  return (
    <Modal title={editing ? `Edit student #${initial.sid}` : 'Add student'} onClose={onCancel}>
      {courses.length === 0 ? (
        <>
          <p className="muted">There are no courses yet. Add a course first, then you can enrol students.</p>
          <div className="modal-actions"><a className="btn primary" href="#/courses" onClick={onCancel}>Go to courses</a></div>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          <label className="field">
            <span>Full name</span>
            <input value={v.sname} onChange={set('sname')} placeholder="e.g. Rohan Sharma" autoFocus />
            {err.sname && <em>{err.sname}</em>}
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={v.smail} onChange={set('smail')} placeholder="rohan@example.com" />
            {err.smail && <em>{err.smail}</em>}
          </label>
          <label className="field">
            <span>Course</span>
            <select value={v.crsId} onChange={set('crsId')}>
              {!knownCourse && v.crsId && <option value={v.crsId}>Course #{v.crsId} (not found)</option>}
              {courses.map((c) => <option key={c.cid} value={c.cid}>{c.cname} (#{c.cid})</option>)}
            </select>
            {err.crsId && <em>{err.crsId}</em>}
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={v.password} onChange={set('password')} placeholder={editing ? 'Leave blank to keep current' : 'Choose a password'} autoComplete="new-password" />
            {err.password && <em>{err.password}</em>}
          </label>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add student'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
