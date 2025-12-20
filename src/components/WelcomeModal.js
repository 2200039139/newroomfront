import React, { useState, useEffect } from 'react';
import './WelcomeModal.css';
import { FaCheckCircle, FaUsers, FaArrowRight, FaRupeeSign, FaBalanceScale, FaTimes } from 'react-icons/fa';

const WelcomeModal = ({ show, onClose, roommatesCount = 0, groupId = null }) => {
  const [hasBeenShown, setHasBeenShown] = useState(false);

  // Check if modal has been shown for this specific group/session
  useEffect(() => {
    if (!show) return;
    
    // Option 1: Show once per group (if groupId is provided)
    if (groupId) {
      const seenGroups = JSON.parse(localStorage.getItem('seenWelcomeGroups') || '[]');
      if (seenGroups.includes(groupId)) {
        setHasBeenShown(true);
      }
    } 
    // Option 2: Show once per session
    else if (sessionStorage.getItem('hasSeenWelcomeThisSession') === 'true') {
      setHasBeenShown(true);
    }
    // Option 3: Show once ever (original behavior)
    else if (localStorage.getItem('hasSeenWelcomeModal') === 'true') {
      setHasBeenShown(true);
    }
  }, [show, groupId]);

  // Don't show if it's already been shown
  if (!show || hasBeenShown) return null;

  const handleClose = () => {
    // Mark as shown based on the tracking method
    if (groupId) {
      // Track by group
      const seenGroups = JSON.parse(localStorage.getItem('seenWelcomeGroups') || '[]');
      if (!seenGroups.includes(groupId)) {
        seenGroups.push(groupId);
        localStorage.setItem('seenWelcomeGroups', JSON.stringify(seenGroups));
      }
    } else {
      // Track by session
      sessionStorage.setItem('hasSeenWelcomeThisSession', 'true');
      // Or track forever
      localStorage.setItem('hasSeenWelcomeModal', 'true');
    }
    
    setHasBeenShown(true);
    onClose();
  };

  const handleDontShowAgain = () => {
    // User explicitly doesn't want to see this again
    localStorage.setItem('hasSeenWelcomeModal', 'true');
    if (groupId) {
      const seenGroups = JSON.parse(localStorage.getItem('seenWelcomeGroups') || '[]');
      if (!seenGroups.includes(groupId)) {
        seenGroups.push(groupId);
        localStorage.setItem('seenWelcomeGroups', JSON.stringify(seenGroups));
      }
    }
    sessionStorage.setItem('hasSeenWelcomeThisSession', 'true');
    setHasBeenShown(true);
    onClose();
  };

  return (
    <div className="welcome-modal-overlay">
      <div className="welcome-modal">
        <div className="welcome-header">
          <button 
            className="close-button" 
            onClick={handleClose}
            aria-label="Close welcome modal"
          >
            <FaTimes />
          </button>
          <FaCheckCircle className="welcome-icon" />
          <h2>Welcome to the Group! 🎉</h2>
        </div>
        
        <div className="welcome-content">
          <p>You have successfully joined the expense group.</p>
          
          <div className="welcome-stats">
            <div className="welcome-stat">
              <FaUsers className="stat-icon" />
              <div>
                <h4>{roommatesCount}</h4>
                <p>Roommates in group</p>
              </div>
            </div>
            <div className="welcome-stat">
              <FaRupeeSign className="stat-icon" />
              <div>
                <h4>₹0</h4>
                <p>Start tracking expenses</p>
              </div>
            </div>
          </div>
          
          <div className="welcome-features">
            <div className="feature">
              <FaCheckCircle className="feature-icon" />
              <div>
                <h4>Start Tracking Expenses</h4>
                <p>Add expenses that you share with your roommates</p>
              </div>
            </div>
            
            <div className="feature">
              <FaBalanceScale className="feature-icon" />
              <div>
                <h4>Automatic Splitting</h4>
                <p>Expenses are automatically split among roommates</p>
              </div>
            </div>
          </div>
          
          <div className="welcome-tips">
            <h4>Quick Tips:</h4>
            <ul>
              <li>Click "Add Expense" to record shared expenses</li>
              <li>Check "Splits" tab to see who owes whom</li>
              <li>Use "Settlements" to record payments</li>
              <li>Only group owners can invite new roommates</li>
            </ul>
          </div>
        </div>
        
        <div className="welcome-actions">
          <button className="btn-primary" onClick={handleClose}>
            Get Started <FaArrowRight />
          </button>
          <button 
            className="btn-secondary" 
            onClick={handleDontShowAgain}
            style={{ marginTop: '10px' }}
          >
            Don't show this again
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;