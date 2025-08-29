
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
import { AuthButton, useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trainingType = searchParams.get('type') || 'Academic';
  const { user, loading, signInWithGoogle, logout } = useAuth();

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
              <Link href={`/reading?type=${trainingType}`}>
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
              <Link href={`/writing?type=${trainingType}`}>
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
       <SidebarFooter>
        <div className="flex items-center justify-between p-2">
          {loading ? (
             <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <div className="flex w-full items-center gap-2">
                <Avatar className="size-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'}/>
                    <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-medium">{user.displayName}</span>
                <Button variant="outline" size="sm" onClick={() => logout()}>Logout</Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => signInWithGoogle()}>
                <LogIn className="mr-2 size-4" />
                Login
            </Button>
          )}
        </div>
        <SidebarTrigger className="md:hidden" />
      </SidebarFooter>
    </Sidebar>
  );
}
