import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Home from './pages/Home';
import Registration from './pages/Registration';
import RemarkScanner from './pages/RemarkScanner';
import History from './pages/History';
import RemarkPage from './pages/RemarkPage';
import InchargeManager from './pages/InchargeManager';
import Layout from './components/Layout';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import HODManagement from './pages/admin/HODManagement';
import InchargeManagement from './pages/admin/InchargeManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import StudentManagement from './pages/admin/StudentManagement';
import RemarksManagement from './pages/admin/RemarksManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReports from './pages/admin/AdminReports';
import ActivityLog from './pages/admin/ActivityLog';
import SystemSettings from './pages/admin/SystemSettings';
import AdminProfile from './pages/admin/AdminProfile';

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/"               element={<Navigate to="/login" replace />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/home"           element={<Layout><Home /></Layout>} />
        <Route path="/remark"         element={<Layout><RemarkPage /></Layout>} />
        <Route path="/registration"   element={<Layout><Registration /></Layout>} />
        <Route path="/remark-scanner" element={<Layout><RemarkScanner /></Layout>} />
        <Route path="/history"        element={<Layout><History /></Layout>} />
        <Route path="/incharges"      element={<Layout><InchargeManager /></Layout>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard"   element={<Layout><AdminDashboard /></Layout>} />
        <Route path="/admin/hods"        element={<Layout><HODManagement /></Layout>} />
        <Route path="/admin/incharges"   element={<Layout><InchargeManagement /></Layout>} />
        <Route path="/admin/departments" element={<Layout><DepartmentManagement /></Layout>} />
        <Route path="/admin/students"    element={<Layout><StudentManagement /></Layout>} />
        <Route path="/admin/remarks"     element={<Layout><RemarksManagement /></Layout>} />
        <Route path="/admin/analytics"   element={<Layout><AdminAnalytics /></Layout>} />
        <Route path="/admin/reports"     element={<Layout><AdminReports /></Layout>} />
        <Route path="/admin/activity-log"element={<Layout><ActivityLog /></Layout>} />
        <Route path="/admin/settings"    element={<Layout><SystemSettings /></Layout>} />
        <Route path="/admin/profile"     element={<Layout><AdminProfile /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
