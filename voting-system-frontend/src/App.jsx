import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import { ToastProvider } from "./components/ui/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import VoterLayout from "./components/layout/VoterLayout";

import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

import DashboardPage from "./pages/DashboardPage";
import ElectionsListPage from "./pages/ElectionsListPage";
import ElectionFormPage from "./pages/ElectionFormPage";
import ElectionDetailPage from "./pages/ElectionDetailPage";
import CandidatesListPage from "./pages/CandidatesListPage";
import CandidateFormPage from "./pages/CandidateFormPage";
import PartiesListPage from "./pages/PartiesListPage";
import PartyFormPage from "./pages/PartyFormPage";
import UsersListPage from "./pages/UsersListPage";
import ResultsPage from "./pages/ResultsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";

import VoterHomePage from "./pages/voter/VoterHomePage";
import VoterElectionsPage from "./pages/voter/VoterElectionsPage";
import VoterElectionDetailPage from "./pages/voter/VoterElectionDetailPage";
import VotePage from "./pages/voter/VotePage";
import VoterResultsPage from "./pages/voter/VoterResultsPage";
import VoterProfilePage from "./pages/voter/VoterProfilePage";
const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Admin */}
        <Route
          element={
            <ProtectedRoute roles={["admin"]} redirectTo="/voter/home">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/elections" element={<ElectionsListPage />} />
          <Route path="/elections/create" element={<ElectionFormPage />} />
          <Route path="/elections/:id" element={<ElectionDetailPage />} />
          <Route path="/elections/:id/edit" element={<ElectionFormPage />} />

          <Route path="/candidates" element={<CandidatesListPage />} />
          <Route path="/candidates/create" element={<CandidateFormPage />} />
          <Route path="/candidates/:id" element={<CandidateFormPage />} />
          <Route path="/candidates/:id/edit" element={<CandidateFormPage />} />

          <Route path="/parties" element={<PartiesListPage />} />
          <Route path="/parties/create" element={<PartyFormPage />} />
          <Route path="/parties/:id" element={<PartyFormPage />} />
          <Route path="/parties/:id/edit" element={<PartyFormPage />} />

          <Route path="/users" element={<UsersListPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Voter */}
        <Route
          element={
            <ProtectedRoute roles={["voter"]} redirectTo="/dashboard">
              <VoterLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/voter/home" element={<VoterHomePage />} />
          <Route path="/voter/elections" element={<VoterElectionsPage />} />
          <Route path="/voter/elections/:id" element={<VoterElectionDetailPage />} />
          <Route path="/voter/elections/:id/vote" element={<VotePage />} />
          <Route path="/voter/results" element={<VoterResultsPage />} />
          <Route path="/voter/profile" element={<VoterProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
    </QueryClientProvider>
  );
}

export default function AppWithProviders() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}
