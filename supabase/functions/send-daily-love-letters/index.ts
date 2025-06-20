import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
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
    console.log("Starting daily love letter delivery...");

    // Get all subscribers
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email, phone_number, delivery_preference')
      .not('email', 'is', null);

    if (error) {
      console.error("Error fetching subscribers:", error);
      throw new Error(`Failed to fetch subscribers: ${error.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No subscribers found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No subscribers to send to" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${subscribers.length} subscribers`);

    // Generate a romantic love letter
    const loveLetter = await generateRomanticLoveLetter();
    console.log("Generated romantic love letter");

    let successCount = 0;
    let errorCount = 0;

    // Send love letters to all email subscribers
    for (const subscriber of subscribers) {
      if (subscriber.email && (subscriber.delivery_preference === 'email' || subscriber.delivery_preference === 'both' || !subscriber.delivery_preference)) {
        try {
          await resend.emails.send({
            to: [subscriber.email],
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

          successCount++;
          console.log(`Love letter sent successfully to: ${subscriber.email}`);
        } catch (emailError) {
          console.error(`Failed to send to ${subscriber.email}:`, emailError);
          errorCount++;
        }
      }
    }

    console.log(`Daily love letter delivery completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Daily love letters sent successfully to ${successCount} subscribers. ${errorCount} errors.`,
      stats: { successCount, errorCount, totalSubscribers: subscribers.length }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-daily-love-letters function:", error);
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
