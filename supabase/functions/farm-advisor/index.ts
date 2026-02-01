import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FarmAdvisorRequest {
  type: 'analyze' | 'selling_advice' | 'cost_optimizer' | 'chat';
  messages?: { role: string; content: string }[];
  context?: {
    cropPrices?: CropPrice[];
    inputPrices?: InputPrice[];
    userCrops?: any[];
    userInventory?: any[];
  };
}

interface CropPrice {
  name: string;
  urdu_name: string;
  price: number;
  unit: string;
  change: number;
  change_percent: number;
  market: string;
}

interface InputPrice {
  name: string;
  urdu_name: string;
  price: number;
  unit: string;
  change: number;
  change_percent: number;
  category: string;
  supplier: string;
}

const getSystemPrompt = (type: string, context?: FarmAdvisorRequest['context']) => {
  const baseContext = `You are an expert Pakistani agricultural advisor specializing in the Khanpur and Rahim Yar Khan district of South Punjab. You provide advice in English or Urdu based on how the user writes.

Current Date: ${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Region Context:
- Location: Khanpur, Rahim Yar Khan District, South Punjab, Pakistan
- Major crops: Cotton, Wheat, Sugarcane, Rice, Maize, Sunflower, Mustard
- Key markets: Khanpur Mandi, Sadiqabad Mandi, RYK Grain Market, Liaquatpur Mandi
- Sugar mills: JDW Sugar Mills, RYK Sugar Mills, Hamza Sugar Mills
- Seasons: Rabi (Oct-Apr: Wheat, Mustard), Kharif (May-Oct: Cotton, Rice, Sugarcane)

${context?.cropPrices ? `
Current Crop Prices (Khanpur/RYK):
${context.cropPrices.map(c => `- ${c.name} (${c.urdu_name}): PKR ${c.price.toLocaleString()}/${c.unit} at ${c.market} (${c.change >= 0 ? '+' : ''}${c.change_percent}%)`).join('\n')}
` : ''}

${context?.inputPrices ? `
Current Input Prices:
${context.inputPrices.map(i => `- ${i.name} (${i.urdu_name}): PKR ${i.price.toLocaleString()}/${i.unit} from ${i.supplier}`).join('\n')}
` : ''}

${context?.userCrops?.length ? `
User's Active Crops:
${context.userCrops.map(c => `- ${c.crop_name}: ${c.status}, Expected yield: ${c.expected_yield}kg`).join('\n')}
` : ''}

${context?.userInventory?.length ? `
User's Inventory:
${context.userInventory.map(i => `- ${i.item_name}: ${i.quantity} ${i.unit}`).join('\n')}
` : ''}`;

  switch (type) {
    case 'analyze':
      return `${baseContext}

You are providing a market analysis. Analyze the current prices and provide:
1. Brief overview of today's market conditions
2. Price trends and what's driving them
3. Key opportunities or risks for farmers
4. 2-3 actionable recommendations

Keep response concise (150-200 words). Use bullet points. Include both English and key Urdu terms for crops.`;

    case 'selling_advice':
      return `${baseContext}

You are advising on the best time to sell crops. For each major crop:
1. Current price vs historical average
2. Expected price movement in next 2-4 weeks
3. Specific recommendation (sell now / hold / wait until date)
4. Reasoning based on seasonal patterns, demand, and government policies

Consider:
- Rabi harvest timing (wheat: April-May)
- Kharif harvest timing (cotton: Oct-Dec, sugarcane: Nov-Mar)
- Government procurement programs (wheat support price, sugarcane rates)
- International market trends

Be specific with dates and percentages. Max 200 words.`;

    case 'cost_optimizer':
      return `${baseContext}

You are optimizing input costs for farmers. Analyze:
1. Current input prices vs recent trends
2. Which inputs to buy now vs wait
3. Alternative options if prices are high
4. Bulk buying recommendations

Focus on:
- Diesel/fuel timing
- Fertilizer (Urea, DAP) seasonal pricing
- Seed availability before season
- Local vs branded product value

Give specific advice with estimated savings. Max 200 words.`;

    case 'chat':
    default:
      return `${baseContext}

You are a friendly farm advisor helping farmers in Khanpur/RYK area. Answer their questions about:
- Crop prices and market timing
- Farming practices and recommendations
- Input costs and where to buy
- Profit calculations
- Weather and seasonal advice
- Government schemes and subsidies

If asked in Urdu, respond in Urdu. If asked in Roman Urdu, you can respond in Roman Urdu or English.
Be helpful, practical, and specific to the South Punjab context.
Keep responses concise but informative.`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, messages, context } = await req.json() as FarmAdvisorRequest;
    
    console.log("Farm Advisor Request:", { type, messagesCount: messages?.length });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getSystemPrompt(type, context);
    
    // Build messages array
    const aiMessages = [
      { role: "system", content: systemPrompt },
    ];

    if (type === 'chat' && messages?.length) {
      aiMessages.push(...messages);
    } else {
      // For non-chat requests, add a default user message
      const defaultPrompts: Record<string, string> = {
        'analyze': 'Analyze today\'s market conditions and give me your recommendations.',
        'selling_advice': 'When should I sell my crops? Give me specific advice for each major crop.',
        'cost_optimizer': 'Help me optimize my input costs. What should I buy now and what should I wait for?',
      };
      aiMessages.push({ role: "user", content: defaultPrompts[type] || 'Help me with my farm.' });
    }

    console.log("Calling Lovable AI with", aiMessages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue using AI features." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Farm advisor error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
