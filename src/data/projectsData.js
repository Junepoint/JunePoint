// All projects and websites organized by category

export const personalWebsites = [
  {
    title: "Jackson Abeyta - Portfolio",
    description: "A modern, interactive portfolio showcasing full-stack development projects, technical skills, and professional experience. Features smooth animations, responsive design, and an intuitive user interface.",
    images: [
      "/imgs/jack_portfolio.png"
    ],
    tech: ["React", "TailwindCSS", "JavaScript"],
    liveUrl: "https://portfolio.jackabeyta.com/",
    status: "Live"
  },
  {
    title: "Alexander Pace - Portfolio",
    description: "A creative portfolio website highlighting projects, skills, and game development work. Built with modern web technologies and featuring interactive elements.",
    images: [
      "/imgs/alex_portfolio.png"
    ],
    tech: ["HTML", "CSS", "JavaScript"],
    liveUrl: "https://snf-alex.github.io/AlexanderPace/",
    status: "Live"
  }
];

export const businessWebsites = [
  {
    title: "iCO Emergency - Company Website",
    description: "Corporate website for iCO Emergency, a safety tracking platform. Features product information, pricing details, and company mission statement with professional design and user-friendly navigation.",
    images: [
      "/imgs/ico_website_ss.png"
    ],
    tech: ["React", "TailwindCSS", "Vercel"],
    liveUrl: "https://icoemergency.com",
    status: "Live"
  },
  {
    title: "Burn Journals - Landing Page",
    description: "Marketing website for Burn Journal app, featuring app showcase, feature highlights, download links, and testimonials. Designed to convert visitors into app users.",
    images: [
      "/imgs/burnjournals.png"
    ],
    tech: ["React", "TailwindCSS", "Vercel"],
    liveUrl: "https://burnjournals.com",
    status: "Live"
  },
  {
    title: "JPA Contractors - Business Website",
    description: "Professional contractor website showcasing services, past projects, client testimonials, and contact information. Built with SEO optimization and mobile-first design.",
    images: [
      "/imgs/jpacontractors.png"
    ],
    tech: ["React", "TailwindCSS", "Node.js"],
    liveUrl: "https://jpacontractors.com/",
    status: "Live"
  }
];

export const crossPlatformApps = [
  {
    title: "iCO Emergency - Safety Tracking App",
    description: "A privacy-based safety tracking application that gives real-time emergency data, constant location tracking, but temporary location sharing, and safety check-ins. Built with React Native for cross-platform deployment on iOS and Android.",
    images: [
      "/imgs/iCO-1.png",
      "/imgs/iCO-2.png",
      "/imgs/iCO-3.png",
      "/imgs/iCO-4.png",
      "/imgs/iCO-5.png",
      "/imgs/iCO-6.png"
    ],
    tech: ["React Native", "Expo", "NeonDB", "Google Cloud Platform"],
    liveUrl: "https://icoemergency.com",
    status: "Beta"
  }
];

export const localApps = [
  {
    title: "Burn Journal - a Therapeutic Journaling App",
    description: "An innovative journaling platform designed for personal reflection and mental wellness. Features secure, private journaling with a scramble & burn feature, daily tasks, and a beautiful, intuitive interface.",
    images: [
      "/imgs/Burn-1-portrait.png",
      "/imgs/Burn-2-portrait.png",
      "/imgs/Burn-3-portrait.png",
      "/imgs/Burn-4-portrait.png"
    ],
    tech: ["EAS", "Expo"],
    liveUrl: "https://burnjournals.com",
    githubUrl: "https://github.com/jack-jackk/burnjournal",
    status: "Live"
  }
];

export const videoGames = [
  {
    title: "Jackson Abeyta - Games Portfolio",
    description: "Interactive games and creative projects showcasing game development skills, mechanics, and design. Built with modern web technologies for engaging gameplay experiences.",
    images: [
      "/imgs/jackabeyta_pacman.png"
    ],
    tech: ["JavaScript", "HTML5", "CSS"],
    liveUrl: "https://jackabeyta.com",
    status: "Live"
  },
  {
    title: "Clicker Game",
    description: "An engaging incremental clicker game with upgrades, achievements, and progression systems. Built with vanilla JavaScript and HTML5 Canvas for smooth performance.",
    images: [
      "/imgs/epicclicker.png"
    ],
    tech: ["HTML5", "JavaScript", "CSS"],
    liveUrl: "https://snf-alex.github.io/AlexanderPace/Games/clicker.html",
    status: "Live"
  },
  {
    title: "Pong Game",
    description: "Classic Pong game reimagined with modern web technologies. Features smooth gameplay, score tracking, and responsive controls.",
    images: [
      "/imgs/pong.png"
    ],
    tech: ["HTML5", "JavaScript", "Canvas API"],
    liveUrl: "https://snf-alex.github.io/AlexanderPace/Games/pong.html",
    status: "Live"
  }
];

// Combined list for homepage
export const allProjects = [
  ...crossPlatformApps,
  ...localApps
];
