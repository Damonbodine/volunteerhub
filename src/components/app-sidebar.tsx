"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import {
  Heart,
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Bell,
  Settings,
  ClipboardCheck,
  UsersRound,
  Search,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const user = useQuery(api.users.getCurrentUser);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const pathname = usePathname();

  const role = user?.role;

  const adminItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Users", href: "/users", icon: Users },
    { title: "Teams", href: "/teams", icon: UsersRound },
    { title: "Review Hours", href: "/review-hours", icon: ClipboardCheck },
    { title: "Impact Report", href: "/admin/impact-report", icon: FileText },
  ];

  const coordinatorItems = [
    { title: "Coordinator Dashboard", href: "/coordinator-dashboard", icon: LayoutDashboard },
    { title: "Teams", href: "/teams", icon: UsersRound },
    { title: "Review Hours", href: "/review-hours", icon: ClipboardCheck },
  ];

  const volunteerItems = [
    { title: "My Shifts", href: "/my-shifts", icon: Calendar },
    { title: "My Hours", href: "/my-hours", icon: Clock },
  ];

  const commonItems = [
    { title: "Opportunities", href: "/opportunities", icon: Search },
    {
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
    },
    { title: "Settings", href: "/settings/profile", icon: Settings },
  ];

  const roleItems =
    role === "Admin"
      ? adminItems
      : role === "Coordinator"
      ? coordinatorItems
      : volunteerItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <span className="text-lg font-bold text-sidebar-foreground">VolunteerHub</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {roleItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {role === "Admin" ? "Admin" : role === "Coordinator" ? "Coordinator" : "My Activity"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {roleItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {"badge" in item && item.badge !== undefined && (
                    <SidebarMenuBadge className="bg-primary text-primary-foreground">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name ?? "Loading..."}
            </span>
            <span className="text-xs text-muted-foreground truncate">{user?.role}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
