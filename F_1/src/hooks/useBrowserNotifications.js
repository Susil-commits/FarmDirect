
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

export const notifyIfBackground = (title, body, options = {}) => {
  showBrowserNotification(title, { ...options, body });
};
