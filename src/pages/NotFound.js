import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

/** Handles unknown paths after GitHub Pages loads the app through its 404 shell. */
export default function NotFound() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center px-6 dark:bg-[#0b1220]">
      <div className="fixed right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold tracking-widest text-blue-600 uppercase mb-4 dark:text-blue-400">
          404
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 dark:text-slate-100">
          We can&apos;t find that page
        </h1>
        <p className="text-lg text-slate-600 mb-10 dark:text-slate-300">
          The link may be out of date, or the address might have a typo in it.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all dark:from-blue-500 dark:to-cyan-400 dark:hover:shadow-blue-400/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to JunePoint
          </Link>
          <a
            href="/resources/"
            className="inline-flex items-center justify-center px-7 py-3 bg-white border border-slate-300 text-slate-700 rounded-full font-semibold hover:bg-slate-50 transition-all dark:bg-[#131f36] dark:border-slate-700 dark:text-blue-300 dark:hover:bg-[#0f172a]"
          >
            Browse free tools and guides
          </a>
        </div>
      </div>
    </div>
  );
}
