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

const generateLoveLetter = async (): Promise<string> => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a master of writing deeply heartfelt, authentic love letters. Your letters should:
            - Be warm, genuine, and emotionally resonant
            - Use beautiful, poetic language without being overly flowery
            - Include universal themes of love, appreciation, and human connection
            - Be personal yet applicable to anyone
            - Be around 200-300 words
            - Feel like it's written by someone who truly cares
            - Include encouraging and uplifting messages
            - Use "you" to address the reader directly
            - End with warmth and affection`,
          },
          {
            role: "user",
            content:
              "Write a beautiful, heartfelt love letter that will make someone feel truly cherished and loved. Make it feel personal and authentic.",
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating love letter:", error);
    return `My Dearest Friend,

    There are moments in life when words feel inadequate to express the depth of what lives in our hearts. Today, I want you to know that you are seen, you are valued, and you are deeply cherished.

    Your presence in this world creates ripples of beauty that you may never fully realize. The way you care, the way you love, the unique light that you bring to every space you enter – it all matters more than you know.

    In a world that can sometimes feel cold or distant, your warmth is a gift. Your kindness is a beacon. Your very existence makes this world a more beautiful place.

    I hope you take a moment today to feel proud of how far you've come, to acknowledge your strength, and to embrace the love that surrounds you – including the love you so generously give to others.

    You are worthy of all the good things life has to offer. You are enough, exactly as you are, in this very moment.

    With endless love and admiration,
    Someone who believes in you ✨`;
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
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Try to insert subscriber, but handle duplicates gracefully
    const dbResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          Prefer: "resolution=ignore-duplicates",
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
        console.log("Subscriber already exists, proceeding to send email");
      }
    }

    // Send the confirmation email
    const confirmationResponse = await resend.emails.send({
      from: "Daily Love Letters <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Daily Love Letters! 💌",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e11d48; text-align: center;">Welcome to Daily Love Letters! 💌</h1>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">Dear subscriber,</p>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Thank you for subscribing to Daily Love Letters. We're thrilled to have you join our community of people
            who start each day with words of love and affirmation.
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Your first love letter is already on its way to your inbox! From now on, you'll receive a personalized love letter each morning to start your day with warmth and joy.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-style: italic; color: #666;">"Love recognizes no barriers. It jumps hurdles, leaps fences, penetrates walls to arrive at its destination full of hope." - Maya Angelou</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            If you have any questions or feedback, simply reply to this email. We'd love to hear from you.
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            With warmth and gratitude,<br>
            The Daily Love Letters Team
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent successfully to:", email);

    // Generate and send the first love letter
    console.log("Generating love letter...");
    const loveLetter = await generateLoveLetter();

    const loveLetterResponse = await resend.emails.send({
      from: "Daily Love Letters <onboarding@resend.dev>",
      to: [email],
      subject: "Your First Love Letter 💕",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #fef7f0 0%, #fef2f2 100%);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #be185d; font-size: 28px; margin: 0; font-weight: 300;">A Love Letter Just For You</h1>
            <div style="width: 50px; height: 2px; background: #f472b6; margin: 15px auto;"></div>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(190, 24, 93, 0.1); border-left: 4px solid #f472b6;">
            <div style="font-size: 18px; line-height: 1.8; color: #4a4a4a; white-space: pre-line;">${loveLetter}</div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px;">
            <p>With love from Daily Love Letters 💌</p>
            <p style="margin-top: 15px; font-style: italic;">"You are braver than you believe, stronger than you seem, and more loved than you know."</p>
          </div>
        </div>
      `,
    });

    console.log("Love letter sent successfully to:", email);
    console.log("Generated love letter:", loveLetter.substring(0, 100) + "...");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Welcome emails sent to ${email}! Your first love letter is in your inbox.`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-confirmation function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
