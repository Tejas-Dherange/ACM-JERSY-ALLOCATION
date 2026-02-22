"use client";

import { useSession } from "next-auth/react";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = !!session?.user;

  console.log("[useAuth] Status:", status);
  console.log("[useAuth] Has session:", !!session);
  console.log("[useAuth] Has user:", !!session?.user);

  return {
    user: session?.user
      ? {
          id: (session.user as any).id,
          email: session.user.email!,
          displayName: session.user.name ?? null,
        }
      : null,
    isLoading,
    isAuthenticated,
    // Returns the user ID as token for authenticating WebSocket connections
    getAccessToken: async (): Promise<string | null> => {
      try {
        console.log("[useAuth] getAccessToken called");
        const token = (session?.user as any)?.id || null;
        console.log("[useAuth] Token (user ID):", token ? "EXISTS" : "NULL");
        return token;
      } catch (error) {
        console.error("[useAuth] Error getting access token:", error);
        return null;
      }
    },
  };
}

