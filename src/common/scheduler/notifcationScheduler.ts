// src/common/scheduler/notificationScheduler.ts
import cron from 'node-cron';
import { db } from '../../database/drizzle';
import { lte, eq, and, lt, gt, desc } from 'drizzle-orm';
import { differenceInDays, isToday } from 'date-fns';
import { medicine_batches, medicines, notifications } from '../../database/schema/schema';
import { sendNotificationToClients } from '../service/socket.manager';

// Constants
const LOW_STOCK_THRESHOLD = 10;
const EXPIRY_THRESHOLD_DAYS = 7;

export const notificationScheduler = cron.schedule('*/15 * * * *', async () => {
  console.log('[Scheduler] Checking for medicine expiry and low stock...');
  
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(now.getDate() + EXPIRY_THRESHOLD_DAYS);
  
  try {
    // Get low stock batches with medicine names
    const lowStockBatches = await db
      .select({
        id: medicine_batches.id,
        batch_name: medicine_batches.batch_name,
        quantity: medicine_batches.quantity,
        medicine_id: medicine_batches.medicine_id,
        medicine_name: medicines.name
      })
      .from(medicine_batches)
      .innerJoin(medicines, eq(medicine_batches.medicine_id, medicines.id))
      .where(lte(medicine_batches.quantity, LOW_STOCK_THRESHOLD));
    
    // Get batches nearing expiry with medicine names
    const expiringBatches = await db
      .select({
        id: medicine_batches.id,
        batch_name: medicine_batches.batch_name,
        medicine_id: medicine_batches.medicine_id,
        medicine_name: medicines.name,
        expiry_date: medicine_batches.expiry_date
      })
      .from(medicine_batches)
      .innerJoin(medicines, eq(medicine_batches.medicine_id, medicines.id))
      .where(
        and(
          lte(medicine_batches.expiry_date, thresholdDate),
          gt(medicine_batches.expiry_date, now)
        )
      );
    
    // Get already expired batches
    const expiredBatches = await db
      .select({
        id: medicine_batches.id,
        batch_name: medicine_batches.batch_name,
        medicine_id: medicine_batches.medicine_id,
        medicine_name: medicines.name,
        expiry_date: medicine_batches.expiry_date
      })
      .from(medicine_batches)
      .innerJoin(medicines, eq(medicine_batches.medicine_id, medicines.id))
      .where(lt(medicine_batches.expiry_date, now));
    
    let notificationsCreated = false;
    
    // Enhanced create or update notifications function
    const createOrUpdateNotification = async (type: 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED', batch: any) => {
      // First, check if any notification exists for this batch and type, regardless of read status
      const allExisting = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.batch_id, batch.id),
            eq(notifications.type, type)
          )
        )
        .orderBy(desc(notifications.created_at)); // Get most recent first
      
      // Generate appropriate message based on notification type
      let message = '';
      switch (type) {
        case 'LOW_STOCK':
          message = `${batch.medicine_name} (${batch.batch_name}) is low in stock (${batch.quantity} remaining)`;
          break;
        case 'EXPIRING':
          const daysUntilExpiry = differenceInDays(new Date(batch.expiry_date), now);
          message = `${batch.medicine_name} (${batch.batch_name}) will expire in ${daysUntilExpiry} days`;
          break;
        case 'EXPIRED':
          message = `${batch.medicine_name} (${batch.batch_name}) has expired and should be removed`;
          break;
      }
      
      if (allExisting.length > 0) {
        const latestNotification = allExisting[0]; // Most recent notification
        
        if (!latestNotification.is_read) {
          // Case: Exists and is_read = false
          const lastUpdated = new Date(latestNotification.updated_at ?? Date.now());
          if (isToday(lastUpdated)) return; // Do nothing if already updated today
          
          // Update the existing notification
          await db.update(notifications)
            .set({ 
              updated_at: new Date(),
              message: message // Update message to reflect current status
            })
            .where(eq(notifications.id, latestNotification.id));
            
          console.log(`[Scheduler] Updated ${type} notification for ${batch.medicine_name}`);
        } else {
          // Case: Exists and is_read = true
          const lastUpdated = new Date(latestNotification.updated_at ?? Date.now());
          
          if (isToday(lastUpdated)) {
            // Case: Exists and is_read = true AND today's date - Do nothing
            console.log(`[Scheduler] Skipped ${type} notification for ${batch.medicine_name} (already read today)`);
            return;
          } else {
            // Case: Exists and is_read = true AND older date - Insert new notification
            await db.insert(notifications).values({
              batch_id: batch.id,
              medicine_id: batch.medicine_id,
              message: message,
              type,
              for_role: "HA", // Explicitly set the role
              is_read: false,
              updated_at: new Date(),
              created_at: new Date(),
            });
            
            notificationsCreated = true;
            console.log(`[Scheduler] Created new ${type} notification for ${batch.medicine_name} (previous was read)`);
          }
        }
      } else {
        // Case: No existing notification
        await db.insert(notifications).values({
          batch_id: batch.id,
          medicine_id: batch.medicine_id,
          message: message,
          type,
          for_role: "HA", // Explicitly set the role
          is_read: false,
          updated_at: new Date(),
          created_at: new Date(),
        });
        
        notificationsCreated = true;
        console.log(`[Scheduler] Created new ${type} notification for ${batch.medicine_name}`);
      }
    };
    
    // Process each batch type
    for (const batch of lowStockBatches) {
      await createOrUpdateNotification('LOW_STOCK', batch);
    }
    
    for (const batch of expiringBatches) {
      await createOrUpdateNotification('EXPIRING', batch);
    }
    
    for (const batch of expiredBatches) {
      await createOrUpdateNotification('EXPIRED', batch);
    }
    
    // Notify clients if any new notifications were created
    if (notificationsCreated) {
      sendNotificationToClients();
    }
    
    console.log('[Scheduler] Notification check complete.');
  } catch (error) {
    console.error('[Scheduler] Error checking for notifications:', error);
  }
});

// Export a function to manually start the scheduler
export const startNotificationScheduler = () => {
  notificationScheduler.start();
  console.log('[Scheduler] Notification scheduler started');
  return notificationScheduler;
};

// Export a function to stop the scheduler
export const stopNotificationScheduler = () => {
  notificationScheduler.stop();
  console.log('[Scheduler] Notification scheduler stopped');
};