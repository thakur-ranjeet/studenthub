import Modal from './Modal.jsx';

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', busyLabel = 'Deleting…', busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="muted">{message}</p>
      <div className="modal-actions">
        <button className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn danger" onClick={onConfirm} disabled={busy}>{busy ? busyLabel : confirmLabel}</button>
      </div>
    </Modal>
  );
}
