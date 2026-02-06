import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { AIChat } from '@/components/AIChat';
import { useAIAdvisor } from '@/hooks/useAIAdvisor';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, Calculator, Loader2, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

export default function AIAdvisor() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('chat');
  
  // Market data state
  const [cropPrices, setCropPrices] = useState<CropPrice[]>([]);
  const [inputPrices, setInputPrices] = useState<InputPrice[]>([]);
  
  // Quick insights state
  const [marketAnalysis, setMarketAnalysis] = useState<string | null>(null);
  const [sellingAdvice, setSellingAdvice] = useState<string | null>(null);
  const [costOptimizer, setCostOptimizer] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState<string | null>(null);
  
  const { messages, isLoading, sendMessage, getQuickInsight, clearMessages } = useAIAdvisor();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-market-prices');
        if (!error && data) {
          setCropPrices(data.cropPrices || []);
          setInputPrices(data.inputPrices || []);
        }
      } catch (err) {
        console.error('Failed to fetch market data:', err);
      }
    };
    
    if (isAuthenticated) {
      fetchMarketData();
    }
  }, [isAuthenticated]);

  const getContext = () => ({
    cropPrices,
    inputPrices,
  });

  const handleGetInsight = async (type: 'analyze' | 'selling_advice' | 'cost_optimizer') => {
    setLoadingInsight(type);
    try {
      const result = await getQuickInsight(type, getContext());
      if (type === 'analyze') setMarketAnalysis(result);
      else if (type === 'selling_advice') setSellingAdvice(result);
      else setCostOptimizer(result);
    } catch (err) {
      console.error('Failed to get insight:', err);
    } finally {
      setLoadingInsight(null);
    }
  };

  const handleSendMessage = (message: string) => {
    sendMessage(message, getContext());
  };

  if (isAuthenticated === null) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const InsightsPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Quick Insights
        </h2>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Market Analysis
          </CardTitle>
          <CardDescription className="text-xs">مارکیٹ تجزیہ</CardDescription>
        </CardHeader>
        <CardContent>
          {marketAnalysis ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{marketAnalysis}</ReactMarkdown>
            </div>
          ) : (
            <Button 
              onClick={() => handleGetInsight('analyze')}
              disabled={loadingInsight === 'analyze'}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {loadingInsight === 'analyze' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                'Get Market Analysis'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Selling Advice
          </CardTitle>
          <CardDescription className="text-xs">فروخت کا مشورہ</CardDescription>
        </CardHeader>
        <CardContent>
          {sellingAdvice ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{sellingAdvice}</ReactMarkdown>
            </div>
          ) : (
            <Button 
              onClick={() => handleGetInsight('selling_advice')}
              disabled={loadingInsight === 'selling_advice'}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {loadingInsight === 'selling_advice' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                'Get Selling Advice'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Cost Optimizer
          </CardTitle>
          <CardDescription className="text-xs">لاگت بچانے کے طریقے</CardDescription>
        </CardHeader>
        <CardContent>
          {costOptimizer ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{costOptimizer}</ReactMarkdown>
            </div>
          ) : (
            <Button 
              onClick={() => handleGetInsight('cost_optimizer')}
              disabled={loadingInsight === 'cost_optimizer'}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {loadingInsight === 'cost_optimizer' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                'Get Cost Optimization Tips'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {(marketAnalysis || sellingAdvice || costOptimizer) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMarketAnalysis(null);
            setSellingAdvice(null);
            setCostOptimizer(null);
          }}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset All Insights
        </Button>
      )}
    </div>
  );

  const ChatPanel = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Farm Advisor
            </CardTitle>
            <CardDescription>اپنے کھیتی کے سوالات پوچھیں</CardDescription>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              Clear Chat
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <AIChat
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          placeholder="Ask about prices, farming advice... (English or اردو)"
        />
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="h-[calc(100vh-180px)]">
        {isMobile ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'insights' | 'chat')} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
            </TabsList>
            <TabsContent value="insights" className="flex-1 overflow-y-auto mt-4">
              <InsightsPanel />
            </TabsContent>
            <TabsContent value="chat" className="flex-1 overflow-hidden mt-4">
              <ChatPanel />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-3 gap-6 h-full">
            <div className="col-span-1 overflow-y-auto pr-2">
              <InsightsPanel />
            </div>
            <div className="col-span-2 overflow-hidden">
              <ChatPanel />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
