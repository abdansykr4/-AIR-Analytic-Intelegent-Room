import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Droplets, Volume2, Sun, Wind } from "lucide-react";
import type { SensorReading } from "@shared/schema";

interface EnvironmentalCardsProps {
  data: SensorReading | null;
}

export function EnvironmentalCards({ data }: EnvironmentalCardsProps) {
  const cards = [
    {
      title: "Temperature",
      value: data?.temperature ? `${data.temperature.toFixed(1)}°C` : "N/A",
      icon: Thermometer,
      color: "text-orange-500",
    },
    {
      title: "Humidity",
      value: data?.humidity ? `${data.humidity.toFixed(1)}%` : "N/A",
      icon: Droplets,
      color: "text-blue-500",
    },
    {
      title: "Noise Level",
      value: data?.noiseLevel ? `${data.noiseLevel.toFixed(1)} dB` : "N/A",
      icon: Volume2,
      color: "text-purple-500",
    },
    {
      title: "Light Intensity",
      value: data?.lightIntensity ? `${data.lightIntensity.toFixed(1)} lux` : "N/A",
      icon: Sun,
      color: "text-yellow-500",
    },
    {
      title: "Air Quality",
      value: data?.airQuality ? `${data.airQuality.toFixed(1)} μg/m³` : "N/A",
      icon: Wind,
      color: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
