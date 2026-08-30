import React, { useState, useEffect } from 'react';
import { ExternalLink, Github } from 'lucide-react';

export default function ProjectDisplay({ projects, title, description }) {
  const [carouselIndices, setCarouselIndices] = useState({});
  const [loadedImages, setLoadedImages] = useState({});

  // Advance each carousel every four seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndices((prev) => {
        const newIndices = { ...prev };
        projects.forEach((project, idx) => {
          const currentIndex = prev[idx] || 0;
          newIndices[idx] = (currentIndex + 1) % project.images.length;
        });
        return newIndices;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [projects]);

  return (
    <section className="relative py-32 px-6 bg-white min-h-screen dark:bg-[#0b1220]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-slate-100">
            {title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
              {title.split(' ').slice(-1)}
            </span>
          </h2>
          {description && (
            <p className="text-xl text-slate-600 max-w-2xl mx-auto dark:text-slate-300">
              {description}
            </p>
          )}
        </div>

        <div className="space-y-8">
          {projects.map((project, idx) => (
            <div
              key={idx}
              className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 dark:bg-[#131f36] dark:border-slate-700 dark:hover:shadow-blue-950/40"
              style={{ animation: `fadeInUp 0.6s ease-out ${idx * 0.2}s backwards` }}
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative h-80 md:h-auto overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0f172a] dark:to-[#131f36]">
                  {!loadedImages[`${idx}-0`] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin dark:border-slate-700 dark:border-t-blue-400"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    {project.images.map((img, imgIdx) => (
                      <img 
                        key={imgIdx}
                        src={img} 
                        alt={`${project.title} screenshot ${imgIdx + 1}`}
                        loading={imgIdx === 0 ? "eager" : "lazy"}
                        onLoad={() => setLoadedImages(prev => ({ ...prev, [`${idx}-${imgIdx}`]: true }))}
                        className={`absolute h-[106%] w-auto object-cover object-bottom transition-opacity duration-300 ${
                          (carouselIndices[idx] || 0) === imgIdx && loadedImages[`${idx}-${imgIdx}`] ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg z-10">
                    {project.status}
                  </div>
                  {project.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                      {project.images.map((_, imgIdx) => (
                        <div 
                          key={imgIdx}
                          className={`h-2 rounded-full transition-all duration-500 ${
                            (carouselIndices[idx] || 0) === imgIdx 
                              ? 'w-8 bg-white' 
                              : 'w-2 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-slate-100">{project.title}</h3>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6 dark:text-slate-300">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech.map((tech, techIdx) => (
                      <span 
                        key={techIdx}
                        className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full dark:bg-[#0f172a] dark:text-blue-300 dark:ring-1 dark:ring-inset dark:ring-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <a 
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all dark:from-blue-500 dark:to-cyan-400 dark:hover:shadow-blue-400/20"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Live
                    </a>
                    {project.githubUrl && (
                      <a 
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-full font-semibold hover:bg-slate-200 transition-all dark:bg-[#0f172a] dark:text-blue-300 dark:hover:bg-slate-800"
                      >
                        <Github className="w-4 h-4" />
                        Source Code
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
