// src/layouts/MainLayout.jsx
// Primary layout with Navbar + Footer

import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: 'var(--navbar-height)' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
