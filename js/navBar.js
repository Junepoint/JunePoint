document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');
  
  // Initialize with menu open
  nav.classList.add('active');
  menuToggle.classList.add('active');

  menuToggle.addEventListener('click', function() {
    const isActive = nav.classList.toggle('active');
    menuToggle.classList.toggle('active', isActive);
    
    // Toggle between X and hamburger
    menuToggle.querySelector('.icon').textContent = isActive ? '✕' : '☰';
  });

  // Close menu when clicking outside on mobile
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768 && 
        !e.target.closest('nav') && 
        !e.target.closest('.menu-toggle')) {
      nav.classList.remove('active');
      menuToggle.classList.remove('active');
      menuToggle.querySelector('.icon').textContent = '☰';
    }
  });
});