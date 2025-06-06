// star-trails.js
document.addEventListener('DOMContentLoaded', function () {
    // Select the container where stars will be placed
    const starsContainer = document.querySelector('.stars-overlay');
  
    // Define number of stars to generate
    const numStars = 8;
  
    // Create each star
    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
  
      // Random position, timing, and animation delay
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const duration = 3 + Math.random() * 3;
      const delay = Math.random() * 5;
  
      // Apply random styles as CSS variables
      star.style.setProperty('--top', `${top}%`);
      star.style.setProperty('--left', `${left}%`);
      star.style.setProperty('--duration', `${duration}s`);
      star.style.setProperty('--delay', `${delay}s`);
  
      // Create and append trail to the star
      const trail = document.createElement('div');
      trail.classList.add('trail');
      star.appendChild(trail);
  
      // Add star to container
      starsContainer.appendChild(star);
    }
  });
  