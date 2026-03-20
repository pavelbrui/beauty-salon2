import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminRoute } from './components/AdminRoute';
import { AuthRoute } from './components/AuthRoute';
import { LanguageLayout } from './components/LanguageLayout';
import { usePageTracking } from './hooks/usePageTracking';
import { CookieConsent } from './components/CookieConsent';

// Static imports for SEO-critical pages (prerendered at build time)
import { Home } from './pages/Home';
import { ServicesPage } from './pages/ServicesPage';
import { BlogPage } from './pages/BlogPage';
import { TrainingPage } from './pages/TrainingPage';
import { GalleryPage } from './pages/GalleryPage';
import { StylistsPage } from './pages/StylistsPage';
import { PricesPage } from './pages/PricesPage';

// Lazy-loaded pages — not indexed by search engines
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const BookingPage = lazy(() => import('./pages/BookingPage').then(m => ({ default: m.BookingPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ServiceLandingPage = lazy(() => import('./pages/ServiceLandingPage').then(m => ({ default: m.ServiceLandingPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));

const PageLoader = () => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-white">
    <div className="relative w-32 h-32 mb-8">
      <img
        src="https://d375139ucebi94.cloudfront.net/region2/pl/162206/logo/163448f26b6c40adb662c97da37033-katarzyna-brui-logo-20152422ca364bf1a5efce379aec29-booksy.jpeg"
        alt="Loading..."
        className="w-full h-full object-contain animate-pulse"
        width={128}
        height={128}
      />
    </div>
    <div className="w-16 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded-full overflow-hidden">
      <div className="h-full bg-amber-600 animate-slideRight" />
    </div>
  </div>
);

// Public routes shared across all language prefixes
const publicRoutes = (
  <>
    <Route index element={<Home />} />
    <Route path="services" element={<ServicesPage />} />
    <Route path="services/:category" element={<ServicesPage />} />
    <Route path="prices" element={<PricesPage />} />
    <Route path="cennik" element={<PricesPage />} />
    <Route path="booking/:serviceId" element={<BookingPage />} />
    <Route path="profile" element={<AuthRoute><ProfilePage /></AuthRoute>} />
    <Route path="appointments" element={<AppointmentsPage />} />
    <Route path="stylists" element={<StylistsPage />} />
    <Route path="gallery" element={<GalleryPage />} />
    <Route path="training" element={<TrainingPage />} />
    <Route path="training/:slug" element={<TrainingPage />} />
    <Route path="blog" element={<BlogPage />} />
    <Route path="blog/:slug" element={<BlogPage />} />
    <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
    <Route path="terms" element={<TermsPage />} />
    {/* SEO landing pages — must be last (catch-all for root-level slugs) */}
    <Route path=":landingSlug" element={<ServiceLandingPage />} />
  </>
);

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
  usePageTracking();

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Polish (default) — no prefix */}
          <Route element={<LanguageLayout />}>
            {publicRoutes}
          </Route>

          {/* English — /en prefix */}
          <Route path="/en" element={<LanguageLayout />}>
            {publicRoutes}
          </Route>

          {/* Russian — /ru prefix */}
          <Route path="/ru" element={<LanguageLayout />}>
            {publicRoutes}
          </Route>

          {/* Admin stays outside language routing */}
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <CookieConsent />}
    </>
  );
};

export default App;
