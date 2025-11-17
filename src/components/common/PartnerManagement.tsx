/**
 * Partner Management Component
 * For Super Admins to view and manage all partner organizations
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
} from 'lucide-react';
import CreatePartnerDialog from './CreatePartnerDialog';
import AddUserDialog from './AddUserDialog';
import ViewUserDialog, { type ViewUser } from './ViewUserDialog';
import { ConfirmDialog } from './ConfirmationDialog';
import type { Id } from '../../../convex/_generated/dataModel';

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

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
  };

  const handleBackToPartners = () => {
    setViewingUsers(false);
    setSelectedPartnerId(null);
  };

  // Filter users when viewing a specific partner
  const activeUsers = (selectedPartner?.users || []).filter(u => u.is_active);
  const inactiveUsers = (selectedPartner?.users || []).filter(u => !u.is_active);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {viewingUsers && selectedPartner ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToPartners}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {selectedPartner.partner.name} - Users
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <UserCheck className="h-6 w-6 text-green-500" />
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
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <UserX className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive Users</p>
                    <p className="text-2xl font-bold">{inactiveUsers.length}</p>
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
                    <p className="text-sm text-muted-foreground text-center py-8">No active users</p>
                  ) : (
                    activeUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors group"
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
                            <Badge variant="outline" className="text-xs mt-1 capitalize">
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
                    <p className="text-sm text-muted-foreground text-center py-8">No inactive users</p>
                  ) : (
                    inactiveUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors group"
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
                            <Badge variant="outline" className="text-xs mt-1 capitalize">
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
        <>
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
                    <p className="text-2xl font-bold">{partners?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">
                      {partners?.reduce((sum, p) => sum + p.user_count, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Campaigns</p>
                    <p className="text-2xl font-bold">
                      {partners?.reduce((sum, p) => sum + p.campaign_count, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search partners by name, email, or username..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Partners Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Partners</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPartners.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No partners found matching your search' : 'No partners yet'}
                  </p>
                </div>
              ) : (
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
                      {filteredPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{partner.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {partner.id}</p>
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
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                                Pending
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700">
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
                                onClick={() => setSelectedPartnerId(partner.id)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Partner Details Sidebar */}
          {selectedPartner && !viewingUsers && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Partner Details: {selectedPartner.partner.name}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPartnerId(null)}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Partner Info */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Organization Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedPartner.partner.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedPartner.partner.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Username</p>
                        <p className="font-medium">{selectedPartner.partner.username}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Campaigns</p>
                        <p className="font-medium">{selectedPartner.campaign_count}</p>
                      </div>
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
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
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
              </CardContent>
            </Card>
          )}
        </>
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
