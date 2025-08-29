import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SavedContentProvider } from '@/hooks/use-saved-content';
import { AuthProvider } from '@/hooks/use-auth';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SavedContentProvider>
      <AuthProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </AuthProvider>
    </SavedContentProvider>
  );
}
