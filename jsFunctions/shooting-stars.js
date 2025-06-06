// shooting-stars.js - Improved version
document.addEventListener('DOMContentLoaded', function() {
  const starsOverlay = document.querySelector('.stars-overlay');
  
  // Create shooting stars
  function createStar() {
    const star = document.createElement('div');
    star.classList.add('star');
    
    // Random starting position - can come from any edge
    const startEdge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let startX, startY;
    
    switch(startEdge) {
      case 0: // top
        startX = Math.random() * window.innerWidth;
        startY = -10;
        break;
      case 1: // right
        startX = window.innerWidth + 10;
        startY = Math.random() * window.innerHeight;
        break;
      case 2: // bottom
        startX = Math.random() * window.innerWidth;
        startY = window.innerHeight + 10;
        break;
      case 3: // left
        startX = -10;
        startY = Math.random() * window.innerHeight;
        break;
    }
    
    // Random ending position - opposite side
    const endX = (Math.random() - 0.5) * window.innerWidth * 0.8;
    const endY = (Math.random() - 0.5) * window.innerHeight * 0.8;
    
    // Calculate the vector for the trail
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Set trail direction
    star.style.setProperty('--trail-length', `${length}px`);
    star.style.setProperty('--trail-angle', `${angle}deg`);
    
    // Set positions
    star.style.left = `${startX}px`;
    star.style.top = `${startY}px`;
    star.style.setProperty('--end-x', `${endX}px`);
    star.style.setProperty('--end-y', `${endY}px`);
    
    // Random size and speed
    const size = 2 + Math.random() * 2;
    const duration = 3 + Math.random() * 3;
    const delay = Math.random() * 5;
    
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.animationDuration = `${duration}s`;
    star.style.animationDelay = `${delay}s`;
    
    starsOverlay.appendChild(star);
    
    // Remove star after animation completes
    setTimeout(() => {
      if (star.parentNode === starsOverlay) {
        star.remove();
      }
    }, (duration + delay) * 1000);
  }
  
  // Generate initial stars
  for (let i = 0; i < 15; i++) {
    createStar();
  }
  
  // Generate new stars continuously
  setInterval(createStar, 800);
});