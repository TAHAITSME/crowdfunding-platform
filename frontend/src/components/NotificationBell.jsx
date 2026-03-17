import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUnreadCount } from './notificationsSlice';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  useEffect(() => {
    dispatch(fetchUnreadCount());
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 30000); // toutes les 30s

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <button
      onClick={handleClick}
      style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <span style={{ fontSize: '20px' }}>🔔</span>
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px',
          }}
        >
          {unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
