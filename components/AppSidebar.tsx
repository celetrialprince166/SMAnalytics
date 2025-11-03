'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Receipt,
  FileText,
  User,
  Building2,
  Building,
  Package,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  UserCog,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { CollapsibleMenuItem, CollapsibleSubMenuItem } from "@/components/ui/collapsible-menu";
import { useSupabaseAuth } from "@/lib/contexts/SupabaseAuthContext";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useSupabaseAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sidebar-primary/10">
            <Building2 className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">SNM Accounts</h2>
            <p className="text-xs text-sidebar-foreground/60">Manager v2.1</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <CollapsibleMenuItem
                title="Manage"
                icon={Settings}
                defaultOpen={pathname.startsWith('/manage')}
              >
                <CollapsibleSubMenuItem
                  title="Accounts"
                  href="/manage/accounts"
                  isActive={pathname === '/manage/accounts'}
                  icon={Building}
                />
                <CollapsibleSubMenuItem
                  title="Fixed Assets"
                  href="/manage/fixed-assets"
                  isActive={pathname === '/manage/fixed-assets'}
                  icon={Package}
                />
                <CollapsibleSubMenuItem
                  title="Payroll"
                  href="/manage/payroll"
                  isActive={pathname === '/manage/payroll'}
                  icon={Users}
                />
              </CollapsibleMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Transactions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <CollapsibleMenuItem
                title="Transactions"
                icon={Receipt}
                defaultOpen={pathname.startsWith('/transactions')}
              >
                <CollapsibleSubMenuItem
                  title="Accounts"
                  href="/transactions/accounts"
                  isActive={pathname === '/transactions/accounts'}
                  icon={Calendar}
                />
                <CollapsibleSubMenuItem
                  title="Fixed Assets"
                  href="/transactions/fixed-assets"
                  isActive={pathname === '/transactions/fixed-assets'}
                  icon={Package}
                />
                <CollapsibleSubMenuItem
                  title="Payroll"
                  href="/transactions/payroll"
                  isActive={pathname === '/transactions/payroll'}
                  icon={Users}
                />
              </CollapsibleMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <CollapsibleMenuItem
                title="Reports"
                icon={FileText}
                defaultOpen={pathname.startsWith('/reports')}
              >
                <CollapsibleSubMenuItem
                  title="Accounts Reports"
                  href="/reports/accounts"
                  isActive={pathname === '/reports/accounts'}
                  icon={BarChart3}
                />
                <CollapsibleSubMenuItem
                  title="Fixed Assets Reports"
                  href="/reports/fixed-assets"
                  isActive={pathname === '/reports/fixed-assets'}
                  icon={PieChart}
                />
                <CollapsibleSubMenuItem
                  title="Payroll Reports"
                  href="/reports/payroll"
                  isActive={pathname === '/reports/payroll'}
                  icon={TrendingUp}
                />
              </CollapsibleMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/admin/users'}
                  >
                    <Link href="/admin/users">
                      <UserCog className="h-4 w-4" />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-sidebar-foreground/60">
          <p>Powered by SNM Analytics</p>
          <p>© 2025 The Mathworld Community</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
