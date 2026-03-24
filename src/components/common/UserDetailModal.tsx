import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { X, Pencil, UserX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { getInitials, getAvatarColor, formatDate } from '../../utils/formatters';
import type { ConvexUser } from '../../types/auth.types';
import ViewUserDialog, { type ViewUser } from './ViewUserDialog';

interface UserDetailModalProps {
  user: ConvexUser;
  onClose: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  canManage: boolean;
}

const SearchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground shrink-0">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground shrink-0">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
);
const ChevronRight = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export function UserDetailModal({ user, onClose, onActivate, onDeactivate, canManage }: UserDetailModalProps) {
  const [auditSearch, setAuditSearch] = useState('');
  const [credentialsOpen, setCredentialsOpen] = useState(false);

  const rawLogs = useQuery(api.audit.getAuditLogs, { user_id: user._id });
  const { data: logs, isLoading: logsLoading } = useConvexQuery(
    `audit_user_${user._id}`,
    rawLogs
  );

  const filteredLogs = (logs ?? []).filter(
    log =>
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const isActive = user.is_account_activated;

  const infoRows = [
    { label: 'Date Added:', value: formatDate(user._creationTime) },
    { label: 'Role:', value: user.role.replace(/_/g, ' ') },
    { label: 'Email:', value: user.email },
    { label: 'Phone:', value: user.phone ? (user.phone.startsWith('+') ? user.phone : `+254 ${user.phone}`) : '—' },
  ];

  const viewUserData: ViewUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role as ViewUser['role'],
    phone: user.phone,
    is_account_activated: user.is_account_activated,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed top-14 sm:top-16 lg:left-[110px] left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/25"
        onClick={onClose}
      >
        <div
          className="rounded-2xl w-[calc(100%-24px)] h-[calc(100%-24px)] flex flex-col overflow-hidden shadow-2xl"
          style={{ background: 'var(--muted)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Breadcrumb */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card rounded-t-2xl">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Users</span>
              <ChevronRight />
              <span className="text-[11px] text-primary font-medium">{user.name}</span>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* ── LEFT PANEL ── */}
            <div className="w-[280px] shrink-0 p-5 border-r border-border bg-card/50 overflow-y-auto">

              {/* Gradient banner + avatar */}
              <div
                className="h-[70px] rounded-[10px] relative mb-8"
                style={{ background: 'linear-gradient(135deg,#c4b5fd 0%,#a5b4fc 100%)' }}
              >
                <div className="absolute -bottom-[22px] left-3.5">
                  <Avatar className="h-11 w-11 border-[2.5px] border-card">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} className="object-cover" />}
                    <AvatarFallback className={`${getAvatarColor(user.name)} text-primary-foreground text-sm font-bold`}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Name */}
              <p className="text-sm font-bold text-foreground mb-3">{user.name}</p>

              {/* Info rows */}
              <div className="space-y-2 mb-3">
                {infoRows.map(row => (
                  <div key={row.label} className="flex justify-between items-start gap-2">
                    <span className="text-[11px] text-muted-foreground shrink-0">{row.label}</span>
                    <span className="text-[11px] text-foreground font-medium text-right capitalize break-all leading-snug">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status badge */}
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-[11px] text-muted-foreground">Status:</span>
                <span className={[
                  'text-[10px] font-semibold px-2.5 py-0.5 rounded-full',
                  isActive ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive',
                ].join(' ')}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Action buttons */}
              {canManage && (
                isActive ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCredentialsOpen(true)}
                      className="border border-border rounded-lg p-1.5 hover:bg-muted transition-colors"
                      title="View credentials"
                    >
                      <Pencil className="h-3.5 w-3.5 text-primary" />
                    </button>
                    <button
                      onClick={onDeactivate}
                      className="border border-destructive/20 rounded-lg p-1.5 hover:bg-destructive/10 transition-colors"
                      title="Deactivate user"
                    >
                      <UserX className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onActivate}
                    className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Activate
                  </button>
                )
              )}
            </div>

            {/* ── RIGHT PANEL — Audit Logs ── */}
            <div className="flex-1 p-5 overflow-y-auto">
              <h3 className="text-sm font-bold text-foreground mb-3">Audit Logs</h3>

              <div className="flex items-center border border-border rounded-lg px-3 py-2 bg-card gap-2 mb-3.5">
                <SearchIcon />
                <input
                  placeholder="Search"
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="flex-1 border-none outline-none text-xs text-foreground bg-transparent placeholder:text-muted-foreground"
                />
                <FilterIcon />
              </div>

              <div className="flex flex-col gap-3">
                {logsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))
                ) : filteredLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No audit logs for this user</p>
                ) : (
                  filteredLogs.map(log => {
                    const enriched = log as typeof log & { userName?: string; userAvatar?: string | null; userInitials?: string };
                    return (
                      <div key={log._id} className="flex items-start gap-2.5">
                        <Avatar className="h-[30px] w-[30px] shrink-0">
                          {enriched.userAvatar && (
                            <AvatarImage src={enriched.userAvatar} alt={enriched.userName ?? ''} className="object-cover" />
                          )}
                          <AvatarFallback className={`${getAvatarColor(enriched.userName ?? log.action)} text-primary-foreground text-[10px] font-bold`}>
                            {enriched.userInitials ?? getInitials(log.action)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs leading-snug">
                            <span className="text-primary font-semibold">{enriched.userName ?? 'Unknown'}</span>
                            {' '}
                            <span className="text-foreground">{log.action}</span>
                            {log.details && (
                              <span className="text-muted-foreground"> — {log.details}</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ViewUserDialog open={credentialsOpen} onOpenChange={setCredentialsOpen} user={viewUserData} />
    </>
  );
}
