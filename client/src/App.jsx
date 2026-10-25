import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import RoleGuard from './components/routing/RoleGuard.jsx';
import { fetchCurrentUser } from './redux/slices/authSlice.js';
import { connectSocket, disconnectSocket } from './services/socket.js';

// Code-splitting page components with React.lazy
const Home = lazy(() => import('./pages/Home.jsx'));
const JobListings = lazy(() => import('./pages/JobListings.jsx'));
const JobDetails = lazy(() => import('./pages/JobDetails.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const SavedJobs = lazy(() => import('./pages/SavedJobs.jsx'));
const SeekerDashboard = lazy(() => import('./pages/SeekerDashboard.jsx'));
const EmployerDashboard = lazy(() => import('./pages/EmployerDashboard.jsx'));
const PostEditJob = lazy(() => import('./pages/PostEditJob.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

// Page loading fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, accessToken]);

  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id, dispatch);
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [user?.id, dispatch]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="jobs" element={<JobListings />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            {/* Authenticated Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<Profile />} />

              {/* Seeker only routes */}
              <Route element={<RoleGuard allowedRoles={['seeker', 'admin']} />}>
                <Route path="saved" element={<SavedJobs />} />
                <Route path="dashboard/seeker" element={<SeekerDashboard />} />
              </Route>

              {/* Employer only routes */}
              <Route element={<RoleGuard allowedRoles={['employer', 'admin']} />}>
                <Route path="jobs/post" element={<PostEditJob />} />
                <Route path="jobs/:id/edit" element={<PostEditJob />} />
                <Route path="dashboard/employer" element={<EmployerDashboard />} />
              </Route>
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
