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

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

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
                <LoginPage 
                  isAuthenticated={isAuthenticated} 
                  setIsAuthenticated={setIsAuthenticated} 
                />
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <ChatPage setIsAuthenticated={setIsAuthenticated} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <SignUpPage 
                  isAuthenticated={isAuthenticated} 
                  setIsAuthenticated={setIsAuthenticated} 
                />
              } 
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
