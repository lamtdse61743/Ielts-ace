
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
import { Bookmark, Notebook, PenSquare, Home, Headphones, Mic } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-8 text-primary" />
          <h1 className="font-headline text-lg font-semibold">IELTS Ace</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/'}
              tooltip="Home"
            >
              <Link href="/">
                <Home />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/reading')}
              tooltip="Reading"
            >
              <Link href="/reading">
                <Notebook />
                <span>Reading</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/listening')}
              tooltip="Listening"
              disabled
            >
              <Link href="/listening">
                <Headphones />
                <span>Listening</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/writing')}
              tooltip="Writing"
            >
              <Link href="/writing">
                <PenSquare />
                <span>Writing</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/speaking')}
              tooltip="Speaking"
              disabled
            >
              <Link href="/speaking">
                <Mic />
                <span>Speaking</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/saved'}
              tooltip="Saved Content"
            >
              <Link href="/saved">
                <Bookmark />
                <span>Saved Content</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="md:hidden">
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
}
