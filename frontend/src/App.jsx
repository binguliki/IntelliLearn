import { useState } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatResetKey, setChatResetKey] = useState(0);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('chat_messages');
    localStorage.removeItem('session_id');
  };

  const handleReset = () => {
    // This will force ChatPage to re-mount and clear its state
    setChatResetKey(prev => prev + 1);
    localStorage.removeItem('chat_messages');
    const newSessionId = crypto.randomUUID();
    localStorage.setItem('session_id', newSessionId);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <>
                  <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
                <Dashboard 
                  isAuthenticated={isAuthenticated} 
                  setIsAuthenticated={setIsAuthenticated} 
                  onLogout={handleLogout}
                />
                </>
              } 
            />
            <Route 
              path="/signin" 
              element={
                <>
                  <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
                <LoginPage 
                  isAuthenticated={isAuthenticated} 
                  setIsAuthenticated={setIsAuthenticated} 
                />
                </>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <>
                    <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} onReset={handleReset} />
                    <ChatPage key={chatResetKey} setIsAuthenticated={setIsAuthenticated} handleReset={handleReset} />
                  </>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <>
                  <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
                <SignUpPage 
                  isAuthenticated={isAuthenticated} 
                  setIsAuthenticated={setIsAuthenticated} 
                />
                </>
              } 
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;