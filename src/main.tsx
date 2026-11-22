// University of Ruhuna - Faculty of Agriculture
// GradePath React Application Entry Point

import React from 'react';
import ReactDOM from 'react-dom/client';
import GradePathApp from './GradePathApp';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GradePathApp />
    </React.StrictMode>
  );
}
