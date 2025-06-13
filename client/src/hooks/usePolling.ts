import { useEffect, useState } from 'react';
import type { SensorReading, AiAnalysis } from '@shared/schema';

interface UsePollingReturn {
  lastData: SensorReading | null;
  lastAnalysis: AiAnalysis | null;
  lastUpdated: Date;
  error: Error | null;
}

export function usePolling(roomId: number, interval = 5000): UsePollingReturn {
  const [lastData, setLastData] = useState<SensorReading | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AiAnalysis | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest sensor data
        const sensorResponse = await fetch(`/api/rooms/${roomId}/sensors/latest`, {
          credentials: 'include'
        });
        if (!sensorResponse.ok) throw new Error('Failed to fetch sensor data');
        const sensorData = await sensorResponse.json();
        setLastData(sensorData);

        // Fetch latest analysis
        const analysisResponse = await fetch(`/api/rooms/${roomId}/analysis/latest`, {
          credentials: 'include'
        });
        if (!analysisResponse.ok) throw new Error('Failed to fetch analysis data');
        const analysisData = await analysisResponse.json();
        setLastAnalysis(analysisData);

        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        console.error('Error polling data:', err);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling interval
    const pollInterval = setInterval(fetchData, interval);

    // Cleanup
    return () => clearInterval(pollInterval);
  }, [roomId, interval]);

  return {
    lastData,
    lastAnalysis,
    lastUpdated,
    error
  };
} 