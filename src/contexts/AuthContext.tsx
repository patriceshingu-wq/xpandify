import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRoleType = 'super_admin' | 'admin' | 'pastor_supervisor' | 'staff' | 'volunteer';

interface Profile {
  id: string;
  email: string;
  primary_language: 'en' | 'fr';
  is_active: boolean;
}

interface Person {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  person: Person | null;
  roles: AppRoleType[];
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRoleType) => boolean;
  hasAnyRole: (roles: AppRoleType[]) => boolean;
  isAdminOrSuper: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [roles, setRoles] = useState<AppRoleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer fetching additional data
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setPerson(null);
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch person record
      const { data: personData } = await supabase
        .from('people')
        .select('id, first_name, last_name, preferred_name, email')
        .eq('user_id', userId)
        .maybeSingle();

      if (personData) {
        setPerson(personData as Person);
      }

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          app_roles (name)
        `)
        .eq('user_id', userId);

      if (rolesData) {
        const userRoles = rolesData
          .map((r: { app_roles: { name: string } | null }) => r.app_roles?.name)
          .filter(Boolean) as AppRoleType[];
        setRoles(userRoles);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPerson(null);
    setRoles([]);
  };

  const hasRole = (role: AppRoleType): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: AppRoleType[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  };

  const isAdminOrSuper = hasRole('super_admin') || hasRole('admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        person,
        roles,
        isLoading,
        signIn,
        signUp,
        signOut,
        hasRole,
        hasAnyRole,
        isAdminOrSuper,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
