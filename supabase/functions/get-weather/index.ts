 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 // Weather codes mapping
 const weatherCodes: Record<number, { description: string; icon: string }> = {
   0: { description: "Clear sky", icon: "☀️" },
   1: { description: "Mainly clear", icon: "🌤️" },
   2: { description: "Partly cloudy", icon: "⛅" },
   3: { description: "Overcast", icon: "☁️" },
   45: { description: "Foggy", icon: "🌫️" },
   48: { description: "Depositing rime fog", icon: "🌫️" },
   51: { description: "Light drizzle", icon: "🌧️" },
   53: { description: "Moderate drizzle", icon: "🌧️" },
   55: { description: "Dense drizzle", icon: "🌧️" },
   61: { description: "Slight rain", icon: "🌧️" },
   63: { description: "Moderate rain", icon: "🌧️" },
   65: { description: "Heavy rain", icon: "🌧️" },
   71: { description: "Slight snow", icon: "❄️" },
   73: { description: "Moderate snow", icon: "❄️" },
   75: { description: "Heavy snow", icon: "❄️" },
   80: { description: "Slight rain showers", icon: "🌦️" },
   81: { description: "Moderate rain showers", icon: "🌦️" },
   82: { description: "Violent rain showers", icon: "⛈️" },
   95: { description: "Thunderstorm", icon: "⛈️" },
 };
 
 // Farming tips based on weather
 function getFarmingTip(weatherCode: number, temp: number, humidity: number): string {
   if (weatherCode >= 61 && weatherCode <= 65) {
     return "🌧️ Rainy conditions - avoid spraying pesticides. Good time to plant water-loving crops.";
   }
   if (weatherCode >= 95) {
     return "⛈️ Thunderstorm expected - secure equipment and avoid outdoor work.";
   }
   if (temp > 40) {
     return "🌡️ Extreme heat - water crops early morning/evening. Provide shade for livestock.";
   }
   if (temp < 5) {
     return "❄️ Cold conditions - protect sensitive crops with covers. Check frost damage.";
   }
   if (humidity > 80) {
     return "💧 High humidity - watch for fungal diseases. Improve ventilation in storage.";
   }
   if (weatherCode === 0 || weatherCode === 1) {
     return "☀️ Good conditions for harvesting, drying crops, and field preparation.";
   }
   return "🌾 Normal conditions - proceed with routine farm activities.";
 }
 
 Deno.serve(async (req) => {
   // Handle CORS preflight requests
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     // Khanpur, Rahim Yar Khan coordinates
     const latitude = 28.6474;
     const longitude = 70.6539;
 
     const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FKarachi&forecast_days=5`;
 
     console.log("Fetching weather data from Open-Meteo API");
 
     const response = await fetch(apiUrl);
 
     if (!response.ok) {
       throw new Error(`Weather API error: ${response.status}`);
     }
 
     const data = await response.json();
 
     const currentWeather = {
       temperature: data.current.temperature_2m,
       humidity: data.current.relative_humidity_2m,
       windSpeed: data.current.wind_speed_10m,
       weatherCode: data.current.weather_code,
       description: weatherCodes[data.current.weather_code]?.description || "Unknown",
       icon: weatherCodes[data.current.weather_code]?.icon || "🌡️",
       tip: getFarmingTip(
         data.current.weather_code,
         data.current.temperature_2m,
         data.current.relative_humidity_2m
       ),
     };
 
     const forecast = data.daily.time.map((date: string, index: number) => ({
       date,
       maxTemp: data.daily.temperature_2m_max[index],
       minTemp: data.daily.temperature_2m_min[index],
       weatherCode: data.daily.weather_code[index],
       description: weatherCodes[data.daily.weather_code[index]]?.description || "Unknown",
       icon: weatherCodes[data.daily.weather_code[index]]?.icon || "🌡️",
     }));
 
     console.log("Weather data fetched successfully");
 
     return new Response(
       JSON.stringify({
         location: "Khanpur, Rahim Yar Khan",
         current: currentWeather,
         forecast,
       }),
       {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   } catch (error) {
     console.error("Error fetching weather:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });