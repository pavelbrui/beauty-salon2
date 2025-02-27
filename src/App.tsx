import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { ServicesPage } from './pages/ServicesPage';
import { BookingPage } from './pages/BookingPage';
import { ProfilePage } from './pages/ProfilePage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { StylistsPage } from './pages/StylistsPage';
import { GalleryPage } from './pages/GalleryPage';
import { Navbar } from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:category" element={<ServicesPage />} />
        <Route path="/booking/:serviceId" element={<BookingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/stylists" element={<StylistsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
};

export default App;