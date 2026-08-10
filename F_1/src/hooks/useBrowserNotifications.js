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
      tag: options.tag,
      data: options.data || {},
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (typeof options.onClick === 'function') options.onClick();
    };

    setTimeout(() => {
      try {
        notification.close();
      } catch (err) {
        console.debug('Notification auto-close ignored error:', err);
      }
    }, 8000);
  } catch (err) {
    console.debug('Send notification failed:', err);
  }
};

/**
 * Convenience helper used by the realtime layer: shows an OS notification when
 * the app is in the background, otherwise no-op (toast handles foreground).
 */
export const notifyIfBackground = (title, body, options = {}) => {
  showBrowserNotification(title, { ...options, body });
};
