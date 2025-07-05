import { Button } from "./ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MessageCircle } from 'lucide-react';

const Navbar = ({ isAuthenticated, onLogout, onReset }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav
      className="w-full bg-gradient-to-r from-white/80 via-blue-50/80 to-purple-50/80 backdrop-blur-md shadow border-b border-gray-100 py-3 px-6 flex items-center justify-between z-50 fixed top-0 left-0"
      role="navigation"
      aria-label="Main Navigation"
      style={{ minHeight: '64px' }}
    >
      <div
        className="flex items-center space-x-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={() => navigate('/')}
        tabIndex={0}
        aria-label="Go to Dashboard"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/'); }}
      >
        <span className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <MessageCircle className="w-5 h-5 text-white" />
        </span>
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
          IntelliLearn
        </span>
      </div>
      <div className="flex items-center space-x-4">
        {!isAuthenticated ? (
          <>
            <Link
              to="/signin"
              aria-label="Sign In"
              aria-current={location.pathname === '/signin' ? 'page' : undefined}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Button
                variant="ghost"
                tabIndex={0}
                type="button"
                className="rounded-full px-6 py-2 font-semibold border-2 border-blue-500 text-blue-600 
                hover:bg-gray-100 hover:text-blue-700 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Sign In
              </Button>
            </Link>
            <Link
              to="/signup"
              aria-label="Sign Up"
              aria-current={location.pathname === '/signup' ? 'page' : undefined}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Button
                variant="default"
                tabIndex={0}
                type="button"
                className="rounded-full px-6 py-2 font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                Sign Up
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/chat"
              aria-label="Go to Chat"
              aria-current={location.pathname === '/chat' ? 'page' : undefined}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Button
                variant="ghost"
                tabIndex={0}
                type="button"
                className="rounded-full px-6 py-2 font-semibold transition-all duration-200 hover:bg-blue-100/80 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Chat
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={onLogout}
              aria-label="Logout"
              type="button"
              tabIndex={0}
              className="rounded-full px-6 py-2 font-semibold border-gray-300 hover:bg-gray-100 hover:text-red-600 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Logout
            </Button>
            <Button
              variant="outline"
              onClick={onReset}
              aria-label="Reset Chat"
              type="button"
              tabIndex={0}
              className="rounded-full px-6 py-2 font-semibold border-gray-300 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Reset
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 