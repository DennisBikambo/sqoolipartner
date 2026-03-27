import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import {
  Building2,
  Plus,
  Search,
  Users,
  Calendar,
  Mail,
  Phone,
  Eye,
  UserX,
  UserCheck,
  ArrowLeft,
  X,
  LayoutGrid,
  List,
  CheckCircle2,
} from 'lucide-react';
import CreatePartnerDialog from './CreatePartnerDialog';
import AddUserDialog from './AddUserDialog';
import ViewUserDialog, { type ViewUser } from './ViewUserDialog';
import { ConfirmDialog } from './ConfirmationDialog';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatDate, getInitials, getAvatarColor } from '../../utils/formatters';

const ROLE_COLORS: Record<string, string> = {
  partner_admin:    "bg-primary/10 text-primary border-primary/20",
  accountant:       "bg-secondary/10 text-secondary border-secondary/20",
  campaign_manager: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  viewer:           "bg-muted text-muted-foreground border-border",
  super_agent:      "bg-chart-4/10 text-chart-4 border-chart-4/20",
  master_agent:     "bg-chart-4/10 text-chart-4 border-chart-4/20",
  merchant_admin:   "bg-chart-3/10 text-chart-3 border-chart-3/20",
};

type ViewMode = 'grid' | 'list';

// ── Partner Card (grid mode) ──────────────────────────────────────────────────
function PartnerCard({
  partner,
  onViewDetails,
  onManageUsers,
}: {
  partner: {
    id: Id<'partners'>;
    name: string;
    email: string;
    phone?: string;
    username: string;
    user_count: number;
    campaign_count: number;
    is_first_login: boolean;
    created_at: number;
  };
  onViewDetails: () => void;
  onManageUsers: () => void;
}) {
  const initials = getInitials(partner.name);
  const avatarBg = getAvatarColor(partner.name);
  const isPending = partner.is_first_login;

  return (
    <div
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Top accent strip */}
      <div
        className={`h-1 w-full ${isPending ? 'bg-chart-3' : 'bg-primary'}`}
      />

      <div className="p-5">
        {/* Avatar + status */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-bold text-primary-foreground ${avatarBg}`}
          >
            {initials}
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isPending
                ? 'bg-chart-3/10 text-chart-3'
                : 'bg-secondary/10 text-secondary'
            }`}
          >
            {isPending ? 'Pending' : 'Active'}
          </span>
        </div>

        {/* Name + username */}
        <p className="font-bold text-foreground text-[15px] leading-snug truncate">{partner.name}</p>
        <p className="text-xs text-muted-foreground mb-4">@{partner.username}</p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-muted/40 rounded-xl px-3 py-2 text-center">
            <p className="text-base font-bold text-foreground">{partner.user_count}</p>
            <p className="text-[10px] text-muted-foreground">Users</p>
          </div>
          <div className="bg-muted/40 rounded-xl px-3 py-2 text-center">
            <p className="text-base font-bold text-foreground">{partner.campaign_count}</p>
            <p className="text-[10px] text-muted-foreground">Campaigns</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onManageUsers(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Users className="h-3 w-3" />
            Users
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Eye className="h-3 w-3" />
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Partner Row (list mode) ───────────────────────────────────────────────────
function PartnerRow({
  partner,
  onViewDetails,
  onManageUsers,
}: {
  partner: {
    id: Id<'partners'>;
    name: string;
    email: string;
    phone?: string;
    username: string;
    user_count: number;
    campaign_count: number;
    is_first_login: boolean;
    created_at: number;
  };
  onViewDetails: () => void;
  onManageUsers: () => void;
}) {
  const avatarBg = getAvatarColor(partner.name);
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0 ${avatarBg}`}>
        {getInitials(partner.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{partner.name}</p>
        <p className="text-xs text-muted-foreground">@{partner.username} · {partner.email}</p>
      </div>
      <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
        <span>{partner.user_count} users</span>
        <span>{partner.campaign_count} campaigns</span>
        <span>{formatDate(partner.created_at)}</span>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
        partner.is_first_login ? 'bg-chart-3/10 text-chart-3' : 'bg-secondary/10 text-secondary'
      }`}>
        {partner.is_first_login ? 'Pending' : 'Active'}
      </span>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onManageUsers}
          className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
          title="Manage Users"
        >
          <Users className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onViewDetails}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title="View Details"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── User Row (in user management view) ───────────────────────────────────────
function UserRow({
  user,
  onView,
  onToggle,
}: {
  user: {
    id: Id<'users'>;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    is_account_activated?: boolean;
  };
  onView: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={`${getAvatarColor(user.name)} text-primary-foreground text-xs font-semibold`}>
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <Badge variant="outline" className={`text-[10px] capitalize flex-shrink-0 hidden sm:flex ${ROLE_COLORS[user.role] ?? ''}`}>
        {user.role.replace(/_/g, ' ')}
      </Badge>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onView}
          className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg transition-colors text-muted-foreground ${
            user.is_active
              ? 'hover:bg-destructive/10 hover:text-destructive'
              : 'hover:bg-secondary/10 hover:text-secondary'
          }`}
        >
          {user.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PartnerManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<Id<'partners'> | null>(null);
  const [viewingUsers, setViewingUsers] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [viewUser, setViewUser] = useState<ViewUser | null>(null);
  const [viewUserOpen, setViewUserOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<'users'> | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [userTab, setUserTab] = useState<'active' | 'inactive'>('active');

  const partners = useQuery(api.createPartner.listPartners);
  const selectedPartner = useQuery(
    api.createPartner.getPartnerDetails,
    selectedPartnerId ? { partner_id: selectedPartnerId } : 'skip'
  );
  const updateUser = useMutation(api.user.updateUser);

  const filteredPartners = (partners || []).filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q)
    );
  });

  const handleViewUser = (user: any) => {
    setViewUser(user as ViewUser);
    setViewUserOpen(true);
  };

  const handleToggleActivation = (userId: Id<'users'>, activate: boolean) => {
    setSelectedUserId(userId);
    setIsActivating(activate);
    setConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedUserId) return;
    setConfirmLoading(true);
    try {
      await updateUser({ user_id: selectedUserId, is_account_activated: isActivating });
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setSelectedUserId(null);
    }
  };

  const handleViewPartnerUsers = (partnerId: Id<'partners'>) => {
    setSelectedPartnerId(partnerId);
    setViewingUsers(true);
    setDetailsPanelOpen(false);
    setUserTab('active');
  };

  const handleOpenDetails = (partnerId: Id<'partners'>) => {
    setSelectedPartnerId(partnerId);
    setDetailsPanelOpen(true);
  };

  const activeUsers   = (selectedPartner?.users || []).filter((u) => u.is_active);
  const inactiveUsers = (selectedPartner?.users || []).filter((u) => !u.is_active);
  const displayUsers  = userTab === 'active' ? activeUsers : inactiveUsers;

  // ── USER MANAGEMENT VIEW ─────────────────────────────────────────────────
  if (viewingUsers && selectedPartner) {
    return (
      <div className="min-h-full bg-muted/20">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <button
                onClick={() => { setViewingUsers(false); setSelectedPartnerId(null); }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs mb-2 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Partners
              </button>
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 ${getAvatarColor(selectedPartner.partner.name)}`}>
                  {getInitials(selectedPartner.partner.name)}
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-foreground leading-tight">
                    {selectedPartner.partner.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">@{selectedPartner.partner.username} · User Management</p>
                </div>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowAddUserDialog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add User
            </Button>
          </div>

          {/* Stats strip */}
          <div className="flex gap-5 mt-4">
            {[
              { label: 'Active users',   value: activeUsers.length,   className: 'text-secondary' },
              { label: 'Inactive',       value: inactiveUsers.length, className: 'text-destructive' },
              { label: 'Total',          value: (selectedPartner.users || []).length, className: 'text-foreground' },
            ].map(({ label, value, className }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`text-base font-bold tabular-nums ${className}`}>{value}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs + list */}
        <div className="p-6">
          <div className="bg-card rounded-2xl border border-border overflow-hidden" style={{minHeight: 200}}>
            {/* Underline tabs */}
            <div className="flex gap-6 px-5 border-b border-border">
              {(['active', 'inactive'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setUserTab(tab)}
                  className={[
                    'py-3.5 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors',
                    userTab === tab
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground',
                  ].join(' ')}
                >
                  {tab} ({tab === 'active' ? activeUsers.length : inactiveUsers.length})
                </button>
              ))}
            </div>

            {/* User rows */}
            {displayUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                {userTab === 'active'
                  ? <UserCheck className="h-8 w-8 mb-2 opacity-30" />
                  : <UserX className="h-8 w-8 mb-2 opacity-30" />
                }
                <p className="text-sm">No {userTab} users</p>
              </div>
            ) : (
              displayUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onView={() => handleViewUser(user)}
                  onToggle={() => handleToggleActivation(user.id, !user.is_active)}
                />
              ))
            )}
          </div>
        </div>

        {selectedPartnerId && (
          <AddUserDialog
            open={showAddUserDialog}
            onOpenChange={setShowAddUserDialog}
            partnerIdOverride={selectedPartnerId}
          />
        )}
        <ViewUserDialog open={viewUserOpen} onOpenChange={setViewUserOpen} user={viewUser} />
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={isActivating ? "Activate User" : "Deactivate User"}
          description={isActivating
            ? "This user will regain access to the platform."
            : "This user will lose access to the platform."
          }
          confirmLabel={isActivating ? "Activate" : "Deactivate"}
          onConfirm={handleConfirmToggle}
          loading={confirmLoading}
          variant={isActivating ? "default" : "destructive"}
        />
      </div>
    );
  }

  // ── PARTNER LIST VIEW ────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-muted/20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                <Building2 className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Organization Management
              </span>
            </div>
            <h2 className="text-[22px] font-bold text-foreground tracking-tight">Partners</h2>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="shrink-0">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create Partner
          </Button>
        </div>

        {/* Aggregate stats */}
        <div className="flex gap-5 mt-4">
          {partners === undefined ? (
            <>
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </>
          ) : (
            [
              { label: 'Partners',  value: partners.length },
              { label: 'Users',     value: partners.reduce((s, p) => s + p.user_count, 0) },
              { label: 'Campaigns', value: partners.reduce((s, p) => s + p.campaign_count, 0) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground tabular-nums">{value}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center gap-3 bg-card border-b border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, username…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''}
        </span>
        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          {([
            { mode: 'grid' as ViewMode, icon: LayoutGrid },
            { mode: 'list' as ViewMode, icon: List },
          ]).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-2 transition-colors ${viewMode === mode ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {partners === undefined ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0">
                  <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
                  <Skeleton className="h-4 flex-1 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              ))}
            </div>
          )
        ) : filteredPartners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Building2 className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground">
              {searchQuery ? 'No partners match your search' : 'No partners yet'}
            </p>
            {!searchQuery && (
              <Button size="sm" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create first partner
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPartners.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onViewDetails={() => handleOpenDetails(partner.id)}
                onManageUsers={() => handleViewPartnerUsers(partner.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {filteredPartners.map((partner) => (
              <PartnerRow
                key={partner.id}
                partner={partner}
                onViewDetails={() => handleOpenDetails(partner.id)}
                onManageUsers={() => handleViewPartnerUsers(partner.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT SLIDE-OVER: Partner Details ── */}
      {detailsPanelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setDetailsPanelOpen(false)}
          />
          <div className="relative w-[420px] max-w-full h-full bg-card border-l border-border shadow-2xl overflow-y-auto flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <p className="text-sm font-bold text-foreground">Partner Details</p>
              <button
                onClick={() => setDetailsPanelOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!selectedPartner ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ) : (
              <>
                {/* Org hero */}
                <div className="px-6 py-5 border-b border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 ${getAvatarColor(selectedPartner.partner.name)}`}>
                      {getInitials(selectedPartner.partner.name)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground leading-tight">{selectedPartner.partner.name}</p>
                      <p className="text-xs text-muted-foreground">@{selectedPartner.partner.username}</p>
                    </div>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      selectedPartner.partner.is_first_login ? 'bg-chart-3/10 text-chart-3' : 'bg-secondary/10 text-secondary'
                    }`}>
                      {selectedPartner.partner.is_first_login ? 'Pending' : 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Users',     value: selectedPartner.users.length },
                      { label: 'Campaigns', value: selectedPartner.campaign_count },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-foreground tabular-nums">{value}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div className="px-6 py-5 border-b border-border space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium mb-3">Contact</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground break-all">{selectedPartner.partner.email}</span>
                  </div>
                  {selectedPartner.partner.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{selectedPartner.partner.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Joined {formatDate(selectedPartner.partner._creationTime)}
                    </span>
                  </div>
                </div>

                {/* Users list */}
                <div className="px-6 py-5 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
                      Users ({selectedPartner.users.length})
                    </p>
                    <button
                      onClick={() => {
                        setDetailsPanelOpen(false);
                        handleViewPartnerUsers(selectedPartner.partner._id);
                      }}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Manage →
                    </button>
                  </div>
                  {selectedPartner.users.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No users yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPartner.users.map((user) => (
                        <div key={user.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <Avatar className="h-7 w-7 flex-shrink-0">
                            <AvatarFallback className={`${getAvatarColor(user.name)} text-primary-foreground text-[10px] font-bold`}>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Badge variant="outline" className={`text-[9px] capitalize ${ROLE_COLORS[user.role] ?? ''}`}>
                              {user.role.replace(/_/g, ' ')}
                            </Badge>
                            {user.is_active && (
                              <CheckCircle2 className="h-3 w-3 text-secondary" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <CreatePartnerDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <ViewUserDialog open={viewUserOpen} onOpenChange={setViewUserOpen} user={viewUser} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isActivating ? "Activate User" : "Deactivate User"}
        description={isActivating
          ? "This user will regain access to the platform."
          : "This user will lose access to the platform."}
        confirmLabel={isActivating ? "Activate" : "Deactivate"}
        onConfirm={handleConfirmToggle}
        loading={confirmLoading}
        variant={isActivating ? "default" : "destructive"}
      />
    </div>
  );
}
