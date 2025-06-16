// notification-system.js - Globaal notification systeem voor CareerLaunch

console.log('📢 Notification system geladen');

// 🔔 Notification System - Global implementation
window.showNotification = function(message, type = 'info', duration = 4000) {
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
    margin-bottom: 0.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  `;
  
  // Set type-specific styles
  switch (type) {
    case 'error':
      notification.style.borderLeftColor = '#dc2626';
      notification.style.background = '#fef2f2';
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-exclamation-circle" style="color: #dc2626;"></i>
          <span>${message}</span>
        </div>
      `;
      break;
    case 'success':
      notification.style.borderLeftColor = '#16a34a';
      notification.style.background = '#f0fdf4';
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-check-circle" style="color: #16a34a;"></i>
          <span>${message}</span>
        </div>
      `;
      break;
    case 'warning':
      notification.style.borderLeftColor = '#f59e0b';
      notification.style.background = '#fffbeb';
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
          <span>${message}</span>
        </div>
      `;
      break;
    default: // info
      notification.style.borderLeftColor = '#2563eb';
      notification.style.background = '#eff6ff';
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-info-circle" style="color: #2563eb;"></i>
          <span>${message}</span>
        </div>
      `;
  }
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #666;
    cursor: pointer;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  `;
  
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = 'rgba(0,0,0,0.1)';
    closeButton.style.color = '#333';
  });
  
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = 'none';
    closeButton.style.color = '#666';
  });
  
  notification.appendChild(closeButton);
  
  // Add progress bar for auto-dismiss
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: ${notification.style.borderLeftColor};
    width: 100%;
    transform-origin: left;
    animation: progressBar ${duration}ms linear;
  `;
  
  // Add progress bar animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes progressBar {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
  `;
  if (!document.querySelector('#progressBarStyles')) {
    style.id = 'progressBarStyles';
    document.head.appendChild(style);
  }
  
  notification.appendChild(progressBar);
  
  // Add to container
  container.appendChild(notification);
  
  // Trigger show animation
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });
  
  // Auto-remove function
  const removeNotification = () => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
      // Remove empty container if no more notifications
      if (container.children.length === 0) {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }
    }, 300);
  };
  
  // Click to dismiss
  notification.addEventListener('click', removeNotification);
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    removeNotification();
  });
  
  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(removeNotification, duration);
  }
  
  return notification;
};

// Convenience functions
window.showSuccess = (message, duration) => window.showNotification(message, 'success', duration);
window.showError = (message, duration) => window.showNotification(message, 'error', duration);
window.showWarning = (message, duration) => window.showNotification(message, 'warning', duration);
window.showInfo = (message, duration) => window.showNotification(message, 'info', duration);

// Toast-style quick notifications
window.toast = {
  success: (message) => window.showNotification(message, 'success', 3000),
  error: (message) => window.showNotification(message, 'error', 5000),
  warning: (message) => window.showNotification(message, 'warning', 4000),
  info: (message) => window.showNotification(message, 'info', 3000)
};

console.log('✅ Notification system ready');

// Example usage (for testing):
// window.showNotification('Test notification!', 'info');
// window.toast.success('Operation completed successfully!');
// window.showError('Something went wrong!');

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Notification system initialized on DOM ready');
  });
} else {
  console.log('🎯 Notification system initialized (DOM already ready)');
}