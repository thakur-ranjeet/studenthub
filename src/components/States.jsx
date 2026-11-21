import Icon from './Icon.jsx';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state" role="status">
      <div className="spinner" />
      <p className="muted">{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state error">
      <Icon name="alert" size={28} />
      <h3>Something went wrong</h3>
      <p className="muted">{error?.message || 'Unexpected error'}</p>
      {onRetry && (
        <button className="btn" onClick={onRetry}><Icon name="refresh" size={16} /> Try again</button>
      )}
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  );
}
