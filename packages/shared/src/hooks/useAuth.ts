import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase, getCurrentUser, getProfile } from "../supabase";
import type { Profile, AuthState } from "../types";

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
  });

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await getProfile(data.user.id);
        setState({
          user: data.user,
          profile,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      }));
    }
  };

  const signUp = async (email: string, password: string, metadata: Record<string, unknown>) => {
    try {
      setState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      if (data.user) {
        const profile = await getProfile(data.user.id);
        setState({
          user: data.user,
          profile,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      }));
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        profile: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev: AuthState) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sign out failed",
      }));
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!state.user) throw new Error("No user logged in");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", state.user.id)
        .select()
        .single();

      if (error) throw error;

      setState((prev: AuthState) => ({
        ...prev,
        profile: data,
      }));
    } catch (error) {
      setState((prev: AuthState) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Profile update failed",
      }));
    }
  };

  const refreshProfile = async () => {
    try {
      if (!state.user) return;

      const profile = await getProfile(state.user.id);
      setState((prev: AuthState) => ({
        ...prev,
        profile,
      }));
    } catch (error) {
      setState((prev: AuthState) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Profile refresh failed",
      }));
    }
  };

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await getProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        setState({
          user: null,
          profile: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Auth initialization failed",
        });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          const profile = await getProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            error: null,
          });
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return React.createElement(AuthContext.Provider, { value: contextValue }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
