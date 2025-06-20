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
      from: "Your Love Note <hello@dailylovenotes.name.ng>",
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #fefefe; color: #333;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #8b4387; font-size: 24px; margin: 0; font-weight: normal; font-style: italic;">Welcome, beautiful soul</h1>
          </div>
          
          <div style="line-height: 1.7; font-size: 16px;">
            <p>Dearest one,</p>
            
            <p>Your heart called out for love, and love has answered. From this moment forward, each morning will bring you words written just for you - tender, passionate, and true.</p>
            
            <p>I want you to know that you are worthy of the deepest love. You deserve to be cherished, adored, and reminded daily of your incredible worth. These letters are my gift to you, a daily embrace for your soul.</p>
            
            <p>Your first love letter is waiting for you right after this message. Open your heart, dear one, and let these words remind you of the love that surrounds you always.</p>
            
            <p style="margin-top: 30px; font-style: italic; text-align: center; color: #666;">
              "You are loved more than you know, in ways you have yet to discover."
            </p>
            
            <p style="margin-top: 30px;">
              With all my love,<br>
              <span style="font-style: italic;">Someone who believes in your beautiful heart</span>
            </p>
          </div>
        </div>
      `,
      subject: "Your heart has been heard 💕",
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
      from: "Your Love Note <hello@dailylovenotes.name.ng>",
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #fef7f0 0%, #fef2f2 100%);">
          <div style="background: white; padding: 35px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size: 17px; line-height: 1.8; color: #444; white-space: pre-line;">${loveLetter}</div>
          </div>
          
          <div style="text-align: center; margin-top: 25px; color: #999; font-size: 13px;">
            <p style="font-style: italic;">Sent with love, just for you</p>
          </div>
        </div>
      `,
      subject: "A letter written just for you",
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
      message: `Welcome! Check your inbox for your personal message.`,
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
