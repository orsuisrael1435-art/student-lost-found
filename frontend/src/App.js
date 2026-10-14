import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import HowItWorks from './pages/public/HowItWorks';

// Student Pages
import Dashboard from './pages/student/Dashboard';
import ReportLost from './pages/student/ReportLost';
import ReportFound from './pages/student/ReportFound';
import LostItems from './pages/student/LostItems';
import FoundItems from './pages/student/FoundItems';
import ItemDetail from './pages/student/ItemDetail';
import MyReports from './pages/student/MyReports';
import Matches from './pages/student/Matches';
import MatchDetail from './pages/student/MatchDetail';
import Messages from './pages/student/Messages';
import Notifications from './pages/student/Notifications';
import Profile from './pages/student/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLostItems from './pages/admin/AdminLostItems';
import AdminFoundItems from './pages/admin/AdminFoundItems';
import AdminMatches from './pages/admin/AdminMatches';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBuildings from './pages/admin/AdminBuildings';

// Protected Route Guards
const StudentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!['admin', 'superadmin'].includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;
  if (user) return <Navigate to={['admin','superadmin'].includes(user.role) ? '/admin' : '/dashboard'} replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', borderRadius: '10px' },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Student Routes */}
          <Route path="/" element={<StudentRoute><StudentLayout /></StudentRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="report-lost" element={<ReportLost />} />
            <Route path="report-found" element={<ReportFound />} />
            <Route path="lost-items" element={<LostItems />} />
            <Route path="found-items" element={<FoundItems />} />
            <Route path="item/:type/:id" element={<ItemDetail />} />
            <Route path="my-reports" element={<MyReports />} />
            <Route path="matches" element={<Matches />} />
            <Route path="matches/:id" element={<MatchDetail />} />
            <Route path="messages" element={<Messages />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="lost-items" element={<AdminLostItems />} />
            <Route path="found-items" element={<AdminFoundItems />} />
            <Route path="matches" element={<AdminMatches />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="buildings" element={<AdminBuildings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
