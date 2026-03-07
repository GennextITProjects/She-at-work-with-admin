/*eslint-disable @typescript-eslint/no-unused-vars */
// src/components/dashboard/layout/DashboardSidebar.tsx
"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronRight,
  FileCheck,
  Home,
  Settings,
  Shield,
  TrendingUp,
  Users,
  FolderTree,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  group?: "common" | "user" | "admin" | "superadmin";
}

interface DashboardSidebarProps {
  role: string;
}

export default function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    // Common items (visible to all roles)
    {
      href: "/dashboard",
      label: "Overview",
      icon: <Home className="h-5 w-5" />,
      roles: ["USER", "ADMIN", "SUPER_ADMIN"],
      group: "common"
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["USER", "ADMIN", "SUPER_ADMIN"],
      group: "common"
    },

    // Admin specific (ADMIN and SUPER_ADMIN can access)
    {
      href: "/dashboard/admin/categories",
      label: "Categories",
      icon: <FolderTree className="h-5 w-5" />,
      roles: ["ADMIN", "SUPER_ADMIN"],
      group: "admin"
    },
    {
      href: "/dashboard/admin/content",
      label: "Content Moderation",
      icon: <FileCheck className="h-5 w-5" />,
      roles: ["ADMIN", "SUPER_ADMIN"],
      group: "admin"
    },
    {
      href: "/dashboard/admin/story-submissions",
      label: "Story Submissions",
      icon: <TrendingUp className="h-5 w-5" />,
      roles: ["ADMIN", "SUPER_ADMIN"],
      group: "admin"
    },
    {
      href: "/dashboard/admin/contact-submissions",
      label: "Contact Submissions",
      icon: <Mail className="h-5 w-5" />,
      roles: ["ADMIN", "SUPER_ADMIN"],
      group: "admin"
    },

    // Super Admin specific (ONLY for SUPER_ADMIN)
    {
      href: "/dashboard/superadmin/users",
      label: "User Management",
      icon: <Users className="h-5 w-5" />,
      roles: ["SUPER_ADMIN"],
      group: "superadmin"
    },
    {
      href: "/dashboard/superadmin/admins",
      label: "Admin Management",
      icon: <Shield className="h-5 w-5" />,
      roles: ["SUPER_ADMIN"],
      group: "superadmin"
    },
    {
      href: "/dashboard/superadmin/analytics",
      label: "System Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      roles: ["SUPER_ADMIN"],
      group: "superadmin"
    },
    {
      href: "/dashboard/superadmin/system",
      label: "System Settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["SUPER_ADMIN"],
      group: "superadmin"
    },
  ];

  // Filter nav items based on role
  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(role)
  );

  // Group items by category for better organization
  const groupedItems = {
    common: filteredNavItems.filter(item => item.group === 'common'),
    admin: filteredNavItems.filter(item => item.group === 'admin'),
    superadmin: filteredNavItems.filter(item => item.group === 'superadmin'),
  };

  // Only show groups that have items for the current role
  const visibleGroups = Object.entries(groupedItems).filter(([_, items]) => items.length > 0);

  // Determine user role display name
  const getRoleDisplayName = () => {
    switch(role) {
      case 'SUPER_ADMIN':
        return 'Super Admin Panel';
      case 'ADMIN':
        return 'Administration';
      default:
        return 'User Panel';
    }
  };

  // Determine role description
  const getRoleDescription = () => {
    switch(role) {
      case 'SUPER_ADMIN':
        return 'Manage system users, admins, and platform configuration';
      case 'ADMIN':
        return 'Moderate content, manage categories, and review submissions';
      default:
        return 'Access your dashboard and settings';
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)]">
      <nav className="p-4">
        {visibleGroups.map(([groupName, items]) => (
          <div key={groupName} className="mb-6">
            {groupName !== 'common' && items.length > 0 && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                {groupName === 'superadmin' ? 'Super Admin' : 
                 groupName === 'admin' ? 'Administration' : 
                 groupName.charAt(0).toUpperCase() + groupName.slice(1)}
              </h3>
            )}
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-l-4 border-primary"
                        : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground hover:border-l-4 hover:border-secondary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "transition-colors",
                        isActive ? "text-primary" : "group-hover:text-foreground"
                      )}>
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      isActive ? "text-primary translate-x-1" : "opacity-0 group-hover:opacity-100"
                    )} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Show message if no nav items */}
        {visibleGroups.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No navigation items available</p>
          </div>
        )}
      </nav>

      {/* Role-specific info panel */}
      <div className="mt-8 mx-4 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {getRoleDisplayName()}
        </h3>
        <p className="text-xs text-muted-foreground">
          {getRoleDescription()}
        </p>
      </div>
    </aside>
  );
}