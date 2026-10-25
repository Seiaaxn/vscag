import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';

const Welcome  = lazy(() => import('./pages/Welcome'));
const Home     = lazy(() => import('./pages/Home'));
const Explore  = lazy(() => import('./pages/Explore'));
const Ongoing  = lazy(() => import('./pages/Ongoing'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Watch    = lazy(() => import('./pages/Watch'));
const Genre    = lazy(() => import('./pages/Genre'));
const GenreResults = lazy(() => import('./pages/GenreResults'));
const Detail   = lazy(() => import('./pages/Detail'));
const Auth     = lazy(() => import('./pages/Auth'));
const Profile  = lazy(() => import('./pages/Profile'));

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
    <div key={location.pathname}>
      <Routes location={location}>
        <Route path="/"         element={<Welcome />} />
        <Route path="/home"     element={<Home />} />
        <Route path="/explore"  element={<Explore />} />
        <Route path="/ongoing"  element={<Ongoing />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/watch"    element={<Watch />} />
        <Route path="/genre"    element={<Genre />} />
        <Route path="/genre/:genreId" element={<GenreResults />} />
        <Route path="/anime/:id" element={<Detail />} />
        <Route path="/login"    element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        {/* Halaman wajib login */}
        <Route path="/profile"  element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/history"   element={<RequireAuth><Navigate to="/profile?tab=history" replace /></RequireAuth>} />
        <Route path="/bookmarks" element={<RequireAuth><Navigate to="/profile?tab=bookmark" replace /></RequireAuth>} />
        <Route path="*"         element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<Loader />}>
          <AnimatedRoutes />
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
