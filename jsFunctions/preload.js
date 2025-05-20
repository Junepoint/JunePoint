// Preloader overlay
window.addEventListener('DOMContentLoaded', () => {
  // Create preloader
  const preloader = document.createElement('div');
  preloader.id = 'preloader';
  preloader.innerHTML = `
    <div class="preloader-spinner"></div>
  `;
  document.body.appendChild(preloader);

  // Hide preloader when all content is loaded
  window.addEventListener('load', () => {
    preloader.classList.add('preloader-fade');
    setTimeout(() => preloader.remove(), 700);
  });
});

// On-scroll animation
document.addEventListener('DOMContentLoaded', () => {
  const animatedEls = document.querySelectorAll('.animate-on-scroll');

  function animateOnScroll() {
    animatedEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) {
        el.classList.add('animated');
      }
    });
  }

  animateOnScroll();
  window.addEventListener('scroll', animateOnScroll);
});