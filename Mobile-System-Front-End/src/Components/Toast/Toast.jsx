import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, show, onClose, type = 'success' }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`toast toast-${type} ${show ? 'show' : ''}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {type === 'success' && ''}
          {type === 'error' && ''}
          {type === 'info' && 'ℹ'}
          {type === 'warning' && ''}
        </div>
        <span className="toast-message">{message}</span>
        <button 
          className="toast-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
