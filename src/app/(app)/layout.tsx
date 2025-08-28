import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SavedContentProvider } from '@/hooks/use-saved-content';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SavedContentProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </SavedContentProvider>
  );
}
