import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Background from './components/Background';

const Welcome  = lazy(() => import('./pages/Welcome'));
const Home     = lazy(() => import('./pages/Home'));
const Explore  = lazy(() => import('./pages/Explore'));
const Ongoing  = lazy(() => import('./pages/Ongoing'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Watch    = lazy(() => import('./pages/Watch'));
const History  = lazy(() => import('./pages/History'));

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="glass flex h-16 w-16 items-center justify-center rounded-2xl">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F6CF80]/25 border-t-[#F6CF80]" />
    </div>
  </div>
);

// key={pathname} membuat animasi .page-enter diputar ulang tiap pindah halaman
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/"         element={<Welcome />} />
        <Route path="/home"     element={<Home />} />
        <Route path="/explore"  element={<Explore />} />
        <Route path="/ongoing"  element={<Ongoing />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/watch"    element={<Watch />} />
        <Route path="/history"  element={<History />} />
        <Route path="*"         element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Background />
      <Suspense fallback={<Loader />}>
        <AnimatedRoutes />
      </Suspense>
    </Router>
  );
}

export default App;
