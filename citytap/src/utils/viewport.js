/**
 * Sets a CSS custom property for the actual viewport height
 * This handles mobile browser UI that can hide/show (like Chrome's address bar)
 */
export function setupViewportHeight() {
  // First, set the value
  const updateHeight = () => {
    // Use visualViewport if available (more accurate on mobile)
    const vh = window.visualViewport 
      ? window.visualViewport.height * 0.01
      : window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Set on load
  updateHeight();

  // Update on resize and visual viewport changes
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateHeight);
  } else {
    window.addEventListener('resize', updateHeight);
  }

  // Also update on orientation change for mobile
  window.addEventListener('orientationchange', () => {
    // Small delay to ensure the browser has updated dimensions
    setTimeout(updateHeight, 100);
  });
}
