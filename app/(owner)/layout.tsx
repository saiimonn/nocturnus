import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/Sidebar';
import { getOwnerProfile } from '@/lib/api/shared/auth';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AdminHeader from '@/components/Header';

interface LayoutProps {
  children: ReactNode;
}

export default async function MainLayout({ children }: LayoutProps) {
  // `proxy.ts` already gates these routes, so this is a defence-in-depth check
  // for a session that verifies but whose user row is gone (e.g. deleted).
  const profile = await getOwnerProfile();
  if (!profile) {
    redirect('/auth/login');
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        user={{
          name: profile.full_name || profile.email,
          email: profile.email,
          avatar: null,
        }}
      />
      <SidebarInset className="grow overflow-hidden bg-background text-foreground">
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
