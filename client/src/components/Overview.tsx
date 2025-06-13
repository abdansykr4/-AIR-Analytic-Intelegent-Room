import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Thermometer, Droplets, Volume2, Sun, Wind, Bell, FolderSync } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';
import { NotificationPanel } from './NotificationPanel';
import type { Room, SensorReading, Notification } from '@shared/schema';

export function Overview() {
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch all rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
    refetchInterval: 5000,
  });

  // Fetch latest readings for each room
  const roomQueries = rooms?.map(room => {
    return useQuery<SensorReading>({
      queryKey: ['/api/rooms', room.id, 'sensors/latest'],
      queryFn: async () => {
        const response = await fetch(`/api/rooms/${room.id}/sensors/latest`, {
          credentials: 'include',
        });
        return response.json();
      },
      refetchInterval: 5000,
    });
  }) || [];

  // Fetch notifications
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['/api/rooms', selectedRoomId, 'notifications'],
    queryFn: async () => {
      const response = await fetch(`/api/rooms/${selectedRoomId}/notifications`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!selectedRoomId,
    refetchInterval: 5000,
  });

  if (roomsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (value: number | undefined, type: string): string => {
    if (value === undefined) return 'text-gray-400';
    
    switch (type) {
      case 'temperature':
        return value >= 20 && value <= 25 ? 'text-green-500' : 'text-red-500';
      case 'humidity':
        return value >= 40 && value <= 60 ? 'text-green-500' : 'text-red-500';
      case 'noise':
        return value <= 50 ? 'text-green-500' : 'text-red-500';
      case 'light':
        return value >= 300 && value <= 500 ? 'text-green-500' : 'text-red-500';
      case 'air':
        return value <= 15 ? 'text-green-500' : 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        rooms={rooms || []}
        selectedRoomId={selectedRoomId}
        onRoomSelect={setSelectedRoomId}
      />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Building Overview</h1>
              <p className="text-gray-600">Real-time status of all rooms</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* Last Updated */}
              <div className="flex items-center text-sm text-gray-500">
                <FolderSync className="h-4 w-4 mr-1" />
                <span>
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map((room, index) => {
              const reading = roomQueries[index]?.data;
              return (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">
                        <Building className="inline-block mr-2 h-5 w-5" />
                        {room.name}
                      </CardTitle>
                      <span className="text-sm text-gray-500">
                        {reading?.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : 'No data'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Thermometer className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Temperature</span>
                        </div>
                        <span className={`text-sm font-medium ${getStatusColor(reading?.temperature ?? undefined, 'temperature')}`}>
                          {reading?.temperature !== undefined && reading?.temperature !== null ? `${reading.temperature.toFixed(1)}°C` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Droplets className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Humidity</span>
                        </div>
                        <span className={`text-sm font-medium ${getStatusColor(reading?.humidity ?? undefined, 'humidity')}`}>
                          {reading?.humidity !== undefined && reading?.humidity !== null ? `${reading.humidity.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Volume2 className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Noise</span>
                        </div>
                        <span className={`text-sm font-medium ${getStatusColor(reading?.noiseLevel ?? undefined, 'noise')}`}>
                          {reading?.noiseLevel !== undefined && reading?.noiseLevel !== null ? `${reading.noiseLevel.toFixed(1)}dB` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Light</span>
                        </div>
                        <span className={`text-sm font-medium ${getStatusColor(reading?.lightIntensity ?? undefined, 'light')}`}>
                          {reading?.lightIntensity !== undefined && reading?.lightIntensity !== null ? `${reading.lightIntensity.toFixed(1)}lux` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Wind className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Air Quality</span>
                        </div>
                        <span className={`text-sm font-medium ${getStatusColor(reading?.airQuality ?? undefined, 'air')}`}>
                          {reading?.airQuality !== undefined && reading?.airQuality !== null ? `${reading.airQuality.toFixed(1)}ppm` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>

        {/* Notification Panel */}
        {showNotifications && (
          <NotificationPanel
            notifications={notifications || []}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </div>
    </div>
  );
} 