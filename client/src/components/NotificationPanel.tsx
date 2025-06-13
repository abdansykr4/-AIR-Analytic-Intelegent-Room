import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, AlertTriangle, Info, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import type { Notification } from '@shared/schema';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllAsRead?: () => void;
  roomId?: number;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'alert':
      return AlertTriangle;
    case 'warning':
      return AlertCircle;
    case 'info':
    default:
      return Info;
  }
};

const getNotificationColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'border-l-red-500 bg-red-50';
    case 'high':
      return 'border-l-orange-500 bg-orange-50';
    case 'medium':
      return 'border-l-yellow-500 bg-yellow-50';
    case 'low':
    default:
      return 'border-l-blue-500 bg-blue-50';
  }
};

const getSeverityBadgeVariant = (severity: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (severity) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
    default:
      return 'outline';
  }
};

export function NotificationPanel({ notifications, onClose, onMarkAllAsRead, roomId }: NotificationPanelProps) {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest('PATCH', `/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      // Invalidate the specific notifications query
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, 'notifications'] });
      }
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  console.log('===Notifications===')
  console.log(notifications)

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg border-l z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && onMarkAllAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 ${
                    notification.isRead ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <Badge variant={getSeverityBadgeVariant(notification.severity || 'low')} className="text-xs">
                          {notification.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : 'No timestamp'}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="ml-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
