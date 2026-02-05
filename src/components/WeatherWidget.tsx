 import { useEffect, useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Cloud, Droplets, Wind, Thermometer, Lightbulb } from "lucide-react";
 
 interface CurrentWeather {
   temperature: number;
   humidity: number;
   windSpeed: number;
   weatherCode: number;
   description: string;
   icon: string;
   tip: string;
 }
 
 interface ForecastDay {
   date: string;
   maxTemp: number;
   minTemp: number;
   weatherCode: number;
   description: string;
   icon: string;
 }
 
 interface WeatherData {
   location: string;
   current: CurrentWeather;
   forecast: ForecastDay[];
 }
 
 export default function WeatherWidget() {
   const [weather, setWeather] = useState<WeatherData | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     fetchWeather();
   }, []);
 
   const fetchWeather = async () => {
     try {
       const { data, error } = await supabase.functions.invoke("get-weather");
 
       if (error) throw error;
       setWeather(data);
     } catch (err: any) {
       console.error("Weather fetch error:", err);
       setError("Unable to load weather data");
     } finally {
       setLoading(false);
     }
   };
 
   if (loading) {
     return (
       <Card>
         <CardHeader className="pb-2">
           <Skeleton className="h-6 w-32" />
         </CardHeader>
         <CardContent className="space-y-4">
           <Skeleton className="h-16 w-full" />
           <div className="flex gap-2">
             {[1, 2, 3, 4, 5].map((i) => (
               <Skeleton key={i} className="h-20 flex-1" />
             ))}
           </div>
         </CardContent>
       </Card>
     );
   }
 
   if (error || !weather) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Cloud className="h-5 w-5" />
             Weather
           </CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-muted-foreground">{error || "Weather data unavailable"}</p>
         </CardContent>
       </Card>
     );
   }
 
   const formatDate = (dateStr: string) => {
     const date = new Date(dateStr);
     const today = new Date();
     if (date.toDateString() === today.toDateString()) return "Today";
     return date.toLocaleDateString("en-PK", { weekday: "short" });
   };
 
   return (
     <Card className="overflow-hidden">
       <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-primary/5">
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <Cloud className="h-5 w-5" />
               {weather.location}
             </CardTitle>
             <CardDescription>Current weather & 5-day forecast</CardDescription>
           </div>
           <div className="text-4xl">{weather.current.icon}</div>
         </div>
       </CardHeader>
       <CardContent className="space-y-4 pt-4">
         {/* Current Weather */}
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="text-4xl font-bold">{weather.current.temperature}°C</div>
             <div className="text-sm text-muted-foreground">
               {weather.current.description}
             </div>
           </div>
           <div className="flex gap-4 text-sm">
             <div className="flex items-center gap-1">
               <Droplets className="h-4 w-4 text-blue-500" />
               <span>{weather.current.humidity}%</span>
             </div>
             <div className="flex items-center gap-1">
               <Wind className="h-4 w-4 text-muted-foreground" />
               <span>{weather.current.windSpeed} km/h</span>
             </div>
           </div>
         </div>
 
         {/* Farming Tip */}
         <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border border-accent">
           <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
           <p className="text-sm">{weather.current.tip}</p>
         </div>
 
         {/* 5-Day Forecast */}
         <div className="grid grid-cols-5 gap-2">
           {weather.forecast.map((day) => (
             <div
               key={day.date}
               className="flex flex-col items-center p-2 rounded-lg bg-muted/50 text-center"
             >
               <span className="text-xs font-medium text-muted-foreground">
                 {formatDate(day.date)}
               </span>
               <span className="text-xl my-1">{day.icon}</span>
               <div className="flex items-center gap-1 text-xs">
                 <Thermometer className="h-3 w-3" />
                 <span className="font-medium">{Math.round(day.maxTemp)}°</span>
                 <span className="text-muted-foreground">{Math.round(day.minTemp)}°</span>
               </div>
             </div>
           ))}
         </div>
       </CardContent>
     </Card>
   );
 }