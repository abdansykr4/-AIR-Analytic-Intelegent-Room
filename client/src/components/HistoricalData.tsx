import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { SensorReading } from '@shared/schema';

interface HistoricalDataProps {
  roomId: number;
}

type DataRange = 'today' | 'yesterday' | '7days';

const getOverallStatus = (reading: SensorReading): { status: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  // Simple heuristic for overall status based on sensor values
  const issues = [];
  
  if (reading.temperature && (reading.temperature < 20 || reading.temperature > 25)) {
    issues.push('temp');
  }
  if (reading.humidity && (reading.humidity < 40 || reading.humidity > 60)) {
    issues.push('humidity');
  }
  if (reading.noiseLevel && reading.noiseLevel > 50) {
    issues.push('noise');
  }
  if (reading.lightIntensity && (reading.lightIntensity < 300 || reading.lightIntensity > 500)) {
    issues.push('light');
  }
  if (reading.airQuality && reading.airQuality > 15) {
    issues.push('air');
  }

  if (issues.length === 0) {
    return { status: 'Comfortable', variant: 'default' };
  } else if (issues.length <= 2) {
    return { status: 'Needs Attention', variant: 'secondary' };
  } else {
    return { status: 'Critical', variant: 'destructive' };
  }
};

export function HistoricalData({ roomId }: HistoricalDataProps) {
  const [dataRange, setDataRange] = useState<DataRange>('today');

  const getDateRange = (range: DataRange) => {
    const now = new Date();
    const bufferDays = 1;

    switch (range) {
      case 'today':
        const startOfToday = new Date(now);
        startOfToday.setDate(now.getDate() - bufferDays);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setDate(now.getDate() + bufferDays);
        endOfToday.setHours(23, 59, 59, 999);
        return { start: startOfToday, end: endOfToday };
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1 - bufferDays);
        const startOfYesterday = new Date(yesterday);
        startOfYesterday.setHours(0, 0, 0, 0);
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setDate(yesterday.getDate() + bufferDays * 2);
        endOfYesterday.setHours(23, 59, 59, 999);
        return { start: startOfYesterday, end: endOfYesterday };
      case '7days':
        const start7Days = new Date(now);
        start7Days.setDate(now.getDate() - 7 - bufferDays);
        start7Days.setHours(0, 0, 0, 0);
        const end7Days = new Date(now);
        end7Days.setDate(now.getDate() + bufferDays);
        end7Days.setHours(23, 59, 59, 999);
        return { start: start7Days, end: end7Days };
    }
  };

  const dateRange = getDateRange(dataRange);
  
  const { data: historicalData, isLoading } = useQuery<SensorReading[]>({
    queryKey: ['/api/rooms', roomId, 'sensors/range', dataRange],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });
      const response = await fetch(`/api/rooms/${roomId}/sensors/range?${searchParams}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      return response.json();
    },
    enabled: !!roomId,
    refetchInterval: 60000, // Refetch every minute
  });

  const handleExport = () => {
    if (!historicalData || historicalData.length === 0) return;

    // Create CSV content
    const headers = ['Time', 'Temperature', 'Humidity', 'Noise', 'Light', 'Air Quality', 'Status'];
    const csvContent = [
      headers.join(','),
      ...historicalData.map(reading => {
        const status = getOverallStatus(reading);
        return [
          format(new Date(reading.timestamp!), 'yyyy-MM-dd HH:mm:ss'),
          reading.temperature?.toFixed(1) || '',
          reading.humidity?.toFixed(0) || '',
          reading.noiseLevel?.toFixed(0) || '',
          reading.lightIntensity?.toFixed(0) || '',
          reading.airQuality?.toFixed(1) || '',
          status.status
        ].join(',');
      })
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `environmental-data-${dataRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Historical Data</CardTitle>
          <div className="flex items-center space-x-3">
            <Select value={dataRange} onValueChange={(value: DataRange) => setDataRange(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={!historicalData || historicalData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : historicalData && historicalData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Temperature</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Humidity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Noise</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Light</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Air Quality</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {historicalData.slice(0, 20).map((reading) => {
                  const status = getOverallStatus(reading);
                  return (
                    <tr key={reading.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">
                        {format(new Date(reading.timestamp!), 'HH:mm')}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {reading.temperature ? `${reading.temperature.toFixed(1)}°C` : '--'}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {reading.humidity ? `${reading.humidity.toFixed(0)}%` : '--'}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {reading.noiseLevel ? `${reading.noiseLevel.toFixed(0)} dB` : '--'}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {reading.lightIntensity ? `${reading.lightIntensity.toFixed(0)} lux` : '--'}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {reading.airQuality ? `${reading.airQuality.toFixed(1)} μg/m³` : '--'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={status.variant}>
                          {status.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {historicalData.length > 20 && (
              <div className="text-center py-4 text-sm text-gray-500">
                Showing latest 20 entries of {historicalData.length} total
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No historical data available for the selected period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
