import {
  users,
  rooms,
  sensorReadings,
  aiAnalysis,
  notifications,
  type User,
  type InsertUser,
  type Room,
  type InsertRoom,
  type SensorReading,
  type InsertSensorReading,
  type AiAnalysis,
  type InsertAiAnalysis,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Room operations
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  
  // Sensor readings
  getLatestSensorReading(roomId: number): Promise<SensorReading | undefined>;
  getSensorReadings(roomId: number, limit?: number): Promise<SensorReading[]>;
  createSensorReading(reading: InsertSensorReading): Promise<SensorReading>;
  getSensorReadingsByTimeRange(roomId: number, startTime: Date, endTime: Date): Promise<SensorReading[]>;
  
  // AI Analysis
  getLatestAiAnalysis(roomId: number): Promise<AiAnalysis | undefined>;
  createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis>;
  
  // Notifications
  getActiveNotifications(roomId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(roomId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Room operations
  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.isActive, true));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  // Sensor readings
  async getLatestSensorReading(roomId: number): Promise<SensorReading | undefined> {
    const [reading] = await db
      .select()
      .from(sensorReadings)
      .where(eq(sensorReadings.roomId, roomId))
      .orderBy(desc(sensorReadings.timestamp))
      .limit(1);
    return reading;
  }

  async getSensorReadings(roomId: number, limit = 50): Promise<SensorReading[]> {
    return await db
      .select()
      .from(sensorReadings)
      .where(eq(sensorReadings.roomId, roomId))
      .orderBy(desc(sensorReadings.timestamp))
      .limit(limit);
  }

  async createSensorReading(reading: InsertSensorReading): Promise<SensorReading> {
    const [newReading] = await db.insert(sensorReadings).values(reading).returning();
    return newReading;
  }

  async getSensorReadingsByTimeRange(roomId: number, startTime: Date, endTime: Date): Promise<SensorReading[]> {
    return await db
      .select()
      .from(sensorReadings)
      .where(
        and(
          eq(sensorReadings.roomId, roomId),
          gte(sensorReadings.timestamp, startTime),
          lte(sensorReadings.timestamp, endTime)
        )
      )
      .orderBy(desc(sensorReadings.timestamp))
      .limit(100);
  }

  // AI Analysis
  async getLatestAiAnalysis(roomId: number): Promise<AiAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(aiAnalysis)
      .where(eq(aiAnalysis.roomId, roomId))
      .orderBy(desc(aiAnalysis.timestamp))
      .limit(1);
    return analysis;
  }

  async createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis> {
    const [newAnalysis] = await db.insert(aiAnalysis).values(analysis).returning();
    return newAnalysis;
  }

  // Notifications
  async getActiveNotifications(roomId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.roomId, roomId),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.timestamp));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(roomId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.roomId, roomId),
          eq(notifications.isRead, false)
        )
      );
  }
}

export const storage = new DatabaseStorage();
