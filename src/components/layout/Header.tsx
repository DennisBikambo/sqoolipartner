'use client';

import { 
  Bell, 
  ChevronDown 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '../../hooks/useAuth';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ 
  title = 'Dashboard'
}: HeaderProps) {
  const { user, loading } = useAuth();

  // Helper function to get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const { setTheme, theme } = useTheme();

  // If loading auth, show placeholder
  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Loading...</h1>
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-semibold">{title}</h1>
          <span className="text-sm text-muted-foreground">Not signed in</span>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full ">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Left Section - Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-2xl font-bold">
            <span className="text-blue-500  px-1.5 py-0.5 rounded">s</span>
            <span className="text-teal-400  px-1.5 py-0.5 rounded">q</span>
            <span className="text-yellow-400  px-1.5 py-0.5 rounded">o</span>
            <span className="text-orange-400  px-1.5 py-0.5 rounded">o</span>
            <span className="text-green-400  px-1.5 py-0.5 rounded">l</span>
            <span className="text-pink-400  px-1.5 py-0.5 rounded">i</span>
          </div>
        </div>

        {/* Right Section - Notifications & User Menu */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="round-full" onClick={()=>setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="h-5 w-5 text-gray-600" /> : <Sun className="h-5 w-5 text-gray-600" />}
          </Button>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 hover:bg-transparent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-br  border border- text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}