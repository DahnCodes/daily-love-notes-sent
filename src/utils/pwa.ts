
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  }
  return false;
};

export const subscribeToPushNotifications = async (registration: ServiceWorkerRegistration) => {
  try {
    // Get the VAPID public key from environment variable
    const vapidPublicKey = 'BPHQWFb8a2ExoH9c8w_nnkxoJgpjmKhJVJ5jPsxFjW2s4TjxGZJWMbTGJqnM5vNmZKmSUuHaJYlBcFgqKqKKDk4';
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('Push subscription:', subscription);
    
    // Store subscription in database
    await storeSubscription(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Store subscription in Supabase
async function storeSubscription(subscription: PushSubscription) {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const subscriptionObject = subscription.toJSON();
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: subscription.endpoint,
        p256dh: subscriptionObject.keys?.p256dh || '',
        auth: subscriptionObject.keys?.auth || '',
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing subscription:', error);
    } else {
      console.log('Subscription stored successfully');
    }
  } catch (error) {
    console.error('Error storing subscription:', error);
  }
}

export const isInstallable = () => {
  return 'beforeinstallprompt' in window;
};

export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://');
};

// Function to send test notification
export const sendTestNotification = async () => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    await supabase.functions.invoke('send-push-notification', {
      body: {
        title: 'Test Notification',
        body: 'Your push notifications are working! 💕',
        icon: '/placeholder.svg',
        url: '/'
      }
    });
  } catch (error) {
    console.error('Failed to send test notification:', error);
  }
};
