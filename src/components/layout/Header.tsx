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
import { getDisplayName, getUserEmail, getUserInitials, isConvexUser, isLaravelUser } from '../../types/auth.types';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const { user, loading, partner, loginMethod } = useAuth();
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      if (loginMethod === 'convex') {
        // Clear Convex session cookie
        document.cookie = 'convex_session=; path=/; max-age=0';
        toast.success('Logged out successfully 👋');
        navigate('/signIn');
        return;
      }

      // Laravel logout
      const result = await handleLogout();
      if (result?.success) {
        toast.success('Logged out successfully 👋');
        navigate('/signIn');
      } else {
        toast.error('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An unexpected error occurred during logout.');
    }
  };

  if (loading) {
    return (
      <header className="w-full bg-background border-b border-border shrink-0">
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="w-full bg-background border-b border-border shrink-0">
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
          <span className="text-xs sm:text-sm text-muted-foreground">Not signed in</span>
        </div>
      </header>
    );
  }

  // Use type-safe helper functions
  const fullName = getDisplayName(user);
  const email = getUserEmail(user);
  const initials = getUserInitials(user);

  // Get avatar (only Laravel users have this field)
  const avatarUrl = isLaravelUser(user) && 'avatar' in user && typeof user.avatar === 'string' 
    ? user.avatar 
    : '';

  // Get additional info for Convex users
  const userRole = isConvexUser(user) ? user.role : null;
  const userExtension = isConvexUser(user) ? user.extension : null;

  return (
    <header className="w-full bg-background border-b border-border shrink-0">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 gap-2">
        {/* Logo / Title Section */}
        <div className="flex items-center gap-2">
          {/* <h1 className="text-lg sm:text-xl font-semibold text-foreground hidden sm:block">
            {title}
          </h1> */}
        </div>

        {/* Desktop Actions */}
        <div className="flex items-center gap-3 lg:gap-4">
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
                    {initials}
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
                  {/* Show role for Convex users */}
                  {userRole && (
                    <span className="text-xs text-muted-foreground truncate w-full capitalize">
                      {userRole.replace(/_/g, ' ')}
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
              
              {/* Show partner organization info */}
              {partner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Organization: {partner.name}
                  </DropdownMenuLabel>
                </>
              )}
              
              {/* Show extension for Convex users */}
              {userExtension && (
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Extension: {userExtension}
                </DropdownMenuLabel>
              )}
              
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