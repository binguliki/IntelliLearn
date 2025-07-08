import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { ChevronDown } from 'lucide-react';
import Orb from "@/components/ui/orb";

const Dashboard = ({ isAuthenticated }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 300);
  }, []);

  return (
    <>
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 animate-gradient-x">
      <Navbar isAuthenticated={isAuthenticated} />
      {/* Hero Section */}
      <section className={`flex flex-col items-center justify-center text-center px-4 pt-24 min-h-screen transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0'}`}> 
        <div className="flex items-center justify-center">
          <div className="grid place-items-center">
            <div className="col-start-1 row-start-1 scale-[5] opacity-80 transform translate-y-34">
              <Orb/>
            </div>
            <h1 className="col-start-1 row-start-1 text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent mb-6 drop-shadow-lg">Welcome to IntelliLearn</h1>
          </div>
        </div>
        <p className="text-lg md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto z-10">
          IntelliLearn is an AI-powered classroom assistant designed to support you in your academics and daily tasks, making learning more personalized, efficient, and stress-free.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          {!isAuthenticated ? (
            <>
              <Link to="/signin" tabIndex={0} aria-label="Sign In">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-lg rounded-full px-8 py-3 font-semibold hover:scale-105 hover:shadow-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" tabIndex={0} aria-label="Sign Up">
                <Button size="lg" variant="outline" className="rounded-full px-8 py-3 font-semibold border-2 border-gray-500 text-gray-100 hover:bg-gray-800 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-400">
                  Sign Up
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/chat" tabIndex={0} aria-label="Go to Chat">
              <Button size="lg" variant="default" className="rounded-full px-8 py-3 font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400">
                Go to Chat
              </Button>
            </Link>
          )}
        </div>
        {/* Down Arrow Scroll Cue */}
        <a href="#video-section" className="mt-16 animate-bounce text-indigo-400 hover:text-fuchsia-400" aria-label="Scroll to video">
          <ChevronDown className="w-10 h-10 mx-auto" />
        </a>
      </section>
      {/* Video Section */}
      <section id="video-section" className="flex flex-col items-center justify-center py-24 px-4 w-full bg-transparent min-h-screen">
        <div className="flex flex-1 items-center justify-center w-full">
          <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-xl border-2 border-gray-700 bg-gray-900/80 mx-auto">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/QlYrNC_1Xmk"
              title="IntelliLearn Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
    </>
    
  );
};

export default Dashboard; 