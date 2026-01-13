import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProjectDisplay from '../components/ProjectDisplay';
import { videoGames } from '../data/projectsData';

export default function VideoGames() {
  return (
    <div className="bg-white min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
            JunePoint
          </Link>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="pt-20">
        <ProjectDisplay 
          projects={videoGames}
          title="Video Games"
          description="2D Platformers, 2D Topdown Adventures, and interactive web games built with modern game development technologies."
        />
      </div>
    </div>
  );
}
