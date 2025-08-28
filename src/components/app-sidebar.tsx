
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { Bookmark, Notebook, PenSquare } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="size-8 text-primary" />
          <h1 className="font-headline text-lg font-semibold">IELTS Ace</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip="Practice Questions"
              >
                <a>
                  <Notebook />
                  <span>Practice Questions</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/essay-feedback" legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/essay-feedback'}
                tooltip="Essay Feedback"
              >
                <a>
                  <PenSquare />
                  <span>Essay Feedback</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/saved" legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/saved'}
                tooltip="Saved Content"
              >
                <a>
                  <Bookmark />
                  <span>Saved Content</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="md:hidden">
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
}
