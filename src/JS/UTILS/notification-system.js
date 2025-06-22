// notification-system.js - Globaal notification systeem voor CareerLaunch

console.log('📢 Notification system geladen');

/**
 * 🔔 Toont een notificatie op het scherm.
 * @param {string} message - Het bericht om te tonen.
 * @param {'info' | 'success' | 'warning' | 'error'} [type='info'] - Het type notificatie.
 * @param {number} [duration=4000] - Hoelang de notificatie zichtbaar blijft in ms.
 */
function showNotification(message, type = 'info', duration = 4000) {
  console.log(`📢 Showing notification: ${type} - ${message}`);
  
  // Ensure notification container exists
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;
    document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    background: white;
    border-left: 4px solid #881538;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(110%);
    transition: transform 0.3s ease, opacity 0.3s ease;
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    opacity: 0;
  `;
  
  // Set type-specific styles
  const typeStyles = {
    error: { color: '#dc2626', bg: '#fef2f2', icon: 'fa-exclamation-circle' },
    success: { color: '#16a34a', bg: '#f0fdf4', icon: 'fa-check-circle' },
    warning: { color: '#f59e0b', bg: '#fffbeb', icon: 'fa-exclamation-triangle' },
    info: { color: '#2563eb', bg: '#eff6ff', icon: 'fa-info-circle' }
  };
  const style = typeStyles[type] || typeStyles.info;

  notification.style.borderLeftColor = style.color;
  notification.style.background = style.bg;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <i class="fas ${style.icon}" style="color: ${style.color}; font-size: 1.2rem;"></i>
      <span style="color: #333;">${message}</span>
    </div>
  `;
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 0.3rem;
    right: 0.3rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: #999;
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  `;
  
  closeButton.onmouseover = () => { closeButton.style.background = 'rgba(0,0,0,0.1)'; closeButton.style.color = '#333'; };
  closeButton.onmouseout = () => { closeButton.style.background = 'none'; closeButton.style.color = '#999'; };
  
  notification.appendChild(closeButton);
  
  // Add progress bar
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    background: ${style.color};
    width: 100%;
    transform-origin: left;
    animation: progressBarAnim ${duration}ms linear forwards;
  `;
  
  const progressKeyframesId = 'progressBarKeyframes';
  if (!document.getElementById(progressKeyframesId)) {
    const keyframesStyle = document.createElement('style');
    keyframesStyle.id = progressKeyframesId;
    keyframesStyle.innerHTML = `
      @keyframes progressBarAnim {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }
    `;
    document.head.appendChild(keyframesStyle);
  }
  
  notification.appendChild(progressBar);
  
  // Add to container
  container.prepend(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  });
  
  const removeNotification = () => {
    notification.style.transform = 'translateX(110%)';
    notification.style.opacity = '0';
    notification.addEventListener('transitionend', () => {
      notification.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    });
  };
  
  notification.onclick = removeNotification;
  closeButton.onclick = (e) => {
    e.stopPropagation();
    removeNotification();
  };
  
  if (duration > 0) {
    setTimeout(removeNotification, duration);
  }
}

// Convenience functions
const showSuccess = (message, duration) => showNotification(message, 'success', duration);
const showError = (message, duration) => showNotification(message, 'error', duration);
const showWarning = (message, duration) => showNotification(message, 'warning', duration);
const showInfo = (message, duration) => showNotification(message, 'info', duration);

// Toast-style quick notifications
const toast = {
  success: (message) => showNotification(message, 'success', 3000),
  error: (message) => showNotification(message, 'error', 5000),
  warning: (message) => showNotification(message, 'warning', 4000),
  info: (message) => showNotification(message, 'info', 3000)
};

// Make functions globally available
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.toast = toast;

console.log('✅ Notification system ready');

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Notification system initialized on DOM ready');
  });
} else {
  console.log('🎯 Notification system initialized (DOM already ready)');
}