import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { analyzeEnvironmentalData } from "./ml/environmentalAnalysis";
import { insertSensorReadingSchema } from "@shared/schema";

// Middleware to check authentication
function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Initialize default rooms if none exist
  const initializeDefaultRooms = async () => {
    try {
      const existingRooms = await storage.getRooms();
      if (existingRooms.length === 0) {
        const defaultRooms = [
          { name: "Conference Room A", description: "Main conference room for meetings", icon: "fas fa-users" },
          { name: "Office Floor 1", description: "General office workspace", icon: "fas fa-building" },
          { name: "Lab Room", description: "Research and development laboratory", icon: "fas fa-flask" },
          { name: "Meeting Room B", description: "Small meeting room for team discussions", icon: "fas fa-handshake" },
        ];
        
        for (const room of defaultRooms) {
          await storage.createRoom(room);
        }
        console.log('Default rooms initialized');
      }
    } catch (error) {
      console.error('Error initializing default rooms:', error);
    }
  };

  // Initialize rooms on startup
  setTimeout(initializeDefaultRooms, 2000);

  // Auth routes are handled in auth.ts

  // Room routes
  app.get('/api/rooms', isAuthenticated, async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get('/api/rooms/:id', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  // Sensor data routes
  app.get('/api/rooms/:id/sensors/latest', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const reading = await storage.getLatestSensorReading(roomId);
      res.json(reading);
    } catch (error) {
      console.error("Error fetching latest sensor reading:", error);
      res.status(500).json({ message: "Failed to fetch sensor data" });
    }
  });

  app.get('/api/rooms/:id/sensors/history', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const readings = await storage.getSensorReadings(roomId, limit);
      res.json(readings);
    } catch (error) {
      console.error("Error fetching sensor history:", error);
      res.status(500).json({ message: "Failed to fetch sensor history" });
    }
  });

  app.get('/api/rooms/:id/sensors/range', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const startTime = new Date(req.query.start as string);
      const endTime = new Date(req.query.end as string);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      
      const readings = await storage.getSensorReadingsByTimeRange(roomId, startTime, endTime);
      res.json(readings);
    } catch (error) {
      console.error("Error fetching sensor data by range:", error);
      res.status(500).json({ message: "Failed to fetch sensor data" });
    }
  });

  // AI Analysis routes
  app.get('/api/rooms/:id/analysis/latest', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const analysis = await storage.getLatestAiAnalysis(roomId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      res.status(500).json({ message: "Failed to fetch AI analysis" });
    }
  });

  // Notifications routes
  app.get('/api/rooms/:id/notifications', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const notifications = await storage.getActiveNotifications(roomId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.patch('/api/rooms/:id/notifications/read-all', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      await storage.markAllNotificationsAsRead(roomId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);

  // Simulate sensor data updates (in production, this would come from actual sensors)
  setInterval(async () => {
    try {
      const rooms = await storage.getRooms();
      
      for (const room of rooms) {
        // Initialize base values
        let baseTemp = 22;
        let baseHumidity = 50;
        let baseNoise = 35;
        let baseLight = 350;
        let baseAirQuality = 8;
        
        if (room.id === 2) {
          // Room 2: Random issues with 50% chance for each parameter
          const hasTempIssue = Math.random() < 0.5;
          const hasHumidityIssue = Math.random() < 0.5;
          const hasNoiseIssue = Math.random() < 0.5;
          const hasLightIssue = Math.random() < 0.5;
          const hasAirIssue = Math.random() < 0.5;

          baseTemp = hasTempIssue ? (Math.random() < 0.5 ? 28 : 18) : 22; // Too hot or too cold
          baseHumidity = hasHumidityIssue ? (Math.random() < 0.5 ? 75 : 35) : 50; // Too humid or too dry
          baseNoise = hasNoiseIssue ? 65 : 35; // Too noisy
          baseLight = hasLightIssue ? (Math.random() < 0.5 ? 800 : 200) : 350; // Too bright or too dim
          baseAirQuality = hasAirIssue ? 25 : 8; // Poor air quality
        } else if (room.id === 3) {
          // Room 3: Random issues with 30% chance for each parameter
          const hasTempIssue = Math.random() < 0.3;
          const hasHumidityIssue = Math.random() < 0.3;
          const hasNoiseIssue = Math.random() < 0.3;
          const hasLightIssue = Math.random() < 0.3;
          const hasAirIssue = Math.random() < 0.3;

          baseTemp = hasTempIssue ? (Math.random() < 0.5 ? 27 : 19) : 22;
          baseHumidity = hasHumidityIssue ? (Math.random() < 0.5 ? 70 : 40) : 50;
          baseNoise = hasNoiseIssue ? 60 : 35;
          baseLight = hasLightIssue ? (Math.random() < 0.5 ? 750 : 250) : 350;
          baseAirQuality = hasAirIssue ? 20 : 8;
        } else if (room.id === 4) {
          // Room 4: Always has multiple issues
          const issueType = Math.floor(Math.random() * 4); // 0-3 for different combinations
          switch (issueType) {
            case 0: // Temperature and humidity issues
              baseTemp = 30;
              baseHumidity = 75;
              baseNoise = 35;
              baseLight = 350;
              baseAirQuality = 8;
              break;
            case 1: // Noise and light issues
              baseTemp = 22;
              baseHumidity = 50;
              baseNoise = 70;
              baseLight = 900;
              baseAirQuality = 8;
              break;
            case 2: // Air quality and temperature issues
              baseTemp = 29;
              baseHumidity = 50;
              baseNoise = 35;
              baseLight = 350;
              baseAirQuality = 30;
              break;
            case 3: // Multiple issues
              baseTemp = 28;
              baseHumidity = 70;
              baseNoise = 65;
              baseLight = 800;
              baseAirQuality = 25;
              break;
          }
        } else {
          // Other rooms: Normal values with occasional minor fluctuations
          baseTemp = 22 + (Math.random() - 0.5) * 2; // 21-23°C
          baseHumidity = 50 + (Math.random() - 0.5) * 4; // 48-52%
          baseNoise = 35 + (Math.random() - 0.5) * 4; // 33-37 dB
          baseLight = 350 + (Math.random() - 0.5) * 20; // 340-360 lux
          baseAirQuality = 8 + (Math.random() - 0.5) * 2; // 7-9 μg/m³
        }

        // Add some variation to make it more realistic
        const tempVariation = Math.sin(Date.now() / 1000000) * 1;
        const randomTemp = (Math.random() - 0.5) * 0.5;
        
        const humidityVariation = Math.sin(Date.now() / 1200000) * 2;
        const randomHumidity = (Math.random() - 0.5) * 1;

        const sensorData = {
          roomId: room.id,
          temperature: baseTemp + tempVariation + randomTemp,
          humidity: baseHumidity + humidityVariation + randomHumidity,
          noiseLevel: baseNoise + Math.random() * 5,
          lightIntensity: baseLight + Math.random() * 50,
          airQuality: baseAirQuality + Math.random() * 2,
        };

        // Validate and store sensor reading
        const validatedData = insertSensorReadingSchema.parse(sensorData);
        const reading = await storage.createSensorReading(validatedData);

        // Perform AI analysis and store it
        const analysis = await analyzeEnvironmentalData(reading);
        await storage.createAiAnalysis({
          roomId: room.id,
          sensorReadingId: reading.id,
          overallStatus: analysis.overallStatus,
          temperatureStatus: analysis.temperatureStatus,
          humidityStatus: analysis.humidityStatus,
          noiseStatus: analysis.noiseStatus,
          lightStatus: analysis.lightStatus,
          airQualityStatus: analysis.airQualityStatus,
          analysisText: analysis.analysisText,
          recommendations: analysis.recommendations,
          confidence: analysis.confidence
        });

        // Create notifications only for critical conditions and with a 10% chance
        if (analysis.overallStatus === 'critical' && Math.random() < 0.1) {
          await storage.createNotification({
            roomId: room.id,
            type: 'alert',
            title: 'Critical Environmental Condition',
            message: analysis.analysisText || 'Environmental conditions require immediate attention',
            severity: 'critical'
          });
        }
      }
    } catch (error) {
      console.error('Error in sensor data simulation:', error);
    }
  }, 5000); // Update every 5 seconds

  return httpServer;
}
