
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
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
            - Be around 250-350 words
            - Feel genuinely passionate and heartfelt
            - Use "my love", "darling", "my heart" to address the reader
            - Express longing, desire, and complete devotion
            - End with romantic declarations of love`
          },
          {
            role: 'user',
            content: 'Write a deeply romantic, passionate love letter that will make someone feel cherished by their lover. Make it intimate, heartfelt, and full of romantic devotion.'
          }
        ],
        temperature: 0.9,
        max_tokens: 600,
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

I love the way you laugh, the way you make even ordinary moments feel magical. Your love transforms me, makes me want to be the best version of myself. In your arms, I have found my home, my peace, my greatest joy.

Every kiss we share writes a new chapter in our love story. Every moment apart makes me ache for you more. You are not just my lover, you are my soulmate, my other half, the missing piece that makes me whole.

I dream of growing old with you, of a thousand more mornings waking up beside you, of a lifetime of adventures with your hand in mine. You are my forever, my always, my one true love.

Until I can hold you again, know that you carry my heart with you wherever you go.

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
    const { email }: EmailRequest = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Starting subscription process for: ${email}`);

    // Try to insert subscriber, but handle duplicates gracefully
    const dbResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          "Prefer": "resolution=ignore-duplicates"
        },
        body: JSON.stringify({ email }),
      }
    );

    // If it's a duplicate key error, that's okay - the subscriber already exists
    if (!dbResponse.ok) {
      const dbError = await dbResponse.json();
      console.log("Database response:", dbError);
      
      // If it's not a duplicate key error, then it's a real problem
      if (dbError.code !== "23505") {
        console.error("Database error:", dbError);
        throw new Error(dbError.message || "Failed to store subscriber");
      } else {
        console.log("Subscriber already exists, proceeding to send emails");
      }
    }

    console.log("Database operation completed successfully");

    // Send the confirmation email first
    console.log("Sending welcome confirmation email...");
    const confirmationResponse = await resend.emails.send({
      to: [email],
      from: "Daily Love Letters <hello@dailylovenotes.name.ng>",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e11d48; text-align: center;">Welcome to Daily Love Letters! 💌</h1>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">Dear subscriber,</p>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Thank you for subscribing to Daily Love Letters. We're thrilled to have you join our community of people
            who start each day with words of love and romantic devotion.
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Your first romantic love letter is already on its way to your inbox! From now on, you'll receive a deeply passionate love letter each morning to fill your heart with romance and warmth.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-style: italic; color: #666;">"Being deeply loved by someone gives you strength, while loving someone deeply gives you courage." - Lao Tzu</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            If you have any questions or feedback, simply reply to this email. We'd love to hear from you.
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            With warmth and romance,<br>
            The Daily Love Letters Team
          </p>
        </div>
      `,
      subject: "Welcome to Daily Love Letters! 💌",
    });

    if (confirmationResponse.error) {
      console.error("Failed to send confirmation email:", confirmationResponse.error);
      throw new Error(`Failed to send confirmation email: ${confirmationResponse.error.message}`);
    }

    console.log("Welcome confirmation email sent successfully");

    // Generate and send the first romantic love letter immediately
    console.log("Generating first romantic love letter...");
    const loveLetter = await generateRomanticLoveLetter();
    console.log("Love letter generated successfully");
    
    console.log("Sending first love letter...");
    const loveLetterResponse = await resend.emails.send({
      to: [email],
      from: "Daily Love Letters <hello@dailylovenotes.name.ng>",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #fef7f0 0%, #fef2f2 100%);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #be185d; font-size: 28px; margin: 0; font-weight: 300;">Your First Love Letter</h1>
            <div style="width: 50px; height: 2px; background: #f472b6; margin: 15px auto;"></div>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(190, 24, 93, 0.1); border-left: 4px solid #f472b6;">
            <div style="font-size: 18px; line-height: 1.8; color: #4a4a4a; white-space: pre-line;">${loveLetter}</div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px;">
            <p>With love from Daily Love Letters 💌</p>
            <p style="margin-top: 15px; font-style: italic;">"Being deeply loved by someone gives you strength, while loving someone deeply gives you courage."</p>
          </div>
        </div>
      `,
      subject: "Your First Romantic Love Letter 💕",
    });

    if (loveLetterResponse.error) {
      console.error("Failed to send love letter:", loveLetterResponse.error);
      // Don't throw here - we still want to return success for the subscription
      console.log("Subscription successful but love letter failed to send");
    } else {
      console.log("First romantic love letter sent successfully");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Welcome! Check your inbox for your welcome email and your first romantic love letter.`,
      details: {
        confirmationSent: !confirmationResponse.error,
        loveLetterSent: !loveLetterResponse.error
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation function:", error);
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
