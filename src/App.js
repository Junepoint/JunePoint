import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import PersonalWebsites from './pages/PersonalWebsites';
import BusinessWebsites from './pages/BusinessWebsites';
import CrossPlatformApps from './pages/CrossPlatformApps';
import LocalApps from './pages/LocalApps';
import VideoGames from './pages/VideoGames';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/personal-websites" element={<PersonalWebsites />} />
        <Route path="/business-websites" element={<BusinessWebsites />} />
        <Route path="/cross-platform-apps" element={<CrossPlatformApps />} />
        <Route path="/local-apps" element={<LocalApps />} />
        <Route path="/video-games" element={<VideoGames />} />
        {/* Reached via build/404.html on GitHub Pages — see content/spa-fallback.js */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
