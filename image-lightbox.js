document.querySelectorAll('[data-lightbox]').forEach(image => {
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `Open ${image.alt || 'image'} full screen`);

  function openLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Expanded image');

    const closeButton = document.createElement('button');
    closeButton.className = 'lightbox-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close image');
    closeButton.textContent = '\u00D7';

    const expandedImage = document.createElement('img');
    expandedImage.src = image.currentSrc || image.src;
    expandedImage.alt = image.alt;

    function closeLightbox() {
      lightbox.remove();
      document.removeEventListener('keydown', handleKeydown);
      image.focus();
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') closeLightbox();
    }

    lightbox.addEventListener('click', event => {
      if (event.target === lightbox || event.target === closeButton) closeLightbox();
    });
    document.addEventListener('keydown', handleKeydown);
    lightbox.append(closeButton, expandedImage);
    document.body.appendChild(lightbox);
    closeButton.focus();
  }

  image.addEventListener('click', openLightbox);
  image.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightbox();
    }
  });
});