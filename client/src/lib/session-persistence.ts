
import { supabase } from './supabase-client';
import { logger } from './logger';

export class SessionPersistenceUtil {
  private static readonly STORAGE_KEY = 'contested-auth';
  private static readonly SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days

  static async persistSession(session: any, userData?: any) {
    try {
      if (!session) {
        logger.warn('[SessionPersistence]', 'Attempted to store null session');
        return;
      }

      const sessionData = {
        session,
        userData,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
      logger.log('[SessionPersistence]', 'Session persisted successfully');
    } catch (error) {
      logger.error('[SessionPersistence]', 'Error persisting session:', error);
    }
  }

  static async restoreSession() {
    try {
      logger.log('[SessionPersistence]', 'Restoring session from storage');
      const storedData = localStorage.getItem(this.STORAGE_KEY);

      if (!storedData) {
        return null;
      }

      const data = JSON.parse(storedData);
      const { session, timestamp } = data;

      if (timestamp && (Date.now() - new Date(timestamp).getTime() > this.SESSION_TIMEOUT)) {
        logger.log('[SessionPersistence]', 'Stored session expired');
        this.clearSession();
        return null;
      }

      if (session?.access_token && session?.refresh_token) {
        try {
          const { data: refreshedSession, error } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          });

          if (error) {
            logger.error('[SessionPersistence]', 'Error refreshing session:', error);
            this.clearSession();
            return null;
          }

          this.persistSession(refreshedSession.session);
          logger.log('[SessionPersistence]', 'Session successfully restored and refreshed');
          return refreshedSession.session;
        } catch (refreshError) {
          logger.error('[SessionPersistence]', 'Error during session refresh:', refreshError);
          this.clearSession();
          return null;
        }
      }
    } catch (error) {
      logger.error('[SessionPersistence]', 'Error restoring session:', error);
      this.clearSession();
    }
    return null;
  }

  static clearSession() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('auth-status');
      localStorage.removeItem('contestedUserData');
      localStorage.removeItem('supabase-auth');
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      logger.log('[SessionPersistence]', 'Session and related data cleared');
    } catch (error) {
      logger.error('[SessionPersistence]', 'Error clearing session:', error);
    }
  }

  static isAuthenticated(): boolean {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return false;

      const data = JSON.parse(storedData);
      const { timestamp } = data;

      if (timestamp && (Date.now() - new Date(timestamp).getTime() > this.SESSION_TIMEOUT)) {
        this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[SessionPersistence]', 'Error checking auth status:', error);
      return false;
    }
  }
}

export const { persistSession, restoreSession, clearSession, isAuthenticated } = SessionPersistenceUtil;
