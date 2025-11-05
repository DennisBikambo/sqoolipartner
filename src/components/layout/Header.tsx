'use client';

import { Bell, ChevronDown, Menu } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import ThemeButton from '../common/ThemeButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { handleLogout } from '../../utils/handleLogout';
import { useState } from 'react';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const { user, loading, partner } = useAuth();
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const onLogout = async () => {
    try {
      const result = await handleLogout();
      if (result?.success) {
        toast.success('Logged out successfully 👋');
        navigate('/signIn');
        setMobileMenuOpen(false);
      } else {
        toast.error('Logout failed. Please try again.');
      }
    } catch {
      toast.error('An unexpected error occurred during logout.');
    }
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
          <span className="text-xs sm:text-sm text-muted-foreground">Not signed in</span>
        </div>
      </header>
    );
  }

  const fullName =
    'first_name' in user && 'last_name' in user
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : partner?.name;

  const email = 'email' in user ? user.email : '';
  const avatarUrl = 'avatar' in user && typeof user.avatar === 'string' ? user.avatar : '';

  return (
    <header className="sticky top-0 z-0 w-full bg-background border-b border-border shrink-0">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-xl sm:text-2xl font-bold">
            <span className="text-primary px-1 sm:px-1.5 py-0.5 rounded">s</span>
            <span className="text-secondary px-1 sm:px-1.5 py-0.5 rounded">q</span>
            <span className="text-chart-3 px-1 sm:px-1.5 py-0.5 rounded">o</span>
            <span className="text-chart-3 px-1 sm:px-1.5 py-0.5 rounded">o</span>
            <span className="text-secondary px-1 sm:px-1.5 py-0.5 rounded">l</span>
            <span className="text-chart-5 px-1 sm:px-1.5 py-0.5 rounded">i</span>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>

          <ThemeButton theme={theme} setTheme={setTheme} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 hover:bg-transparent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary border border-border text-xs text-primary-foreground">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start max-w-[150px]">
                  <span className="text-sm font-medium text-foreground truncate w-full">
                    {fullName}
                  </span>
                  {email && (
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {email}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6 mt-6">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary border border-border text-sm text-primary-foreground">
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {fullName}
                    </p>
                    {email && (
                      <p className="text-xs text-muted-foreground truncate">{email}</p>
                    )}
                  </div>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Theme</span>
                  <ThemeButton theme={theme} setTheme={setTheme} />
                </div>

                {/* Menu Items */}
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Settings
                  </Button>
                </div>

                {/* Logout Button */}
                <Button
                  variant="destructive"
                  className="w-full mt-4"
                  onClick={onLogout}
                >
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}