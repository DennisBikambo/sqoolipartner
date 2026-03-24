import { useState } from 'react';
import { Plus, Lock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermission';
import { PermissionWrapper } from '../components/common/PermissionWrapper';
import AddUserDialog from '../components/common/AddUserDialog';
import { ConfirmDialog } from '../components/common/ConfirmationDialog';
import { DeactivateWithReasonDialog } from '../components/common/DeactivateWithReasonDialog';
import { UserDetailModal } from '../components/common/UserDetailModal';
import PartnerManagement from '../components/common/PartnerManagement';
import { isConvexUser, type ConvexUser } from '../types/auth.types';
import { toast } from 'sonner';
import { getInitials, getAvatarColor } from '../utils/formatters';
import { useConvexQuery } from '../hooks/useConvexQuery';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-destructive">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

export default function UserSection() {
  const { user: currentUser, partner } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  // Activate flow
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<'users'> | null>(null);

  // Deactivate-with-reason flow
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateTargetId, setDeactivateTargetId] = useState<Id<'users'> | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [activateLoading, setActivateLoading] = useState(false);

  // Detail modal
  const [detailUser, setDetailUser] = useState<ConvexUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { canRead, canWrite } = usePermissions();
  const partnerId = partner?._id;
  const canViewUsers = canRead('users');
  const canManageUsers = canWrite('users');

  const rawUsers = useQuery(
    api.user.getUsers,
    partnerId && canViewUsers ? { partner_id: partnerId } : 'skip'
  );
  const { data: users, isLoading: usersLoading } = useConvexQuery(
    `users_${partnerId ?? 'none'}`,
    rawUsers
  );

  const rawAuditLogs = useQuery(
    api.audit.getAuditLogs,
    partnerId && canViewUsers ? { partner_id: partnerId } : 'skip'
  );
  const { data: auditLogs, isLoading: auditLoading } = useConvexQuery(
    `audit_partner_${partnerId ?? 'none'}`,
    rawAuditLogs
  );

  const updateUser = useMutation(api.user.updateUser);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleActivate = (userId: Id<'users'>) => {
    if (!canManageUsers) { toast.error("No permission"); return; }
    setSelectedUserId(userId);
    setConfirmOpen(true);
  };

  const handleConfirmActivate = async () => {
    if (!selectedUserId) return;
    setActivateLoading(true);
    try {
      await updateUser({ user_id: selectedUserId, is_account_activated: true });
      toast.success('User activated');
      setConfirmOpen(false);
      setSelectedUserId(null);
      setDetailOpen(false);
    } finally {
      setActivateLoading(false);
    }
  };

  const handleDeactivate = (userId: Id<'users'>) => {
    if (!canManageUsers) { toast.error("No permission"); return; }
    setDeactivateTargetId(userId);
    setDeactivateOpen(true);
  };

  const handleConfirmDeactivate = async (reason: string) => {
    if (!deactivateTargetId) return;
    setDeactivateLoading(true);
    try {
      await updateUser({ user_id: deactivateTargetId, is_account_activated: false });
      toast.success(reason ? `User deactivated: ${reason}` : 'User deactivated');
      setDeactivateOpen(false);
      setDeactivateTargetId(null);
      setDetailOpen(false);
    } finally {
      setDeactivateLoading(false);
    }
  };

  const openDetail = (user: ConvexUser) => {
    setDetailUser(user);
    setDetailOpen(true);
  };

  // ── Filters ────────────────────────────────────────────────────────────────
  const allUsers = users ?? [];
  const filteredUsers = allUsers.filter(
    u =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeUsers = filteredUsers.filter(u => u.is_account_activated);
  const inactiveUsers = filteredUsers.filter(u => !u.is_account_activated);
  const displayedUsers = activeTab === 'active' ? activeUsers : inactiveUsers;

  const filteredAuditLogs = (auditLogs ?? []).filter(
    log =>
      log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(auditSearchQuery.toLowerCase())
  );

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">User Access Restricted</h3>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>You don't have permission to view users. Contact your administrator to request <span className="font-medium text-foreground">user.read</span> permission.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isConvexUser(currentUser) && currentUser.role === 'super_admin') {
    return <PartnerManagement />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30 p-6 font-sans">
      <div className="max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-bold text-foreground">Users</h1>
          <PermissionWrapper requireWrite="users" fallback="button" fallbackProps={{ buttonText: 'Add User' }}>
            <Button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg text-xs px-4 py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Add User
            </Button>
          </PermissionWrapper>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '220px 1fr' }}>

          {/* ── LEFT: Audit Logs ── */}
          <div className="bg-card rounded-xl border border-border p-3.5 shadow-sm max-h-[600px] overflow-y-auto">
            <h3 className="text-[13px] font-bold text-foreground mb-2.5">Audit Logs</h3>

            {/* Search */}
            <div className="flex items-center border border-border rounded-lg px-2.5 py-1.5 bg-muted/40 mb-3.5 gap-1.5">
              <SearchIcon />
              <input
                placeholder="Search"
                value={auditSearchQuery}
                onChange={e => setAuditSearchQuery(e.target.value)}
                className="flex-1 border-none outline-none text-[11px] bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <FilterIcon />
            </div>

            {/* Entries */}
            <div className="flex flex-col gap-3">
              {auditLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))
              ) : filteredAuditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No audit logs</p>
              ) : (
                filteredAuditLogs.map(log => {
                    const enriched = log as typeof log & { userName?: string; userAvatar?: string | null; userInitials?: string };
                    return (
                      <div key={log._id} className="flex items-start gap-2">
                        <Avatar className="h-7 w-7 shrink-0">
                          {enriched.userAvatar && (
                            <AvatarImage src={enriched.userAvatar} alt={enriched.userName ?? ''} className="object-cover" />
                          )}
                          <AvatarFallback className={`${getAvatarColor(enriched.userName ?? log.action)} text-primary-foreground text-[10px] font-bold`}>
                            {enriched.userInitials ?? getInitials(log.action)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[11px] leading-snug">
                            <span className="text-primary font-semibold">{enriched.userName ?? 'Unknown'}</span>{' '}
                            <span className="text-foreground">{log.action}</span>
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* ── RIGHT: Users table ── */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">

            {/* Search + filter */}
            <div className="flex items-center border border-border rounded-lg px-3 py-2 bg-muted/30 mb-3.5 gap-2">
              <SearchIcon />
              <input
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 border-none outline-none text-xs bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <FilterIcon />
            </div>

            {/* Tabs */}
            <div className="flex gap-5 border-b border-border mb-3">
              {(['active', 'inactive'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={[
                    'pb-2 text-xs font-semibold capitalize border-b-2 -mb-px transition-colors',
                    activeTab === t
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground',
                  ].join(' ')}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* User rows */}
            <div className="flex flex-col">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[52px] w-full rounded-lg mb-1" />
                ))
              ) : displayedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No {activeTab} users
                </p>
              ) : (
                displayedUsers.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 px-1 py-2.5 border-b border-border/40 last:border-0"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      {user.avatar_url && (
                        <AvatarImage src={user.avatar_url} alt={user.name} className="object-cover" />
                      )}
                      <AvatarFallback className={`${getAvatarColor(user.name)} text-primary-foreground text-xs font-semibold`}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {/* View detail */}
                      <button
                        onClick={() => openDetail(user as ConvexUser)}
                        className="p-1 rounded hover:bg-primary/10 transition-colors"
                        title="View user"
                      >
                        <EyeIcon />
                      </button>
                      {/* Deactivate (active) / nothing (inactive — use detail modal) */}
                      {activeTab === 'active' && canManageUsers && (
                        <button
                          onClick={() => handleDeactivate(user._id)}
                          className="p-1 rounded hover:bg-destructive/10 transition-colors"
                          title="Deactivate user"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination — only visible when there are multiple pages */}
            {displayedUsers.length > 0 && (
              <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  {displayedUsers.length} {activeTab} user{displayedUsers.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {canManageUsers && (
        <AddUserDialog open={showAddModal} onOpenChange={setShowAddModal} />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Activate User"
        description="Are you sure you want to activate this user? They will regain access."
        confirmLabel="Activate"
        onConfirm={handleConfirmActivate}
        loading={activateLoading}
      />

      <DeactivateWithReasonDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate User"
        description="Are you sure you want to deactivate this user? They will lose access."
        onConfirm={handleConfirmDeactivate}
        loading={deactivateLoading}
      />

      {detailOpen && detailUser && (
        <UserDetailModal
          user={detailUser}
          onClose={() => { setDetailOpen(false); setDetailUser(null); }}
          onActivate={() => handleActivate(detailUser._id)}
          onDeactivate={() => handleDeactivate(detailUser._id)}
          canManage={canManageUsers}
        />
      )}
    </div>
  );
}
