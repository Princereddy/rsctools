// notify.js - Global Premium Notification System
(function() {
  let container = null;

  function initContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      document.body.appendChild(container);
    }
  }

  window.notify = function(message, type = 'info') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => executeNotify(message, type));
    } else {
      executeNotify(message, type);
    }
  };

  function executeNotify(message, type) {
    initContainer();
    
    // Check max notifications: Limit to 3
    if (container.children.length >= 3) {
      const oldest = container.firstElementChild;
      if (oldest) {
        closeNotification(oldest);
      }
    }

    const notif = document.createElement('div');
    notif.className = `notification notify-${type}`;
    
    // Icons based on type
    let iconHtml = '';
    if (type === 'success') {
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    notif.innerHTML = `
      <div class="notify-icon">${iconHtml}</div>
      <div class="notify-message">${message}</div>
    `;

    container.appendChild(notif);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notif.classList.add('show');
      });
    });

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      closeNotification(notif);
    }, 3000);
  }

  function closeNotification(el) {
    el.classList.remove('show');
    el.classList.add('hide'); // triggers exit animation
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 400); // wait for CSS transition to complete
  }
})();
