
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { registerServiceWorker, requestNotificationPermission, isStandalone } from '@/utils/pwa';
import { useToast } from '@/hooks/use-toast';

const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
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

    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

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
      toast({
        title: "Notifications Enabled! 🔔",
        description: "You'll receive push notifications for your daily love letters.",
      });
    } else {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings to receive daily reminders.",
        variant: "destructive",
      });
    }
  };

  // Don't show if already installed and notifications are enabled
  if (isInstalled && notificationsEnabled) return null;

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
