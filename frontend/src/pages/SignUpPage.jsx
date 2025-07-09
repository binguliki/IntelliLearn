import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { MessageCircle, Mail, Lock, User } from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/background-beams';

const SignUpPage = ({ isAuthenticated, setIsAuthenticated }) => {
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  const handleSignup = (e) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <BackgroundBeams className="z-0" />
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-gray-900/80 border-gray-700 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            Create an Account
          </CardTitle>
          <CardDescription className="text-gray-300">
            Sign up to start chatting with IntelliLearn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={signupData.name}
                  onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                  className="pl-10 h-12 border border-gray-700 bg-gray-800 text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                  className="pl-10 h-12 border border-gray-700 bg-gray-800 text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                  className="pl-10 h-12 border border-gray-700 bg-gray-800 text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                  className="pl-10 h-12 border border-gray-700 bg-gray-800 text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Account
            </Button>
            <div className="text-center mt-4">
              <span className="text-gray-300">Already have an account? </span>
              <Link to="/signin" className="text-indigo-400 hover:underline">Sign In</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage; 