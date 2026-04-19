import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiMoon, FiSun } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function Navbar({ setIsAuthenticated, darkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, {}, {
        withCredentials: true
      });
      localStorage.removeItem('user_id');
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        🛍️ Price Decision System
      </div>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <button onClick={toggleDarkMode} className="dark-mode-toggle">
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
        <button onClick={handleLogout} style={{ background: '#f56565' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;