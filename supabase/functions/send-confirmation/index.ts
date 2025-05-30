
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
        console.log("Subscriber already exists, proceeding to send email");
      }
    }

    // Send the confirmation email to the provided email address
    const emailResponse = await resend.emails.send({
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
            Beginning tomorrow, you'll receive your first personalized love letter in your inbox.
            Each morning, we'll send you words that warm your heart and remind you that you are cherished.
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

    console.log("Email sent successfully to:", email);
    console.log("Email response:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Confirmation email sent to ${email}` 
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
