import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { EnvironmentalCards } from './EnvironmentalCards';
import { AIAnalysis } from './AIAnalysis';
import { Charts } from './Charts';
import { HistoricalData } from './HistoricalData';
import { NotificationPanel } from './NotificationPanel';
import { usePolling } from '@/hooks/usePolling';
import { Bell, FolderSync } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Room, SensorReading, AiAnalysis, Notification } from '@shared/schema';

export function Dashboard() {
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { lastData, lastAnalysis, lastUpdated, error } = usePolling(selectedRoomId, 5000);

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
    refetchInterval: 5000,
  });

  // Fetch current room details
  const { data: currentRoom } = useQuery<Room>({
    queryKey: ['/api/rooms', selectedRoomId],
    enabled: !!selectedRoomId,
  });

  // Fetch notifications
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['/api/rooms', selectedRoomId, 'notifications'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/rooms/${selectedRoomId}/notifications`);
      return response.json();
    },
    enabled: !!selectedRoomId,
    refetchInterval: 5000,
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest('PATCH', `/api/rooms/${selectedRoomId}/notifications/read-all`);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate notifications query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', selectedRoomId, 'notifications'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error) => {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  });

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

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
              <h1 className="text-2xl font-bold text-gray-800">
                {currentRoom?.name || 'Room'} Dashboard
              </h1>
              <p className="text-gray-600">Real-time environmental monitoring</p>
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
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              Error fetching data: {error.message}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EnvironmentalCards data={lastData} />
            <AIAnalysis analysis={lastAnalysis} />
            <Charts roomId={selectedRoomId} />
          </div>
          
          <div className="mt-6">
            <HistoricalData roomId={selectedRoomId} />
          </div>
        </main>

        {/* Notification Panel */}
        {showNotifications && (
          <NotificationPanel
            notifications={notifications || []}
            onClose={() => setShowNotifications(false)}
            onMarkAllAsRead={handleMarkAllAsRead}
            roomId={selectedRoomId}
          />
        )}
      </div>
    </div>
  );
}
