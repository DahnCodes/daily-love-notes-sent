
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
    // Use your actual VAPID public key here - you'll need to replace this
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('Push subscription:', subscription);
    
    // Store subscription in your database
    // You can integrate this with your Supabase functions
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
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
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
