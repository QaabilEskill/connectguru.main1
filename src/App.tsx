import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import Mentors from "./pages/Mentors";
import Dashboard from "./pages/Dashboard";
import PsychometricTestPage from "./pages/PsychometricTestPage";
import PsychometricPayment from "./pages/PsychometricPayment";
import NotFound from "./pages/NotFound";
import RequireAccess from "./components/RequireAccess";
import AdminRedirect from "./pages/AdminRedirect";
import PathSelector from "./pages/PathSelector";
import TutorHome from "./pages/TutorHome";
import TutorClassroom from "./pages/TutorClassroom";
import TutorResults from "./pages/TutorResults";
import TutorVocab from "./pages/TutorVocab";
import AdminTutor from "./pages/AdminTutor";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          <BrowserRouter>
            <div>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/mentors" element={<Mentors />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/psychometric-test" element={<RequireAccess kind="test"><PsychometricTestPage /></RequireAccess>} />
                <Route path="/test-access" element={<PsychometricPayment />} />
                <Route path="/psychometric-payment" element={<Navigate to="/test-access" replace />} />
                <Route path="/choose-path" element={<PathSelector />} />
                <Route path="/tutor" element={<TutorHome />} />
                <Route path="/tutor/classroom/:chapterId" element={<TutorClassroom />} />
                <Route path="/tutor/results/:sessionId" element={<TutorResults />} />
                <Route path="/tutor/vocab" element={<TutorVocab />} />
                <Route path="/admin/tutor" element={<AdminTutor />} />
                <Route path="/admin" element={<AdminRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
