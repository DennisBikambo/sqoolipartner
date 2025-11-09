'use client';

import { useState, useEffect } from 'react';
import { Eye, Plus, Search, Filter, UserX, UserCheck, Lock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Loading } from '../components/common/Loading';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermission';
import { PermissionWrapper } from '../components/common/PermissionWrapper';
import AddUserDialog from '../components/common/AddUserDialog';
import { ConfirmDialog } from '../components/common/ConfirmationDialog';
import ViewUserDialog, { type ViewUser } from '../components/common/ViewUserDialog';

export default function UserSection() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Id<'users'> | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [viewUser, setViewUser] = useState<ViewUser | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const { partner } = useAuth();
  const { canRead, canWrite, permissions } = usePermissions();
  const partnerId = partner?._id;

  // Permission checks
  const canViewUsers = canRead('users');
  const canManageUsers = canWrite('users');

  // Debug logs
  useEffect(() => {
    console.log('User Section Permissions:', {
      permissions,
      canViewUsers,
      canManageUsers,
      partnerId,
    });
  }, [permissions, canViewUsers, canManageUsers, partnerId]);

  // ✅ Only fetch if partnerId exists AND user has permission
  const users = useQuery(
    api.user.getUsers,
    partnerId && canViewUsers ? { partner_id: partnerId } : 'skip'
  );

  const auditLogs = useQuery(
    api.audit.getAuditLogs,
    partnerId && canViewUsers ? { partner_id: partnerId } : 'skip'
  );

  const updateUser = useMutation(api.user.updateUser);

  const handleViewUser = (user: ViewUser) => {
    setViewUser(user);
    setViewOpen(true);
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleToggleActivation = (userId: Id<'users'>, activate: boolean) => {
    if (!canManageUsers) {
      alert('You don\'t have permission to activate/deactivate users');
      return;
    }
    setSelectedUser(userId);
    setIsActivating(activate);
    setConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedUser || !canManageUsers) return;
    await updateUser({ user_id: selectedUser, is_account_activated: isActivating });
    setConfirmOpen(false);
    setSelectedUser(null);
  };

  // ✅ Filter users safely
  const filteredUsers = (users || []).filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeUsers = filteredUsers.filter(u => u.is_account_activated);
  const inactiveUsers = filteredUsers.filter(u => !u.is_account_activated);

  // No permission to view
  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">User Access Restricted</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>You don't have permission to view users.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to request <span className="font-medium text-foreground">user.read</span> permission.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (!partnerId || users === undefined) {
    return <Loading message="Loading users..." size="md" />;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Audit Logs */}
          <div className="lg:col-span-3">
            <Card className="sticky top-24 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Audit Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={auditSearchQuery}
                    onChange={e => setAuditSearchQuery(e.target.value)}
                    className="pl-9 pr-8"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {(auditLogs || []).map(log => (
                      <div
                        key={log._id}
                        className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${getAvatarColor(log.action)} text-white text-xs`}>
                            {getInitials(log.action)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{log.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.entity_type}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(auditLogs || []).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No audit logs</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Users Table */}
          <div className="lg:col-span-9">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage your team members and their permissions</CardDescription>
                    {!canManageUsers && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Lock className="h-3 w-3 inline mr-1" />
                        View-only mode
                      </p>
                    )}
                  </div>
                  <PermissionWrapper
                    requireWrite="users"
                    fallback="button"
                    fallbackProps={{ buttonText: 'Add User' }}
                  >
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </PermissionWrapper>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8"
                  />
                </div>

                <Tabs defaultValue="active" className="w-full">
                  <TabsList>
                    <TabsTrigger value="active">Active ({activeUsers.length})</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive ({inactiveUsers.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="space-y-3 mt-4">
                    {activeUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No active users</p>
                    ) : (
                      activeUsers.map(user => (
                        <div
                          key={user._id}
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
                              <p className="text-xs text-muted-foreground capitalize">
                                {user.role.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleViewUser(user as ViewUser)} className='hover:bg-primary/10 hover:text-primary'>
                              <Eye className="h-4 w-4 text-primary group-hover:text-primary" />
                            </Button>
                            {canManageUsers ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActivation(user._id, false)}
                                className="hover:bg-destructive/10 hover:text-destructive"
                              >
                                <UserX className="h-4 w-4 text-destructive group-hover:text-destructive" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" disabled title="No permission">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="inactive" className="space-y-3 mt-4">
                    {inactiveUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No inactive users</p>
                    ) : (
                      inactiveUsers.map(user => (
                        <div
                          key={user._id}
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
                              <p className="text-xs text-muted-foreground capitalize">
                                {user.role.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleViewUser(user as ViewUser)} className='hover:bg-primary/10 hover:text-primary'>
                              <Eye className="h-4 w-4 text-primary group-hover:text-primary" />
                            </Button>
                            {canManageUsers ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActivation(user._id, true)}
                                className='hover:bg-secondary/10 hover:text-secondary'
                              >
                                <UserCheck className="h-4 w-4 text-secondary group-hover:text-secondary" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" disabled title="No permission">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>

                <Separator />
                <p className="text-sm text-muted-foreground text-center py-2">
                  {filteredUsers.length} total users for this partner
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add User Dialog - Only if user has permission */}
      {canManageUsers && (
        <AddUserDialog open={showAddModal} onOpenChange={setShowAddModal} />
      )}

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

      {/* View User Dialog */}
      <ViewUserDialog open={viewOpen} onOpenChange={setViewOpen} user={viewUser} />
    </div>
  );
}