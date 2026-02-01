import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

interface AdvisorContext {
  cropPrices?: CropPrice[];
  inputPrices?: InputPrice[];
  userCrops?: any[];
  userInventory?: any[];
}

type RequestType = 'analyze' | 'selling_advice' | 'cost_optimizer' | 'chat';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farm-advisor`;

export function useAIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamResponse = useCallback(async ({
    type,
    userMessage,
    context,
    onDelta,
    onDone,
  }: {
    type: RequestType;
    userMessage?: string;
    context?: AdvisorContext;
    onDelta: (text: string) => void;
    onDone: () => void;
  }) => {
    const body: any = {
      type,
      context,
    };

    if (type === 'chat' && userMessage) {
      const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
      body.messages = newMessages;
    }

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${resp.status}`);
    }

    if (!resp.body) {
      throw new Error('No response body');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  }, [messages]);

  const sendMessage = useCallback(async (
    userMessage: string,
    context?: AdvisorContext
  ) => {
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    let assistantContent = '';
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      await streamResponse({
        type: 'chat',
        userMessage,
        context,
        onDelta: updateAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (e) {
      console.error('AI chat error:', e);
      setError(e instanceof Error ? e.message : 'Failed to get response');
      setIsLoading(false);
    }
  }, [streamResponse]);

  const getQuickInsight = useCallback(async (
    type: 'analyze' | 'selling_advice' | 'cost_optimizer',
    context?: AdvisorContext
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    let content = '';

    try {
      await streamResponse({
        type,
        context,
        onDelta: (chunk) => { content += chunk; },
        onDone: () => setIsLoading(false),
      });
      return content;
    } catch (e) {
      console.error('AI insight error:', e);
      setError(e instanceof Error ? e.message : 'Failed to get insight');
      setIsLoading(false);
      throw e;
    }
  }, [streamResponse]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    getQuickInsight,
    clearMessages,
  };
}
