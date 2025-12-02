import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface SyncUserData {
  username?: string;
  role?: string;
}

export function useAuth() {
  const { currentUser, loading: authLoading } = useFirebaseAuth();
  const queryClient = useQueryClient();

  // Fetch user data from backend after Firebase auth
  const { data: user, isLoading: userLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      if (!currentUser) return null;
      
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/user", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // User not in database - this is expected during signup
          // Don't throw error, just return null and let manual sync handle it
          return null;
        }
        throw new Error("Failed to fetch user");
      }
      
      return response.json();
    },
    enabled: !!currentUser,
    retry: 2, // Retry twice for better reliability
    refetchOnMount: "always", // Always refetch on mount to get latest data
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetch after signup
  });

  // Sync Firebase user to backend
  const syncUser = useMutation({
    mutationFn: async (data: SyncUserData = {}) => {
      if (!currentUser) return null;
      
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed to sync user");
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate and immediately refetch to update user data
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
    },
  });

  // Auto-sync disabled - manual sync from AuthModal handles both signup and login
  // This prevents race conditions where auto-sync creates user with wrong role
  // useEffect(() => {
  //   if (currentUser && !user && !userLoading && !authLoading && !syncUser.isPending) {
  //     console.log("🔄 Auto-syncing user on login:", currentUser.email);
  //     syncUser.mutate({ role: "student" });
  //   }
  // }, [currentUser, user, userLoading, authLoading, syncUser]);

  return {
    user: user || null,
    isLoading: authLoading || userLoading || syncUser.isPending,
    isAuthenticated: !!currentUser && !!user,
    firebaseUser: currentUser,
    syncUser: syncUser.mutateAsync,  // Use mutateAsync instead of mutate
  };
}

