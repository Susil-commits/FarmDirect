/**
 * useBrowserNotifications
 * Thin wrapper around the Web Notifications API.
 * - requestNotificationPermission(): prompts the user (only once per session,
 *   and only when authenticated). Returns the current permission state.
 * - showBrowserNotification(title, options): fires an OS-level notification,
 *   but ONLY when the document is hidden (tab in background) and permission is
 *   granted. When the tab is visible we rely on in-app toasts instead, to avoid
 *   double notifications.
 *
 * Guards for environments without Notification support (older browsers / SSR).
 */

let permissionRequestedThisSession = false;

export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const isNotificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const requestNotificationPermission = async () => {
  if (!isNotificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  // Avoid re-prompting repeatedly within the same session
  if (permissionRequestedThisSession) return Notification.permission;
  permissionRequestedThisSession = true;

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
};

/**
 * Show a browser (OS-level) notification. Only fires when the tab is hidden
 * so users aren't double-notified (in-app toast handles the visible case).
 */
export const showBrowserNotification = (title, options = {}) => {
  if (!isNotificationsSupported()) return;
  if (Notification.permission !== 'granted') return;
  if (typeof document !== 'undefined' && !document.hidden) return;

  try {
    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/favicon.ico',
      tag: options.tag, // dedupes notifications with the same tag
      data: options.data || {},
    });

    // Focus the window & close the notification when clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (typeof options.onClick === 'function') options.onClick();
    };

    // Auto-close after 8s to avoid堆积
    setTimeout(() => {
      try {
        notification.close();
      } catch {
        /* already closed */
      }
    }, 8000);
  } catch {
    /* Notification construction can throw on some mobile browsers; ignore */
  }
};

/**
 * Convenience helper used by the realtime layer: shows an OS notification when
 * the app is in the background, otherwise no-op (toast handles foreground).
 */
export const notifyIfBackground = (title, body, options = {}) => {
  showBrowserNotification(title, { ...options, body });
};
