import { eq, and } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { notifications } from "../../database/schema/schema";

export class NotificationService{
    public async getAll(userType: "STUDENT" | "STAFF" | "DEAN" | "HA" | "PREVIOUS_HA") {
        return db
          .select()
          .from(notifications)
          .where(and(
            eq(notifications.for_role, userType),
            eq(notifications.is_read, false)
          ))
          .orderBy(notifications.updated_at);
    }
    public async markAsRead(notificationId: string) {
        const [updated] = await db
          .update(notifications)
          .set({ is_read: true, updated_at: new Date() }) 
          .where(eq(notifications.id, notificationId))
          .returning(); 
        return updated;
    }
    public async deleteNotification(notificationId: string) {
        const deleted = await db
          .delete(notifications)
          .where(eq(notifications.id, notificationId))
          .returning();
          
        return deleted[0];
    }
    public async createNotification(data: {
        title: string;
        message: string;
        userType: "STUDENT" | "STAFF" | "DEAN" | "HA" | "PREVIOUS_HA";
      }) {
        const [notification] = await db
          .insert(notifications)
          .values({
            type: data.title,
            message: data.message,
            for_role: "HA",
            is_read: false
          })
          .returning();
    
        return notification;
      }
      
}