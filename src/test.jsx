import React from 'react';
import { createRoot } from 'react-dom/client';
import Test from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
	<Test />
  </React.StrictMode>,
);
