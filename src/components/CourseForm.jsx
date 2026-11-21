import { useState } from 'react';
import Modal from './Modal.jsx';

export default function CourseForm({ mode, initial, existingIds, busy, onSubmit, onCancel }) {
  const editing = mode === 'edit';
  const [v, setV] = useState({
    cid: initial ? String(initial.cid) : '',
    cname: initial?.cname ?? '',
    duration: initial?.duration ?? '',
    price: initial?.price != null ? String(initial.price) : '',
  });
  const [err, setErr] = useState({});
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    const id = Number(v.cid);
    if (!Number.isInteger(id) || id <= 0) next.cid = 'Enter a positive whole number';
    // The backend saves by cid, so re-using an id would silently overwrite that course.
    else if (!editing && existingIds.includes(id)) next.cid = 'This course ID already exists';
    if (!v.cname.trim()) next.cname = 'Course name is required';
    if (!v.duration.trim()) next.duration = 'Duration is required';
    const price = v.price.trim() === '' ? null : Number(v.price);
    if (price !== null && (!Number.isFinite(price) || price < 0)) next.price = 'Enter 0 or more, or leave empty';
    setErr(next);
    if (Object.keys(next).length) return;
    onSubmit({ cid: id, cname: v.cname.trim(), duration: v.duration.trim(), price });
  };

  return (
    <Modal title={editing ? `Edit course #${initial.cid}` : 'Add course'} onClose={onCancel}>
      <form onSubmit={submit} noValidate>
        <label className="field">
          <span>Course ID</span>
          <input type="number" min="1" value={v.cid} onChange={set('cid')} disabled={editing} placeholder="e.g. 3" autoFocus={!editing} />
          {err.cid && <em>{err.cid}</em>}
        </label>
        <label className="field">
          <span>Course name</span>
          <input value={v.cname} onChange={set('cname')} placeholder="e.g. Java Full Stack" autoFocus={editing} />
          {err.cname && <em>{err.cname}</em>}
        </label>
        <label className="field">
          <span>Duration</span>
          <input value={v.duration} onChange={set('duration')} placeholder="e.g. 6 months" />
          {err.duration && <em>{err.duration}</em>}
        </label>
        <label className="field">
          <span>Price in ₹ <small className="muted">(leave empty if the course is not for sale yet)</small></span>
          <input type="number" min="0" step="0.01" value={v.price} onChange={set('price')} placeholder="e.g. 4999" />
          {err.price && <em>{err.price}</em>}
        </label>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add course'}</button>
        </div>
      </form>
    </Modal>
  );
}
