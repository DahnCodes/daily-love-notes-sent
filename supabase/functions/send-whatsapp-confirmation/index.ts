
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
    console.log("=== WhatsApp Confirmation Function Started ===");
    
    const requestBody: WhatsAppRequest = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));
    
    const { email, phone_number, delivery_preference } = requestBody;

    // Validate required fields
    if (!phone_number && delivery_preference !== 'email') {
      console.error("Phone number is required for WhatsApp delivery");
      throw new Error("Phone number is required for WhatsApp delivery");
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const whatsappAccessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const whatsappPhoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    console.log("Environment check:");
    console.log("- SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
    console.log("- SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓ Set" : "✗ Missing");
    console.log("- WHATSAPP_ACCESS_TOKEN:", whatsappAccessToken ? "✓ Set" : "✗ Missing");
    console.log("- WHATSAPP_PHONE_NUMBER_ID:", whatsappPhoneNumberId ? "✓ Set" : "✗ Missing");

    if (!whatsappAccessToken || !whatsappPhoneNumberId) {
      throw new Error("WhatsApp credentials not configured");
    }

    // Store subscriber in the database
    console.log("Storing subscriber in database...");
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey || "",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: email || null,
          phone_number: phone_number || null,
          delivery_preference,
        }),
      }
    );

    console.log("Database response status:", dbResponse.status);
    console.log("Database response headers:", Object.fromEntries(dbResponse.headers.entries()));

    // Check if response has content before trying to parse JSON
    let dbResult = null;
    const contentType = dbResponse.headers.get("content-type");
    const contentLength = dbResponse.headers.get("content-length");
    
    console.log("Content-Type:", contentType);
    console.log("Content-Length:", contentLength);

    if (contentType && contentType.includes("application/json") && contentLength !== "0") {
      try {
        const responseText = await dbResponse.text();
        console.log("Raw response text:", responseText);
        
        if (responseText.trim()) {
          dbResult = JSON.parse(responseText);
          console.log("Database response parsed:", JSON.stringify(dbResult, null, 2));
        } else {
          console.log("Empty response body, treating as success");
          dbResult = { success: true };
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.log("Treating as success since status is OK");
        dbResult = { success: true };
      }
    } else {
      console.log("No JSON content or empty response, treating as success");
      dbResult = { success: true };
    }

    if (!dbResponse.ok) {
      throw new Error(`Database error: ${JSON.stringify(dbResult)} (Status: ${dbResponse.status})`);
    }

    // Send WhatsApp message if phone number provided
    if (phone_number) {
      console.log("Preparing WhatsApp message...");
      
      // Clean phone number (remove + and any spaces/dashes)
      const cleanPhoneNumber = phone_number.replace(/[\+\s\-\(\)]/g, '');
      console.log("Original phone number:", phone_number);
      console.log("Cleaned phone number:", cleanPhoneNumber);

      const whatsappMessage = {
        messaging_product: "whatsapp",
        to: cleanPhoneNumber,
        type: "text",
        text: {
          body: `🌹 Welcome to Daily Love Letters! 💌

Thank you for subscribing! We're thrilled to have you join our community of people who start each day with words of love and affirmation.

Beginning tomorrow, you'll receive your first personalized love letter right here on WhatsApp. Each morning, we'll send you words that warm your heart and remind you that you are cherished.

"Love recognizes no barriers. It jumps hurdles, leaps fences, penetrates walls to arrive at its destination full of hope." - Maya Angelou

If you have any questions, just reply to this message. We'd love to hear from you.

With warmth and gratitude,
The Daily Love Letters Team 💕`,
        },
      };

      console.log("WhatsApp message payload:", JSON.stringify(whatsappMessage, null, 2));

      const whatsappUrl = `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`;
      console.log("WhatsApp API URL:", whatsappUrl);

      const whatsappResponse = await fetch(whatsappUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(whatsappMessage),
      });

      console.log("WhatsApp API response status:", whatsappResponse.status);
      const whatsappResult = await whatsappResponse.json();
      console.log("WhatsApp API response:", JSON.stringify(whatsappResult, null, 2));

      if (!whatsappResponse.ok) {
        console.error("WhatsApp API error details:", {
          status: whatsappResponse.status,
          statusText: whatsappResponse.statusText,
          result: whatsappResult
        });
        throw new Error(
          `WhatsApp message failed: ${
            whatsappResult.error?.message || JSON.stringify(whatsappResult)
          }`
        );
      }

      console.log("WhatsApp message sent successfully!");
    }

    // Also send email if both delivery preference is selected and email is provided
    if (delivery_preference === "both" && email) {
      console.log("Sending email confirmation as well...");
      const emailResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-confirmation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const emailResult = await emailResponse.json();
      console.log("Email response:", JSON.stringify(emailResult, null, 2));

      if (!emailResponse.ok) {
        console.error("Email sending failed:", emailResult);
      }
    }

    console.log("=== Function completed successfully ===");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("=== ERROR in send-whatsapp-confirmation function ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Check the function logs for more information"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
