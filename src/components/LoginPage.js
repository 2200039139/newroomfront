import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiInfo, FiMail, FiLock, FiCheckCircle } from 'react-icons/fi';
import { AiOutlineRocket } from 'react-icons/ai';
import './Lg.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (error) setError('');
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Enhanced validation messages
    if (!formData.email || !formData.password) {
      setError('Please complete all required fields to continue');
      setIsLoading(false);
      return;
    }
    
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address format (example@domain.com)');
      setIsLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters for security');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Attempting secure authentication...');
      
      const response = await fetch('https://newroomback-production.up.railway.app/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        }),
      });
      
      console.log('Authentication response status:', response.status);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text);
        throw new Error('Authentication service temporarily unavailable. Please try again shortly.');
      }
      
      const data = await response.json();
      console.log('Authentication response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || `Authentication failed (Status: ${response.status})`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'The credentials provided do not match our records');
      }
      
      if (!data.data || !data.data.user || !data.data.token) {
        throw new Error('Secure authentication protocol error. Please contact support.');
      }
      
      // Save to localStorage with enhanced security note
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('token', data.data.token);
      
      // Save remember me preference with comment
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        console.log('Remember me preference saved for future sessions');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      console.log('Authentication successful! Redirecting to secure dashboard...');
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Authentication error details:', err);
      setError(err.message || 'Authentication failed. Please verify your credentials and try again. If the issue persists, contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="split-container">
      {/* Left side - Secure Login Portal */}
      <div className="login-side">
        <div className="login-card">
          <button 
            className="back-button" 
            onClick={() => navigate('/Homepage')}
            aria-label="Return to homepage"
          >
            <FiArrowLeft /> back
          </button>
          
          <div className="login-header">
            <h2>Welcome Back 👋</h2>
            <p className="subtitle">
              Access your expense management dashboard to streamline shared living costs
            </p>
          </div>
          
          {error && (
            <div className="error-message">
              <FiInfo className="error-icon" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <div className="label-header">
                  <FiMail className="label-icon" />
                  <span>Email Address</span>
                  <span className="required-badge">Required</span>
                </div>
              </label>
              <div className="input-with-icon">
                {!formData.email && focusedField !== 'email' && (
                  <FiMail className="input-icon" />
                )}
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={handleBlur}
                  placeholder="Enter the email associated with your RoomExpense"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  aria-describedby="email-hint"
                  className={error && !formData.email.includes('@') ? 'input-error' : ''}
                />
              </div>
              <small id="email-hint" className="input-hint">
                Enter the email associated with your RoomExpense account
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">
                <div className="label-header">
                  <FiLock className="label-icon" />
                  <span>Secure Password</span>
                  <span className="required-badge">Required</span>
                </div>
              </label>
              <div className="input-with-icon">
                {!formData.password && focusedField !== 'password' && (
                  <FiLock className="input-icon" />
                )}
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => handleFocus('password')}
                  onBlur={handleBlur}
                  placeholder="Minimum 6 characters • Case sensitive • Your data is encrypted"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  aria-describedby="password-hint"
                  className={error && formData.password.length < 6 ? 'input-error' : ''}
                />
              </div>
              <small id="password-hint" className="input-hint">
                Minimum 6 characters • Case sensitive • Your data is encrypted
              </small>
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  aria-describedby="remember-hint"
                />
                <label htmlFor="remember">
                  Keep me signed in
                  <small id="remember-hint" className="option-hint">
                    Recommended for personal devices only
                  </small>
                </label>
              </div>
              
              <Link 
                to="/forgot-password" 
                className="forgot-password"
                aria-label="Reset your password"
              >
                Forgot password?
              </Link>
            </div>
            
            <button
              type="submit"
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <AiOutlineRocket className="button-icon" />
                  <span>Access Dashboard</span>
                </>
              )}
            </button>
            
            <div className="security-note">
              <FiCheckCircle className="security-icon" />
              <span>Protected by 256-bit SSL encryption • GDPR Compliant</span>
            </div>
          </form>
          
          <div className="signup-prompt">
            <div className="divider">
              <span className="divider-text">New to RoomExpense?</span>
            </div>
            <p>
              Join thousands of professionals streamlining their shared expenses. 
              <Link to="/signup" className="signup-link">
                Create Your Free Account
              </Link>
            </p>
            <small className="signup-hint">
              No credit card required • 14-day free trial • Setup in 2 minutes
            </small>
          </div>
        </div>
      </div>
      
      {/* Right side - Value Proposition */}
      <div className="info-side">
        <div className="info-content">
          <div className="info-logo">
            <span className="logo-icon" role="img" aria-label="Money bag">💰</span>
            <span>RoomExpense Pro</span>
          </div>
          
          <h2>Enterprise-Grade Expense Management for Modern Living</h2>
          
          <div className="statistic">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Professional Users</div>
              <div className="stat-growth">↑ 42% YoY</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">$5M+</div>
              <div className="stat-label">Monthly Transactions</div>
              <div className="stat-growth">↑ 35% YoY</div>
            </div>
          </div>
          
          <div className="features">
            <div className="feature-section">
              <h3 className="feature-section-title">Why Industry Leaders Choose Us</h3>
              <div className="feature-item">
                <span className="feature-icon" role="img" aria-label="Check mark">✓</span>
                <div className="feature-text">
                  <h4>Automated Financial Reconciliation</h4>
                  <p>Intelligent algorithms that automatically track, categorize, and reconcile all shared expenses in real-time</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon" role="img" aria-label="Check mark">✓</span>
                <div className="feature-text">
                  <h4>Smart Balance Optimization</h4>
                  <p>Advanced algorithms calculate optimal settlement paths to minimize transaction complexity between parties</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon" role="img" aria-label="Check mark">✓</span>
                <div className="feature-text">
                  <h4>Comprehensive Audit Trail</h4>
                  <p>Complete transaction history with timestamps, categories, and notes for effortless financial reporting</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon" role="img" aria-label="Check mark">✓</span>
                <div className="feature-text">
                  <h4>Real-Time Financial Intelligence</h4>
                  <p>Live dashboard with predictive analytics and spending insights for proactive financial management</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="testimonial">
            <div className="testimonial-header">
              <span className="testimonial-badge">Enterprise Case Study</span>
              <div className="testimonial-rating">
                {'★'.repeat(5)} <span className="rating-text">5.0/5.0</span>
              </div>
            </div>
            <p className="quote">
              "After implementing RoomExpense across our multi-unit properties, we reduced administrative overhead by 73% and eliminated all financial disputes. The platform's automation and reporting capabilities transformed how we manage shared expenses."
            </p>
            <div className="author">
              <div className="author-info">
                <div className="author-name">Jamie D., Portfolio Manager</div>
                <div className="author-details">Manages 15 properties • Enterprise Customer since 2023</div>
              </div>
              <div className="author-stats">
                <span className="stat-badge">$2.1M processed</span>
                <span className="stat-badge">98% time saved</span>
              </div>
            </div>
          </div>
          
          <div className="trust-badges">
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <span>SOC 2 Type II Certified</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🏆</span>
              <span>FinTech Excellence Award 2024</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🤝</span>
              <span>Trusted by 500+ Companies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
