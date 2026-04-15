import { useAuth } from '../context/AuthContext';

export default function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();

  const tabs = [
    { id: 'upload', label: '↑ Upload' },
    { id: 'search', label: '⌕ Search' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-logo" onClick={() => setPage(user ? 'search' : 'login')}>
        <div className="nav-logo-icon">⬡</div>
        <span className="nav-logo-name">BiblioVec</span>
      </div>

      {user && (
        <div className="nav-links">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`nav-link${page === t.id ? ' active' : ''}`}
              onClick={() => setPage(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {user && (
        <div className="nav-right">
          <div className="nav-avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <span className="nav-user">{user.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Sign out</button>
        </div>
      )}
    </nav>
  );
}
