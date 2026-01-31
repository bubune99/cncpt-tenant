'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import { Button } from '@/components/cms/ui/button'
import { Input } from '@/components/cms/ui/input'
import { Badge } from '@/components/cms/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/cms/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/cms/ui/avatar'
import { toast } from 'sonner'

interface UserRole {
  id: string
  name: string
  displayName: string
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  image: string | null
  roles: UserRole[]
  permissionCount: number
  isSuperAdmin: boolean
  createdAt: string
  lastLogin: string | null
}

interface UserStats {
  totalAdminUsers: number
  superAdmins: number
  usersWithRoles: number
  usersWithOverrides: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])

        // Calculate stats
        const superAdmins = data.users.filter((u: AdminUser) => u.isSuperAdmin).length
        const usersWithRoles = data.users.filter((u: AdminUser) => u.roles.length > 0).length
        const usersWithOverrides = data.users.filter((u: AdminUser) => u.permissionCount > 0).length
        setStats({
          totalAdminUsers: data.users.length,
          superAdmins,
          usersWithRoles,
          usersWithOverrides,
        })
      } else {
        // Use mock data for now
        const mockUsers: AdminUser[] = [
          {
            id: '1',
            email: 'admin@example.com',
            name: 'Admin User',
            image: null,
            roles: [{ id: '1', name: 'super_admin', displayName: 'Super Admin' }],
            permissionCount: 0,
            isSuperAdmin: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          },
        ]
        setUsers(mockUsers)
        setStats({
          totalAdminUsers: 1,
          superAdmins: 1,
          usersWithRoles: 1,
          usersWithOverrides: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      (user.name?.toLowerCase().includes(query) ?? false)
    )
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      dateStyle: 'medium',
    })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permission assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Admin Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAdminUsers}</div>
              <p className="text-xs text-muted-foreground">
                Users with admin access
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Super Admins
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.superAdmins}</div>
              <p className="text-xs text-muted-foreground">
                Full platform access
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Users with Roles
              </CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usersWithRoles}</div>
              <p className="text-xs text-muted-foreground">
                Have assigned roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Permission Overrides
              </CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usersWithOverrides}</div>
              <p className="text-xs text-muted-foreground">
                Have custom overrides
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground text-center">
                {users.length === 0
                  ? 'No admin users have been created yet.'
                  : 'No users match your search criteria.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {user.name || user.email}
                        </h3>
                        {user.isSuperAdmin && (
                          <Badge variant="destructive">Super Admin</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.roles.map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.displayName}
                          </Badge>
                        ))}
                        {user.roles.length === 0 && !user.isSuperAdmin && (
                          <span className="text-xs text-muted-foreground">
                            No roles assigned
                          </span>
                        )}
                        {user.permissionCount > 0 && (
                          <Badge variant="outline">
                            +{user.permissionCount} overrides
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-muted-foreground hidden md:block">
                      <p>Last login: {formatDate(user.lastLogin)}</p>
                      <p>Joined: {formatDate(user.createdAt)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/admin-users/${user.id}`}>
                            <Key className="h-4 w-4 mr-2" />
                            Manage Permissions
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Remove Admin Access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/admin-users/${user.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <Card>
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
  )
}
