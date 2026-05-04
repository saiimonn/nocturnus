import type { ReactNode } from 'react';
import AdminSidebar from '@/components/Sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AdminHeader from '@/components/Header';

interface LayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="grow overflow-hidden">
        <div className="flex min-h-screen w-full">
          <div className="w-full flex-1">
            <AdminHeader trigger={<SidebarTrigger />} />
            <div className="w-full px-5 py-8 md:px-6">
              <div className="flex min-h-screen w-full flex-col gap-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
