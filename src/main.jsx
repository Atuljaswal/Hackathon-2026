import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Local-only auth test page; does not change the existing frontend.
// Visit http://localhost:5173/?auth-test=1 while running `npm run dev`.
const showAuthTest = import.meta.env.DEV && new URLSearchParams(window.location.search).has('auth-test');
const AuthDevPanel = showAuthTest ? lazy(() => import('./dev/AuthDevPanel.jsx')) : null;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {showAuthTest && AuthDevPanel ? (
      <Suspense fallback={<p>Loading Firebase test...</p>}><AuthDevPanel /></Suspense>
    ) : <App />}
  </React.StrictMode>
);
