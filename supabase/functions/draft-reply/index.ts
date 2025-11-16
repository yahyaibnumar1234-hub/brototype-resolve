import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { complaint } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const statusContext = complaint.status === 'resolved' 
      ? 'The complaint has been resolved.'
      : complaint.status === 'in_progress'
      ? 'We are actively working on this complaint.'
      : 'We have received this complaint and will address it soon.';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a professional admin assistant drafting responses to student complaints. Be empathetic, professional, and helpful. Keep responses under 150 words.'
          },
          {
            role: 'user',
            content: `Draft a professional response for this complaint:\n\nTitle: ${complaint.title}\nDescription: ${complaint.description}\nCategory: ${complaint.category}\nStatus: ${statusContext}\n\nDraft a helpful response.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add funds.');
      }
      const errorText = await response.text();
      throw new Error(`AI API error: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content?.trim() || '';

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in draft-reply:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
