"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from '../ui/navigation-menu';
import { Menu, X, User, LogOut, Settings, Palette, BarChart3, Shield, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading, signOut } = useAuth();
  
  // Check if user is super admin
  const isSuperAdmin = user?.primaryEmail === 'bubuneo99@gmail.com';

  const publicNavItems = [
    { href: "/", label: "Home" },
    { href: "/product", label: "Product" },
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
    { href: "/designer-demo", label: "Demo" },
    { href: "/faq", label: "FAQ" },
  ];

  const dashboardNavItems = [
    { href: "/business", label: "Dashboard", icon: BarChart3 },
    { href: "/designer", label: "Designer", icon: Palette },
    { href: "/projects", label: "Projects", icon: Settings },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-40">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Palette className="h-6 w-6" />
          <span className="font-bold text-lg">CNCPT Designer</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex ml-8 items-center space-x-6">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center space-x-4">
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center space-x-4">
                  {/* Dashboard Navigation for Authenticated Users */}
                  <div className="hidden md:flex items-center space-x-4">
                    {dashboardNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* User Menu */}
                  <NavigationMenu className="z-50">
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="p-0 bg-transparent hover:bg-transparent">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profileImageUrl || ""} />
                            <AvatarFallback>
                              {user.displayName?.charAt(0) || user.primaryEmail?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="z-50">
                          <div className="w-48 p-2">
                            <div className="px-2 py-1.5 text-sm font-medium">
                              {user.displayName || user.primaryEmail}
                            </div>
                            <div className="h-px bg-border my-1" />
                            <Link
                              href="/dashboard/settings"
                              className="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                            >
                              <User className="h-4 w-4" />
                              <span>Account Settings</span>
                            </Link>
                            <Link
                              href="/business?tab=privacy"
                              className="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                            >
                              <Shield className="h-4 w-4" />
                              <span>Privacy & Data</span>
                            </Link>
                            {isSuperAdmin && (
                              <Link
                                href="/admin"
                                className="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm text-primary font-medium"
                              >
                                <ShieldCheck className="h-4 w-4" />
                                <span>Admin Panel</span>
                              </Link>
                            )}
                            <div className="h-px bg-border my-1" />
                            <button
                              onClick={signOut}
                              className="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm w-full text-left"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link href="/handler/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/handler/sign-up">Get Started</Link>
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                {/* Public Navigation */}
                <div className="space-y-2">
                  {publicNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-base font-medium hover:bg-accent rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {user && (
                  <>
                    <div className="h-px bg-border" />
                    {/* Dashboard Navigation */}
                    <div className="space-y-2">
                      {dashboardNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center space-x-3 px-3 py-2 text-base font-medium hover:bg-accent rounded-md"
                            onClick={() => setIsOpen(false)}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>

                    <div className="h-px bg-border" />
                    {/* User Actions */}
                    <div className="space-y-2">
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center space-x-3 px-3 py-2 text-base font-medium hover:bg-accent rounded-md"
                        onClick={() => setIsOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        <span>Account Settings</span>
                      </Link>
                      {isSuperAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center space-x-3 px-3 py-2 text-base font-medium hover:bg-accent rounded-md text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          <ShieldCheck className="h-5 w-5" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }}
                        className="flex items-center space-x-3 px-3 py-2 text-base font-medium hover:bg-accent rounded-md w-full text-left"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}

                {!user && !isLoading && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/handler/sign-in" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href="/handler/sign-up" onClick={() => setIsOpen(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}