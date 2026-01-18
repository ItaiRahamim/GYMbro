import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import * as FaIcons from 'react-icons/fa';
import AnonymousAvatar from './AnonymousAvatar';
import '../styles/Navbar.css';
import { chatService } from '../services/chatService';

const Navbar: React.FC = () => {
  const { authState, logout } = useAuth();
  const { isAuthenticated, user } = authState;
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread message count on load and when receiving new messages
  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch
      fetchUnreadCount();

      // Listen for new messages
      if (socket) {
        socket.on('new message', () => {
          fetchUnreadCount();
        });

        socket.on('messages read', () => {
          fetchUnreadCount();
        });

        return () => {
          socket.off('new message');
          socket.off('messages read');
        };
      }
    }
  }, [isAuthenticated, socket]);

  const fetchUnreadCount = async () => {
    try {
      const response = await chatService.getUnreadMessageCount();
      setUnreadCount(response);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container container">
        <Link to="/" className="logo">
          {FaIcons.FaDumbbell({ className: "logo-icon" })}
          <span>GYMbro</span>
        </Link>

        <nav className="nav-menu">
          {isAuthenticated ? (
            <>
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                בית
              </NavLink>
              <NavLink 
                to="/create-post" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                <span>{FaIcons.FaPlus({})}</span> פוסט חדש
              </NavLink>
              <NavLink 
                to="/workout-planner" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                תוכניות אימון
              </NavLink>
              <NavLink 
                to="/nutrition-advice" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                תזונה
              </NavLink>
              <NavLink 
                to="/nutritional-calculator" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                מחשבון תזונה
              </NavLink>
              <NavLink 
                to="/chat" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                <span style={{ position: 'relative' }}>
                  {FaIcons.FaComments({})}
                  {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </span>
                {' '}צ'אט
              </NavLink>
              <NavLink 
                to={user?.id ? `/profile/${user.id}` : '/profile'} 
                className={({ isActive }) => isActive ? 'nav-link active profile-link' : 'nav-link profile-link'}
              >
                <div className="navbar-avatar-container">
                  {user?.profilePicture && !imageError ? (
                    <img 
                      src={user.profilePicture} 
                      alt="תמונת פרופיל" 
                      className="navbar-avatar"
                      onError={(e) => {
                        console.log('תמונת פרופיל בנאבבר נכשלה בטעינה:', user.profilePicture);
                        setImageError(true);
                      }}
                    />
                  ) : (
                    <AnonymousAvatar size="xs" className="navbar-avatar" />
                  )}
                </div>
                <span className="username-text">{user?.username || 'פרופיל'}</span>
              </NavLink>
              <button onClick={handleLogout} className="nav-link btn-link">
                {FaIcons.FaSignOutAlt({ className: "me-1" })} התנתק
              </button>
            </>
          ) : (
            <>
              <NavLink 
                to="/login" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {FaIcons.FaSignInAlt({ className: "me-1" })} התחברות
              </NavLink>
              <NavLink 
                to="/register" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {FaIcons.FaUserPlus({ className: "me-1" })} הרשמה
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar; 