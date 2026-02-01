import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Sparkles, 
  TrendingUp, 
  ShoppingCart, 
  MessageSquare, 
  Loader2,
  RefreshCw,
  X,
  BarChart3
} from 'lucide-react';
import { AIChat } from './AIChat';
import { useAIAdvisor } from '@/hooks/useAIAdvisor';
import { cn } from '@/lib/utils';

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

interface AIFarmAdvisorProps {
  cropPrices: CropPrice[];
  inputPrices: InputPrice[];
  userCrops?: any[];
  userInventory?: any[];
}

type InsightType = 'analyze' | 'selling_advice' | 'cost_optimizer';

const insightConfig = {
  analyze: {
    title: 'Market Analysis',
    urdu: 'مارکیٹ تجزیہ',
    icon: BarChart3,
    description: 'Get AI analysis of today\'s market conditions',
  },
  selling_advice: {
    title: 'Selling Advice',
    urdu: 'فروخت کا مشورہ',
    icon: TrendingUp,
    description: 'Best time to sell your crops',
  },
  cost_optimizer: {
    title: 'Cost Optimizer',
    urdu: 'لاگت کم کریں',
    icon: ShoppingCart,
    description: 'Optimize your input costs',
  },
};

export function AIFarmAdvisor({ cropPrices, inputPrices, userCrops, userInventory }: AIFarmAdvisorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');
  const [insights, setInsights] = useState<Record<InsightType, string>>({
    analyze: '',
    selling_advice: '',
    cost_optimizer: '',
  });
  const [loadingInsight, setLoadingInsight] = useState<InsightType | null>(null);
  
  const { messages, isLoading, error, sendMessage, getQuickInsight, clearMessages } = useAIAdvisor();

  const context = {
    cropPrices,
    inputPrices,
    userCrops,
    userInventory,
  };

  const fetchInsight = async (type: InsightType) => {
    setLoadingInsight(type);
    try {
      const content = await getQuickInsight(type, context);
      setInsights(prev => ({ ...prev, [type]: content }));
    } catch (e) {
      console.error('Failed to fetch insight:', e);
    } finally {
      setLoadingInsight(null);
    }
  };

  const handleSendMessage = (message: string) => {
    sendMessage(message, context);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Sparkles className="h-4 w-4" />
          AI Farm Advisor
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>AI Farm Advisor</span>
              <p className="text-xs font-normal text-muted-foreground">
                Khanpur & RYK District Expert
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-2" style={{ width: 'calc(100% - 32px)' }}>
            <TabsTrigger value="insights" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Quick Insights
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* Quick Insights Tab */}
          <TabsContent value="insights" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {(Object.keys(insightConfig) as InsightType[]).map((type) => {
                  const config = insightConfig[type];
                  const Icon = config.icon;
                  const isLoadingThis = loadingInsight === type;
                  const content = insights[type];

                  return (
                    <Card key={type} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{config.title}</CardTitle>
                              <p className="text-xs text-muted-foreground font-urdu">{config.urdu}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchInsight(type)}
                            disabled={isLoadingThis || loadingInsight !== null}
                          >
                            {isLoadingThis ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : content ? (
                              <RefreshCw className="h-4 w-4" />
                            ) : (
                              'Get'
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoadingThis ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Analyzing...</span>
                          </div>
                        ) : content ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {config.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {error && (
                  <Card className="border-destructive">
                    <CardContent className="py-4">
                      <p className="text-sm text-destructive">{error}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
            <div className="h-full flex flex-col">
              {messages.length > 0 && (
                <div className="px-4 py-2 border-b flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearMessages}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Chat
                  </Button>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <AIChat
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  placeholder="میں آپ کی کیا مدد کر سکتا ہوں؟ Ask in English or Urdu..."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'When to sell wheat?',
              'گندم کب بیچیں؟',
              'Fertilizer advice',
            ].map((q) => (
              <Badge
                key={q}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => {
                  setActiveTab('chat');
                  handleSendMessage(q);
                }}
              >
                {q}
              </Badge>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
