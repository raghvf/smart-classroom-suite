import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/lib/auth';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    const [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
    ]);

    if (profileResult.error || !profileResult.data) {
      console.error('Failed to load profile', profileResult.error);
      return null;
    }

    if (roleResult.error && roleResult.error.code !== 'PGRST116') {
      console.error('Failed to load role', roleResult.error);
    }

    return {
      id: profileResult.data.id,
      email: profileResult.data.email,
      name: profileResult.data.name,
      role: (roleResult.data?.role as UserRole) || 'student',
      avatar: profileResult.data.avatar,
    };
  };

  useEffect(() => {
    let isMounted = true;
    let syncRequestId = 0;

    const syncAuthState = async (nextSession: Session | null) => {
      const requestId = ++syncRequestId;

      setSession(nextSession);

      if (!nextSession?.user) {
        if (!isMounted || requestId !== syncRequestId) return;
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const nextUser = await fetchUserProfile(nextSession.user.id);

        if (!isMounted || requestId !== syncRequestId) return;
        setUser(nextUser);
      } catch (error) {
        console.error('Failed to sync auth state', error);
        if (!isMounted || requestId !== syncRequestId) return;
        setUser(null);
      } finally {
        if (isMounted && requestId === syncRequestId) {
          setLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true);
      void syncAuthState(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setLoading(true);
      void syncAuthState(initialSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
