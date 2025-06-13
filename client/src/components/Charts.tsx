import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format, subDays, subHours } from 'date-fns';
import type { SensorReading } from '@shared/schema';

interface ChartsProps {
  roomId: number;
}

type TimeRange = '24h' | '7d' | '30d';

export function Charts({ roomId }: ChartsProps) {
  const [tempTimeRange, setTempTimeRange] = useState<TimeRange>('24h');
  const [overviewTimeRange, setOverviewTimeRange] = useState<TimeRange>('24h');

  const getTimeRangeParams = (range: TimeRange) => {
    const now = new Date();
    // Add buffer to ensure we get data across timezone boundaries
    const bufferDays = 1;
    
    switch (range) {
      case '24h':
        const start24h = new Date(now);
        start24h.setHours(now.getHours() - 24 - bufferDays * 24, 0, 0, 0);
        const end24h = new Date(now);
        end24h.setHours(now.getHours() + bufferDays * 24, 59, 59, 999);
        return { start: start24h, end: end24h };
      case '7d':
        const start7d = new Date(now);
        start7d.setDate(now.getDate() - 7 - bufferDays);
        start7d.setHours(0, 0, 0, 0);
        const end7d = new Date(now);
        end7d.setDate(now.getDate() + bufferDays);
        end7d.setHours(23, 59, 59, 999);
        return { start: start7d, end: end7d };
      case '30d':
        const start30d = new Date(now);
        start30d.setDate(now.getDate() - 30 - bufferDays);
        start30d.setHours(0, 0, 0, 0);
        const end30d = new Date(now);
        end30d.setDate(now.getDate() + bufferDays);
        end30d.setHours(23, 59, 59, 999);
        return { start: start30d, end: end30d };
    }
  };

  // Fetch historical data for temperature chart
  const tempRange = getTimeRangeParams(tempTimeRange);
  const { data: temperatureData } = useQuery<SensorReading[]>({
    queryKey: ['/api/rooms', roomId, 'sensors/range', tempTimeRange],
    queryFn: () => {
      const searchParams = new URLSearchParams({
        start: tempRange.start.toISOString(),
        end: tempRange.end.toISOString(),
      });
      return fetch(`/api/rooms/${roomId}/sensors/range?${searchParams}`, {
        credentials: 'include',
      }).then(res => res.json());
    },
    enabled: !!roomId,
  });

  // Fetch historical data for overview chart
  const overviewRange = getTimeRangeParams(overviewTimeRange);
  const { data: overviewData } = useQuery<SensorReading[]>({
    queryKey: ['/api/rooms', roomId, 'sensors/range', overviewTimeRange],
    queryFn: () => {
      const searchParams = new URLSearchParams({
        start: overviewRange.start.toISOString(),
        end: overviewRange.end.toISOString(),
      });
      return fetch(`/api/rooms/${roomId}/sensors/range?${searchParams}`, {
        credentials: 'include',
      }).then(res => res.json());
    },
    enabled: !!roomId,
  });

  // Process temperature data for line chart
  const processedTempData = temperatureData?.map(reading => ({
    time: format(new Date(reading.timestamp!), tempTimeRange === '24h' ? 'HH:mm' : 'MMM dd'),
    temperature: reading.temperature || 0,
  })) || [];

  // Process overview data for radar chart
  const latestReading = overviewData?.[0];
  const radarData = latestReading ? [
    {
      parameter: 'Temperature',
      value: Math.min(100, ((latestReading.temperature || 20) - 15) / 15 * 100), // Normalize to 0-100
      fullMark: 100,
    },
    {
      parameter: 'Humidity',
      value: Math.min(100, (latestReading.humidity || 50)),
      fullMark: 100,
    },
    {
      parameter: 'Noise',
      value: Math.min(100, (latestReading.noiseLevel || 40) / 80 * 100), // Normalize 0-80dB to 0-100
      fullMark: 100,
    },
    {
      parameter: 'Light',
      value: Math.min(100, (latestReading.lightIntensity || 300) / 1000 * 100), // Normalize 0-1000lux to 0-100
      fullMark: 100,
    },
    {
      parameter: 'Air Quality',
      value: Math.max(0, 100 - ((latestReading.airQuality || 15) / 50 * 100)), // Invert scale: lower is better
      fullMark: 100,
    },
  ] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Temperature Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Temperature Trend</CardTitle>
            <Select value={tempTimeRange} onValueChange={(value: TimeRange) => setTempTimeRange(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last Week</SelectItem>
                <SelectItem value="30d">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedTempData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperature']}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#1976D2" 
                  strokeWidth={2}
                  fill="rgba(25, 118, 210, 0.1)"
                  dot={{ fill: '#1976D2', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#1976D2', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Overview Radar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Environmental Overview</CardTitle>
            <Select value={overviewTimeRange} onValueChange={(value: TimeRange) => setOverviewTimeRange(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Current Status</SelectItem>
                <SelectItem value="7d">Weekly Average</SelectItem>
                <SelectItem value="30d">Monthly Average</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis 
                  dataKey="parameter" 
                  tick={{ fontSize: 12, fill: '#666' }}
                />
                <PolarRadiusAxis 
                  angle={0} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: '#666' }}
                />
                <Radar 
                  name="Current Levels" 
                  dataKey="value" 
                  stroke="#1976D2" 
                  fill="rgba(25, 118, 210, 0.2)" 
                  strokeWidth={2}
                  dot={{ fill: '#1976D2', strokeWidth: 2, r: 4 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number, name) => [`${value.toFixed(1)}%`, name]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
