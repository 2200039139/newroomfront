import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaSignInAlt, FaUserPlus, FaEnvelope, FaUsers } from 'react-icons/fa';

const AcceptInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [invitationEmail, setInvitationEmail] = useState('');
  const [inviterName, setInviterName] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState({});
  
  // Use refs to track state
  const hasProcessed = useRef(false);
  const isInitialLoad = useRef(true);

  // Add debug logging
  useEffect(() => {
    const authToken = localStorage.getItem('token');
    console.log('=== ACCEPT INVITATION DEBUG ===');
    console.log('Token from params:', token);
    console.log('Auth token in localStorage:', authToken ? 'Present' : 'Missing');
    console.log('Auth token value:', authToken ? `${authToken.substring(0, 30)}...` : 'None');
    console.log('Location state:', location.state);
    
    // Check for pending invitation in localStorage
    const pendingToken = localStorage.getItem('pending_invitation_token');
    console.log('Pending token in localStorage:', pendingToken);
    
    // Update debug info for UI
    setDebugInfo({
      hasAuthToken: !!authToken,
      tokenLength: authToken ? authToken.length : 0,
      pendingToken: !!pendingToken,
      locationState: location.state
    });

    return () => {
      console.log('AcceptInvitationPage unmounting');
    };
  }, [token, location.state]);

  const acceptInvitation = async (forceRetry = false) => {
    // Prevent multiple processing unless forced retry
    if (hasProcessed.current && !forceRetry) {
      console.log('Already processed this invitation, skipping');
      return;
    }
    
    try {
      const authToken = localStorage.getItem('token');
      console.log('=== PROCESSING INVITATION ===');
      console.log('Using auth token:', authToken ? 'Yes' : 'No');
      console.log('Invitation token:', token);
      
      setStatus('loading');
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add auth token if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('Adding Authorization header with token');
      }
      
      const response = await fetch(`http://localhost:5000/api/invitations/accept/${token}`, {
        headers: headers
      });
      
      console.log('Response status:', response.status);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned invalid response format');
      }
      
      const data = await response.json();
      
      console.log('Invitation response:', data);
      console.log('Response success:', data.success);
      console.log('Requires login:', data.requiresLogin);
      
      if (data.success) {
        hasProcessed.current = true;
        
        if (data.requiresLogin) {
          console.log('Server says requires login even with auth token');
          
          // Check if we have an auth token but server still requires login
          if (authToken) {
            console.log('WARNING: Has auth token but server still requires login');
            console.log('Possible issues:');
            console.log('1. Token might be invalid/expired');
            console.log('2. Server might not be accepting the token');
            console.log('3. User might not match invitation email');
            
            // Try to get user info to debug
            try {
              const userResponse = await fetch('http://localhost:5000/api/users/me', {
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log('Current user data:', userData);
                console.log('User email:', userData.email);
                console.log('Invitation email:', data.email);
                
                if (userData.email !== data.email) {
                  setStatus('error');
                  setMessage(`Invitation is for ${data.email} but you're logged in as ${userData.email}. Please log out and login with the correct email.`);
                  return;
                }
              }
            } catch (userError) {
              console.error('Failed to fetch user info:', userError);
            }
          }
          
          setInvitationEmail(data.email);
          setMessage(data.message);
          setStatus('requires_login');
          
        } else if (data.alreadyMember) {
          setStatus('already_member');
          setMessage(data.message);
          setUserRole(data.userRole || 'member');
          
          // Store flag to refresh data
          localStorage.setItem('should_refresh', 'true');
          localStorage.setItem('user_role', data.userRole || 'member');
          localStorage.setItem('just_accepted_invitation', 'true');
          setTimeout(() => navigate('/dashboard'), 3000);
          
        } else {
          setStatus('success');
          setMessage(data.message);
          setInviterName(data.data?.inviterName || 'Your friend');
          setUserRole(data.data?.userRole || 'member');
          
          // IMPORTANT: Clear ALL caches and set refresh flags
          localStorage.removeItem('roommates_cache');
          localStorage.removeItem('expenses_cache');
          localStorage.removeItem('settlements_cache');
          localStorage.removeItem('user_role');
          
          // Set MULTIPLE flags to ensure refresh happens
          localStorage.setItem('invitation_accepted', 'true');
          localStorage.setItem('should_refresh', 'true');
          localStorage.setItem('force_data_fetch', Date.now().toString());
          localStorage.setItem('just_accepted_invitation', 'true');
          
          // Store invitation data for the dashboard
          sessionStorage.setItem('recent_invitation', JSON.stringify({
            inviterName: data.data?.inviterName,
            inviterEmail: data.data?.inviterEmail,
            inviterId: data.data?.inviterId,
            timestamp: Date.now()
          }));
          
          // For the inviter (if they're the same browser), trigger a refresh
          // This is important so User A sees User B immediately
          if (data.data?.inviterId) {
            // Check if current user is the inviter
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (currentUser.id === data.data.inviterId) {
              console.log('Current user is the inviter - forcing dashboard refresh');
              localStorage.setItem('refresh_dashboard', 'true');
              localStorage.setItem('new_roommate_added', 'true');
            }
          }
          
          // Redirect with state
          setTimeout(() => {
            navigate('/dashboard', { 
              state: { 
                fromInvitation: true,
                inviterName: data.data?.inviterName,
                inviterEmail: data.data?.inviterEmail,
                inviterId: data.data?.inviterId,
                showWelcome: true,
                userRole: data.data?.userRole || 'member',
                forceRefresh: true,
                roommatesSynced: data.data?.roommatesSynced
              } 
            });
          }, 2000);
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to accept invitation');
        hasProcessed.current = true;
      }
    } catch (error) {
      console.error('Invitation error:', error);
      
      // Retry logic (max 3 retries)
      if (retryCount < 3) {
        console.log(`Retrying... (${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          acceptInvitation(true);
        }, 1500);
      } else {
        setStatus('error');
        setMessage('Failed to process invitation. Please try again.');
        hasProcessed.current = true;
      }
    }
  };

  useEffect(() => {
    if (token) {
      // Clear pending invitation data since we're processing it
      localStorage.removeItem('pending_invitation_token');
      localStorage.removeItem('pending_invitation_email');
      sessionStorage.removeItem('pending_invitation');
      
      // Check if we have an auth token
      const authToken = localStorage.getItem('token');
      
      if (authToken && location.state?.fromLogin) {
        console.log('Coming from login page with auth token');
        // Wait a moment to ensure token is properly set
        setTimeout(() => acceptInvitation(), 500);
      } else {
        // Normal flow
        acceptInvitation();
      }
      
      isInitialLoad.current = false;
    } else {
      setStatus('error');
      setMessage('Invalid invitation token');
    }
  }, [token, navigate]);

  const handleLoginRedirect = () => {
    console.log('Redirecting to login with invitation token:', token);
    
    // Store invitation data
    if (token) {
      localStorage.setItem('pending_invitation_token', token);
    }
    
    if (invitationEmail) {
      localStorage.setItem('pending_invitation_email', invitationEmail);
    }
    
    // Navigate to login with state
    navigate('/login', { 
      state: { 
        fromInvitation: true,
        invitationToken: token,
        invitationEmail: invitationEmail,
        returnTo: `/accept-invitation/${token}`
      },
      replace: true
    });
  };

  const handleSignupRedirect = () => {
    console.log('Redirecting to signup with invitation token:', token);
    
    if (token) {
      localStorage.setItem('pending_invitation_token', token);
    }
    
    if (invitationEmail) {
      localStorage.setItem('pending_invitation_email', invitationEmail);
    }
    
    navigate('/signup', { 
      state: { 
        fromInvitation: true,
        invitationToken: token,
        invitationEmail: invitationEmail,
        returnTo: `/accept-invitation/${token}`
      },
      replace: true
    });
  };

  const handleManualRedirect = () => {
    // Clear all caches
    localStorage.removeItem('roommates_cache');
    localStorage.removeItem('expenses_cache');
    
    // Store role information
    if (userRole) {
      localStorage.setItem('user_role', userRole);
    } else {
      // Default to member for invited users
      localStorage.setItem('user_role', 'member');
    }
    
    // Force refresh and redirect
    localStorage.setItem('should_refresh', 'true');
    localStorage.setItem('just_accepted_invitation', 'true');
    navigate('/dashboard', { 
      state: { 
        fromInvitation: true,
        userRole: userRole || 'member',
        forceRefresh: true
      } 
    });
  };

  const handleRetryInvitation = () => {
    console.log('Retrying invitation acceptance...');
    setRetryCount(0);
    setStatus('loading');
    setMessage('');
    hasProcessed.current = false;
    acceptInvitation(true);
  };

  const handleLogoutAndRetry = () => {
    console.log('Logging out and retrying...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.setItem('pending_invitation_token', token);
    localStorage.setItem('pending_invitation_email', invitationEmail);
    
    navigate('/login', { 
      state: { 
        fromInvitation: true,
        invitationToken: token,
        invitationEmail: invitationEmail,
        forceLogin: true
      },
      replace: true
    });
  };

  return (
    <div className="accept-invitation-page">
      <div className="invitation-container">
        <div className="invitation-card">
          {status === 'loading' && (
            <>
              <FaSpinner className="spinner-icon" />
              <h2>Processing Invitation...</h2>
              <p>Please wait while we validate your invitation.</p>
              <p className="debug-hint">
                Auth token: {debugInfo.hasAuthToken ? 'Present' : 'Missing'}
                {debugInfo.hasAuthToken && ` (${debugInfo.tokenLength} chars)`}
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <FaCheckCircle className="success-icon" />
              <h2>🎉 Invitation Accepted!</h2>
              <p>{message}</p>
              {inviterName && (
                <>
                  <p>You've been added to <strong>{inviterName}'s</strong> expense group.</p>
                  <div className="roommate-status">
                    <FaCheckCircle style={{ color: '#28a745', marginRight: '8px' }} />
                    <span>Your role: <strong>{userRole === 'owner' ? 'Group Owner' : 'Group Member'}</strong></span>
                  </div>
                  <div className="sync-info">
                    <p>✓ Roommate lists synchronized</p>
                    <p>✓ You can now add expenses with the group</p>
                    <p>✓ The group owner will see you in their roommate list</p>
                  </div>
                </>
              )}
              <p>You will be redirected to the dashboard shortly...</p>
              <div className="loading-bar">
                <div className="loading-progress"></div>
              </div>
              <button 
                className="btn-secondary"
                onClick={handleManualRedirect}
                style={{ marginTop: '20px' }}
              >
                Go to Dashboard Now
              </button>
            </>
          )}
          
          {status === 'requires_login' && (
            <>
              <h2><FaEnvelope /> Accept Invitation</h2>
              <p>{message}</p>
              <div className="invitation-email">
                <p><strong>Invitation for:</strong> {invitationEmail}</p>
                {inviterName && <p><strong>Invited by:</strong> {inviterName}</p>}
              </div>
              
              {debugInfo.hasAuthToken && (
                <div className="warning-message">
                  <p><strong>⚠️ Notice:</strong> You appear to be logged in, but the invitation is for a different email.</p>
                  <p>Please login with: <strong>{invitationEmail}</strong></p>
                  <button 
                    className="btn-warning"
                    onClick={handleLogoutAndRetry}
                    style={{ margin: '10px 0' }}
                  >
                    Logout & Login with Correct Email
                  </button>
                </div>
              )}
              
              <p>Please login or create an account to accept this invitation.</p>
              <div className="auth-options">
                <button 
                  className="btn-primary"
                  onClick={handleLoginRedirect}
                >
                  <FaSignInAlt /> Login
                </button>
                <button 
                  className="btn-secondary"
                  onClick={handleSignupRedirect}
                >
                  <FaUserPlus /> Sign Up
                </button>
              </div>
              <p className="hint">
                Already have an account with a different email? 
                <br />
                Please login with the email that received this invitation.
              </p>
            </>
          )}
          
          {status === 'already_member' && (
            <>
              <FaCheckCircle className="info-icon" />
              <h2>Already a Member</h2>
              <p>{message}</p>
              <p>Your role: <strong>{userRole === 'owner' ? 'Group Owner' : 'Group Member'}</strong></p>
              <p>Redirecting to dashboard...</p>
              <button 
                className="btn-primary"
                onClick={handleManualRedirect}
              >
                Go to Dashboard Now
              </button>
            </>
          )}
          
          {status === 'error' && (
            <>
              <FaTimesCircle className="error-icon" />
              <h2>Invitation Failed</h2>
              <p>{message}</p>
              
              {/* Debug info for developers */}
              {process.env.NODE_ENV === 'development' && (
                <div className="debug-info" style={{ 
                  background: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  fontSize: '12px',
                  margin: '10px 0'
                }}>
                  <p><strong>Debug Info:</strong></p>
                  <p>Has auth token: {debugInfo.hasAuthToken ? 'Yes' : 'No'}</p>
                  <p>Token length: {debugInfo.tokenLength || 'N/A'}</p>
                  <p>Retry count: {retryCount}</p>
                  <p>Has processed: {hasProcessed.current ? 'Yes' : 'No'}</p>
                  <p>Initial load: {isInitialLoad.current ? 'Yes' : 'No'}</p>
                </div>
              )}
              
              <div className="error-actions">
                <button 
                  className="btn-primary"
                  onClick={handleRetryInvitation}
                  style={{ marginBottom: '10px' }}
                >
                  Retry Accepting Invitation
                </button>
                
                {debugInfo.hasAuthToken && (
                  <button 
                    className="btn-warning"
                    onClick={handleLogoutAndRetry}
                    style={{ marginBottom: '10px' }}
                  >
                    Logout & Try Again
                  </button>
                )}
                
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/')}
                >
                  Go to Homepage
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </button>
                <Link to="/contact" className="btn-link">
                  Contact Support
                </Link>
              </div>
            </>
          )}
        </div>
        
        <div className="invitation-info">
          <h3><FaUsers /> About ExpenseHub</h3>
          <p>ExpenseHub helps roommates track shared expenses, split bills, and settle debts easily.</p>
          <ul>
            <li>📊 Track all shared expenses</li>
            <li>🤝 Split bills automatically</li>
            <li>💰 See who owes whom</li>
            <li>✅ Record settlements</li>
            <li>📱 Access from any device</li>
            <li>🔒 Secure and private</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;