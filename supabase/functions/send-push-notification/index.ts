
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, body, icon, url } = await req.json();

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPrivateKey || !vapidPublicKey) {
      throw new Error('VAPID keys not configured');
    }

    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions`);

    // Create the notification payload
    const payload = JSON.stringify({
      title: title || 'Daily Love Letters',
      body: body || 'You have a new love letter waiting! 💕',
      icon: icon || '/placeholder.svg',
      badge: '/placeholder.svg',
      url: url || '/',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Read Now',
          icon: '/placeholder.svg'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/placeholder.svg'
        }
      ]
    });

    // Send notifications to all subscriptions
    const results = [];
    for (const subscription of subscriptions || []) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        // For now, we'll use a simple approach to send notifications
        // In a production environment, you'd want to use a proper Web Push library
        console.log('Sending notification to:', subscription.endpoint);
        
        // This is a simplified implementation
        // You would typically use a library like 'web-push' for proper VAPID authentication
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400'
          },
          body: payload
        });

        results.push({
          endpoint: subscription.endpoint,
          success: response.ok,
          status: response.status
        });

        console.log('Notification sent:', response.status);
      } catch (error) {
        console.error('Error sending to subscription:', error);
        results.push({
          endpoint: subscription.endpoint,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Attempted to send ${results.length} notifications`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
