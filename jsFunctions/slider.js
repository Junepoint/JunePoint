// Slider functionality
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.querySelector('.slider-wrapper');
  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.querySelector('.slider-arrow.prev');
  const nextBtn = document.querySelector('.slider-arrow.next');
  const dotsContainer = document.querySelector('.slider-dots');
  
  let currentIndex = 0;
  let autoSlideInterval;
  
  // Create dots
  slides.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.classList.add('slider-dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', (e) => {
      goToSlide(index);
      e.currentTarget.blur();  // Remove focus state after click
    });
    dotsContainer.appendChild(dot);
  });
  
  const dots = document.querySelectorAll('.slider-dot');
  
  // Go to specific slide
  function goToSlide(index) {
    currentIndex = index;
    updateSlider();
  }
  
  // Update slider position and active dot
  function updateSlider() {
    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Update active dot
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }
  
  // Next slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider();
  }
  
  // Previous slide
  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlider();
  }
  
  // Auto slide
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 6000);
  }
  
  // Stop auto slide on interaction
  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }
  
  // Event listeners with blur
  prevBtn.addEventListener('click', (e) => {
    prevSlide();
    stopAutoSlide();
    startAutoSlide();
    e.currentTarget.blur();  // Remove focus state
  });
  
  nextBtn.addEventListener('click', (e) => {
    nextSlide();
    stopAutoSlide();
    startAutoSlide();
    e.currentTarget.blur();  // Remove focus state
  });
  
  // Initialize
  startAutoSlide();
  
  // Pause auto slide on hover
  slider.addEventListener('mouseenter', stopAutoSlide);
  slider.addEventListener('mouseleave', startAutoSlide);
  
  // Touch support for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  
  slider.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoSlide();
  });
  
  slider.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoSlide();
  });
  
  function handleSwipe() {
    const minSwipeDistance = 50;
    const distance = touchStartX - touchEndX;
    
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
      stopAutoSlide();
      startAutoSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      stopAutoSlide();
      startAutoSlide();
    }
  });
  
  // Create wave effect on text
  const swipeText = document.querySelector('.swipe-text span');
  if (swipeText) {
    const text = swipeText.textContent;
    swipeText.innerHTML = '';
    
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = char;
        span.style.setProperty('--index', index);
        swipeText.appendChild(span);
    });
  }
});