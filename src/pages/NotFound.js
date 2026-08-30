import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Catch-all route.
 *
 * GitHub Pages serves build/404.html (a copy of the app shell) for any path it
 * cannot resolve, so an unknown URL loads the SPA. Without this route React
 * Router would match nothing and render a blank page.
 */
export default function NotFound() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold tracking-widest text-blue-600 uppercase mb-4">
          404
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          We can&apos;t find that page
        </h1>
        <p className="text-lg text-slate-600 mb-10">
          The link may be out of date, or the address might have a typo in it.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to JunePoint
          </Link>
          <a
            href="/resources/"
            className="inline-flex items-center justify-center px-7 py-3 bg-white border border-slate-300 text-slate-700 rounded-full font-semibold hover:bg-slate-50 transition-all"
          >
            Browse free tools and guides
          </a>
        </div>
      </div>
    </div>
  );
}
