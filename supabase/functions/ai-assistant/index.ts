import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, complaint } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'summary') {
      systemPrompt = 'You are a helpful assistant that summarizes student complaints concisely in 1-2 sentences.';
      userPrompt = `Summarize this complaint:\n\nTitle: ${complaint.title}\nDescription: ${complaint.description}\nCategory: ${complaint.category}\nUrgency: ${complaint.urgency}`;
    } else if (type === 'suggestions') {
      systemPrompt = 'You are a helpful assistant for a student complaint management system. Provide 3 practical solutions or suggestions based on the complaint.';
      userPrompt = `Provide 3 practical suggestions for this complaint:\n\nTitle: ${complaint.title}\nDescription: ${complaint.description}\nCategory: ${complaint.category}`;
    } else if (type === 'generate-description') {
      systemPrompt = 'You are a helpful assistant for a student complaint management system. Generate a detailed 5-line description for a complaint based on the title provided. The description should be professional, clear, and explain the issue in detail. Do not include any headings or bullet points, just write 5 lines of natural text.';
      userPrompt = `Generate a 5-line detailed description for this complaint title: "${complaint}"`;
    } else if (type === 'format-complaint') {
      systemPrompt = `You are a helpful assistant for a student complaint management system. Your job is to take rough, informal text from students and convert it into a well-formatted complaint.

You MUST respond with a valid JSON object with these exact fields:
- title: A clear, concise title (max 100 chars)
- description: A professional, detailed description (5-7 sentences)
- category: One of: technical, facilities, curriculum, mentorship, other
- urgency: One of: low, medium, high, urgent (based on tone and content)
- mood: One of: angry, frustrated, confused, calm, urgent (detected from text)

Only output the JSON object, no additional text.`;
      userPrompt = `Format this rough complaint text into a professional complaint:\n\n"${complaint}"`;
    } else if (type === 'detect-mood') {
      systemPrompt = 'You are an AI that detects the emotional tone of text. Respond with ONLY one word: angry, frustrated, confused, calm, or urgent.';
      userPrompt = `Detect the mood of this text: "${complaint}"`;
    } else if (type === 'smart-suggestion') {
      systemPrompt = 'You are a helpful assistant that suggests solutions based on past resolved complaints. Provide a brief, actionable suggestion.';
      userPrompt = `Based on this complaint, suggest a solution:\n\nTitle: ${complaint.title}\nDescription: ${complaint.description}\nCategory: ${complaint.category}`;
    } else if (type === 'detect-spam') {
      systemPrompt = 'You are a spam detection AI. Analyze the complaint and respond with a JSON object: { "isSpam": boolean, "confidence": number (0-100), "reason": string }. Only output JSON.';
      userPrompt = `Analyze if this complaint is spam or fake:\n\nTitle: ${complaint.title}\nDescription: ${complaint.description}`;
    } else {
      throw new Error('Invalid type');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI request failed: ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    return new Response(
      JSON.stringify({ result: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
