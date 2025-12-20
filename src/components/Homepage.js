import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Invitations.css';
import hpImage from './hp.jpg';

/* ================= DATA ================= */
const features = [
  { icon: '💸', title: 'Easy Splitting', description: 'Split bills among roommates easily.' },
  { icon: '📊', title: 'Visual Reports', description: 'Clear charts of who owes what.' },
  { icon: '🔔', title: 'Payment Reminders', description: 'Automatic reminders.' },
  { icon: '📱', title: 'Mobile Friendly', description: 'Works on all devices.' }
];

const testimonials = [
  { quote: 'RoomExpense saved our friendship!', author: 'Sarah, Bangalore' },
  { quote: 'Best app for splitting expenses.', author: 'Rohan, Mumbai' }
];

const footerLinks = {
  Product: ['Features', 'Pricing', 'FAQ'],
  Company: ['About Us', 'Blog', 'Contact'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy']
};

/* ================= COMPONENT ================= */
const HomePage = () => {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <div className="homepage">

      {/* ===== POPUP ===== */}
      {showPopup && (
  <div className="popup-message">
    <div className="popup-content">
      <div className="popup-header">
        <span className="popup-icon">🔔</span>
        <h4>Important Notice</h4>
        <button 
          className="popup-close-btn" 
          onClick={() => setShowPopup(false)}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      <div className="popup-body">
        <p>One login is shared for all roommates. Individual logins coming soon!</p>
        <p className="popup-hint">You can close this message and it won't show again for this session.</p>
      </div>
      <div className="popup-footer">
        <button 
          className="popup-understand-btn"
          onClick={() => setShowPopup(false)}
        >
          Got it!
        </button>
      </div>
    </div>
  </div>
)}

      {/* ===== NAVBAR ===== */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo">RoomExpense</div>
          <div className="auth-buttons">
            <Link to="/login" className="btn outline">Log In</Link>
            <Link to="/signup" className="btn primary">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <h1>Track Shared Expenses with Ease</h1>
            <p>Split bills, manage expenses, and avoid conflicts.</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn primary">Get Started</Link>
              <Link to="/about" className="btn outline">Learn More</Link>
            </div>
          </div>

          <div className="hero-image">
            <img src={hpImage} alt="Expense tracking" />
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section>
        <div className="section-inner">
          <h2>Why Choose RoomExpense?</h2>
          <div className="features-grid">
            {features.map((item, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="testimonials">
        <div className="section-inner">
          <h2>What Users Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((item, index) => (
              <div key={index} className="testimonial-card">
                <p>"{item.quote}"</p>
                <div className="testimonial-author">— {item.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta">
        <div className="section-inner">
          <h2>Start Managing Expenses Today</h2>
          <p>Join thousands of users simplifying shared living.</p>
          <Link to="/signup" className="btn primary">Start Free</Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-content">
            <div>
              <div className="logo">RoomExpense</div>
              <p>© {new Date().getFullYear()} RoomExpense</p>
            </div>

            <div className="footer-links">
              {Object.entries(footerLinks).map(([title, links]) => (
                <div key={title} className="link-column">
                  <h4>{title}</h4>
                  {links.map((link, i) => (
                    <Link key={i} to={`/${link.toLowerCase().replace(/\s+/g, '-')}`}>
                      {link}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
