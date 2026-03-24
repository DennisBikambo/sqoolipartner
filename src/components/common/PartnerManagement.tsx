/**
 * Partner Management Component
 * For Super Admins to view and manage all partner organizations
 */

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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
} from 'lucide-react';
import CreatePartnerDialog from './CreatePartnerDialog';
import AddUserDialog from './AddUserDialog';
import ViewUserDialog, { type ViewUser } from './ViewUserDialog';
import { ConfirmDialog } from './ConfirmationDialog';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatDate, getInitials, getAvatarColor } from '../../utils/formatters';

const ROLE_COLORS: Record<string, string> = {
  partner_admin: "bg-primary/10 text-primary border-primary/20",
  accountant: "bg-secondary/10 text-secondary border-secondary/20",
  campaign_manager: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  viewer: "bg-muted text-muted-foreground border-border",
  super_agent: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  master_agent: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  merchant_admin: "bg-chart-3/10 text-chart-3 border-chart-3/20",
};

export default function PartnerManagement() {
  const [searchQuery, setSearchQuery] = useState('');
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

  const partners = useQuery(api.createPartner.listPartners);
  const selectedPartner = useQuery(
    api.createPartner.getPartnerDetails,
    selectedPartnerId ? { partner_id: selectedPartnerId } : 'skip'
  );
  const updateUser = useMutation(api.user.updateUser);

  const filteredPartners = (partners || []).filter((partner) => {
    const query = searchQuery.toLowerCase();
    return (
      partner.name.toLowerCase().includes(query) ||
      partner.email.toLowerCase().includes(query) ||
      partner.username.toLowerCase().includes(query)
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
    await updateUser({ user_id: selectedUserId, is_account_activated: isActivating });
    setConfirmOpen(false);
    setSelectedUserId(null);
  };

  const handleViewPartnerUsers = (partnerId: Id<'partners'>) => {
    setSelectedPartnerId(partnerId);
    setViewingUsers(true);
    setDetailsPanelOpen(false);
  };

  const handleOpenDetails = (partnerId: Id<'partners'>) => {
    setSelectedPartnerId(partnerId);
    setDetailsPanelOpen(true);
  };

  const handleBackToPartners = () => {
    setViewingUsers(false);
    setSelectedPartnerId(null);
  };

  // Filter users when viewing a specific partner
  const activeUsers = (selectedPartner?.users || []).filter(u => u.is_active);
  const inactiveUsers = (selectedPartner?.users || []).filter(u => !u.is_active);
  const totalUsers = (selectedPartner?.users || []).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {viewingUsers && selectedPartner ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToPartners}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Partners
              </Button>
              <span className="text-muted-foreground">/</span>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {selectedPartner.partner.name}
                  <span className="text-muted-foreground font-normal"> — Users</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage users for this partner organization
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-foreground">Partner Organizations</h2>
              <p className="text-sm text-muted-foreground">
                Manage all partner organizations and their users
              </p>
            </>
          )}
        </div>
        {viewingUsers ? (
          <Button onClick={() => setShowAddUserDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        ) : (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Partner
          </Button>
        )}
      </div>

      {/* Conditionally render partners list or user management */}
      {viewingUsers && selectedPartner ? (
        /* User Management View */
        <>
          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <UserCheck className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{activeUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <UserX className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive Users</p>
                    <p className="text-2xl font-bold">{inactiveUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Tabs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="active">
                <TabsList>
                  <TabsTrigger value="active">Active ({activeUsers.length})</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive ({inactiveUsers.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-3 mt-4">
                  {activeUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No active users</p>
                    </div>
                  ) : (
                    activeUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors group border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className={`${getAvatarColor(user.name)} text-white`}>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs mt-1 capitalize ${ROLE_COLORS[user.role] ?? ''}`}
                            >
                              {user.role.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUser(user)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActivation(user.id, false)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="inactive" className="space-y-3 mt-4">
                  {inactiveUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserX className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No inactive users</p>
                    </div>
                  ) : (
                    inactiveUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors group border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className={`${getAvatarColor(user.name)} text-white`}>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs mt-1 capitalize ${ROLE_COLORS[user.role] ?? ''}`}
                            >
                              {user.role.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUser(user)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActivation(user.id, true)}
                            className="hover:bg-secondary/10 hover:text-secondary"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Partners List View */
        <div className="relative">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Partners</p>
                    {partners === undefined ? (
                      <Skeleton className="h-8 w-16 mt-1 rounded" />
                    ) : (
                      <p className="text-2xl font-bold">{partners.length}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    {partners === undefined ? (
                      <Skeleton className="h-8 w-16 mt-1 rounded" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {partners.reduce((sum, p) => sum + p.user_count, 0)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Campaigns</p>
                    {partners === undefined ? (
                      <Skeleton className="h-8 w-16 mt-1 rounded" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {partners.reduce((sum, p) => sum + p.campaign_count, 0)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search partners by name, email, or username..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Partners Table */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>All Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Campaigns</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners === undefined ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((__, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full rounded" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredPartners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="text-center py-12">
                            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              {searchQuery ? 'No partners found matching your search' : 'No partners yet'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{partner.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  @{partner.username}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{partner.email}</span>
                              </div>
                              {partner.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{partner.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {partner.username}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{partner.user_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{partner.campaign_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(partner.created_at)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {partner.is_first_login ? (
                              <Badge variant="outline" className="bg-chart-3/10 text-chart-3">
                                Pending
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-secondary/10 text-secondary">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPartnerUsers(partner.id)}
                                title="Manage Users"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Manage Users
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDetails(partner.id)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Right Slide-over Panel for Partner Details */}
          {detailsPanelOpen && (
            <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/20 pointer-events-auto"
                onClick={() => setDetailsPanelOpen(false)}
              />
              {/* Panel */}
              <div className="relative w-[380px] h-full bg-background border-l border-border shadow-xl pointer-events-auto overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
                  <h3 className="text-base font-semibold">Partner Details</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDetailsPanelOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {selectedPartner ? (
                  <div className="p-5 space-y-6">
                    {/* Org info */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{selectedPartner.partner.name}</p>
                          <p className="text-xs text-muted-foreground">@{selectedPartner.partner.username}</p>
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-foreground break-all">{selectedPartner.partner.email}</span>
                        </div>
                        {selectedPartner.partner.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground">{selectedPartner.partner.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">
                            Joined {formatDate(selectedPartner.partner._creationTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/40 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-foreground">{selectedPartner.users.length}</p>
                        <p className="text-xs text-muted-foreground">Users</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-foreground">{selectedPartner.campaign_count}</p>
                        <p className="text-xs text-muted-foreground">Campaigns</p>
                      </div>
                    </div>

                    {/* Users List */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Users ({selectedPartner.users.length})</h4>
                      <div className="space-y-2">
                        {selectedPartner.users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className={`${getAvatarColor(user.name)} text-white text-xs`}>
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-xs capitalize ${ROLE_COLORS[user.role] ?? ''}`}
                              >
                                {user.role.replace(/_/g, ' ')}
                              </Badge>
                              <Badge
                                variant={user.is_active ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreatePartnerDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Add User Dialog - with partner context override */}
      {viewingUsers && selectedPartnerId && (
        <AddUserDialog
          open={showAddUserDialog}
          onOpenChange={setShowAddUserDialog}
          partnerIdOverride={selectedPartnerId}
        />
      )}

      {/* View User Dialog */}
      <ViewUserDialog open={viewUserOpen} onOpenChange={setViewUserOpen} user={viewUser} />

      {/* Confirm Activation / Inactivation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isActivating ? "Activate User" : "Inactivate User"}
        description={isActivating
          ? "Are you sure you want to activate this user? They will regain access."
          : "Are you sure you want to inactivate this user? They will no longer have access."}
        confirmLabel={isActivating ? "Activate" : "Inactivate"}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
