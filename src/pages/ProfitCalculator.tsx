 import { useEffect, useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import Layout from "@/components/Layout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Calculator, TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";
 import { formatPKR } from "@/lib/utils";
 
 interface Crop {
   id: string;
   crop_name: string;
   expected_yield: number | null;
   market_price: number | null;
 }
 
 export default function ProfitCalculator() {
   const [crops, setCrops] = useState<Crop[]>([]);
   const [selectedCropId, setSelectedCropId] = useState<string>("");
   const [loading, setLoading] = useState(true);
   const [cropExpenses, setCropExpenses] = useState<number>(0);
   const navigate = useNavigate();
 
   // Form state
   const [expectedYield, setExpectedYield] = useState<string>("");
   const [marketPrice, setMarketPrice] = useState<string>("");
   const [totalExpenses, setTotalExpenses] = useState<string>("");
 
   useEffect(() => {
     checkAuth();
     loadCrops();
   }, []);
 
   const checkAuth = async () => {
     const { data: { session } } = await supabase.auth.getSession();
     if (!session) {
       navigate("/auth");
     }
   };
 
   const loadCrops = async () => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
 
       const { data, error } = await supabase
         .from("crops")
         .select("id, crop_name, expected_yield, market_price")
         .eq("user_id", user.id)
         .order("crop_name");
 
       if (error) throw error;
       setCrops(data || []);
     } catch (error) {
       console.error("Error loading crops:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const loadCropExpenses = async (cropId: string) => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
 
       const { data, error } = await supabase
         .from("expenses")
         .select("amount")
         .eq("user_id", user.id)
         .eq("crop_id", cropId);
 
       if (error) throw error;
 
       const total = data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
       setCropExpenses(total);
       setTotalExpenses(total.toString());
     } catch (error) {
       console.error("Error loading crop expenses:", error);
     }
   };
 
   const handleCropSelect = (cropId: string) => {
     setSelectedCropId(cropId);
     const crop = crops.find((c) => c.id === cropId);
     if (crop) {
       setExpectedYield(crop.expected_yield?.toString() || "");
       setMarketPrice(crop.market_price?.toString() || "");
       loadCropExpenses(cropId);
     }
   };
 
   // Calculations
   const yieldNum = parseFloat(expectedYield) || 0;
   const priceNum = parseFloat(marketPrice) || 0;
   const expensesNum = parseFloat(totalExpenses) || 0;
 
   const projectedRevenue = yieldNum * priceNum;
   const projectedProfit = projectedRevenue - expensesNum;
   const profitMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;
   const breakEvenYield = priceNum > 0 ? expensesNum / priceNum : 0;
   const isProfit = projectedProfit >= 0;
 
   if (loading) {
     return (
       <Layout>
         <div className="flex items-center justify-center h-64">
           <p className="text-muted-foreground">Loading...</p>
         </div>
       </Layout>
     );
   }
 
   return (
     <Layout>
       <div className="space-y-6">
         <div>
           <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
             <Calculator className="h-8 w-8" />
             Profit Calculator
           </h2>
           <p className="text-muted-foreground">
             Calculate projected profits and break-even analysis for your crops
           </p>
         </div>
 
         <div className="grid gap-6 lg:grid-cols-2">
           {/* Input Section */}
           <Card>
             <CardHeader>
               <CardTitle>Input Parameters</CardTitle>
               <CardDescription>
                 Select a crop to auto-fill or enter values manually
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Crop Selector */}
               <div className="space-y-2">
                 <Label>Select Crop (Optional)</Label>
                 <Select value={selectedCropId} onValueChange={handleCropSelect}>
                   <SelectTrigger>
                     <SelectValue placeholder="Choose a crop to auto-fill data..." />
                   </SelectTrigger>
                   <SelectContent>
                     {crops.map((crop) => (
                       <SelectItem key={crop.id} value={crop.id}>
                         {crop.crop_name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {selectedCropId && cropExpenses > 0 && (
                   <p className="text-sm text-muted-foreground">
                     Loaded {formatPKR(cropExpenses)} in recorded expenses for this crop
                   </p>
                 )}
               </div>
 
               {/* Expected Yield */}
               <div className="space-y-2">
                 <Label htmlFor="yield">Expected Yield (kg)</Label>
                 <Input
                   id="yield"
                   type="number"
                   step="0.01"
                   placeholder="e.g., 500"
                   value={expectedYield}
                   onChange={(e) => setExpectedYield(e.target.value)}
                 />
               </div>
 
               {/* Market Price */}
               <div className="space-y-2">
                 <Label htmlFor="price">Market Price (PKR/kg)</Label>
                 <Input
                   id="price"
                   type="number"
                   step="0.01"
                   placeholder="e.g., 300"
                   value={marketPrice}
                   onChange={(e) => setMarketPrice(e.target.value)}
                 />
               </div>
 
               {/* Total Expenses */}
               <div className="space-y-2">
                 <Label htmlFor="expenses">Total Expenses (PKR)</Label>
                 <Input
                   id="expenses"
                   type="number"
                   step="0.01"
                   placeholder="e.g., 80000"
                   value={totalExpenses}
                   onChange={(e) => setTotalExpenses(e.target.value)}
                 />
               </div>
             </CardContent>
           </Card>
 
           {/* Results Section */}
           <div className="space-y-4">
             {/* Projected Revenue */}
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-primary/10">
                       <TrendingUp className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                       <p className="text-sm text-muted-foreground">Projected Revenue</p>
                       <p className="text-2xl font-bold">{formatPKR(projectedRevenue)}</p>
                     </div>
                   </div>
                   <div className="text-sm text-muted-foreground text-right">
                     {yieldNum > 0 && priceNum > 0 && (
                       <p>{yieldNum} kg × {formatPKR(priceNum)}/kg</p>
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>
 
             {/* Total Expenses Card */}
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-destructive/10">
                       <TrendingDown className="h-5 w-5 text-destructive" />
                     </div>
                     <div>
                       <p className="text-sm text-muted-foreground">Total Expenses</p>
                       <p className="text-2xl font-bold">{formatPKR(expensesNum)}</p>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
 
             {/* Projected Profit */}
             <Card className={isProfit ? "border-green-500/50" : "border-destructive/50"}>
               <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${isProfit ? "bg-green-500/10" : "bg-destructive/10"}`}>
                       {isProfit ? (
                         <TrendingUp className="h-5 w-5 text-green-500" />
                       ) : (
                         <TrendingDown className="h-5 w-5 text-destructive" />
                       )}
                     </div>
                     <div>
                       <p className="text-sm text-muted-foreground">
                         Projected {isProfit ? "Profit" : "Loss"}
                       </p>
                       <p className={`text-3xl font-bold ${isProfit ? "text-green-500" : "text-destructive"}`}>
                         {isProfit ? "" : "-"}{formatPKR(Math.abs(projectedProfit))}
                       </p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-sm text-muted-foreground">Margin</p>
                     <p className={`text-xl font-semibold ${isProfit ? "text-green-500" : "text-destructive"}`}>
                       {profitMargin.toFixed(1)}%
                     </p>
                   </div>
                 </div>
               </CardContent>
             </Card>
 
             {/* Break-even Analysis */}
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-accent">
                       <Target className="h-5 w-5 text-accent-foreground" />
                     </div>
                     <div>
                       <p className="text-sm text-muted-foreground">Break-even Yield</p>
                       <p className="text-2xl font-bold">{breakEvenYield.toFixed(2)} kg</p>
                     </div>
                   </div>
                   {yieldNum > 0 && breakEvenYield > 0 && (
                     <div className="text-right">
                       {yieldNum >= breakEvenYield ? (
                         <p className="text-sm text-green-500">
                           ✓ Above break-even by {(yieldNum - breakEvenYield).toFixed(2)} kg
                         </p>
                       ) : (
                         <p className="text-sm text-destructive">
                           ✗ Below break-even by {(breakEvenYield - yieldNum).toFixed(2)} kg
                         </p>
                       )}
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>
 
             {/* Info Note */}
             {(yieldNum === 0 || priceNum === 0) && (
               <Card className="bg-muted/50">
                 <CardContent className="pt-6">
                   <div className="flex items-start gap-3">
                     <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                     <div className="text-sm text-muted-foreground">
                       <p className="font-medium">Enter values to see calculations</p>
                       <p>
                         Fill in expected yield and market price to calculate projected
                         revenue and profit margins.
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             )}
           </div>
         </div>
       </div>
     </Layout>
   );
 }