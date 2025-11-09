import { Lock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

/**
 * Locked Button Fallback
 * Use this in place of buttons when user doesn't have permission
 */
interface LockedButtonProps {
  text?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showTooltip?: boolean;
}

export function LockedButton({ 
  text = 'Locked', 
  variant = 'default',
  size = 'default',
  className,
  showTooltip = true,
}: LockedButtonProps) {
  return (
    <Button 
      variant={variant} 
      size={size}
      disabled 
      className={cn(
        'relative cursor-not-allowed opacity-60',
        className
      )}
      title={showTooltip ? 'You don\'t have permission for this action' : undefined}
    >
      <Lock className="h-4 w-4 mr-2" />
      {text}
    </Button>
  );
}

/**
 * Locked Tab Fallback
 * Use this in place of tab content when user doesn't have permission
 */
interface LockedTabProps {
  title?: string;
  description?: string;
  permissionNeeded?: string;
  className?: string;
}

export function LockedTab({ 
  title = 'Access Restricted',
  description = 'You don\'t have permission to view this content',
  permissionNeeded,
  className,
}: LockedTabProps) {
  return (
    <div className={cn('flex items-center justify-center min-h-[400px] p-6', className)}>
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {permissionNeeded && (
          <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground text-left">
              <p>Required permission:</p>
              <code className="font-mono bg-background px-2 py-0.5 rounded text-foreground">
                {permissionNeeded}
              </code>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-2">
          Contact your administrator for access
        </p>
      </div>
    </div>
  );
}

/**
 * Inline Locked Message
 * Use this for smaller inline messages
 */
interface LockedMessageProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LockedMessage({ 
  message = 'Access restricted',
  size = 'md',
  className,
}: LockedMessageProps) {
  const sizeClasses = {
    sm: 'p-2 text-xs',
    md: 'p-3 text-sm',
    lg: 'p-4 text-base',
  };

  return (
    <div className={cn(
      'flex items-center gap-2 bg-muted/50 rounded-lg text-muted-foreground',
      sizeClasses[size],
      className
    )}>
      <Lock className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}