import Icon from './Icon.jsx';

// Refresh with visible feedback: spinning icon while loading, and the time of the last successful load.
export default function RefreshButton({ loading, updatedAt, onClick }) {
  return (
    <div className="refresh">
      {updatedAt && !loading && <span className="muted updated">Updated {new Date(updatedAt).toLocaleTimeString()}</span>}
      <button className="btn" onClick={onClick} disabled={loading}>
        <span className={loading ? 'spin' : ''}><Icon name="refresh" size={16} /></span> {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}
