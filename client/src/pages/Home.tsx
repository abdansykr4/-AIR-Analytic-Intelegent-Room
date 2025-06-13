import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dashboard } from '@/components/Dashboard';
import { storage } from '../../../server/storage';

export default function Home() {
  // Initialize some default rooms if none exist
  useEffect(() => {
    const initializeDefaultRooms = async () => {
      try {
        const response = await fetch('/api/rooms', { credentials: 'include' });
        const rooms = await response.json();
        
        // If no rooms exist, we'll let the backend handle creating default rooms
        // This would typically be done during initial setup
      } catch (error) {
        console.error('Error checking rooms:', error);
      }
    };

    initializeDefaultRooms();
  }, []);

  return <Dashboard />;
}
