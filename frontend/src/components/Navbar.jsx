import { Button } from "./ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
import { useToast } from '../hooks/use-toast';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signOut, user, resetChat } = useUser();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  const handleReset = async () => {
    if (!user) {
      toast({
        title: "Reset Failed",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await resetChat();
      if (error) {
        toast({
          title: "Reset Failed",
          description: "Failed to clear chat history. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Emit a custom event to notify ChatPage to clear its local messages state
      window.dispatchEvent(new Event('chat-reset'));

      toast({
        title: "Chat Cleared",
        description: "Your chat history has been successfully cleared.",
      });
    } catch (error) {
      console.error('Unexpected error during chat reset:', error);
      toast({
        title: "Reset Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };


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
          <img
            src="/botavatar.svg"
            alt="IntelliLearn Logo"
            className="w-6 h-6 object-contain bg-transparent mix-blend-screen"
            aria-hidden="true"
          />
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
              onClick={handleReset}
              aria-label="Reset Chat"
              type="button"
              tabIndex={0}
              className="rounded-full px-6 py-2 font-semibold border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-indigo-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              aria-label="Logout"
              type="button"
              tabIndex={0}
              className="rounded-full px-6 py-2 font-semibold border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-red-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Logout
            </Button>
            <div className="w-12 h-12 bg-gradient-to-br hover:cursor-pointer from-indigo-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
              <span className="text-white font-bold text-md">{(user?.user_metadata?.full_name?.split(' ').map(n => n[0]).join('') ?? '') || user?.email?.split('@')[0] || 'User'}</span>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;