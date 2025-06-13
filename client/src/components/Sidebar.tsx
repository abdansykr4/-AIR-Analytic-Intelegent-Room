import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, ChartLine, Settings, LogOut, Users, Building, FlaskRound, Handshake } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import type { Room, User, SensorReading } from '@shared/schema';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  rooms: Room[];
  selectedRoomId: number;
  onRoomSelect: (roomId: number) => void;
}

const getRoomIcon = (iconClass: string) => {
  switch (iconClass) {
    case 'fas fa-users':
      return Users;
    case 'fas fa-building':
      return Building;
    case 'fas fa-flask':
      return FlaskRound;
    case 'fas fa-handshake':
      return Handshake;
    default:
      return Home;
  }
};

const getStatusColor = (data: SensorReading | null) => {
  if (!data) return 'bg-gray-500';
  
  // Check if any parameter is critical
  const isCritical = 
    data.temperature > 30 || data.temperature < 15 ||
    data.humidity > 80 || data.humidity < 20 ||
    data.noiseLevel > 80 ||
    data.lightIntensity > 1000 ||
    data.airQuality > 50;
    
  // Check if any parameter is warning
  const isWarning = 
    data.temperature > 28 || data.temperature < 18 ||
    data.humidity > 70 || data.humidity < 30 ||
    data.noiseLevel > 70 ||
    data.lightIntensity > 800 ||
    data.airQuality > 40;
    
  if (isCritical) return 'bg-red-500';
  if (isWarning) return 'bg-yellow-500';
  return 'bg-green-500';
};

export function Sidebar({ rooms, selectedRoomId, onRoomSelect }: SidebarProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch latest sensor data for all rooms
  const { data: roomData } = useQuery<Record<number, SensorReading>>({
    queryKey: ['/api/rooms/sensors/latest'],
    queryFn: async () => {
      const data: Record<number, SensorReading> = {};
      await Promise.all(
        rooms.map(async (room) => {
          const response = await fetch(`/api/rooms/${room.id}/sensors/latest`, {
            credentials: 'include'
          });
          if (response.ok) {
            data[room.id] = await response.json();
          }
        })
      );
      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Invalidate all queries to clear the cache
      await queryClient.invalidateQueries();
      
      // Show success message
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });

      // Redirect to login page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const isOverviewPage = location === '/overview';

  return (
    <div className="w-64 bg-white shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center">
          <Home className="h-8 w-8 text-primary mr-3" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">AIR System</h1>
            <p className="text-sm text-gray-600">Intelligent Room Analytics</p>
          </div>
        </div>
      </div>
      
      {/* User Info */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-white">
              {getInitials(user?.firstName || null, user?.lastName || null)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="font-medium text-gray-800">
              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User'}
            </p>
            <p className="text-sm text-gray-600">{user?.role || 'User'}</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Dashboard</h3>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isOverviewPage ? "text-primary bg-blue-50" : "text-gray-700 hover:bg-gray-100"
            )}
            onClick={() => setLocation('/overview')}
          >
            <ChartLine className="mr-3 h-4 w-4" />
            Overview
          </Button>
        </div>
        
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Rooms</h3>
          <div className="space-y-1">
            {rooms.map((room) => {
              const IconComponent = getRoomIcon(room.icon || '');
              const statusColor = getStatusColor(roomData?.[room.id] || null);
              const isRoomActive = !isOverviewPage && selectedRoomId === room.id;
              
              return (
                <Button
                  key={room.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isRoomActive
                      ? "bg-blue-50 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => {
                    onRoomSelect(room.id);
                    setLocation('/');
                  }}
                >
                  <IconComponent className="mr-3 h-4 w-4" />
                  <span className="flex-1 text-left">{room.name}</span>
                  <div className={cn("w-3 h-3 rounded-full", statusColor)}></div>
                </Button>
              );
            })}
          </div>
        </div>
        
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Settings</h3>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}
