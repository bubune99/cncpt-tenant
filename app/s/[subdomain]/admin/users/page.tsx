'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubdomainAccess } from '@/hooks/use-subdomain-access';
import {
  Search,
  MoreVertical,
  Shield,
  Users,
  Key,
  RefreshCw,
  UserPlus,
  Mail,
  ChevronRight,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
import { Badge } from '@/components/cms/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/cms/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/cms/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/cms/ui/avatar';
import { toast } from 'sonner';

interface UserRole {
  id: string;
  name: string;
  displayName: string;
}

interface PlatformUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  roles: UserRole[];
  permissionCount: number;
  isSuperAdmin: boolean;
  createdAt: string;
  lastLogin: string | null;
}

interface UserStats {
  totalUsers: number;
  superAdmins: number;
  usersWithRoles: number;
  activeUsers: number;
}

export default function UsersPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useSubdomainAccess('admin');
  const router = useRouter();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthLoading = authLoading || accessLoading;

  useEffect(() => {
    if (!isAuthLoading && (!currentUser || !hasAccess)) {
      router.push('/');
    }
  }, [currentUser, isAuthLoading, hasAccess, router]);

  useEffect(() => {
    if (currentUser && hasAccess) {
      fetchUsers();
    }
  }, [currentUser, hasAccess]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);

        // Calculate stats
        const superAdmins = data.users.filter((u: PlatformUser) => u.isSuperAdmin).length;
        const usersWithRoles = data.users.filter((u: PlatformUser) => u.roles.length > 0).length;
        const activeUsers = data.users.filter((u: PlatformUser) => {
          if (!u.lastLogin) return false;
          const lastLogin = new Date(u.lastLogin);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastLogin > thirtyDaysAgo;
        }).length;

        setStats({
          totalUsers: data.users.length,
          superAdmins,
          usersWithRoles,
          activeUsers,
        });
      } else {
        // Create entry for current user if API fails
        const mockUsers: PlatformUser[] = [];
        if (currentUser) {
          mockUsers.push({
            id: currentUser.id,
            email: currentUser.primaryEmail || '',
            name: currentUser.displayName || null,
            image: currentUser.profileImageUrl || null,
            roles: [{ id: '1', name: 'super_admin', displayName: 'Super Admin' }],
            permissionCount: 0,
            isSuperAdmin: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          });
        }
        setUsers(mockUsers);
        setStats({
          totalUsers: mockUsers.length,
          superAdmins: 1,
          usersWithRoles: 1,
          activeUsers: 1,
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.name?.toLowerCase().includes(query) ?? false)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      dateStyle: 'medium',
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const isCurrentUser = (user: PlatformUser) => {
    return currentUser?.primaryEmail === user.email;
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6" data-help-key="admin.users.page">
      {/* Header */}
      <div className="flex items-center justify-between" data-help-key="admin.users.header">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage platform users, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2" data-help-key="admin.users.actions">
          <Button variant="outline" onClick={fetchUsers} disabled={isLoading} data-help-key="admin.users.refresh">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-help-key="admin.users.stats">
          <Card data-help-key="admin.users.stat.total">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Platform users
              </p>
            </CardContent>
          </Card>

          <Card data-help-key="admin.users.stat.super-admins">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.superAdmins}</div>
              <p className="text-xs text-muted-foreground">
                Full platform access
              </p>
            </CardContent>
          </Card>

          <Card data-help-key="admin.users.stat.with-roles">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Roles</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usersWithRoles}</div>
              <p className="text-xs text-muted-foreground">
                Have assigned roles
              </p>
            </CardContent>
          </Card>

          <Card data-help-key="admin.users.stat.active">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active (30d)</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                Logged in recently
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4" data-help-key="admin.users.filters">
        <div className="relative flex-1 max-w-sm" data-help-key="admin.users.search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card data-help-key="admin.users.table">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Platform users with admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground text-center">
                {users.length === 0
                  ? 'No users have been registered yet.'
                  : 'No users match your search criteria.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>
                            {getInitials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {user.name || user.email.split('@')[0]}
                            </span>
                            {isCurrentUser(user) && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.isSuperAdmin && (
                          <Badge variant="destructive">Super Admin</Badge>
                        )}
                        {user.roles.map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.displayName}
                          </Badge>
                        ))}
                        {user.roles.length === 0 && !user.isSuperAdmin && (
                          <span className="text-xs text-muted-foreground">
                            No roles
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <UserX className="h-3 w-3 mr-1" />
                          Never logged in
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.lastLogin)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Key className="h-4 w-4 mr-2" />
                              Manage Permissions
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          {!isCurrentUser(user) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Remove Access
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card data-help-key="admin.users.quick-actions">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Button variant="outline" className="justify-start h-auto py-4" asChild>
            <Link href="/admin/roles">
              <Shield className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Manage Roles</div>
                <div className="text-xs text-muted-foreground">
                  Create and edit role definitions
                </div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="justify-start h-auto py-4" asChild>
            <Link href="/admin/roles/new">
              <Key className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Create New Role</div>
                <div className="text-xs text-muted-foreground">
                  Define a custom permission bundle
                </div>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
