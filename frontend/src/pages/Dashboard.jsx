import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { ChevronDown } from 'lucide-react';
import Orb from "@/components/ui/orb";
import { useUser } from "../contexts/UserContext";

const Dashboard = () => {
  const [show, setShow] = useState(false);
  const { isAuthenticated } = useUser();

  useEffect(() => {
    setTimeout(() => setShow(true), 300);
  }, []);

  return (
    <>
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 animate-gradient-x">
      <Navbar />
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
              <Link to="/signin" className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-lg rounded-full px-8 py-3 font-semibold hover:scale-105 hover:shadow-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400">
                Sign In
              </Link>
              <Link to="/signup" tabIndex={0} aria-label="Sign Up">
                <Button size="lg" variant="outline" className="rounded-full px-8 py-3 font-semibold border-2 border-gray-500 text-gray-100 hover:bg-gray-800 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-400">
                  Sign Up
                </Button>
              </Link>
            </>
          ) : (
              <Link to="/chat" tabIndex={0} aria-label="Go to Chat" className="rounded-full px-8 py-3 font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400 text-center text-lg">
                Go to Chat
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
        <div className="flex flex-col gap-4 flex-1 items-center justify-center w-full">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent mb-4">
            Demo Video
          </h2>
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
        <a href="#team-section" className="mt-16 animate-bounce text-indigo-400 hover:text-fuchsia-400" aria-label="Scroll to video">
          <ChevronDown className="w-10 h-10 mx-auto" />
        </a>
      </section>

       {/* Team Section */}
      <section id="team-section" className="flex flex-col items-center justify-center py-24 px-4 w-full bg-transparent min-h-screen">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent mb-4">
            Our Team
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Meet the talented individuals behind IntelliLearn
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center border border-gray-700/50 hover:scale-105 hover:bg-gray-700/80">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">LB</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-100 mb-2">Likith B.</h4>
            <p className="text-gray-400 text-sm">AI/ML Developer</p>
            <a 
              href="https://www.linkedin.com/in/bingumalla-likith/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 underline inline-block mt-2"
            >
              LinkedIn
            </a>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center border border-gray-700/50 hover:scale-105 hover:bg-gray-700/80">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">VT</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-100 mb-2">Vydhika T.</h4>
            <p className="text-gray-400 text-sm">Designer and <br></br>Front-end Developer</p>
            <a 
              href="https://www.linkedin.com/in/vydhika-talatam/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 underline inline-block mt-2"
            >
              LinkedIn
            </a>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center border border-gray-700/50 hover:scale-105 hover:bg-gray-700/80">
            <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">IC</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-100 mb-2">Ibrahim C.</h4>
            <p className="text-gray-400 text-sm">Full stack Developer</p>
            <a 
              href="https://www.linkedin.com/in/ibrahimchikani"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 underline inline-block mt-2"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>
    </div>
    </>
    
  );
};

export default Dashboard; 