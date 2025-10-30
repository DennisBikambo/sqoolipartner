'use client';

import { Bell, ChevronDown } from 'lucide-react';
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
import { useTheme } from '../../hooks/useTheme';
import ThemeButton from '../common/ThemeButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { handleLogout } from '../../utils/handleLogout';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const { user, loading } = useAuth();
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">Loading...</h1>
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <span className="text-sm text-muted-foreground">Not signed in</span>
        </div>
      </header>
    );
  }

  const fullName =
    'first_name' in user && 'last_name' in user
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : user.name;

  const email = 'email' in user ? user.email : '';
  const avatarUrl ='avatar' in user && typeof user.avatar === 'string' ? user.avatar : '';


  const onLogout = async () => {
    try {
      const result = await handleLogout();
      if (result?.success) {
        toast.success('Logged out successfully 👋');
        navigate('/signIn');
      } else {
        toast.error('Logout failed. Please try again.');
      }
    } catch {
      toast.error('An unexpected error occurred during logout.');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-2xl font-bold">
            <span className="text-primary px-1.5 py-0.5 rounded">s</span>
            <span className="text-secondary px-1.5 py-0.5 rounded">q</span>
            <span className="text-chart-3 px-1.5 py-0.5 rounded">o</span>
            <span className="text-chart-3 px-1.5 py-0.5 rounded">o</span>
            <span className="text-secondary px-1.5 py-0.5 rounded">l</span>
            <span className="text-chart-5 px-1.5 py-0.5 rounded">i</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
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
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">{fullName}</span>
                  {email && <span className="text-xs text-muted-foreground">{email}</span>}
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
      </div>
    </header>
  );
}
