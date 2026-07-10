"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import {
  ChevronRight,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  MartiniIcon,
  Book,
  Clipboard,
  Tag,
} from 'lucide-react';
import React from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SubMenuItem {
  name: string;
  href: string;
}

interface NavigationType {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  submenu?: SubMenuItem[];
}

const dashboardNavigation: NavigationType[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
];

const customizationNavigation: NavigationType[] = [
  {
    name: 'Club',
    href: 'club',
    icon: MartiniIcon,
    submenu: [
      { name: 'Details', href: '/club/details' },
      { name: 'Layout', href: '/club/layout' },
    ],
  },
];

const bookingNavigation: NavigationType[] = [
  {
    name: 'Reservation',
    href: 'booking',
    icon: Book,
    submenu: [
      { name: 'Requests', href: '/reservations/requests' },
      { name: 'History', href: '/reservations/history' },
    ],
  },
];

const eventsNavigation: NavigationType[] = [
  {
    name: 'Events/Promos',
    href: '/events',
    icon: Clipboard,
  }
]

const discountsNavigation: NavigationType[] = [
  {
    name: 'Discount Codes',
    href: '/discounts',
    icon: Tag,
  }
]

const user = {
  name: 'Admin User',
  email: 'admin@nocturnus.com',
  avatar: null,
};

const AdminSidebar = () => {
  const renderNavigationGroup = (
    items: NavigationType[],
    hasSubmenu: boolean = true
  ) => {
    return items.map((item) => {
      const IconComponent = item.icon;
      if (item.submenu && hasSubmenu) {
        return (
          <Collapsible
            key={item.name}
            className="group/collapsible"
            render={(props) => <SidebarMenuItem {...props} />}
          >
            <CollapsibleTrigger
              render={(props) => (
                <SidebarMenuButton {...props} tooltip={item.name}>
                  <IconComponent size={16} />
                  <span>{item.name}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              )}
            />
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.submenu.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.name}>
                      <SidebarMenuSubButton
                        render={(props) => (
                          <a {...props} href={subItem.href} />
                        )}
                      >
                        <span>{subItem.name}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      return (
        <SidebarMenuItem key={item.name}>
          <SidebarMenuButton
            tooltip={item.name}
            render={(props) => <a {...props} href={item.href} />}
          >
            <IconComponent size={16} />
            <span>{item.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center gap-2 py-2">
            {/* Icon stays visible in collapsed state */}
            <div className="flex size-8 items-center justify-center">
              <img src="/BijouLOGO2(PINK).svg" alt="Logo" className="h-5" />
            </div>

            {/* This section hides in collapsed icon mode */}
            <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
              <span className="truncate text-xs font-semibold">Nocturnus</span>
              <span className="text-sidebar-foreground/70 truncate text-xs">
                Club Owner Dashboard
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderNavigationGroup(dashboardNavigation, false)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Club Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderNavigationGroup(customizationNavigation)}
              {renderNavigationGroup(bookingNavigation)}
              {renderNavigationGroup(eventsNavigation)}
              {renderNavigationGroup(discountsNavigation)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/*<SidebarGroup>*/}
        {/*  <SidebarGroupLabel>System</SidebarGroupLabel>*/}
        {/*  <SidebarGroupContent>*/}
        {/*    <SidebarMenu>*/}
        {/*      {renderNavigationGroup(settingsNavigation)}*/}
        {/*    </SidebarMenu>*/}
        {/*  </SidebarGroupContent>*/}
        {/*</SidebarGroup>*/}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <SidebarMenuButton
                    {...props}
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    tooltip={`${user.name} (${user.email})`}
                  >
                    <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-pink-500 via-purple-500 to-indigo-600">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="size-8 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold">{user.name}</span>
                      <span className="text-sidebar-foreground/70 truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                )}
              />
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <User className="size-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="size-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 hover:text-red-700">
                  <LogOut className="size-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
