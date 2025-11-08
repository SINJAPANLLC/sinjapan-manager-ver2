// Authorization Middleware for Role-Based Access Control
import type { Request, Response, NextFunction } from "express";
import type { Permission, UserRole } from "@shared/permissions";
import { hasPermission, hasAnyPermission } from "@shared/permissions";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
    }
  }
}

// Middleware to require specific permission(s)
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    const userRole = req.user.role as UserRole;
    const hasRequiredPermission = hasAnyPermission(userRole, permissions);

    if (!hasRequiredPermission) {
      return res.status(403).json({ 
        message: "このリソースへのアクセス権限がありません",
        requiredPermissions: permissions,
        userRole: userRole
      });
    }

    next();
  };
}

// Middleware to require specific role(s)
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    const userRole = req.user.role as UserRole;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: "このリソースへのアクセス権限がありません",
        requiredRoles: roles,
        userRole: userRole
      });
    }

    next();
  };
}

// Middleware to check resource ownership or admin role
export function requireOwnershipOrRole(
  getOwnerId: (req: Request) => Promise<string | undefined>,
  ...allowedRoles: UserRole[]
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    const userRole = req.user.role as UserRole;
    const userId = req.user.id;

    // Check if user has privileged role
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Check ownership
    try {
      const ownerId = await getOwnerId(req);
      
      if (!ownerId) {
        return res.status(404).json({ message: "リソースが見つかりません" });
      }

      if (ownerId !== userId) {
        return res.status(403).json({ 
          message: "このリソースへのアクセス権限がありません"
        });
      }

      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      return res.status(500).json({ message: "権限確認中にエラーが発生しました" });
    }
  };
}

// Helper to check if user can view all data vs only their own
export function canViewAll(userRole: UserRole): boolean {
  return ["CEO", "Manager", "AI"].includes(userRole);
}

// Helper to check if user can manage system settings
export function canManageSystem(userRole: UserRole): boolean {
  return ["CEO", "Manager"].includes(userRole);
}

// Helper to get user scope filter
export function getUserScopeFilter(req: Request, resource: string): { userId?: string } | {} {
  if (!req.user) {
    return {};
  }

  const userRole = req.user.role as UserRole;
  
  // Admins and AI see everything
  if (canViewAll(userRole)) {
    return {};
  }

  // Other roles see only their own data
  return { userId: req.user.id };
}
