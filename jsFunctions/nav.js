document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.main-navbar');
    const navArrow = navbar.querySelector('.nav-arrow');
    const iconArrow = navArrow.querySelector('.icon-arrow');
    const iconX = navArrow.querySelector('.icon-x');
  
    navArrow.addEventListener('click', () => {
      const isOpen = navbar.classList.contains('open');
      if (isOpen) {
        navbar.classList.remove('open');
        navbar.classList.add('closed');
        iconArrow.style.display = 'flex';
        iconX.style.display = 'none';
        navArrow.setAttribute('aria-label', 'Open Navigation');
      } else {
        navbar.classList.add('open');
        navbar.classList.remove('closed');
        iconArrow.style.display = 'none';
        iconX.style.display = 'flex';
        navArrow.setAttribute('aria-label', 'Close Navigation');
      }
    });
  });
  