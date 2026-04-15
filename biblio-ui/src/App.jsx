import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import './index.css';

function AppInner() {
  const { user } = useAuth();
  const [page, setPage] = useState(user ? 'search' : 'login');
  const [dbCount, setDbCount] = useState(0);

  // Redirect unauthenticated to login
  const safePage = user ? page : (page === 'register' ? 'register' : 'login');

  const renderPage = () => {
    switch (safePage) {
      case 'login':    return <LoginPage setPage={setPage} />;
      case 'register': return <RegisterPage setPage={setPage} />;
      case 'upload':   return <UploadPage setPage={setPage} setDbCount={setDbCount} />;
      case 'search':   return <SearchPage dbCount={dbCount} />;
      default:         return <LoginPage setPage={setPage} />;
    }
  };

  const showNav = user && (safePage === 'upload' || safePage === 'search');

  return (
    <div className="layout">
      <div className="bg-noise" />
      {showNav && <Navbar page={safePage} setPage={setPage} />}
      {renderPage()}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}
