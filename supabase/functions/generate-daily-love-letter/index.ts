import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Create a seed based on current date to ensure same letter for same day
    const dateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const prompts = [
      `Write a heartfelt, romantic love letter for ${currentDate}. Make it personal, warm, and encouraging. Include beautiful metaphors about love, gratitude for the reader's existence, and hopes for their day. The letter should feel like it's written by someone who truly cares about the reader. Keep it between 150-200 words. Make it unique and authentic, not generic.`,
      
      `Compose an uplifting love letter for ${currentDate} that celebrates the reader's uniqueness and beauty. Include poetic language about how they light up the world, their inner strength, and how much they are cherished. Make it feel personal and inspiring for their day ahead. 150-200 words with genuine emotion.`,
      
      `Create a tender, loving message for ${currentDate} that reminds the reader of their worth and the joy they bring to others. Use gentle, comforting words mixed with passionate expressions of love. Include wishes for their happiness and success today. Write it as if from a devoted partner who adores them completely. 150-200 words.`,
      
      `Write a passionate yet gentle love letter for ${currentDate} that focuses on the reader's inner and outer beauty. Include metaphors about nature, light, and warmth. Express deep gratitude for their presence in the world and excitement for all the wonderful things they'll accomplish today. 150-200 words with authentic emotion.`,
      
      `Compose a romantic letter for ${currentDate} that feels like a warm embrace in words. Write about the reader's impact on the world, their precious heart, and how thinking of them brings pure joy. Include beautiful imagery and heartfelt promises of love and support. Make it deeply personal and moving. 150-200 words.`
    ];

    // Use date as seed to select consistent prompt for the day
    const dateNumber = new Date(dateString).getTime();
    const promptIndex = Math.abs(dateNumber) % prompts.length;
    const selectedPrompt = prompts[promptIndex];

    console.log(`Generating love letter for ${currentDate} using prompt ${promptIndex}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a romantic poet who writes beautiful, heartfelt love letters. Your writing is warm, personal, and emotionally moving. You make each person feel truly special and loved. Always write in a personal, intimate tone as if writing to someone you deeply care about.' 
          },
          { role: 'user', content: selectedPrompt }
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const loveLetter = data.choices[0].message.content;

    console.log('Successfully generated love letter');

    return new Response(JSON.stringify({ 
      loveLetter,
      date: currentDate,
      dateString 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-daily-love-letter function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallbackLetter: `My Dearest,\n\nOn this beautiful ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}, I want you to know how incredibly special you are. Your presence in this world makes everything brighter, and your heart touches everyone around you in the most wonderful ways.\n\nYou are loved beyond measure, cherished completely, and appreciated more than words can express. May your day be filled with joy, laughter, and all the beautiful moments your heart deserves.\n\nWith all my love,\nYour Daily Love Letter 💕`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});