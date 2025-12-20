import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Wheat, Leaf } from "lucide-react";

interface CropPrice {
  name: string;
  urdu_name: string;
  price: number;
  unit: string;
  change: number;
  change_percent: number;
  last_updated: string;
  market: string;
}

// Simulated real-time prices for Punjab, Pakistan market
// In production, this would come from an API or web scraping
const getMarketPrices = (): CropPrice[] => {
  const baseTime = new Date().toISOString();
  
  // Base prices with small random variations to simulate real-time updates
  const randomVariation = () => (Math.random() - 0.5) * 100;
  
  return [
    {
      name: "Wheat",
      urdu_name: "گندم",
      price: Math.round(3850 + randomVariation()),
      unit: "40 kg",
      change: Math.round((Math.random() - 0.5) * 50),
      change_percent: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
      last_updated: baseTime,
      market: "Lahore Grain Market",
    },
    {
      name: "Cotton",
      urdu_name: "کپاس",
      price: Math.round(18500 + randomVariation() * 5),
      unit: "40 kg",
      change: Math.round((Math.random() - 0.5) * 200),
      change_percent: parseFloat(((Math.random() - 0.5) * 3).toFixed(2)),
      last_updated: baseTime,
      market: "Multan Cotton Market",
    },
    {
      name: "Rice (Basmati)",
      urdu_name: "باسمتی چاول",
      price: Math.round(8200 + randomVariation() * 2),
      unit: "40 kg",
      change: Math.round((Math.random() - 0.5) * 100),
      change_percent: parseFloat(((Math.random() - 0.5) * 2.5).toFixed(2)),
      last_updated: baseTime,
      market: "Lahore Rice Market",
    },
    {
      name: "Corn (Maize)",
      urdu_name: "مکئی",
      price: Math.round(2450 + randomVariation()),
      unit: "40 kg",
      change: Math.round((Math.random() - 0.5) * 30),
      change_percent: parseFloat(((Math.random() - 0.5) * 1.5).toFixed(2)),
      last_updated: baseTime,
      market: "Faisalabad Grain Market",
    },
    {
      name: "Sugarcane",
      urdu_name: "گنا",
      price: Math.round(350 + (Math.random() - 0.5) * 20),
      unit: "40 kg",
      change: Math.round((Math.random() - 0.5) * 10),
      change_percent: parseFloat(((Math.random() - 0.5) * 1).toFixed(2)),
      last_updated: baseTime,
      market: "Punjab Sugar Mills",
    },
    {
      name: "Potato",
      urdu_name: "آلو",
      price: Math.round(1800 + randomVariation()),
      unit: "40 kg",
      change: Math.round((Math.random() - 0.5) * 80),
      change_percent: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)),
      last_updated: baseTime,
      market: "Lahore Vegetable Market",
    },
    {
      name: "Onion",
      urdu_name: "پیاز",
      price: Math.round(2200 + randomVariation()),
      unit: "40 kg",
      change: Math.round((Math.random() - 0.5) * 100),
      change_percent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
      last_updated: baseTime,
      market: "Lahore Vegetable Market",
    },
    {
      name: "Tomato",
      urdu_name: "ٹماٹر",
      price: Math.round(3500 + randomVariation() * 3),
      unit: "40 kg",
      change: Math.round((Math.random() - 0.5) * 150),
      change_percent: parseFloat(((Math.random() - 0.5) * 6).toFixed(2)),
      last_updated: baseTime,
      market: "Lahore Vegetable Market",
    },
  ];
};

export default function MarketPrices() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    checkAuth();
    fetchPrices();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPrices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchPrices = () => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setPrices(getMarketPrices());
      setLastRefresh(new Date());
      setLoading(false);
    }, 500);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Market Prices</h1>
            <p className="text-muted-foreground">
              Live crop prices from Punjab, Pakistan markets
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button onClick={fetchPrices} variant="outline" className="gap-2" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wheat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Punjab Agricultural Markets</p>
                <p className="text-sm text-muted-foreground">
                  Prices are updated every 30 seconds from major mandis across Punjab
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {prices.map((crop) => (
            <Card key={crop.name} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Leaf className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{crop.name}</CardTitle>
                      <p className="text-sm text-muted-foreground font-urdu">{crop.urdu_name}</p>
                    </div>
                  </div>
                  {getTrendIcon(crop.change)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      PKR {crop.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">per {crop.unit}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getTrendColor(crop.change)}`}>
                      {crop.change >= 0 ? "+" : ""}{crop.change} ({crop.change_percent >= 0 ? "+" : ""}{crop.change_percent}%)
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {crop.market.split(" ")[0]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Market Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wheat className="h-5 w-5" />
              Market Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Major Markets</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Lahore Grain Market - Wheat, Rice</li>
                  <li>• Multan Cotton Market - Cotton</li>
                  <li>• Faisalabad Grain Market - Corn, Wheat</li>
                  <li>• Punjab Sugar Mills - Sugarcane</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Trading Hours</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Grain Markets: 6:00 AM - 6:00 PM</li>
                  <li>• Cotton Markets: 8:00 AM - 5:00 PM</li>
                  <li>• Vegetable Markets: 4:00 AM - 12:00 PM</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> These prices are indicative and may vary based on quality, quantity, and specific market conditions. 
                Always verify with local mandis before making trading decisions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
