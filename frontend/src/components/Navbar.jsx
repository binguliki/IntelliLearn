import { Button } from "./ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MessageCircle } from 'lucide-react';

const Navbar = ({ isAuthenticated, onLogout, onReset }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav
      className="w-full bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-md shadow border-b border-gray-800 py-3 px-6 flex items-center justify-between z-50 fixed top-0 left-0"
      role="navigation"
      aria-label="Main Navigation"
      style={{ minHeight: '64px' }}
    >
      <div
        className="flex items-center space-x-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        onClick={() => navigate('/')}
        tabIndex={0}
        aria-label="Go to Dashboard"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/'); }}
      >
        <span className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-md">
          <MessageCircle className="w-5 h-5 text-white" />
        </span>
        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent select-none">
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
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Button
                variant="ghost"
                tabIndex={0}
                type="button"
                className="rounded-full px-6 py-2 font-semibold border-2 border-indigo-500 text-indigo-300 hover:bg-gray-800 hover:text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                Sign In
              </Button>
            </Link>
            <Link
              to="/signup"
              aria-label="Sign Up"
              aria-current={location.pathname === '/signup' ? 'page' : undefined}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Button
                variant="default"
                tabIndex={0}
                type="button"
                className="rounded-full px-6 py-2 font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-400"
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
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Button
                variant="ghost"
                tabIndex={0}
                type="button"
                className="rounded-full px-6 py-2 font-semibold text-indigo-200 hover:bg-gray-800 hover:text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400"
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
              className="rounded-full px-6 py-2 font-semibold border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-red-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Logout
            </Button>
            <Button
              variant="outline"
              onClick={onReset}
              aria-label="Reset Chat"
              type="button"
              tabIndex={0}
              className="rounded-full px-6 py-2 font-semibold border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-indigo-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400"
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