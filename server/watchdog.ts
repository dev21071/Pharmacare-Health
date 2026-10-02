import { repository } from './repository.ts';
import { crossDeviceHub } from './crossDeviceHub.ts';
import type { CaregiverAlert } from '../src/types.ts';

export class MissedDoseWatchdog {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs: number = 30000; // 30 seconds

  start(): void {
    if (this.timer) return;
    console.log('[Watchdog] Missed-dose monitoring watchdog started (interval: 30s)');
    this.timer = setInterval(() => this.checkMissedDoses(), this.intervalMs);
    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Watchdog] Missed-dose monitoring watchdog stopped');
    }
  }

  private async checkMissedDoses(): Promise<void> {
    try {
      const activeConnections = await repository.getAllActiveConnections();
      if (activeConnections.length === 0) return;

      for (const conn of activeConnections) {
        if (!conn.permissions.unconfirmedAlerts) continue;

        const patient = await repository.getUserByPhone(conn.patientPhone);
        const patientTz = patient?.timezone || 'Asia/Kolkata';
        const gracePeriod = patient?.reminderGracePeriodMinutes || 30;

        // Current time in patient timezone
        const nowInPatientTz = new Date(new Date().toLocaleString('en-US', { timeZone: patientTz }));
        const currentYear = nowInPatientTz.getFullYear();
        const currentMonth = String(nowInPatientTz.getMonth() + 1).padStart(2, '0');
        const currentDay = String(nowInPatientTz.getDate()).padStart(2, '0');
        const todayDateStr = `${currentYear}-${currentMonth}-${currentDay}`;
        const currentTotalMinutes = nowInPatientTz.getHours() * 60 + nowInPatientTz.getMinutes();

        const reminders = await repository.getReminders(conn.patientPhone);

        for (const rem of reminders) {
          if (!rem.active) continue;

          // Check if start date has begun and not past end date
          if (rem.startDate && todayDateStr < rem.startDate) continue;
          if (rem.endDate && todayDateStr > rem.endDate) continue;

          for (const doseTime of rem.times) {
            const [h, m] = doseTime.split(':').map(Number);
            const scheduledTotalMinutes = h * 60 + m;
            const overdueThresholdMinutes = scheduledTotalMinutes + gracePeriod;

            // Check if dose is overdue but within 6 hours (360 minutes) window
            if (
              currentTotalMinutes >= overdueThresholdMinutes &&
              currentTotalMinutes - scheduledTotalMinutes <= 360
            ) {
              // Check if logged as taken or skipped
              const isLogged = rem.doseLogs.some(
                log => log.date === todayDateStr && log.time === doseTime && (log.status === 'taken' || log.status === 'skipped')
              );

              if (!isLogged) {
                // Check if alert already generated
                const existingAlerts = await repository.getAlertsForCaregiver(conn.caregiverPhone);
                const alreadyAlerted = existingAlerts.some(
                  a => a.connectionId === conn.id && a.reminderId === rem.id && a.date === todayDateStr && a.scheduledTime === doseTime
                );

                if (!alreadyAlerted) {
                  const newAlert: CaregiverAlert = {
                    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    connectionId: conn.id,
                    patientPhone: conn.patientPhone,
                    patientName: conn.patientName,
                    caregiverPhone: conn.caregiverPhone,
                    reminderId: rem.id,
                    medicineName: conn.permissions.medicineName ? rem.medicineName : 'Scheduled Medication',
                    dosage: conn.permissions.medicineName ? rem.dosage : 'Prescribed Dose',
                    scheduledTime: conn.permissions.scheduledTime ? doseTime : 'Scheduled Time',
                    date: todayDateStr,
                    status: 'dose_not_confirmed',
                    alertGeneratedAt: Date.now(),
                    confirmedLater: false,
                    notificationDelivered: false,
                  };

                  await repository.saveAlert(newAlert);
                  crossDeviceHub.notifyMissedDoseAlert(conn.caregiverPhone, newAlert);
                  console.log(`[Watchdog] Generated missed dose alert for caregiver ${conn.caregiverPhone} (Patient: ${conn.patientName}, Med: ${rem.medicineName})`);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[Watchdog] Error running checkMissedDoses:', err);
    }
  }
}

export const watchdog = new MissedDoseWatchdog();
