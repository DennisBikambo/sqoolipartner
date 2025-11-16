import { ChevronDown } from 'lucide-react';
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
import { NotificationDropdown } from '../common/NotificationDropDown';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { handleLogout } from '../../utils/handleLogout';
import { getDisplayName, getUserEmail, getUserInitials, isConvexUser, isLaravelUser } from '../../types/auth.types';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const { user, loading, partner, loginMethod } = useAuth();
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const deleteSession = useMutation(api.session.deleteSession);

  const onLogout = async () => {
    try {
      if (loginMethod === "convex") {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("convex_session="))
          ?.split("=")[1];

        if (token) {
          try {
            await deleteSession({ token });
            console.log("✅ Convex session deleted from DB");
          } catch (err) {
            console.error("❌ Failed to delete session from DB:", err);
          }
        }

        document.cookie = "convex_session=; path=/; max-age=0";

        toast.success("Logged out successfully 👋");
        navigate("/signIn");
        return;
      }

      const result = await handleLogout();
      if (result?.success) {
        toast.success("Logged out successfully 👋");
        navigate("/signIn");
      } else {
        toast.error("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An unexpected error occurred during logout.");
    }
  };

  if (loading) {
    return (
      <header className="w-full bg-background border-b border-border shrink-0">
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </div>
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

  const fullName = getDisplayName(user);
  const email = getUserEmail(user);
  const initials = getUserInitials(user);

  const avatarUrl = isLaravelUser(user) && 'avatar' in user && typeof user.avatar === 'string' 
    ? user.avatar 
    : '';

  const userRole = isConvexUser(user) ? user.role : null;
  const userExtension = isConvexUser(user) ? user.extension : null;

  return (
    <header className="w-full bg-background border-b border-border shrink-0">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 gap-2">
        <div className="flex items-center gap-2">
          {/* Logo / Title can go here */}
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* Notification Dropdown - Only show if partner exists */}
          {partner && <NotificationDropdown partnerId={partner._id} />}

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
              
              {partner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Organization: {partner.name}
                  </DropdownMenuLabel>
                </>
              )}
              
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