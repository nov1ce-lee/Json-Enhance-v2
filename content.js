(function() {
  if (window.top !== window.self) return; // Prevent injection into iframes

  const initFAB = () => {
    if (document.querySelector('.json-enhance-fab')) return;
    if (!document.body) {
      setTimeout(initFAB, 100);
      return;
    }

    const fab = document.createElement('div');
    fab.className = 'json-enhance-fab';
    fab.innerHTML = `
      <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M42 38C38.6863 38 36 40.6863 36 44V58C36 61.3137 33.3137 64 30 64C33.3137 64 36 66.6863 36 70V84C36 87.3137 38.6863 90 42 90" stroke="white" stroke-width="10" stroke-linecap="round"/>
        <path d="M86 38C89.3137 38 92 40.6863 92 44V58C92 61.3137 94.6863 64 98 64C94.6863 64 92 66.6863 92 70V84C92 87.3137 89.3137 90 86 90" stroke="white" stroke-width="10" stroke-linecap="round"/>
        <circle cx="64" cy="64" r="10" fill="#FFD700"/>
      </svg>
      <div class="tooltip">JSON Enhance</div>
    `;

    document.body.appendChild(fab);

    let isDragging = false;
    let startX, startY;
    let startBottom, startRight;

    fab.addEventListener('mousedown', (e) => {
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      const style = window.getComputedStyle(fab);
      startBottom = parseInt(style.bottom);
      startRight = parseInt(style.right);
      
      const onMouseMove = (moveEvent) => {
        const deltaX = startX - moveEvent.clientX;
        const deltaY = startY - moveEvent.clientY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          isDragging = true;
          fab.style.bottom = `${startBottom + deltaY}px`;
          fab.style.right = `${startRight + deltaX}px`;
          fab.style.transition = 'none';
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        fab.style.transition = '';
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    fab.addEventListener('click', (e) => {
      if (isDragging) return;
      chrome.runtime.sendMessage({ action: "openStandalone" });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFAB);
  } else {
    initFAB();
  }
})();