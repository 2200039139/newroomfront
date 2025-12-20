import React, { useState, useEffect } from 'react';
import { 
  FaEnvelope, 
  FaUserPlus, 
  FaTimes, 
  FaClock, 
  FaCheckCircle, 
  FaSpinner, 
  FaExclamationTriangle,
  FaExclamationCircle,
  FaCrown,
  FaUser,
  FaSync,
  FaInfoCircle
} from 'react-icons/fa';

const InviteRoommateModal = ({ 
  show, 
  onClose, 
  onInvite, 
  pendingInvites = [], 
  onResendInvite, 
  onCancelInvite,
  userRole = 'owner', // 'owner' or 'member'
  currentUserEmail = '',
  roommates = []
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResendSuccess, setShowResendSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    if (show) {
      setEmail('');
      setError('');
      setSuccess('');
      setShowResendSuccess(false);
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Check if inviting self
    if (email.toLowerCase() === currentUserEmail?.toLowerCase()) {
      setError('You cannot invite yourself');
      return;
    }
    
    // Check if already a roommate
    const isAlreadyRoommate = roommates.some(roommate => 
      roommate.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (isAlreadyRoommate) {
      setError('This user is already a roommate in your group');
      return;
    }
    
    // Check for duplicate pending invites
    const duplicate = pendingInvites.find(invite => 
      invite.email.toLowerCase() === email.toLowerCase()
    );
    
    if (duplicate) {
      setError('An invitation has already been sent to this email address');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await onInvite(email);
      setSuccess(`Invitation sent successfully to ${email}`);
      setEmail('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (inviteId, inviteEmail) => {
    setResendEmail(inviteEmail);
    try {
      await onResendInvite(inviteId);
      setShowResendSuccess(true);
      setResendEmail(inviteEmail);
      
      setTimeout(() => {
        setShowResendSuccess(false);
        setResendEmail('');
      }, 3000);
    } catch (err) {
      setError(`Failed to resend: ${err.message}`);
    }
  };

  const handleCancel = async (inviteId, inviteEmail) => {
    if (window.confirm(`Are you sure you want to cancel the invitation to ${inviteEmail}?`)) {
      try {
        await onCancelInvite(inviteId);
      } catch (err) {
        setError(`Failed to cancel: ${err.message}`);
      }
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysLeft = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusColor = (daysLeft) => {
    if (daysLeft > 3) return '#4CAF50'; // Green
    if (daysLeft > 1) return '#FF9800'; // Orange
    return '#f44336'; // Red
  };

  if (!show) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-container invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>
              {userRole === 'owner' ? (
                <>
                  <FaUserPlus /> Invite Roommate
                </>
              ) : (
                <>
                  <FaExclamationCircle /> Invitation Restricted
                </>
              )}
            </h3>
            <div className="role-badge">
              {userRole === 'owner' ? (
                <span className="badge-owner"><FaCrown /> Group Owner</span>
              ) : (
                <span className="badge-member"><FaUser /> Group Member</span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        {userRole === 'owner' ? (
          <>
            {/* Invite Form for Owners */}
            <form onSubmit={handleSubmit} className="invite-form">
              <div className="form-group">
                <label htmlFor="email">
                  <FaEnvelope /> Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="roommate@example.com"
                  required
                  disabled={loading}
                  autoFocus
                  className={error ? 'error' : ''}
                />
                <p className="form-hint">
                  <FaInfoCircle /> An invitation link will be sent to this email. 
                  The recipient will have 7 days to accept.
                </p>
              </div>
              
              {error && (
                <div className="alert error">
                  <FaExclamationTriangle /> {error}
                </div>
              )}
              
              {success && (
                <div className="alert success">
                  <FaCheckCircle /> {success}
                </div>
              )}
              
              {showResendSuccess && (
                <div className="alert info">
                  <FaCheckCircle /> Invitation resent to {resendEmail}
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading || !email.trim()}>
                  {loading ? (
                    <>
                      <FaSpinner className="spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <FaEnvelope /> Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
            
            {/* Pending Invites Section */}
            {pendingInvites.length > 0 ? (
              <div className="pending-invites">
                <div className="section-header">
                  <h4><FaClock /> Pending Invitations ({pendingInvites.length})</h4>
                </div>
                <div className="invites-list">
                  {pendingInvites.map(invite => {
                    const daysLeft = getDaysLeft(invite.expires_at);
                    const isExpiringSoon = daysLeft <= 2;
                    const isExpired = daysLeft === 0;
                    
                    return (
                      <div key={invite.id} className={`invite-item ${isExpired ? 'expired' : ''}`}>
                        <div className="invite-main">
                          <div className="invite-email">
                            <FaEnvelope className="invite-icon" />
                            <div className="email-details">
                              <span className="email-address">{invite.email}</span>
                              {invite.user_id && (
                                <span className="accepted-badge">
                                  <FaCheckCircle /> Accepted
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="invite-meta">
                            <span className="invite-date">
                              Sent: {formatDate(invite.created_at)}
                            </span>
                            <span 
                              className="invite-expiry"
                              style={{ color: getStatusColor(daysLeft) }}
                            >
                              {isExpired ? 'Expired' : `${daysLeft} days left`}
                            </span>
                          </div>
                        </div>
                        {!isExpired && (
                          <div className="invite-actions">
                            <button 
                              className="btn-icon btn-resend"
                              onClick={() => handleResend(invite.id, invite.email)}
                              title="Resend invitation"
                              disabled={loading}
                            >
                              <FaSync /> Resend
                            </button>
                            <button 
                              className="btn-icon btn-cancel"
                              onClick={() => handleCancel(invite.id, invite.email)}
                              title="Cancel invitation"
                              disabled={loading}
                            >
                              <FaTimes /> Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="no-pending-invites">
                <div className="empty-state">
                  <FaEnvelope className="empty-icon" />
                  <h4>No Pending Invitations</h4>
                  <p>Invitations you send will appear here</p>
                </div>
              </div>
            )}
            
            {/* Help Text */}
            <div className="invite-help">
              <h5><FaInfoCircle /> How it works:</h5>
              <ul>
                <li>Invitees receive an email with a secure link</li>
                <li>They must create an account (if new) or login</li>
                <li>After accepting, they'll appear in your roommates list</li>
                <li>Invitations expire in 7 days</li>
                <li>You can resend or cancel invitations at any time</li>
              </ul>
            </div>
          </>
        ) : (
          /* Restricted View for Members */
          <div className="restricted-view">
            <div className="restricted-content">
              <FaExclamationCircle className="restricted-icon" />
              <h4>Invitation Feature Restricted</h4>
              <p>
                Only group owners can invite new roommates to the expense group.
              </p>
              <div className="restricted-details">
                <p>
                  <strong>Your role:</strong> Group Member
                </p>
                <p>
                  <strong>What you can do:</strong>
                </p>
                <ul>
                  <li>Track and add expenses</li>
                  <li>View balances and splits</li>
                  <li>Record settlements</li>
                  <li>View transaction history</li>
                </ul>
                <p>
                  <strong>To invite new roommates:</strong> Please contact the group owner.
                </p>
              </div>
              <button className="btn-secondary" onClick={onClose}>
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteRoommateModal;