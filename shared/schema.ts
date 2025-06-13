import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").default("fas fa-home"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sensorReadings = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  temperature: real("temperature"), // Celsius
  humidity: real("humidity"), // Percentage
  noiseLevel: real("noise_level"), // Decibels
  lightIntensity: real("light_intensity"), // Lux
  airQuality: real("air_quality"), // PM2.5 μg/m³
  timestamp: timestamp("timestamp").defaultNow(),
});

export const aiAnalysis = pgTable("ai_analysis", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  sensorReadingId: integer("sensor_reading_id").references(() => sensorReadings.id),
  overallStatus: varchar("overall_status"), // comfortable, warning, critical
  temperatureStatus: varchar("temperature_status"),
  humidityStatus: varchar("humidity_status"),
  noiseStatus: varchar("noise_status"),
  lightStatus: varchar("light_status"),
  airQualityStatus: varchar("air_quality_status"),
  analysisText: text("analysis_text"),
  recommendations: jsonb("recommendations"), // Array of recommendation objects
  confidence: real("confidence"), // 0-1 confidence score
  timestamp: timestamp("timestamp").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  type: varchar("type").notNull(), // alert, warning, info
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  severity: varchar("severity").default("low"), // low, medium, high, critical
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  sensorReadings: many(sensorReadings),
  aiAnalysis: many(aiAnalysis),
  notifications: many(notifications),
}));

export const sensorReadingsRelations = relations(sensorReadings, ({ one, many }) => ({
  room: one(rooms, {
    fields: [sensorReadings.roomId],
    references: [rooms.id],
  }),
  aiAnalysis: many(aiAnalysis),
}));

export const aiAnalysisRelations = relations(aiAnalysis, ({ one }) => ({
  room: one(rooms, {
    fields: [aiAnalysis.roomId],
    references: [rooms.id],
  }),
  sensorReading: one(sensorReadings, {
    fields: [aiAnalysis.sensorReadingId],
    references: [sensorReadings.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  room: one(rooms, {
    fields: [notifications.roomId],
    references: [rooms.id],
  }),
}));

// Insert schemas
export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertSensorReadingSchema = createInsertSchema(sensorReadings).omit({
  id: true,
  timestamp: true,
});

export const insertAiAnalysisSchema = createInsertSchema(aiAnalysis).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  timestamp: true,
});

// Insert schemas for users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type AiAnalysis = typeof aiAnalysis.$inferSelect;
export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
