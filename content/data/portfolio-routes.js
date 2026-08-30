/**
 * The React portfolio's sub-routes, described for prerendering.
 *
 * These live only inside React Router, so GitHub Pages had no file to serve and
 * returned 404 for every direct visit. content/prerender-routes.js turns each
 * one into a real 200 page using this metadata plus the project data that the
 * React components already render, so there is a single source of truth.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load src/data/projectsData.js from Node.
 *
 * The file is plain data with no imports, so stripping the ESM `export` keyword
 * makes it evaluable directly. Reading it rather than duplicating it means the
 * prerendered pages can never drift from what React renders.
 */
function loadProjects() {
  const file = path.join(__dirname, '..', '..', 'src', 'data', 'projectsData.js');
  const source = fs.readFileSync(file, 'utf8').replace(/^export const /gm, 'const ');
  const names = ['personalWebsites', 'businessWebsites', 'crossPlatformApps', 'localApps', 'videoGames'];
  return new Function(`${source}\nreturn { ${names.join(', ')} };`)();
}

const projects = loadProjects();

/** Titles and descriptions mirror the ProjectDisplay props in src/pages/. */
const routes = [
  {
    path: '/personal-websites/',
    heading: 'Personal Websites',
    title: 'Personal Website Development | JunePoint',
    description:
      'Custom portfolio and personal branding sites built with React and modern web technologies, featuring galleries and seamless user experiences.',
    intro:
      'Custom portfolio and personal branding sites built with modern web technologies, featuring stunning galleries and seamless user experiences.',
    projects: projects.personalWebsites,
  },
  {
    path: '/business-websites/',
    heading: 'Business Websites',
    title: 'Business Website Development | JunePoint',
    description:
      'Responsive, modern business websites powered by full-stack technologies, with professional design and seamless user experiences.',
    intro:
      'Responsive, modern business sites powered by full-stack technologies with seamless user experiences and professional design.',
    projects: projects.businessWebsites,
  },
  {
    path: '/cross-platform-apps/',
    heading: 'Full-Stack Cross-Platform Apps',
    title: 'Cross-Platform App Development | JunePoint',
    description:
      'Native-quality iOS and Android applications from a single codebase, built with React Native, Expo and cloud infrastructure.',
    intro:
      'Native-quality iOS and Android apps from a single codebase using React Native, Expo, and cloud infrastructure.',
    projects: projects.crossPlatformApps,
  },
  {
    path: '/local-apps/',
    heading: 'Local Cross-Platform Apps',
    title: 'Local-First Mobile App Development | JunePoint',
    description:
      'Journaling, task management and productivity apps built with Expo for offline and local-first experiences on iOS and Android.',
    intro:
      'Journaling, task managers, and productivity apps built with Expo for seamless offline and local-first experiences.',
    projects: projects.localApps,
  },
  {
    path: '/video-games/',
    heading: 'Video Games',
    title: 'Game Development Portfolio | JunePoint',
    description:
      '2D platformers, top-down adventures and interactive web games built with Godot, Unreal Engine and modern web technologies.',
    intro:
      '2D Platformers, 2D Topdown Adventures, and interactive web games built with modern game development technologies.',
    projects: projects.videoGames,
  },
];

module.exports = { routes };
