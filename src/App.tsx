import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FEATURES } from "@/config/features";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import People from "./pages/People";
import Ministries from "./pages/Ministries";
import Goals from "./pages/Goals";
import Meetings from "./pages/Meetings";


import Reviews from "./pages/Reviews";
import Surveys from "./pages/Surveys";
import Analytics from "./pages/Analytics";
import Administration from "./pages/Administration";
import Profile from "./pages/Profile";
import Learning from "./pages/Learning";
import NotFound from "./pages/NotFound";

// Calendar pages
import QuartersPage from "./pages/calendar/Quarters";
import QuarterDetailPage from "./pages/calendar/QuarterDetail";
import ProgramsPage from "./pages/calendar/Programs";
import EventsCalendarPage from "./pages/calendar/EventsCalendar";
import EventDetailPage from "./pages/calendar/EventDetail";
import EventEditorPage from "./pages/calendar/EventEditor";

// Mentorship
import MentorshipPage from "./pages/Mentorship";

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
      <Route path="/team" element={<Navigate to="/people" replace />} />
      <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
      <Route path="/ministries" element={<ProtectedRoute><Ministries /></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
      <Route path="/development" element={<Navigate to="/goals" replace />} />
      {FEATURES.courses && (
        <>
          <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
          <Route path="/courses" element={<Navigate to="/learning" replace />} />
        </>
      )}
      <Route path="/feedback" element={<Navigate to="/reviews" replace />} />
      <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
      {FEATURES.surveys && <Route path="/surveys" element={<ProtectedRoute><Surveys /></ProtectedRoute>} />}
      {FEATURES.analytics && <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />}
      <Route path="/admin" element={<Navigate to="/administration" replace />} />
      <Route path="/administration" element={<ProtectedRoute><Administration /></ProtectedRoute>} />
      <Route path="/settings" element={<Navigate to="/administration" replace />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* Calendar routes */}
      <Route path="/calendar/quarters" element={<ProtectedRoute><QuartersPage /></ProtectedRoute>} />
      <Route path="/calendar/quarters/:id" element={<ProtectedRoute><QuarterDetailPage /></ProtectedRoute>} />
      <Route path="/calendar/programs" element={<ProtectedRoute><ProgramsPage /></ProtectedRoute>} />
      <Route path="/calendar/events" element={<ProtectedRoute><EventsCalendarPage /></ProtectedRoute>} />
      <Route path="/calendar/events/new" element={<ProtectedRoute><EventEditorPage /></ProtectedRoute>} />
      <Route path="/calendar/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
      <Route path="/calendar/events/:id/edit" element={<ProtectedRoute><EventEditorPage /></ProtectedRoute>} />
      
      {/* Learning & Mentorship routes */}
      <Route path="/pathways" element={<Navigate to="/learning" replace />} />
      <Route path="/my-learning" element={<Navigate to="/learning" replace />} />
      <Route path="/mentorship" element={<ProtectedRoute><MentorshipPage /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
    </ThemeProvider>
  </QueryClientProvider>
);


export default App;
