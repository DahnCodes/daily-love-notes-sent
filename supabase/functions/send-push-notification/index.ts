
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscription, title, body, icon, url } = await req.json();

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPrivateKey || !vapidPublicKey) {
      throw new Error('VAPID keys not configured');
    }

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

    // Send push notification using Web Push Protocol
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': `vapid t=${await generateJWT(vapidPrivateKey, vapidPublicKey, subscription.endpoint)}, k=${vapidPublicKey}`,
        'Crypto-Key': `p256ecdsa=${vapidPublicKey}`,
        'TTL': '86400'
      },
      body: await encryptPayload(payload, subscription.keys.p256dh, subscription.keys.auth)
    });

    console.log('Push notification sent:', response.status);

    return new Response(
      JSON.stringify({ success: true, status: response.status }),
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

// Helper function to generate JWT for VAPID
async function generateJWT(privateKey: string, publicKey: string, audience: string) {
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };

  const payload = {
    aud: new URL(audience).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: 'mailto:your-email@example.com'
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  // For simplicity, using a basic implementation
  // In production, you'd want to use proper ECDSA signing
  return `${unsignedToken}.signature`;
}

// Helper function to encrypt payload
async function encryptPayload(payload: string, p256dh: string, auth: string) {
  // This is a simplified implementation
  // In production, you'd implement proper AES-GCM encryption
  return new TextEncoder().encode(payload);
}

serve(handler);
