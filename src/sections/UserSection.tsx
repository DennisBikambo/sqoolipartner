'use client';

import { useState } from 'react';
import { Eye, Plus, Search, Filter, UserX, UserCheck } from 'lucide-react';
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
import { useAuth } from '../hooks/useAuth';
import AddUserDialog from '../components/common/AddUserDialog';
import { ConfirmDialog } from '../components/common/ConfirmationDialog';

export default function UserSection() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Id<'users'> | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const { partner } = useAuth();
  const partnerId = partner?._id;

  const users = useQuery(api.user.getUsers, { partner_id: partnerId });
  const auditLogs = useQuery(api.audit.getAuditLogs, { partner_id: partnerId });
  const updateUser = useMutation(api.user.updateUser);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleToggleActivation = (userId: Id<'users'>, activate: boolean) => {
    setSelectedUser(userId);
    setIsActivating(activate);
    setConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedUser) return;
    await updateUser({ user_id: selectedUser, is_account_activated: isActivating });
    setConfirmOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = (users || []).filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeUsers = filteredUsers.filter(u => u.is_account_activated);
  const inactiveUsers = filteredUsers.filter(u => !u.is_account_activated);

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
                  </div>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8"
                  />
                </div>

                <Tabs defaultValue="active" className="w-full">
                  <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="space-y-3 mt-4">
                    {activeUsers.map(user => (
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
                            <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActivation(user._id, false)}
                          >
                            <UserX className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="inactive" className="space-y-3 mt-4">
                    {inactiveUsers.map(user => (
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
                            <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActivation(user._id, true)}
                          >
                            <UserCheck className="h-4 w-4 text-success" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                <Separator />
                <p className="text-sm text-muted-foreground text-center py-4">
                  {filteredUsers.length} total users
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <AddUserDialog open={showAddModal} onOpenChange={setShowAddModal} />

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
