import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import ActiveTimerBar from "@/components/ActiveTimerBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";

// Pages other than the dashboard load on first visit (charts in Produtividade are the heaviest)
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const RecurrencesPage = lazy(() => import("@/pages/RecurrencesPage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProductivityPage = lazy(() => import("@/pages/ProductivityPage"));
const InboxPage = lazy(() => import("@/pages/InboxPage"));
const RemindersPage = lazy(() => import("@/pages/RemindersPage"));
const TrashPage = lazy(() => import("@/pages/TrashPage"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function Spinner() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen w-full">
      <AppSidebar />
      <main className="md:pl-[220px] pb-16 md:pb-0 min-h-screen overflow-x-hidden">
        <ActiveTimerBar variant="mobile" />
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/recurrences" element={<RecurrencesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/productivity" element={<ProductivityPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
