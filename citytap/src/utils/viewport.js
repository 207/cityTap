function isEditing() {
  const el = document.activeElement;
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));
}

function resetScroll() {
  if (isEditing()) return;
  if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
  const scroller = document.scrollingElement;
  if (scroller && scroller.scrollTop !== 0) scroller.scrollTop = 0;
}

/**
 * Mobile browsers scroll the page up to reveal a focused input and don't
 * always scroll it back when the keyboard closes, leaving an empty strip.
 */
export function setupMobileViewport() {
  document.addEventListener('focusout', () => {
    setTimeout(resetScroll, 60);
    setTimeout(resetScroll, 320);
  });

  window.visualViewport?.addEventListener('resize', resetScroll);
  window.addEventListener('orientationchange', () => setTimeout(resetScroll, 150));
}
