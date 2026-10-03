/**
 * Admin Dashboard Entry Point
 * Loads all CSS and initializes admin components
 */

import './assets/styles/main.css';

import { AdminDashboard } from './components/AdminDashboard.ts';
import { AdminKeygen } from './components/AdminKeygen.ts';
import { MatrixRain } from './components/MatrixRain.ts';
import { getSoundEngine } from './components/SoundEngine.ts';

import deviceCatalog from './assets/data/device-catalog.json';

const SECRET_KEY = process.env.LICENSE_SECRET_KEY || 'ff-ob54-benz-secret-key-2026';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

// Matrix background
const matrixRain = new MatrixRain();
matrixRain.start();

// Sound
getSoundEngine({ enabled: false });

// Wrap in a full-page container
const root = document.getElementById('app-root')!;
root.style.cssText = `
  min-height: 100vh;
  background: var(--bg);
  overflow-y: auto;
`;

// Admin Dashboard
const dashboard = new AdminDashboard({
    onRefresh: () => dashboard.refresh()
});
root.appendChild(dashboard.getElement());

// Admin Keygen — mounted inside dashboard's keygen container
const keygen = new AdminKeygen({
    catalog: deviceCatalog as any,
    secretKey: SECRET_KEY,
    adminPasswordHash: ADMIN_PASSWORD_HASH,
    onKeysGenerated: (keys: any) => console.log('[Admin] Keys generated:', keys.length)
});

const keygenContainer = document.getElementById('keygen-container');
if (keygenContainer) {
    keygenContainer.appendChild(keygen.getElement());
}

// Start dashboard
dashboard.init();
