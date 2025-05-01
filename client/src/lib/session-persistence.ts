import { supabase } from './supabase-client';
import { logger } from './logger';

export class SessionPersistenceUtil {
  private static readonly STORAGE_KEY = 'contested-auth';

  static async restoreSession() {
    try {
      logger.log('[SessionPersistence]', 'Restoring session from storage');
      const storedData = localStorage.getItem(this.STORAGE_KEY);

      if (!storedData) {
        return null;
      }

      const data = JSON.parse(storedData);
      const { session, timestamp } = data;

      // Check if session is expired (30 days)
      if (timestamp && (Date.now() - new Date(timestamp).getTime() > 30 * 24 * 60 * 60 * 1000)) {
        logger.log('[SessionPersistence]', 'Stored session expired');
        this.clearSession();
        return null;
      }

      if (session?.access_token && session?.refresh_token) {
        const { data: refreshedSession, error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });

        if (error) {
          logger.error('[SessionPersistence]', 'Error refreshing session:', error);
          this.clearSession();
          return null;
        }

        logger.log('[SessionPersistence]', 'Session successfully restored');
        return refreshedSession;
      }
    } catch (error) {
      logger.error('[SessionPersistence]', 'Error restoring session:', error);
      this.clearSession();
    }
    return null;
  }

  static storeSession(session: any) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        session,
        timestamp: new Date().toISOString()
      }));
      logger.log('[SessionPersistence]', 'Session stored successfully');
    } catch (error) {
      logger.error('[SessionPersistence]', 'Error storing session:', error);
    }
  }

  static clearSession() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      logger.log('[SessionPersistence]', 'Session cleared');
    } catch (error) {
      logger.error('[SessionPersistence]', 'Error clearing session:', error);
    }
  }
}