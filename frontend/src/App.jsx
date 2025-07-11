import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./hooks/use-toast.jsx";
import { UserProvider } from "./contexts/UserContext";
import NotesDashboard from "./pages/NotesDashboard";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <UserProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <>
                      <Navbar />
                      <Dashboard />
                    </>
                  } 
                />
                <Route 
                  path="/signin" 
                  element={
                    <>
                      <Navbar />
                      <LoginPage />
                    </>
                  } 
                />
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <>
                        <Navbar />
                        <ChatPage />
                      </>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/signup" 
                  element={
                    <>
                      <Navbar />
                      <SignUpPage />
                    </>
                  } 
                />
                <Route 
                  path="/notes" 
                  element={
                    <ProtectedRoute>
                      <NotesDashboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </BrowserRouter>
          </UserProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;