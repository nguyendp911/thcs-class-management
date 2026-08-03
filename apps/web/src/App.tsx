import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassFeedPage } from './pages/ClassFeedPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeaveRequestsPage } from './pages/LeaveRequestsPage';
import { GradebookPage } from './pages/GradebookPage';
import { ConductPage } from './pages/ConductPage';
import { TimetablePage } from './pages/TimetablePage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';
import { ParentPortalPage } from './pages/ParentPortalPage';
import { StudentPortalPage } from './pages/StudentPortalPage';

const queryClient = new QueryClient();

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen text-[#18243A] font-sans">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
};

export const App: React.FC = () => {
  const baseUrl = import.meta.env.BASE_URL || '/thcs';

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router basename={baseUrl}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<LoginPage />} />

            {/* Authenticated Application Routes */}
            <Route path="/app/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/feed" element={<ProtectedRoute><ClassFeedPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/students/:studentId" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
            <Route path="/app/students/:studentId" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/leave-requests" element={<ProtectedRoute><LeaveRequestsPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/gradebook" element={<ProtectedRoute><GradebookPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/conduct" element={<ProtectedRoute><ConductPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/timetable" element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/incidents" element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
            <Route path="/app/classes/:classId/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/app/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

            {/* Portals */}
            <Route path="/portal/parent" element={<ProtectedRoute><ParentPortalPage /></ProtectedRoute>} />
            <Route path="/portal/student" element={<ProtectedRoute><StudentPortalPage /></ProtectedRoute>} />

            {/* Default Fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
