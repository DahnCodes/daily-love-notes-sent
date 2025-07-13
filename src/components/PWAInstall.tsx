
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Bell, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { registerServiceWorker, requestNotificationPermission, subscribeToPushNotifications, isStandalone, sendTestNotification } from '@/utils/pwa';
import { useToast } from '@/hooks/use-toast';

const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(isStandalone());

    // Register service worker
    registerServiceWorker();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check notification permission and subscription status
    const checkNotificationStatus = async () => {
      if ('Notification' in window) {
        const hasPermission = Notification.permission === 'granted';
        setNotificationsEnabled(hasPermission);
        
        if (hasPermission && 'serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setPushSubscribed(!!subscription);
          } catch (error) {
            console.error('Error checking push subscription:', error);
          }
        }
      }
    };

    checkNotificationStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: "App Installed! 🎉",
        description: "Daily Love Letters is now installed on your device.",
      });
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    
    if (granted) {
      setNotificationsEnabled(true);
      
      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready;
      const subscription = await subscribeToPushNotifications(registration);
      
      if (subscription) {
        setPushSubscribed(true);
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You'll receive push notifications for your daily love letters.",
        });
      }
    } else {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings to receive daily reminders.",
        variant: "destructive",
      });
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast({
        title: "Test Notification Sent! 📨",
        description: "Check if you received the test notification.",
      });
    } catch (error) {
      toast({
        title: "Failed to Send Test",
        description: "There was an error sending the test notification.",
        variant: "destructive",
      });
    }
  };

  // Don't show if already installed and notifications are enabled
  if (isInstalled && notificationsEnabled && pushSubscribed) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-rose-200 shadow-lg mb-6">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              All Set! 🎉
            </h3>
            <p className="text-sm text-gray-600">
              Your app is installed and notifications are enabled.
            </p>
            <Button
              onClick={handleTestNotification}
              variant="outline"
              className="w-full border-rose-300 text-rose-600 hover:bg-rose-50"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-rose-200 shadow-lg mb-6">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Enhance Your Experience
          </h3>
          
          <div className="space-y-3">
            {!isInstalled && deferredPrompt && (
              <Button
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
            
            {!notificationsEnabled && (
              <Button
                onClick={handleEnableNotifications}
                variant="outline"
                className="w-full border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Push Notifications
              </Button>
            )}

            {notificationsEnabled && !pushSubscribed && (
              <Button
                onClick={handleTestNotification}
                variant="outline"
                className="w-full border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test Notification
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-600">
            {!isInstalled ? "Install the app for quick access and " : ""}
            {!notificationsEnabled ? "enable notifications to never miss your daily love letter!" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstall;
