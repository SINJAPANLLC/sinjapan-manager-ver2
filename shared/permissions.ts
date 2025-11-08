// Role-based Access Control (RBAC) System
// Defines permissions matrix for all user roles

export type UserRole = "CEO" | "Manager" | "Staff" | "staff" | "Agency" | "Client" | "AI";

export type Permission = 
  // Dashboard
  | "view:dashboard:all"
  | "view:dashboard:own"
  // Businesses
  | "view:businesses"
  | "create:businesses"
  | "update:businesses"
  | "delete:businesses"
  // Tasks
  | "view:tasks:all"
  | "view:tasks:own"
  | "create:tasks"
  | "update:tasks:all"
  | "update:tasks:own"
  | "delete:tasks:all"
  | "delete:tasks:own"
  // Finance
  | "view:finance"
  | "create:finance"
  | "update:finance"
  | "delete:finance"
  // Marketing
  | "view:marketing"
  | "create:marketing"
  | "update:marketing"
  | "delete:marketing"
  // Contracts
  | "view:contracts:all"
  | "view:contracts:own"
  | "create:contracts"
  | "update:contracts:all"
  | "update:contracts:own"
  | "delete:contracts:all"
  | "delete:contracts:own"
  // Documents
  | "view:documents:all"
  | "view:documents:own"
  | "create:documents"
  | "update:documents:own"
  | "delete:documents:own"
  // Memos
  | "view:memos:all"
  | "view:memos:own"
  | "create:memos"
  | "update:memos:own"
  | "delete:memos:own"
  // Integrations
  | "view:integrations"
  | "manage:integrations"
  // Workflows
  | "view:workflows"
  | "create:workflows"
  | "update:workflows"
  | "delete:workflows"
  // Recruitment
  | "view:recruitment"
  | "create:recruitment"
  | "update:recruitment"
  | "delete:recruitment"
  // CRM
  | "view:crm:all"
  | "view:crm:own"
  | "create:crm"
  | "update:crm:all"
  | "update:crm:own"
  | "delete:crm:all"
  | "delete:crm:own"
  // Employees
  | "view:employees:all"
  | "view:employees:own"
  | "update:employees:all"
  | "update:employees:own"
  // Communications
  | "view:communications:all"
  | "view:communications:own"
  | "create:communications"
  | "update:communications:own"
  | "delete:communications:own"
  // AI Console
  | "view:ai-console"
  | "use:ai-console"
  // System Settings
  | "view:system-settings"
  | "update:system-settings"
  // Users
  | "view:users"
  | "create:users"
  | "update:users"
  | "delete:users";

// Permission matrix for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CEO: [
    // Full access to everything
    "view:dashboard:all",
    "view:businesses", "create:businesses", "update:businesses", "delete:businesses",
    "view:tasks:all", "create:tasks", "update:tasks:all", "delete:tasks:all",
    "view:finance", "create:finance", "update:finance", "delete:finance",
    "view:marketing", "create:marketing", "update:marketing", "delete:marketing",
    "view:contracts:all", "create:contracts", "update:contracts:all", "delete:contracts:all",
    "view:documents:all", "create:documents",
    "view:memos:all", "create:memos", "update:memos:own", "delete:memos:own",
    "view:integrations", "manage:integrations",
    "view:workflows", "create:workflows", "update:workflows", "delete:workflows",
    "view:recruitment", "create:recruitment", "update:recruitment", "delete:recruitment",
    "view:crm:all", "create:crm", "update:crm:all", "delete:crm:all",
    "view:employees:all", "update:employees:all",
    "view:communications:all", "create:communications",
    "view:ai-console", "use:ai-console",
    "view:system-settings", "update:system-settings",
    "view:users", "create:users", "update:users", "delete:users",
  ],
  
  Manager: [
    // Same as CEO but slightly restricted
    "view:dashboard:all",
    "view:businesses", "create:businesses", "update:businesses", "delete:businesses",
    "view:tasks:all", "create:tasks", "update:tasks:all", "delete:tasks:all",
    "view:finance", "create:finance", "update:finance", "delete:finance",
    "view:marketing", "create:marketing", "update:marketing", "delete:marketing",
    "view:contracts:all", "create:contracts", "update:contracts:all", "delete:contracts:all",
    "view:documents:all", "create:documents",
    "view:memos:all", "create:memos", "update:memos:own", "delete:memos:own",
    "view:integrations", "manage:integrations",
    "view:workflows", "create:workflows", "update:workflows", "delete:workflows",
    "view:recruitment", "create:recruitment", "update:recruitment", "delete:recruitment",
    "view:crm:all", "create:crm", "update:crm:all", "delete:crm:all",
    "view:employees:all", "update:employees:all",
    "view:communications:all", "create:communications",
    "view:ai-console", "use:ai-console",
    "view:system-settings",
    "view:users", "create:users", "update:users",
  ],
  
  Staff: [
    // Limited access - mainly own data
    "view:dashboard:own",
    "view:tasks:own", "create:tasks", "update:tasks:own", "delete:tasks:own",
    "view:documents:own", "create:documents", "update:documents:own", "delete:documents:own",
    "view:memos:own", "create:memos", "update:memos:own", "delete:memos:own",
    "view:workflows",
    "view:employees:own", "update:employees:own",
    "view:communications:own", "create:communications", "update:communications:own", "delete:communications:own",
  ],
  
  // Backward compatibility with lowercase "staff"
  staff: [
    // Same permissions as Staff
    "view:dashboard:own",
    "view:tasks:own", "create:tasks", "update:tasks:own", "delete:tasks:own",
    "view:documents:own", "create:documents", "update:documents:own", "delete:documents:own",
    "view:memos:own", "create:memos", "update:memos:own", "delete:memos:own",
    "view:workflows",
    "view:employees:own", "update:employees:own",
    "view:communications:own", "create:communications", "update:communications:own", "delete:communications:own",
  ],
  
  Agency: [
    // Partner access - contracts and CRM
    "view:dashboard:own",
    "view:contracts:own", "update:contracts:own",
    "view:memos:own", "create:memos", "update:memos:own", "delete:memos:own",
    "view:crm:own", "create:crm", "update:crm:own", "delete:crm:own",
    "view:communications:own", "create:communications", "update:communications:own", "delete:communications:own",
  ],
  
  Client: [
    // Very limited access
    "view:dashboard:own",
    "view:memos:own", "create:memos", "update:memos:own", "delete:memos:own",
    "view:communications:own", "create:communications", "update:communications:own", "delete:communications:own",
  ],
  
  AI: [
    // AI agent access
    "view:dashboard:all",
    "view:tasks:all", "create:tasks", "update:tasks:all",
    "view:memos:all", "create:memos",
    "view:crm:all", "create:crm", "update:crm:all",
    "view:communications:all", "create:communications",
    "view:ai-console", "use:ai-console",
  ],
};

// Helper function to check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

// Helper function to check if a role has any of the specified permissions
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Helper function to check if a role has all of the specified permissions
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

// Route permission requirements
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  "/": ["view:dashboard:all", "view:dashboard:own"],
  "/businesses": ["view:businesses"],
  "/businesses/:id": ["view:businesses"],
  "/tasks": ["view:tasks:all", "view:tasks:own"],
  "/finance": ["view:finance"],
  "/marketing": ["view:marketing"],
  "/marketing/campaigns": ["view:marketing"],
  "/marketing/social-posts": ["view:marketing"],
  "/contract": ["view:contracts:all", "view:contracts:own"],
  "/document": ["view:documents:all", "view:documents:own"],
  "/memos": ["view:memos:all", "view:memos:own"],
  "/integrations": ["view:integrations"],
  "/workflows": ["view:workflows"],
  "/workflows/:id/edit": ["update:workflows"],
  "/workflows/:id/view": ["view:workflows"],
  "/recruitment": ["view:recruitment"],
  "/applicants": ["view:recruitment"],
  "/crm/customers": ["view:crm:all", "view:crm:own"],
  "/crm/leads": ["view:crm:all", "view:crm:own"],
  "/crm/deals": ["view:crm:all", "view:crm:own"],
  "/employee-portal": ["view:employees:own"],
  "/employee-salaries": ["view:employees:all"],
  "/admin-notifications": ["view:system-settings"],
  "/communications": ["view:communications:all", "view:communications:own"],
  "/ai-console": ["view:ai-console"],
  "/system-settings": ["view:system-settings"],
  "/users": ["view:users"],
};

// Helper function to check if a user can access a route
export function canAccessRoute(role: UserRole, path: string): boolean {
  // Normalize path (remove trailing slash, handle dynamic segments)
  let normalizedPath = path;
  
  // Remove trailing slash
  if (normalizedPath.endsWith("/") && normalizedPath.length > 1) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  
  // Replace UUIDs with :id
  normalizedPath = normalizedPath.replace(/\/[a-f0-9-]{36}(\/|$)/g, "/:id$1");
  
  // Replace numeric IDs with :id
  normalizedPath = normalizedPath.replace(/\/\d+(\/|$)/g, "/:id$1");
  
  // Replace /edit, /view, /new endpoints with route params
  normalizedPath = normalizedPath.replace(/\/([a-zA-Z0-9-]+)\/(edit|view|new)$/, "/:id/$2");
  
  const requiredPermissions = ROUTE_PERMISSIONS[normalizedPath];
  if (!requiredPermissions || requiredPermissions.length === 0) {
    // If no permissions defined, allow access (default open)
    return true;
  }
  
  // User needs at least one of the required permissions
  return hasAnyPermission(role, requiredPermissions);
}
