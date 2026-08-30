import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProjectDisplay from '../components/ProjectDisplay';
import ThemeToggle from '../components/ThemeToggle';
import { personalWebsites } from '../data/projectsData';

export default function PersonalWebsites() {
  return (
    <div className="bg-white min-h-screen dark:bg-[#0b1220]">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/50 dark:bg-[#0b1220]/90 dark:border-slate-700/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-cyan-300">
            JunePoint
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium dark:text-slate-300 dark:hover:text-blue-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="pt-20">
        <ProjectDisplay 
          projects={personalWebsites}
          title="Personal Websites"
          description="Custom portfolio and personal branding sites built with modern web technologies, featuring stunning galleries and seamless user experiences."
        />
      </div>
    </div>
  );
}
