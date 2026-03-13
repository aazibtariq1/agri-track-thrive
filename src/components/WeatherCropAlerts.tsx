import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Droplets, Wind, Thermometer, Sun, CloudRain, Snowflake, Leaf } from "lucide-react";

interface WeatherData {
    location: string;
    current: {
        temperature: number;
        humidity: number;
        windSpeed: number;
        weatherCode: number;
        description: string;
    };
    forecast: {
        date: string;
        maxTemp: number;
        minTemp: number;
        weatherCode: number;
        description: string;
    }[];
}

interface Crop {
    id: string;
    crop_name: string;
    crop_type: string;
    status: string;
    planting_date: string;
}

interface WeatherAlert {
    id: string;
    type: "frost" | "heat" | "rain" | "wind" | "dry" | "good";
    severity: "warning" | "danger" | "info" | "success";
    icon: React.ReactNode;
    title: string;
    message: string;
    cropAdvice: string[];
}

// Weather code ranges (WMO standard used by Open-Meteo)
const isRainy = (code: number) => [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
const isCloudy = (code: number) => [2, 3, 45, 48].includes(code);
const isClear = (code: number) => [0, 1].includes(code);

function generateAlerts(weather: WeatherData, crops: Crop[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const { current, forecast } = weather;
    const activeCropNames = crops.filter(c => c.status === "planted" || c.status === "growing").map(c => c.crop_name);

    // Frost Warning (temp < 5°C)
    if (current.temperature < 5) {
        alerts.push({
            id: "frost",
            type: "frost",
            severity: "danger",
            icon: <Snowflake className="h-5 w-5" />,
            title: "🥶 Frost Warning",
            message: `Temperature is ${current.temperature}°C — risk of frost damage to crops.`,
            cropAdvice: activeCropNames.length > 0
                ? activeCropNames.map(name => `Cover ${name} with plastic sheets or straw mulch to prevent frost damage.`)
                : ["Cover seedlings with plastic sheets or straw mulch to prevent frost damage."],
        });
    }

    // Heat Alert (temp > 40°C)
    if (current.temperature > 40) {
        alerts.push({
            id: "heat",
            type: "heat",
            severity: "danger",
            icon: <Thermometer className="h-5 w-5" />,
            title: "🌡️ Extreme Heat Alert",
            message: `Temperature is ${current.temperature}°C — crops may suffer heat stress.`,
            cropAdvice: activeCropNames.length > 0
                ? activeCropNames.map(name => `Increase irrigation for ${name}. Water in early morning or late evening.`)
                : ["Increase irrigation frequency. Water in early morning or late evening to reduce evaporation."],
        });
    }

    // High Wind (> 30 km/h)
    if (current.windSpeed > 30) {
        alerts.push({
            id: "wind",
            type: "wind",
            severity: "warning",
            icon: <Wind className="h-5 w-5" />,
            title: "💨 High Wind Alert",
            message: `Wind speed is ${current.windSpeed} km/h — may damage tall crops.`,
            cropAdvice: [
                "Delay pesticide or fertilizer spraying — wind will drift chemicals.",
                ...activeCropNames.filter(n => ["Corn", "Sugarcane", "Cotton"].some(c => n.toLowerCase().includes(c.toLowerCase())))
                    .map(name => `Secure ${name} stalks with supports if possible.`),
            ],
        });
    }

    // Rain Coming (check forecast for rain in next 2 days)
    const upcomingRain = forecast.slice(0, 2).filter(d => isRainy(d.weatherCode));
    if (upcomingRain.length > 0) {
        const rainDay = upcomingRain[0];
        const dayLabel = new Date(rainDay.date).toLocaleDateString("en-PK", { weekday: "long" });
        alerts.push({
            id: "rain",
            type: "rain",
            severity: "info",
            icon: <CloudRain className="h-5 w-5" />,
            title: "🌧️ Rain Expected",
            message: `${rainDay.description} expected on ${dayLabel}.`,
            cropAdvice: [
                "Delay fertilizer application — rain will wash it away.",
                "Ensure proper drainage in fields to prevent waterlogging.",
                ...activeCropNames.length > 0
                    ? [`Natural irrigation incoming for your ${activeCropNames.join(", ")}.`]
                    : [],
            ],
        });
    }

    // Dry Spell (no rain in forecast, low humidity, high temp)
    const noRainInForecast = forecast.every(d => !isRainy(d.weatherCode));
    if (noRainInForecast && current.humidity < 40 && current.temperature > 25) {
        alerts.push({
            id: "dry",
            type: "dry",
            severity: "warning",
            icon: <Droplets className="h-5 w-5" />,
            title: "💧 Dry Conditions",
            message: `No rain expected in the next ${forecast.length} days. Humidity is only ${current.humidity}%.`,
            cropAdvice: activeCropNames.length > 0
                ? activeCropNames.map(name => `Schedule irrigation for ${name}. Consider drip irrigation to conserve water.`)
                : ["Plan irrigation schedule. Consider drip irrigation to conserve water."],
        });
    }

    // Perfect Weather for farming
    if (current.temperature >= 15 && current.temperature <= 32 && current.windSpeed < 15 && !isRainy(current.weatherCode) && alerts.length === 0) {
        alerts.push({
            id: "good",
            type: "good",
            severity: "success",
            icon: <Sun className="h-5 w-5" />,
            title: "☀️ Great Weather for Farming",
            message: `${current.temperature}°C with ${current.description.toLowerCase()} — ideal conditions.`,
            cropAdvice: [
                "Perfect weather for field work, sowing, or spraying.",
                ...activeCropNames.length > 0
                    ? [`Your ${activeCropNames.join(", ")} should thrive in these conditions.`]
                    : [],
            ],
        });
    }

    return alerts;
}

const severityStyles: Record<string, string> = {
    danger: "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800",
    warning: "border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800",
    info: "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800",
    success: "border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800",
};

const severityIconColors: Record<string, string> = {
    danger: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-blue-600 dark:text-blue-400",
    success: "text-green-600 dark:text-green-400",
};

export default function WeatherCropAlerts() {
    const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDataAndGenerateAlerts();
    }, []);

    const fetchDataAndGenerateAlerts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch weather and crops in parallel
            const [weatherResult, cropsResult] = await Promise.all([
                supabase.functions.invoke("get-weather"),
                supabase.from("crops").select("id, crop_name, crop_type, status, planting_date").eq("user_id", user.id),
            ]);

            if (weatherResult.error) throw weatherResult.error;

            const weatherData = weatherResult.data as WeatherData;
            const crops = (cropsResult.data || []) as Crop[];

            const generatedAlerts = generateAlerts(weatherData, crops);
            setAlerts(generatedAlerts);
        } catch (err: any) {
            console.error("Weather alerts error:", err);
            setError("Unable to generate weather alerts");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error || alerts.length === 0) {
        return null; // Don't show anything if weather fetch fails or no alerts
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 to-orange-500/5">
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Weather-Based Crop Alerts
                </CardTitle>
                <CardDescription>AI-powered recommendations based on local weather for your crops</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`rounded-lg border p-4 ${severityStyles[alert.severity]}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 shrink-0 ${severityIconColors[alert.severity]}`}>
                                {alert.icon}
                            </div>
                            <div className="space-y-2 flex-1">
                                <div>
                                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                                </div>
                                <div className="space-y-1">
                                    {alert.cropAdvice.map((advice, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                            <Leaf className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                                            <span>{advice}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
