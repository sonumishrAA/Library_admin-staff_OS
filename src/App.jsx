import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import LibrarySelectPage from './pages/LibrarySelectPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import AdmissionPage from './pages/AdmissionPage';
import RenewalsPage from './pages/RenewalsPage';
import SeatsPage from './pages/SeatsPage';
import LockersPage from './pages/LockersPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import VacancyPage from './pages/VacancyPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/libraries"
        element={
          <ProtectedRoute>
            <LibrarySelectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/:libraryId"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="admissions/new" element={<AdmissionPage />} />
        <Route path="renewals" element={<RenewalsPage />} />
        <Route path="seats" element={<SeatsPage />} />
        <Route path="lockers" element={<LockersPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="vacancies" element={<VacancyPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
