// Slider JS: support multiple sliders on the same page.
(function(){
  const AUTOPLAY_MS = 3500;

  function initSlider(slider) {
    const slides = Array.from(slider.querySelectorAll('.slide'));
    if (!slides.length) return;

    function openLightbox(image) {
      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Expanded image');
      lightbox.innerHTML = `
        <button class="lightbox-close" type="button" aria-label="Close image">&times;</button>
        <img src="${image.currentSrc || image.src}" alt="${image.alt}">
      `;

      function closeLightbox() {
        lightbox.remove();
        document.removeEventListener('keydown', handleKeydown);
      }
      function handleKeydown(event) {
        if (event.key === 'Escape') closeLightbox();
      }

      lightbox.addEventListener('click', event => {
        if (event.target === lightbox || event.target.classList.contains('lightbox-close')) closeLightbox();
      });
      document.addEventListener('keydown', handleKeydown);
      document.body.appendChild(lightbox);
      lightbox.querySelector('.lightbox-close').focus();
    }

    slider.querySelectorAll('img').forEach(image => {
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', `Open ${image.alt || 'image'} full screen`);
      image.addEventListener('click', () => openLightbox(image));
      image.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(image);
        }
      });
    });

    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    let dotsContainer = slider.querySelector('.dots');
    if (!dotsContainer) {
      dotsContainer = document.createElement('div');
      dotsContainer.className = 'dots';
      slider.appendChild(dotsContainer);
    }

    let current = 0;
    let intervalId = null;

    // Decide best layout for this slider by inspecting image aspect ratios.
    // If most images are portrait (height > width) use 'fit' (shrink-wrap to image width).
    // Otherwise use 'full' (fill available width).
    const imgsForDecision = Array.from(slider.querySelectorAll('img'));
    function decideLayoutAndApply() {
      if (!imgsForDecision.length) return;
      const forced = (slider.dataset && slider.dataset.mode) ? slider.dataset.mode.trim().toLowerCase() : null; // 'fit' or 'full'
      const isMobile = window.innerWidth <= 780;
      if (forced === 'fit') {
        // honor forced 'fit' on all screen sizes
        slider.classList.add('fit'); slider.classList.remove('full');
        return;
      }
      if (forced === 'full') {
        slider.classList.add('full'); slider.classList.remove('fit');
        return;
      }

      // auto-detect by aspect ratio
      const ratios = imgsForDecision.map(i => (i.naturalWidth && i.naturalHeight) ? (i.naturalWidth / i.naturalHeight) : 1);
      const avg = ratios.reduce((a,b)=>a+b,0) / ratios.length;
      if (avg < 1) {
        slider.classList.add('fit');
        slider.classList.remove('full');
      } else {
        slider.classList.add('full');
        slider.classList.remove('fit');
      }
    }

    // Wait for images to load, decide layout, and re-run layout detection on resize.
    // NOTE: we do NOT resize the slider container via JS. The container size is controlled by CSS
    // and images adapt inside it (object-fit). This keeps the border container stable.
    Promise.all(imgsForDecision.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { img.addEventListener('load', resolve); img.addEventListener('error', resolve); });
    })).then(() => {
      decideLayoutAndApply();
    });
    window.addEventListener('resize', () => { decideLayoutAndApply(); });

    // NOTE: container resizing removed — fit mode will be visual only and images will scale to fit inside the fixed container.

    function goTo(index) {
      slides.forEach((s, i) => s.classList.toggle('active', i === index));
      const dots = Array.from(dotsContainer.children);
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
  current = index;
    }

    function next() { goTo((current + 1) % slides.length); }
    function prev() { goTo((current - 1 + slides.length) % slides.length); }

    // create dots (reset to avoid duplicates)
    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.setAttribute('aria-label', `Go to slide ${i+1}`);
      dot.addEventListener('click', () => { goTo(i); restartAutoplay(); });
      dotsContainer.appendChild(dot);
    });

    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });

    function startAutoplay() {
      if (intervalId) return;
      intervalId = setInterval(next, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    // Keyboard navigation when slider has focus. Make slider focusable.
    slider.tabIndex = slider.tabIndex || 0;
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { prev(); restartAutoplay(); }
      if (e.key === 'ArrowRight') { next(); restartAutoplay(); }
    });

    // Pointer-based swipe support (works for touch and mouse drags)
    let pointerStartX = null;
    let pointerDeltaX = 0;
    slider.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, [role="button"], a, input, select, textarea')) return;
      pointerStartX = e.clientX;
      slider.setPointerCapture(e.pointerId);
    });
    slider.addEventListener('pointermove', (e) => { if (pointerStartX !== null) pointerDeltaX = e.clientX - pointerStartX; });
    slider.addEventListener('pointerup', (e) => {
      if (pointerStartX === null) return;
      slider.releasePointerCapture(e.pointerId);
      if (Math.abs(pointerDeltaX) > 40) {
        if (pointerDeltaX > 0) { prev(); } else { next(); }
        restartAutoplay();
      }
      pointerStartX = null; pointerDeltaX = 0;
    });

    // init
    goTo(0);
    startAutoplay();
  }

  // Initialize all sliders on the page
  document.querySelectorAll('.slider').forEach(initSlider);
})();
