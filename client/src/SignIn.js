import React, { useState } from 'react';
import TermsModal from './TermsModal';
import './SignIn.css';

function SignIn({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Simulate authentication
    setTimeout(() => {
      const user = {
        email,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('pawsocial_user', JSON.stringify(user));
      onSignIn(user);
      setLoading(false);
    }, 500);
  };

  const handleFreeAccess = () => {
    setLoading(true);
    setTimeout(() => {
      const guestUser = {
        email: 'guest@pawsocial.app',
        id: 'guest_' + Date.now().toString(),
        isGuest: true,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('pawsocial_user', JSON.stringify(guestUser));
      onSignIn(guestUser);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1>🐾 PawSocial</h1>
          <p>Connect with amazing dogs near you</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="signin-button"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleFreeAccess}
            className="free-access-button"
          >
            {loading ? 'Loading...' : 'Continue as Guest'}
          </button>
        </form>

        <div className="signin-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="toggle-button"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div className="signin-features">
          <h3>What you can do:</h3>
          <ul>
            <li>✅ Add your dog's profile</li>
            <li>✅ Browse other dogs in your area</li>
            <li>✅ Connect with dog lovers</li>
            <li>✅ Share dog photos</li>
          </ul>
        </div>

        <div className="signin-legal">
          <p>
            By signing in, you agree to our{' '}
            <button 
              type="button"
              className="legal-link"
              onClick={() => setModalType('terms')}
            >
              Terms & Conditions
            </button>
            {' '}and{' '}
            <button 
              type="button"
              className="legal-link"
              onClick={() => setModalType('privacy')}
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>

      {modalType && <TermsModal type={modalType} onClose={() => setModalType(null)} />}
    </div>
  );
}

export default SignIn;
