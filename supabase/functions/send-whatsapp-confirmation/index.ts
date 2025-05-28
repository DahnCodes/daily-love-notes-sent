
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  email?: string;
  phone_number?: string;
  delivery_preference: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone_number, delivery_preference }: WhatsAppRequest = await req.json();

    // Store subscriber in the database
    const { error: dbError } = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ 
          email: email || null, 
          phone_number: phone_number || null,
          delivery_preference 
        }),
      }
    ).then(res => res.json());

    if (dbError) {
      throw new Error(dbError.message);
    }

    // Send WhatsApp message if phone number provided
    if (phone_number) {
      const whatsappMessage = {
        messaging_product: "whatsapp",
        to: phone_number.replace("+", ""),
        type: "text",
        text: {
          body: `🌹 Welcome to Daily Love Letters! 💌

Thank you for subscribing! We're thrilled to have you join our community of people who start each day with words of love and affirmation.

Beginning tomorrow, you'll receive your first personalized love letter right here on WhatsApp. Each morning, we'll send you words that warm your heart and remind you that you are cherished.

"Love recognizes no barriers. It jumps hurdles, leaps fences, penetrates walls to arrive at its destination full of hope." - Maya Angelou

If you have any questions, just reply to this message. We'd love to hear from you.

With warmth and gratitude,
The Daily Love Letters Team 💕`
        }
      };

      const whatsappResponse = await fetch(
        `https://graph.facebook.com/v18.0/${Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("WHATSAPP_ACCESS_TOKEN")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(whatsappMessage),
        }
      );

      const whatsappResult = await whatsappResponse.json();
      
      if (!whatsappResponse.ok) {
        console.error("WhatsApp API error:", whatsappResult);
        throw new Error(`WhatsApp message failed: ${whatsappResult.error?.message || 'Unknown error'}`);
      }

      console.log("WhatsApp message sent successfully:", whatsappResult);
    }

    // Also send email if both delivery preference is selected and email is provided
    if (delivery_preference === 'both' && email) {
      const { error: emailError } = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-confirmation`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      ).then(res => res.json());

      if (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-whatsapp-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
