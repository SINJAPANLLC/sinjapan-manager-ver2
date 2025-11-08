// Route Guard Component - Protects routes based on user permissions
import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { canAccessRoute, type UserRole } from "@shared/permissions";
import { Skeleton } from "@/components/ui/skeleton";

interface RouteGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export function RouteGuard({ children, fallbackPath = "/" }: RouteGuardProps) {
  const [location, navigate] = useLocation();
  
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
  });

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, redirect to landing page
    if (!user) {
      navigate("/");
      return;
    }

    // Check if user has access to this route
    const userRole = user.role as UserRole;
    const hasAccess = canAccessRoute(userRole, location);

    if (!hasAccess) {
      console.warn(`User ${user.email} (${userRole}) attempted to access unauthorized route: ${location}`);
      navigate(fallbackPath);
    }
  }, [user, isLoading, location, navigate, fallbackPath]);

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // If not authenticated or no access, don't render children
  if (!user) {
    return null;
  }

  const userRole = user.role as UserRole;
  const hasAccess = canAccessRoute(userRole, location);

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
