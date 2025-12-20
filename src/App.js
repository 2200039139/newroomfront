import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import RoommateExpenseTracker from './components/RoommateExpenseTracker';
import HomePage from './components/Homepage';
import AcceptInvitationPage from './components/AcceptInvitationPage';

// Updated PrivateRoute for React Router v6
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public route - redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/homepage" 
          element={
            <PublicRoute>
              <HomePage />
            </PublicRoute>
          }
        />
        
        {/* Protected route - requires authentication */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <RoommateExpenseTracker />
            </PrivateRoute>
          } 
        />
        <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/homepage" replace />} />
        <Route path="*" element={<Navigate to="/homepage" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;