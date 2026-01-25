import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import People from "./pages/People";
import Ministries from "./pages/Ministries";
import Goals from "./pages/Goals";
import Meetings from "./pages/Meetings";
import Development from "./pages/Development";
import Courses from "./pages/Courses";
import FeedbackPage from "./pages/Feedback";
import Reviews from "./pages/Reviews";
import Surveys from "./pages/Surveys";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
      <Route path="/ministries" element={<ProtectedRoute><Ministries /></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
      <Route path="/development" element={<ProtectedRoute><Development /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
      <Route path="/surveys" element={<ProtectedRoute><Surveys /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
