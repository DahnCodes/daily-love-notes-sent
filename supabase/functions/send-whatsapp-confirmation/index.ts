
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

const generateRomanticLoveLetter = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a master of writing deeply romantic, passionate love letters between lovers. Your letters should:
            - Be intensely romantic and passionate
            - Express deep, intimate love between romantic partners
            - Use beautiful, poetic language that stirs the heart
            - Include themes of desire, devotion, and romantic connection
            - Be personal and intimate, as if written by a devoted lover
            - Be around 200-300 words (shorter for WhatsApp)
            - Feel genuinely passionate and heartfelt
            - Use "my love", "darling", "my heart" to address the reader
            - Express longing, desire, and complete devotion
            - End with romantic declarations of love`
          },
          {
            role: 'user',
            content: 'Write a deeply romantic, passionate love letter that will make someone feel cherished by their lover. Keep it concise but intensely romantic for WhatsApp delivery.'
          }
        ],
        temperature: 0.9,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error("OpenAI error details:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response from OpenAI API:', data);
      throw new Error('Invalid response from OpenAI API');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating romantic love letter:", error);
    return `My Darling Love,

Every morning I wake with your name on my lips and your love filling my heart completely. You are the most beautiful thing that has ever happened to me, and I fall deeper in love with you with each passing day.

Your touch ignites a fire in my soul that burns only for you. When you look at me with those eyes, I see forever reflected back at me. You are my passion, my desire, my everything.

I love the way you laugh, the way you make even ordinary moments feel magical. Your love transforms me, makes me want to be the best version of myself.

Every kiss we share writes a new chapter in our love story. You are not just my lover, you are my soulmate, my other half, the missing piece that makes me whole.

Forever and completely yours,
Your devoted lover 💕`;
  }
};

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

    if (!dbResponse.ok) {
      const dbError = await dbResponse.json();
      console.log("Database response:", dbError);
      
      // If it's not a duplicate key error, then it's a real problem
      if (dbError.code !== "23505") {
        console.error("Database error:", dbError);
        throw new Error(dbError.message || "Failed to store subscriber");
      } else {
        console.log("Subscriber already exists, proceeding to send WhatsApp messages");
      }
    }

    console.log("Database operation completed successfully");

    // Send WhatsApp welcome message if phone number provided
    if (phone_number) {
      console.log("Preparing WhatsApp welcome message...");
      
      // Clean phone number (remove + and any spaces/dashes)
      const cleanPhoneNumber = phone_number.replace(/[\+\s\-\(\)]/g, '');
      console.log("Original phone number:", phone_number);
      console.log("Cleaned phone number:", cleanPhoneNumber);

      const welcomeMessage = {
        messaging_product: "whatsapp",
        to: cleanPhoneNumber,
        type: "text",
        text: {
          body: `🌹 Welcome to Daily Love Letters! 💌

Thank you for subscribing! We're thrilled to have you join our community of people who start each day with words of love and affirmation.

Your first personalized love letter is coming right after this message! Each morning, we'll send you words that warm your heart and remind you that you are cherished.

"Love recognizes no barriers. It jumps hurdles, leaps fences, penetrates walls to arrive at its destination full of hope." - Maya Angelou

If you have any questions, just reply to this message. We'd love to hear from you.

With warmth and gratitude,
The Daily Love Letters Team 💕`,
        },
      };

      console.log("WhatsApp welcome message payload:", JSON.stringify(welcomeMessage, null, 2));

      const whatsappUrl = `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`;
      console.log("WhatsApp API URL:", whatsappUrl);

      const welcomeResponse = await fetch(whatsappUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(welcomeMessage),
      });

      console.log("WhatsApp welcome response status:", welcomeResponse.status);
      const welcomeResult = await welcomeResponse.json();
      console.log("WhatsApp welcome response:", JSON.stringify(welcomeResult, null, 2));

      if (!welcomeResponse.ok) {
        console.error("WhatsApp welcome message failed:", {
          status: welcomeResponse.status,
          statusText: welcomeResponse.statusText,
          result: welcomeResult
        });
        throw new Error(
          `WhatsApp welcome message failed: ${
            welcomeResult.error?.message || JSON.stringify(welcomeResult)
          }`
        );
      }

      console.log("WhatsApp welcome message sent successfully!");

      // Generate and send the first romantic love letter immediately
      console.log("Generating first romantic love letter for WhatsApp...");
      const loveLetter = await generateRomanticLoveLetter();
      console.log("Love letter generated successfully");

      console.log("Sending first love letter via WhatsApp...");
      const loveLetterMessage = {
        messaging_product: "whatsapp",
        to: cleanPhoneNumber,
        type: "text",
        text: {
          body: `💕 Your First Love Letter 💕

${loveLetter}

---
Daily Love Letters 💌`,
        },
      };

      const loveLetterResponse = await fetch(whatsappUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loveLetterMessage),
      });

      console.log("WhatsApp love letter response status:", loveLetterResponse.status);
      const loveLetterResult = await loveLetterResponse.json();
      console.log("WhatsApp love letter response:", JSON.stringify(loveLetterResult, null, 2));

      if (!loveLetterResponse.ok) {
        console.error("WhatsApp love letter failed:", {
          status: loveLetterResponse.status,
          statusText: loveLetterResponse.statusText,
          result: loveLetterResult
        });
        // Don't throw here - we still want to return success for the subscription
        console.log("Subscription successful but love letter failed to send");
      } else {
        console.log("First romantic love letter sent successfully via WhatsApp!");
      }
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
    return new Response(JSON.stringify({ 
      success: true,
      message: "Welcome! Check your WhatsApp for your welcome message and your first romantic love letter!"
    }), {
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
