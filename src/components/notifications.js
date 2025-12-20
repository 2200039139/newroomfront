import React, { useEffect, useRef } from 'react';

const Notification = ({ notification, onClose }) => {
  const timerRef = useRef(null);
  
  // Auto-close effect
  useEffect(() => {
    if (notification.show) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, 3000);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification.show, onClose]);

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onClose();
  };

  if (!notification.show) return null;

  return (
    <div className={`notification notification-${notification.type}`}>
      <span className="notification-message">{notification.message}</span>
      <button 
        type="button"
        className="notification-close"
        onClick={handleClose}
      >
        ×
      </button>
    </div>
  );
};

export default Notification;