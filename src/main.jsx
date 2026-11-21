import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './theme3d.css';
import Scene3D from './components/Scene3D.jsx';
import { DEMO } from './demo/mockApi.js';
import DemoBanner from './components/DemoBanner.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Scene3D />
    <App />
    {DEMO && <DemoBanner />}
  </StrictMode>,
);
