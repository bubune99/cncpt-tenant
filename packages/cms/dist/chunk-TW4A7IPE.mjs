import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator
} from "./chunk-4BRAYHQW.mjs";
import {
  useAuth,
  useMediaUpload
} from "./chunk-L2ZOWITB.mjs";
import {
  formatFileSize,
  getMediaType
} from "./chunk-5BW47DUZ.mjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "./chunk-BA3R2WOQ.mjs";
import {
  Input,
  Label
} from "./chunk-5IKORTYA.mjs";
import {
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./chunk-N2UEDXYG.mjs";
import {
  ScrollArea
} from "./chunk-HC2NDME5.mjs";
import {
  Button,
  buttonVariants
} from "./chunk-PUJKKAD5.mjs";
import {
  cn
} from "./chunk-ZXDYF6LY.mjs";
import {
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-C2QMXRW7.mjs";

// src/app/admin/AdminShell.tsx
import { useState as useState3 } from "react";
import Link2 from "next/link";
import { usePathname } from "next/navigation";

// src/contexts/WizardContext.tsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { jsx } from "react/jsx-runtime";
var WizardContext = createContext(void 0);
var tourStyles = `
  .shepherd-element {
    background: white !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
    padding: 20px !important;
    max-width: 360px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif !important;
  }
  
  .shepherd-header {
    padding-bottom: 12px !important;
  }
  
  .shepherd-title {
    font-size: 18px !important;
    font-weight: 600 !important;
    color: #1d1d1f !important;
    margin: 0 !important;
  }
  
  .shepherd-text {
    font-size: 15px !important;
    line-height: 1.5 !important;
    color: #424245 !important;
    margin: 8px 0 16px 0 !important;
  }
  
  .shepherd-footer {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 8px !important;
    padding-top: 12px !important;
  }
  
  .shepherd-button {
    background: #007aff !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 8px 16px !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: background 0.2s !important;
  }
  
  .shepherd-button:hover {
    background: #0051d5 !important;
  }
  
  .shepherd-button-secondary {
    background: #f5f5f7 !important;
    color: #1d1d1f !important;
  }
  
  .shepherd-button-secondary:hover {
    background: #e8e8ed !important;
  }
  
  .shepherd-modal-overlay-container {
    background: rgba(0, 0, 0, 0.5) !important;
  }
`;
var tours = {
  "admin-dashboard": {
    steps: [
      {
        id: "welcome",
        title: "Welcome to Your Admin Dashboard",
        text: "This powerful dashboard gives you complete control over your platform. Let's explore the key features.",
        buttons: [
          {
            text: "Get Started",
            action: "next"
          }
        ]
      },
      {
        id: "sidebar",
        title: "Navigation Sidebar",
        text: "Access all admin features from here. Each section is designed for specific management tasks.",
        attachTo: {
          element: '[data-tour="sidebar"]',
          on: "right"
        },
        buttons: [
          {
            text: "Next",
            action: "next"
          }
        ]
      },
      {
        id: "stats",
        title: "Platform Statistics",
        text: "Monitor key metrics at a glance. Click any stat card for detailed analytics.",
        attachTo: {
          element: '[data-tour="stats"]',
          on: "bottom"
        },
        buttons: [
          {
            text: "Next",
            action: "next"
          }
        ]
      },
      {
        id: "users",
        title: "User Management",
        text: "View, search, and manage all platform users from this central location.",
        attachTo: {
          element: '[data-tour="users-section"]',
          on: "top"
        },
        buttons: [
          {
            text: "Finish",
            action: "complete"
          }
        ]
      }
    ],
    options: {
      useModalOverlay: true,
      exitOnEsc: true,
      keyboardNavigation: true,
      defaultStepOptions: {
        scrollTo: true,
        cancelIcon: {
          enabled: true
        }
      }
    }
  },
  "business-owner-dashboard": {
    steps: [
      {
        id: "welcome",
        title: "Welcome to Your Business Dashboard",
        text: "Manage your digital assets, track sales, and connect with designers all in one place.",
        buttons: [
          {
            text: "Start Tour",
            action: "next"
          }
        ]
      },
      {
        id: "products",
        title: "Your Products",
        text: "Create and manage your digital products. Each product can have multiple design templates.",
        attachTo: {
          element: '[data-tour="products"]',
          on: "bottom"
        },
        buttons: [
          {
            text: "Next",
            action: "next"
          }
        ]
      },
      {
        id: "designers",
        title: "Designer Network",
        text: "Browse and connect with talented designers. View portfolios and send collaboration requests.",
        attachTo: {
          element: '[data-tour="designers"]',
          on: "top"
        },
        buttons: [
          {
            text: "Next",
            action: "next"
          }
        ]
      },
      {
        id: "api-keys",
        title: "API Integration",
        text: "Generate API keys to integrate your products with external platforms and services.",
        attachTo: {
          element: '[data-tour="api-keys"]',
          on: "left"
        },
        buttons: [
          {
            text: "Complete",
            action: "complete"
          }
        ]
      }
    ]
  },
  "designer-dashboard": {
    steps: [
      {
        id: "welcome",
        title: "Designer Studio",
        text: "Your creative workspace for managing projects, templates, and client collaborations.",
        buttons: [
          {
            text: "Begin",
            action: "next"
          }
        ]
      },
      {
        id: "portfolio",
        title: "Portfolio Showcase",
        text: "Showcase your best work. Keep your portfolio updated to attract more clients.",
        attachTo: {
          element: '[data-tour="portfolio"]',
          on: "bottom"
        },
        buttons: [
          {
            text: "Next",
            action: "next"
          }
        ]
      },
      {
        id: "templates",
        title: "Design Templates",
        text: "Create reusable templates for different product types. Set your pricing and licensing terms.",
        attachTo: {
          element: '[data-tour="templates"]',
          on: "top"
        },
        buttons: [
          {
            text: "Next",
            action: "next"
          }
        ]
      },
      {
        id: "earnings",
        title: "Earnings Dashboard",
        text: "Track your earnings, view payment history, and manage withdrawal settings.",
        attachTo: {
          element: '[data-tour="earnings"]',
          on: "left"
        },
        buttons: [
          {
            text: "Finish Tour",
            action: "complete"
          }
        ]
      }
    ]
  }
};
function WizardProvider({ children }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourId, setCurrentTourId] = useState(null);
  const [completedTours, setCompletedTours] = useState(/* @__PURE__ */ new Set());
  const tourRef = useRef(null);
  useEffect(() => {
    const stored = localStorage.getItem("completedTours");
    if (stored) {
      setCompletedTours(new Set(JSON.parse(stored)));
    }
  }, []);
  useEffect(() => {
    if (completedTours.size > 0) {
      localStorage.setItem("completedTours", JSON.stringify(Array.from(completedTours)));
    }
  }, [completedTours]);
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = tourStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  const startTour = (tourId) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const tourConfig = tours[tourId];
    if (!tourConfig) {
      console.warn(`Tour "${tourId}" not found`);
      return;
    }
    if (tourRef.current) {
      tourRef.current.complete();
    }
    const tour = new Shepherd.Tour({
      useModalOverlay: (_b = (_a = tourConfig.options) == null ? void 0 : _a.useModalOverlay) != null ? _b : true,
      defaultStepOptions: {
        cancelIcon: {
          enabled: (_f = (_e = (_d = (_c = tourConfig.options) == null ? void 0 : _c.defaultStepOptions) == null ? void 0 : _d.cancelIcon) == null ? void 0 : _e.enabled) != null ? _f : true
        },
        scrollTo: (_i = (_h = (_g = tourConfig.options) == null ? void 0 : _g.defaultStepOptions) == null ? void 0 : _h.scrollTo) != null ? _i : true
      }
    });
    tourConfig.steps.forEach((step) => {
      var _a2, _b2, _c2;
      const shepherdStep = {
        id: step.id,
        title: step.title,
        text: step.text,
        scrollTo: (_a2 = step.scrollTo) != null ? _a2 : true,
        classes: step.classes,
        highlightClass: step.highlightClass,
        canClickTarget: (_b2 = step.canClickTarget) != null ? _b2 : false,
        buttons: (_c2 = step.buttons) == null ? void 0 : _c2.map((button) => {
          if (typeof button.action === "string") {
            if (button.action === "next") {
              return {
                text: button.text,
                action: tour.next,
                classes: button.classes
              };
            } else if (button.action === "back") {
              return {
                text: button.text,
                action: tour.back,
                classes: button.classes
              };
            } else if (button.action === "complete") {
              return {
                text: button.text,
                action: tour.complete,
                classes: button.classes
              };
            }
          }
          return {
            text: button.text,
            action: button.action,
            classes: button.classes
          };
        })
      };
      if (step.attachTo) {
        shepherdStep.attachTo = step.attachTo;
      }
      tour.addStep(shepherdStep);
    });
    tour.on("complete", () => {
      if (currentTourId) {
        markTourCompleted(currentTourId);
      }
      endTour();
    });
    tour.on("cancel", () => {
      endTour();
    });
    tourRef.current = tour;
    setCurrentTourId(tourId);
    setIsTourActive(true);
    tour.start();
  };
  const endTour = () => {
    if (tourRef.current) {
      tourRef.current.complete();
      tourRef.current = null;
    }
    setIsTourActive(false);
    setCurrentTourId(null);
  };
  const markTourCompleted = (tourId) => {
    setCompletedTours((prev) => /* @__PURE__ */ new Set([...prev, tourId]));
  };
  const isTourCompleted = (tourId) => {
    return completedTours.has(tourId);
  };
  const resetTourHistory = () => {
    setCompletedTours(/* @__PURE__ */ new Set());
    localStorage.removeItem("completedTours");
  };
  return /* @__PURE__ */ jsx(
    WizardContext.Provider,
    {
      value: {
        startTour,
        endTour,
        isTourActive,
        currentTourId,
        markTourCompleted,
        isTourCompleted,
        resetTourHistory
      },
      children
    }
  );
}
function useWizard() {
  const context = useContext(WizardContext);
  if (context === void 0) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}

// src/components/admin-chat/index.tsx
import dynamic from "next/dynamic";
import { jsx as jsx2 } from "react/jsx-runtime";
var ChatPanel2 = dynamic(
  () => import("./chat-panel-WJKINVK7.mjs").then((mod) => ({ default: mod.ChatPanel })),
  { ssr: false }
);
function AdminChat() {
  return /* @__PURE__ */ jsx2(ChatPanel2, {});
}

// src/app/admin/AdminShell.tsx
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  Mail,
  BarChart3,
  Puzzle,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  Layers,
  GitBranch,
  Image as Image2,
  Key,
  Workflow,
  ClipboardList
} from "lucide-react";

// src/components/branding/Logo.tsx
import { useEffect as useEffect2, useState as useState2 } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var sizeClasses = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12"
};
var textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl"
};
function Logo({
  href = "/",
  className = "",
  size = "md",
  showText = true
}) {
  const { resolvedTheme } = useTheme();
  const [branding, setBranding] = useState2({
    siteName: "My Site"
  });
  const [mounted, setMounted] = useState2(false);
  useEffect2(() => {
    setMounted(true);
    fetchBranding();
  }, []);
  const fetchBranding = async () => {
    try {
      const response = await fetch("/api/settings?group=branding");
      if (response.ok) {
        const data = await response.json();
        if (data.branding) {
          setBranding(data.branding);
        }
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };
  const logoUrl = mounted && resolvedTheme === "dark" && branding.logoDarkUrl ? branding.logoDarkUrl : branding.logoUrl;
  const content = /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 ${className}`, children: [
    logoUrl ? /* @__PURE__ */ jsx3(
      Image,
      {
        src: logoUrl,
        alt: branding.logoAlt || branding.siteName,
        width: size === "sm" ? 24 : size === "md" ? 32 : 48,
        height: size === "sm" ? 24 : size === "md" ? 32 : 48,
        className: `${sizeClasses[size]} w-auto object-contain`,
        priority: true
      }
    ) : (
      // Default logo placeholder - first letter of site name
      /* @__PURE__ */ jsx3(
        "div",
        {
          className: `${sizeClasses[size]} aspect-square rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold ${size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-xl"}`,
          children: branding.siteName.charAt(0).toUpperCase()
        }
      )
    ),
    showText && /* @__PURE__ */ jsx3("span", { className: `font-semibold ${textSizeClasses[size]}`, children: branding.siteName })
  ] });
  if (href) {
    return /* @__PURE__ */ jsx3(Link, { href, className: "hover:opacity-80 transition-opacity", children: content });
  }
  return content;
}

// src/app/admin/AdminShell.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function AdminShell({
  children
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState3(true);
  const [expandedGroups, setExpandedGroups] = useState3(["Main", "E-Commerce", "Content"]);
  const [searchQuery, setSearchQuery] = useState3("");
  const navigationGroups = [
    {
      name: "Main",
      items: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Analytics", href: "/admin/analytics", icon: BarChart3 }
      ]
    },
    {
      name: "E-Commerce",
      items: [
        { name: "Products", href: "/admin/products", icon: Package },
        { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
        { name: "Order Workflows", href: "/admin/order-workflows", icon: Workflow },
        { name: "Shipping", href: "/admin/shipping", icon: Truck },
        { name: "Customers", href: "/admin/customers", icon: Users }
      ]
    },
    {
      name: "Content",
      items: [
        { name: "Pages", href: "/admin/pages", icon: Layers },
        { name: "Blog", href: "/admin/blog", icon: FileText },
        { name: "Forms", href: "/admin/forms", icon: ClipboardList },
        { name: "Media", href: "/admin/media", icon: Image2 },
        { name: "Email Marketing", href: "/admin/email-marketing", icon: Mail }
      ]
    },
    {
      name: "System",
      items: [
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Roles & Permissions", href: "/admin/roles", icon: Key },
        { name: "Plugins", href: "/admin/plugins", icon: Puzzle },
        { name: "Workflows", href: "/admin/workflows", icon: GitBranch },
        { name: "Settings", href: "/admin/settings", icon: Settings }
      ]
    }
  ];
  const toggleGroup = (groupName) => {
    setExpandedGroups(
      (prev) => prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName]
    );
  };
  const isActiveLink = (href) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname == null ? void 0 : pathname.startsWith(href);
  };
  if (!user) {
    return /* @__PURE__ */ jsx4(Fragment, { children });
  }
  return /* @__PURE__ */ jsx4(WizardProvider, { children: /* @__PURE__ */ jsxs2("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx4("div", { className: "lg:hidden fixed top-4 left-4 z-50", children: /* @__PURE__ */ jsx4(
      "button",
      {
        onClick: () => setIsSidebarOpen(!isSidebarOpen),
        className: "p-2 rounded-md bg-card border border-border",
        children: isSidebarOpen ? /* @__PURE__ */ jsx4(X, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx4(Menu, { className: "h-5 w-5" })
      }
    ) }),
    /* @__PURE__ */ jsx4("div", { className: `fixed inset-y-0 left-0 z-40 w-56 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`, children: /* @__PURE__ */ jsxs2("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsxs2("div", { className: "px-4 py-4 border-b border-border", children: [
        /* @__PURE__ */ jsx4(Logo, { href: "/admin", size: "sm" }),
        /* @__PURE__ */ jsx4("p", { className: "text-xs text-muted-foreground mt-1 pl-8", children: "Admin Panel" })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "px-4 py-3 border-b border-border", children: [
        /* @__PURE__ */ jsx4("p", { className: "text-sm font-medium", children: user.displayName || "Admin" }),
        /* @__PURE__ */ jsx4("p", { className: "text-xs text-muted-foreground", children: user.primaryEmail }),
        /* @__PURE__ */ jsx4("span", { className: "inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-primary/10 text-primary", children: "Super Admin" })
      ] }),
      /* @__PURE__ */ jsx4("nav", { className: "flex-1 px-2 py-4 overflow-y-auto", children: /* @__PURE__ */ jsx4("div", { className: "space-y-4", children: navigationGroups.map((group) => /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsxs2(
          "button",
          {
            onClick: () => toggleGroup(group.name),
            className: "flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors",
            children: [
              group.name,
              expandedGroups.includes(group.name) ? /* @__PURE__ */ jsx4(ChevronDown, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx4(ChevronRight, { className: "h-3 w-3" })
            ]
          }
        ),
        expandedGroups.includes(group.name) && /* @__PURE__ */ jsx4("ul", { className: "mt-1 space-y-0.5", children: group.items.map((item) => {
          const Icon2 = item.icon;
          const isActive = isActiveLink(item.href);
          return /* @__PURE__ */ jsx4("li", { children: /* @__PURE__ */ jsxs2(
            Link2,
            {
              href: item.href,
              className: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"}`,
              children: [
                /* @__PURE__ */ jsx4(Icon2, { className: "h-4 w-4" }),
                item.name
              ]
            }
          ) }, item.name);
        }) })
      ] }, group.name)) }) }),
      /* @__PURE__ */ jsxs2("div", { className: "p-4 border-t border-border", children: [
        /* @__PURE__ */ jsxs2(
          Link2,
          {
            href: "/",
            className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors mb-2",
            children: [
              /* @__PURE__ */ jsx4(ArrowLeft, { className: "h-4 w-4" }),
              "View Site"
            ]
          }
        ),
        /* @__PURE__ */ jsxs2(
          "button",
          {
            onClick: () => signOut(),
            className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full",
            children: [
              /* @__PURE__ */ jsx4(LogOut, { className: "h-4 w-4" }),
              "Sign Out"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs2("div", { className: "lg:pl-56", children: [
      /* @__PURE__ */ jsx4("header", { className: "sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border", children: /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between h-16 px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx4("div", { className: "flex-1 max-w-xl", children: /* @__PURE__ */ jsxs2("div", { className: "relative", children: [
          /* @__PURE__ */ jsx4(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx4(
            Input,
            {
              type: "search",
              placeholder: "Search products, orders, customers...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "pl-10 w-full"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 ml-4", children: [
          /* @__PURE__ */ jsx4(
            "button",
            {
              className: "p-2 rounded-md hover:bg-accent transition-colors",
              title: "Notifications (coming soon)",
              children: /* @__PURE__ */ jsx4(Bell, { className: "h-5 w-5 text-muted-foreground" })
            }
          ),
          /* @__PURE__ */ jsx4(
            "button",
            {
              className: "p-2 rounded-md hover:bg-accent transition-colors",
              title: "Help (coming soon)",
              children: /* @__PURE__ */ jsx4(HelpCircle, { className: "h-5 w-5 text-muted-foreground" })
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx4("main", { className: "min-h-[calc(100vh-4rem)]", children })
    ] }),
    /* @__PURE__ */ jsx4(AdminChat, {})
  ] }) });
}

// src/components/admin/BrandingSettings.tsx
import { useState as useState5, useEffect as useEffect3 } from "react";
import { Loader2 as Loader22 } from "lucide-react";
import { toast as toast2 } from "sonner";

// src/components/admin/MediaPicker.tsx
import { useState as useState4, useCallback } from "react";
import { Upload, Image as Image3, Link as LinkIcon, Loader2, X as X2, Check } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function MediaPicker({
  value,
  onChange,
  label,
  placeholder = "Enter URL or select from library",
  accept = ["image/*"],
  maxSize = 10 * 1024 * 1024,
  // 10MB default
  aspectRatio = "auto",
  previewSize = "medium"
}) {
  const [isOpen, setIsOpen] = useState4(false);
  const [activeTab, setActiveTab] = useState4("library");
  const [mediaItems, setMediaItems] = useState4([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState4(false);
  const [isUploading, setIsUploading] = useState4(false);
  const [uploadProgress, setUploadProgress] = useState4(0);
  const [urlInput, setUrlInput] = useState4("");
  const [selectedMedia, setSelectedMedia] = useState4(null);
  const previewSizes = {
    small: "max-h-16",
    medium: "max-h-32",
    large: "max-h-48"
  };
  const loadMedia = useCallback(async () => {
    setIsLoadingMedia(true);
    try {
      const response = await fetch("/api/media?type=image&limit=50&sortBy=createdAt&sortOrder=desc");
      if (response.ok) {
        const data = await response.json();
        setMediaItems(data.media || []);
      }
    } catch (error) {
      console.error("Failed to load media:", error);
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);
  const uploadFile = useCallback(async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const presignResponse = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "presign",
          filename: file.name,
          mimeType: file.type,
          size: file.size
        })
      });
      if (!presignResponse.ok) {
        const error = await presignResponse.json();
        throw new Error(error.error || "Failed to get upload URL");
      }
      const presignData = await presignResponse.json();
      setUploadProgress(25);
      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type
        }
      });
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }
      setUploadProgress(75);
      const completeResponse = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          filename: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: presignData.publicUrl,
          key: presignData.key,
          bucket: presignData.bucket,
          provider: presignData.provider
        })
      });
      if (!completeResponse.ok) {
        throw new Error("Failed to create media record");
      }
      const media = await completeResponse.json();
      setUploadProgress(100);
      onChange(media.url);
      setIsOpen(false);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onChange]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: accept.reduce((acc, type) => {
      if (type === "image/*") {
        return __spreadProps(__spreadValues({}, acc), { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"] });
      }
      return __spreadProps(__spreadValues({}, acc), { [type]: [] });
    }, {}),
    maxSize,
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await uploadFile(acceptedFiles[0]);
      }
    }
  });
  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) {
      loadMedia();
      setUrlInput(value || "");
    }
  };
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setIsOpen(false);
    }
  };
  const handleMediaSelect = (media) => {
    setSelectedMedia(media);
  };
  const handleConfirmSelection = () => {
    if (selectedMedia) {
      onChange(selectedMedia.url);
      setIsOpen(false);
      setSelectedMedia(null);
    }
  };
  return /* @__PURE__ */ jsxs3("div", { className: "space-y-2", children: [
    label && /* @__PURE__ */ jsx5(Label, { className: "text-sm font-medium", children: label }),
    /* @__PURE__ */ jsxs3("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx5(
        Input,
        {
          value: value || "",
          onChange: (e) => onChange(e.target.value),
          placeholder,
          className: "flex-1"
        }
      ),
      /* @__PURE__ */ jsxs3(Dialog, { open: isOpen, onOpenChange: handleOpenChange, children: [
        /* @__PURE__ */ jsx5(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx5(Button, { variant: "outline", size: "icon", type: "button", children: /* @__PURE__ */ jsx5(Image3, { className: "h-4 w-4" }) }) }),
        /* @__PURE__ */ jsxs3(DialogContent, { className: "max-w-3xl max-h-[80vh]", children: [
          /* @__PURE__ */ jsx5(DialogHeader, { children: /* @__PURE__ */ jsx5(DialogTitle, { children: "Select Image" }) }),
          /* @__PURE__ */ jsxs3(Tabs, { value: activeTab, onValueChange: (v) => setActiveTab(v), children: [
            /* @__PURE__ */ jsxs3(TabsList, { className: "grid w-full grid-cols-3", children: [
              /* @__PURE__ */ jsxs3(TabsTrigger, { value: "library", children: [
                /* @__PURE__ */ jsx5(Image3, { className: "h-4 w-4 mr-2" }),
                "Library"
              ] }),
              /* @__PURE__ */ jsxs3(TabsTrigger, { value: "upload", children: [
                /* @__PURE__ */ jsx5(Upload, { className: "h-4 w-4 mr-2" }),
                "Upload"
              ] }),
              /* @__PURE__ */ jsxs3(TabsTrigger, { value: "url", children: [
                /* @__PURE__ */ jsx5(LinkIcon, { className: "h-4 w-4 mr-2" }),
                "URL"
              ] })
            ] }),
            /* @__PURE__ */ jsx5(TabsContent, { value: "library", className: "mt-4", children: isLoadingMedia ? /* @__PURE__ */ jsx5("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsx5(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : mediaItems.length === 0 ? /* @__PURE__ */ jsxs3("div", { className: "text-center py-12 text-muted-foreground", children: [
              /* @__PURE__ */ jsx5(Image3, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }),
              /* @__PURE__ */ jsx5("p", { children: "No images in library" }),
              /* @__PURE__ */ jsx5("p", { className: "text-sm", children: "Upload some images first" })
            ] }) : /* @__PURE__ */ jsxs3(Fragment2, { children: [
              /* @__PURE__ */ jsx5(ScrollArea, { className: "h-[400px]", children: /* @__PURE__ */ jsx5("div", { className: "grid grid-cols-4 gap-3 p-1", children: mediaItems.map((media) => /* @__PURE__ */ jsxs3(
                "div",
                {
                  className: `relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${(selectedMedia == null ? void 0 : selectedMedia.id) === media.id ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"}`,
                  onClick: () => handleMediaSelect(media),
                  children: [
                    /* @__PURE__ */ jsx5(
                      "img",
                      {
                        src: media.url,
                        alt: media.alt || media.filename,
                        className: "w-full h-full object-cover"
                      }
                    ),
                    (selectedMedia == null ? void 0 : selectedMedia.id) === media.id && /* @__PURE__ */ jsx5("div", { className: "absolute inset-0 bg-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsx5(Check, { className: "h-8 w-8 text-primary" }) })
                  ]
                },
                media.id
              )) }) }),
              /* @__PURE__ */ jsx5("div", { className: "flex justify-end mt-4 pt-4 border-t", children: /* @__PURE__ */ jsx5(
                Button,
                {
                  onClick: handleConfirmSelection,
                  disabled: !selectedMedia,
                  children: "Select Image"
                }
              ) })
            ] }) }),
            /* @__PURE__ */ jsx5(TabsContent, { value: "upload", className: "mt-4", children: /* @__PURE__ */ jsxs3(
              "div",
              __spreadProps(__spreadValues({}, getRootProps()), {
                className: `border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`,
                children: [
                  /* @__PURE__ */ jsx5("input", __spreadValues({}, getInputProps())),
                  isUploading ? /* @__PURE__ */ jsxs3("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsx5(Loader2, { className: "h-12 w-12 mx-auto animate-spin text-primary" }),
                    /* @__PURE__ */ jsxs3("p", { className: "text-muted-foreground", children: [
                      "Uploading... ",
                      uploadProgress,
                      "%"
                    ] }),
                    /* @__PURE__ */ jsx5("div", { className: "w-48 mx-auto h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsx5(
                      "div",
                      {
                        className: "h-full bg-primary transition-all duration-300",
                        style: { width: `${uploadProgress}%` }
                      }
                    ) })
                  ] }) : /* @__PURE__ */ jsxs3(Fragment2, { children: [
                    /* @__PURE__ */ jsx5(Upload, { className: "h-12 w-12 mx-auto mb-4 text-muted-foreground" }),
                    /* @__PURE__ */ jsx5("p", { className: "text-lg font-medium", children: isDragActive ? "Drop the image here" : "Drag & drop an image" }),
                    /* @__PURE__ */ jsx5("p", { className: "text-sm text-muted-foreground mt-2", children: "or click to select a file" }),
                    /* @__PURE__ */ jsxs3("p", { className: "text-xs text-muted-foreground mt-4", children: [
                      "PNG, JPG, GIF, WebP, SVG, or ICO up to ",
                      Math.round(maxSize / 1024 / 1024),
                      "MB"
                    ] })
                  ] })
                ]
              })
            ) }),
            /* @__PURE__ */ jsx5(TabsContent, { value: "url", className: "mt-4", children: /* @__PURE__ */ jsxs3("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs3("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx5(Label, { htmlFor: "imageUrl", children: "Image URL" }),
                /* @__PURE__ */ jsx5(
                  Input,
                  {
                    id: "imageUrl",
                    value: urlInput,
                    onChange: (e) => setUrlInput(e.target.value),
                    placeholder: "https://example.com/image.jpg",
                    onKeyDown: (e) => e.key === "Enter" && handleUrlSubmit()
                  }
                )
              ] }),
              urlInput && /* @__PURE__ */ jsxs3("div", { className: "border rounded-lg p-4", children: [
                /* @__PURE__ */ jsx5("p", { className: "text-sm text-muted-foreground mb-2", children: "Preview:" }),
                /* @__PURE__ */ jsx5(
                  "img",
                  {
                    src: urlInput,
                    alt: "Preview",
                    className: "max-h-48 rounded-lg mx-auto",
                    onError: (e) => {
                      e.target.style.display = "none";
                    },
                    onLoad: (e) => {
                      e.target.style.display = "block";
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsx5("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx5(Button, { onClick: handleUrlSubmit, disabled: !urlInput.trim(), children: "Use This URL" }) })
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    value && /* @__PURE__ */ jsxs3("div", { className: "relative mt-2 rounded-lg overflow-hidden border bg-muted/30", children: [
      /* @__PURE__ */ jsx5(
        "img",
        {
          src: value,
          alt: "Selected image",
          className: `${previewSizes[previewSize]} w-full object-contain`,
          onError: (e) => {
            e.target.style.display = "none";
          }
        }
      ),
      /* @__PURE__ */ jsx5(
        Button,
        {
          variant: "destructive",
          size: "icon",
          className: "absolute top-2 right-2 h-6 w-6",
          onClick: () => onChange(""),
          children: /* @__PURE__ */ jsx5(X2, { className: "h-3 w-3" })
        }
      )
    ] })
  ] });
}

// src/components/admin/BrandingSettings.tsx
import { Fragment as Fragment3, jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function BrandingSettings() {
  const [branding, setBranding] = useState5({
    siteName: "",
    siteTagline: "",
    logoUrl: "",
    logoAlt: "",
    logoDarkUrl: "",
    faviconUrl: "",
    appleTouchIconUrl: "",
    ogImageUrl: "",
    primaryColor: "#0066cc",
    accentColor: "#6366f1"
  });
  const [isLoading, setIsLoading] = useState5(true);
  const [isSaving, setIsSaving] = useState5(false);
  const [hasChanges, setHasChanges] = useState5(false);
  useEffect3(() => {
    fetchBranding();
  }, []);
  const fetchBranding = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings?group=branding");
      if (response.ok) {
        const data = await response.json();
        if (data.branding) {
          setBranding((prev) => __spreadValues(__spreadValues({}, prev), data.branding));
        }
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group: "branding",
          settings: branding
        })
      });
      if (response.ok) {
        toast2.success("Branding settings saved successfully");
        setHasChanges(false);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast2.error("Failed to save branding settings");
    } finally {
      setIsSaving(false);
    }
  };
  const updateField = (field, value) => {
    setBranding((prev) => __spreadProps(__spreadValues({}, prev), { [field]: value }));
    setHasChanges(true);
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx6("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsx6(Loader22, { className: "h-8 w-8 animate-spin text-muted-foreground" }) });
  }
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs4(Card, { children: [
      /* @__PURE__ */ jsxs4(CardHeader, { children: [
        /* @__PURE__ */ jsx6(CardTitle, { children: "Site Identity" }),
        /* @__PURE__ */ jsx6(CardDescription, { children: "Your site name and tagline appear in headers and metadata" })
      ] }),
      /* @__PURE__ */ jsx6(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs4("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx6(Label, { htmlFor: "siteName", children: "Site Name" }),
          /* @__PURE__ */ jsx6(
            Input,
            {
              id: "siteName",
              value: branding.siteName,
              onChange: (e) => updateField("siteName", e.target.value),
              placeholder: "My Awesome Site"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx6(Label, { htmlFor: "siteTagline", children: "Tagline" }),
          /* @__PURE__ */ jsx6(
            Input,
            {
              id: "siteTagline",
              value: branding.siteTagline || "",
              onChange: (e) => updateField("siteTagline", e.target.value),
              placeholder: "Your site's slogan or description"
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs4(Card, { children: [
      /* @__PURE__ */ jsxs4(CardHeader, { children: [
        /* @__PURE__ */ jsx6(CardTitle, { children: "Logo" }),
        /* @__PURE__ */ jsx6(CardDescription, { children: "Upload your logo for light and dark themes. Recommended size: 200x50px or larger." })
      ] }),
      /* @__PURE__ */ jsxs4(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs4("div", { className: "grid gap-6 md:grid-cols-2", children: [
          /* @__PURE__ */ jsx6(
            MediaPicker,
            {
              label: "Logo (Light Mode)",
              value: branding.logoUrl || "",
              onChange: (value) => updateField("logoUrl", value),
              placeholder: "Select or upload logo",
              previewSize: "small"
            }
          ),
          /* @__PURE__ */ jsx6(
            MediaPicker,
            {
              label: "Logo (Dark Mode)",
              value: branding.logoDarkUrl || "",
              onChange: (value) => updateField("logoDarkUrl", value),
              placeholder: "Select or upload dark mode logo",
              previewSize: "small"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx6(Label, { htmlFor: "logoAlt", children: "Logo Alt Text" }),
          /* @__PURE__ */ jsx6(
            Input,
            {
              id: "logoAlt",
              value: branding.logoAlt || "",
              onChange: (e) => updateField("logoAlt", e.target.value),
              placeholder: "Company Logo"
            }
          ),
          /* @__PURE__ */ jsx6("p", { className: "text-xs text-muted-foreground", children: "Describes the logo for accessibility and SEO" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4(Card, { children: [
      /* @__PURE__ */ jsxs4(CardHeader, { children: [
        /* @__PURE__ */ jsx6(CardTitle, { children: "Favicon & Icons" }),
        /* @__PURE__ */ jsx6(CardDescription, { children: "Browser tab icon and mobile app icons" })
      ] }),
      /* @__PURE__ */ jsx6(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs4("div", { className: "grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx6(
            MediaPicker,
            {
              label: "Favicon",
              value: branding.faviconUrl || "",
              onChange: (value) => updateField("faviconUrl", value),
              placeholder: "Select or upload favicon",
              previewSize: "small"
            }
          ),
          /* @__PURE__ */ jsx6("p", { className: "text-xs text-muted-foreground", children: "Recommended: 32x32px .ico or .png" })
        ] }),
        /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx6(
            MediaPicker,
            {
              label: "Apple Touch Icon",
              value: branding.appleTouchIconUrl || "",
              onChange: (value) => updateField("appleTouchIconUrl", value),
              placeholder: "Select or upload icon",
              previewSize: "small"
            }
          ),
          /* @__PURE__ */ jsx6("p", { className: "text-xs text-muted-foreground", children: "Recommended: 180x180px .png" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs4(Card, { children: [
      /* @__PURE__ */ jsxs4(CardHeader, { children: [
        /* @__PURE__ */ jsx6(CardTitle, { children: "Social Sharing" }),
        /* @__PURE__ */ jsx6(CardDescription, { children: "Default image for social media shares" })
      ] }),
      /* @__PURE__ */ jsx6(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx6(
          MediaPicker,
          {
            label: "Default Open Graph Image",
            value: branding.ogImageUrl || "",
            onChange: (value) => updateField("ogImageUrl", value),
            placeholder: "Select or upload social sharing image",
            previewSize: "large"
          }
        ),
        /* @__PURE__ */ jsx6("p", { className: "text-xs text-muted-foreground", children: "Recommended: 1200x630px for best display on social platforms" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs4(Card, { children: [
      /* @__PURE__ */ jsxs4(CardHeader, { children: [
        /* @__PURE__ */ jsx6(CardTitle, { children: "Brand Colors" }),
        /* @__PURE__ */ jsx6(CardDescription, { children: "Primary colors used throughout the site" })
      ] }),
      /* @__PURE__ */ jsx6(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs4("div", { className: "grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs4("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx6(Label, { htmlFor: "primaryColor", children: "Primary Color" }),
          /* @__PURE__ */ jsxs4("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx6(
              "input",
              {
                type: "color",
                id: "primaryColor",
                value: branding.primaryColor || "#0066cc",
                onChange: (e) => updateField("primaryColor", e.target.value),
                className: "h-10 w-14 rounded border cursor-pointer"
              }
            ),
            /* @__PURE__ */ jsx6(
              Input,
              {
                value: branding.primaryColor || "#0066cc",
                onChange: (e) => updateField("primaryColor", e.target.value),
                placeholder: "#0066cc",
                className: "flex-1"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs4("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx6(Label, { htmlFor: "accentColor", children: "Accent Color" }),
          /* @__PURE__ */ jsxs4("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx6(
              "input",
              {
                type: "color",
                id: "accentColor",
                value: branding.accentColor || "#6366f1",
                onChange: (e) => updateField("accentColor", e.target.value),
                className: "h-10 w-14 rounded border cursor-pointer"
              }
            ),
            /* @__PURE__ */ jsx6(
              Input,
              {
                value: branding.accentColor || "#6366f1",
                onChange: (e) => updateField("accentColor", e.target.value),
                placeholder: "#6366f1",
                className: "flex-1"
              }
            )
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "flex justify-end gap-4", children: [
      /* @__PURE__ */ jsx6(
        Button,
        {
          variant: "outline",
          onClick: fetchBranding,
          disabled: !hasChanges || isSaving,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx6(Button, { onClick: handleSave, disabled: !hasChanges || isSaving, children: isSaving ? /* @__PURE__ */ jsxs4(Fragment3, { children: [
        /* @__PURE__ */ jsx6(Loader22, { className: "mr-2 h-4 w-4 animate-spin" }),
        "Saving..."
      ] }) : "Save Branding" })
    ] })
  ] });
}

// src/components/admin/DashboardMetrics.tsx
import { useEffect as useEffect4, useState as useState6 } from "react";
import {
  Users as Users2,
  TrendingUp,
  Activity,
  DollarSign,
  Package as Package2,
  ShoppingCart as ShoppingCart2,
  Zap
} from "lucide-react";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function DashboardMetrics() {
  const [metrics, setMetrics] = useState6(null);
  const [loading, setLoading] = useState6(true);
  useEffect4(() => {
    fetchMetrics();
  }, []);
  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx7("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [...Array(8)].map((_, i) => /* @__PURE__ */ jsx7(Card, { children: /* @__PURE__ */ jsxs5(CardHeader, { className: "animate-pulse", children: [
      /* @__PURE__ */ jsx7("div", { className: "h-4 bg-gray-200 rounded w-3/4" }),
      /* @__PURE__ */ jsx7("div", { className: "h-8 bg-gray-200 rounded w-1/2 mt-2" })
    ] }) }, i)) });
  }
  if (!metrics) {
    return null;
  }
  const cards = [
    {
      title: "Total Users",
      value: metrics.totalUsers,
      icon: Users2,
      description: "Registered user accounts",
      color: "text-blue-600"
    },
    {
      title: "Active Subscriptions",
      value: metrics.activeSubscriptions,
      icon: TrendingUp,
      description: "Paying customers",
      color: "text-green-600"
    },
    {
      title: "Active Trials",
      value: metrics.trialsActive,
      icon: Activity,
      description: "Trial accounts",
      color: "text-yellow-600"
    },
    {
      title: "Total Customers",
      value: metrics.totalCustomers,
      icon: Users2,
      description: "End users across all businesses",
      color: "text-purple-600"
    },
    {
      title: "Monthly Revenue",
      value: `$${metrics.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "Recurring revenue",
      color: "text-green-600"
    },
    {
      title: "Total Products",
      value: metrics.totalProducts,
      icon: Package2,
      description: "Products across all stores",
      color: "text-orange-600"
    },
    {
      title: "Total Orders",
      value: metrics.totalOrders,
      icon: ShoppingCart2,
      description: "Orders this month",
      color: "text-indigo-600"
    },
    {
      title: "API Calls Today",
      value: metrics.apiCallsToday.toLocaleString(),
      icon: Zap,
      description: "Platform API usage",
      color: "text-pink-600"
    }
  ];
  return /* @__PURE__ */ jsx7("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: cards.map((card, index) => {
    const Icon2 = card.icon;
    return /* @__PURE__ */ jsxs5(Card, { children: [
      /* @__PURE__ */ jsxs5(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ jsx7(CardTitle, { className: "text-sm font-medium", children: card.title }),
        /* @__PURE__ */ jsx7(Icon2, { className: `h-4 w-4 ${card.color}` })
      ] }),
      /* @__PURE__ */ jsxs5(CardContent, { children: [
        /* @__PURE__ */ jsx7("div", { className: "text-2xl font-bold", children: card.value }),
        /* @__PURE__ */ jsx7("p", { className: "text-xs text-muted-foreground", children: card.description })
      ] })
    ] }, index);
  }) });
}

// src/components/admin/QuickActions.tsx
import {
  Plus,
  Download,
  Mail as Mail2,
  Settings as Settings2,
  FileText as FileText2,
  TrendingUp as TrendingUp2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function QuickActions() {
  const router = useRouter();
  const actions = [
    {
      title: "Add Product",
      description: "Create a new product",
      icon: Plus,
      action: () => router.push("/admin/products/new"),
      variant: "default"
    },
    {
      title: "View Analytics",
      description: "Performance metrics",
      icon: TrendingUp2,
      action: () => router.push("/admin/analytics"),
      variant: "outline"
    },
    {
      title: "New Blog Post",
      description: "Write a new article",
      icon: FileText2,
      action: () => router.push("/admin/blog/new"),
      variant: "outline"
    },
    {
      title: "Export Data",
      description: "Download reports",
      icon: Download,
      action: () => handleExport(),
      variant: "outline"
    },
    {
      title: "Email Marketing",
      description: "Send email campaigns",
      icon: Mail2,
      action: () => router.push("/admin/email-marketing"),
      variant: "outline"
    },
    {
      title: "System Settings",
      description: "Configure settings",
      icon: Settings2,
      action: () => router.push("/admin/settings"),
      variant: "outline"
    }
  ];
  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `platform-report-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };
  return /* @__PURE__ */ jsxs6(Card, { children: [
    /* @__PURE__ */ jsxs6(CardHeader, { children: [
      /* @__PURE__ */ jsx8(CardTitle, { children: "Quick Actions" }),
      /* @__PURE__ */ jsx8(CardDescription, { children: "Common administrative tasks" })
    ] }),
    /* @__PURE__ */ jsx8(CardContent, { children: /* @__PURE__ */ jsx8("div", { className: "grid gap-2 md:grid-cols-2 lg:grid-cols-3", children: actions.map((action, index) => {
      const Icon2 = action.icon;
      return /* @__PURE__ */ jsxs6(
        Button,
        {
          variant: action.variant,
          className: "justify-start",
          onClick: action.action,
          children: [
            /* @__PURE__ */ jsx8(Icon2, { className: "mr-2 h-4 w-4" }),
            /* @__PURE__ */ jsxs6("div", { className: "text-left", children: [
              /* @__PURE__ */ jsx8("div", { className: "font-medium", children: action.title }),
              /* @__PURE__ */ jsx8("div", { className: "text-xs opacity-70", children: action.description })
            ] })
          ]
        },
        index
      );
    }) }) })
  ] });
}

// src/components/admin/EnvManager.tsx
import { useState as useState7, useEffect as useEffect5, useCallback as useCallback2 } from "react";
import {
  Database,
  Shield,
  CreditCard,
  Truck as Truck2,
  HardDrive,
  Mail as Mail3,
  BarChart,
  Bot,
  Settings as Settings3,
  Check as Check2,
  Loader2 as Loader23,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Search as Search2,
  Upload as Upload2,
  Info,
  X as X3
} from "lucide-react";
import { toast as toast3 } from "sonner";

// src/components/ui/progress.tsx
import * as React3 from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { jsx as jsx9 } from "react/jsx-runtime";
var Progress = React3.forwardRef((_a, ref) => {
  var _b = _a, { className, value } = _b, props = __objRest(_b, ["className", "value"]);
  return /* @__PURE__ */ jsx9(
    ProgressPrimitive.Root,
    __spreadProps(__spreadValues({
      ref,
      className: cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )
    }, props), {
      children: /* @__PURE__ */ jsx9(
        ProgressPrimitive.Indicator,
        {
          className: "h-full w-full flex-1 bg-primary transition-all",
          style: { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      )
    })
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

// src/components/ui/alert.tsx
import * as React4 from "react";
import { cva } from "class-variance-authority";
import { jsx as jsx10 } from "react/jsx-runtime";
var alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Alert = React4.forwardRef((_a, ref) => {
  var _b = _a, { className, variant } = _b, props = __objRest(_b, ["className", "variant"]);
  return /* @__PURE__ */ jsx10(
    "div",
    __spreadValues({
      ref,
      role: "alert",
      className: cn(alertVariants({ variant }), className)
    }, props)
  );
});
Alert.displayName = "Alert";
var AlertTitle = React4.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx10(
    "h5",
    __spreadValues({
      ref,
      className: cn("mb-1 font-medium leading-none tracking-tight", className)
    }, props)
  );
});
AlertTitle.displayName = "AlertTitle";
var AlertDescription = React4.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx10(
    "div",
    __spreadValues({
      ref,
      className: cn("text-sm [&_p]:leading-relaxed", className)
    }, props)
  );
});
AlertDescription.displayName = "AlertDescription";

// src/components/ui/accordion.tsx
import * as React5 from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown as ChevronDown2 } from "lucide-react";
import { jsx as jsx11, jsxs as jsxs7 } from "react/jsx-runtime";
var Accordion = AccordionPrimitive.Root;
var AccordionItem = React5.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx11(
    AccordionPrimitive.Item,
    __spreadValues({
      ref,
      className: cn("border-b", className)
    }, props)
  );
});
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = React5.forwardRef((_a, ref) => {
  var _b = _a, { className, children } = _b, props = __objRest(_b, ["className", "children"]);
  return /* @__PURE__ */ jsx11(AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ jsxs7(
    AccordionPrimitive.Trigger,
    __spreadProps(__spreadValues({
      ref,
      className: cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )
    }, props), {
      children: [
        children,
        /* @__PURE__ */ jsx11(ChevronDown2, { className: "h-4 w-4 shrink-0 transition-transform duration-200" })
      ]
    })
  ) });
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
var AccordionContent = React5.forwardRef((_a, ref) => {
  var _b = _a, { className, children } = _b, props = __objRest(_b, ["className", "children"]);
  return /* @__PURE__ */ jsx11(
    AccordionPrimitive.Content,
    __spreadProps(__spreadValues({
      ref,
      className: "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    }, props), {
      children: /* @__PURE__ */ jsx11("div", { className: cn("pb-4 pt-0", className), children })
    })
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// src/components/admin/EnvManager.tsx
import { Fragment as Fragment4, jsx as jsx12, jsxs as jsxs8 } from "react/jsx-runtime";
var CATEGORY_ICONS = {
  database: Database,
  auth: Shield,
  payments: CreditCard,
  shipping: Truck2,
  storage: HardDrive,
  email: Mail3,
  analytics: BarChart,
  ai: Bot,
  general: Settings3
};
var CATEGORY_LABELS = {
  database: "Database",
  auth: "Authentication",
  payments: "Payments",
  shipping: "Shipping",
  storage: "Storage",
  email: "Email",
  analytics: "Analytics",
  ai: "AI",
  general: "General"
};
function EnvManager() {
  const [variables, setVariables] = useState7([]);
  const [health, setHealth] = useState7(null);
  const [isLoading, setIsLoading] = useState7(true);
  const [activeCategory, setActiveCategory] = useState7("all");
  const [searchQuery, setSearchQuery] = useState7("");
  const [editingVar, setEditingVar] = useState7(null);
  const [editValue, setEditValue] = useState7("");
  const [showValue, setShowValue] = useState7(false);
  const [isSaving, setIsSaving] = useState7(false);
  const [showImportDialog, setShowImportDialog] = useState7(false);
  const [importText, setImportText] = useState7("");
  const [isImporting, setIsImporting] = useState7(false);
  const loadEnvVars = useCallback2(async () => {
    try {
      const [varsRes, healthRes] = await Promise.all([
        fetch("/api/env"),
        fetch("/api/env?health=true")
      ]);
      if (varsRes.ok) {
        const data = await varsRes.json();
        setVariables(data.variables || []);
      }
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealth(data);
      }
    } catch (error) {
      console.error("Error loading env vars:", error);
      toast3.error("Failed to load environment variables");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect5(() => {
    loadEnvVars();
  }, [loadEnvVars]);
  const handleSaveVar = async () => {
    if (!editingVar) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/env", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: editingVar.key,
          value: editValue
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }
      toast3.success(`${editingVar.label} has been updated`);
      setEditingVar(null);
      setEditValue("");
      setShowValue(false);
      loadEnvVars();
    } catch (error) {
      toast3.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteVar = async (key) => {
    try {
      const response = await fetch("/api/env", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });
      if (!response.ok) {
        throw new Error("Failed to delete");
      }
      toast3.success("Environment variable removed");
      loadEnvVars();
    } catch (error) {
      toast3.error("Failed to delete environment variable");
    }
  };
  const handleImport = async () => {
    var _a;
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      const response = await fetch("/api/env/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envString: importText, overwrite: false })
      });
      if (!response.ok) {
        throw new Error("Import failed");
      }
      const data = await response.json();
      toast3.success(`Imported ${data.imported} variables (${data.skipped} skipped)`);
      if (((_a = data.errors) == null ? void 0 : _a.length) > 0) {
        toast3.warning(`${data.errors.length} errors occurred during import`);
      }
      setShowImportDialog(false);
      setImportText("");
      loadEnvVars();
    } catch (error) {
      toast3.error("Failed to import environment variables");
    } finally {
      setIsImporting(false);
    }
  };
  const filteredVariables = variables.filter((v) => {
    const matchesCategory = activeCategory === "all" || v.category === activeCategory;
    const matchesSearch = !searchQuery || v.key.toLowerCase().includes(searchQuery.toLowerCase()) || v.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const groupedVariables = filteredVariables.reduce((acc, v) => {
    if (!acc[v.category]) {
      acc[v.category] = [];
    }
    acc[v.category].push(v);
    return acc;
  }, {});
  if (isLoading) {
    return /* @__PURE__ */ jsx12("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs8("div", { className: "animate-pulse space-y-4", children: [
      /* @__PURE__ */ jsx12("div", { className: "h-20 bg-muted rounded-lg" }),
      /* @__PURE__ */ jsx12("div", { className: "h-64 bg-muted rounded-lg" })
    ] }) });
  }
  return /* @__PURE__ */ jsx12(TooltipProvider, { children: /* @__PURE__ */ jsxs8("div", { className: "space-y-6", children: [
    health && /* @__PURE__ */ jsxs8(Card, { children: [
      /* @__PURE__ */ jsx12(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs8("div", { children: [
          /* @__PURE__ */ jsx12(CardTitle, { className: "text-lg", children: "Configuration Health" }),
          /* @__PURE__ */ jsxs8(CardDescription, { children: [
            health.requiredConfigured,
            "/",
            health.required,
            " required variables configured"
          ] })
        ] }),
        /* @__PURE__ */ jsxs8(Button, { variant: "outline", size: "sm", onClick: loadEnvVars, children: [
          /* @__PURE__ */ jsx12(RefreshCw, { className: "h-4 w-4 mr-2" }),
          "Refresh"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs8(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs8("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs8("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx12("span", { children: "Overall Progress" }),
            /* @__PURE__ */ jsxs8("span", { children: [
              health.configured,
              "/",
              health.total,
              " (",
              Math.round(health.configured / health.total * 100),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ jsx12(Progress, { value: health.configured / health.total * 100 })
        ] }),
        health.missingRequired.length > 0 && /* @__PURE__ */ jsxs8(Alert, { variant: "destructive", children: [
          /* @__PURE__ */ jsx12(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxs8(AlertDescription, { children: [
            /* @__PURE__ */ jsx12("span", { className: "font-medium", children: "Missing required variables: " }),
            health.missingRequired.join(", ")
          ] })
        ] }),
        /* @__PURE__ */ jsx12("div", { className: "grid grid-cols-3 md:grid-cols-5 gap-2 pt-2", children: Object.keys(health.categories).map((cat) => {
          const Icon2 = CATEGORY_ICONS[cat];
          const catHealth = health.categories[cat];
          const percentage = catHealth.total > 0 ? Math.round(catHealth.configured / catHealth.total * 100) : 0;
          return /* @__PURE__ */ jsxs8(Tooltip, { children: [
            /* @__PURE__ */ jsx12(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs8(
              "button",
              {
                className: cn(
                  "p-3 rounded-lg border text-center transition-colors",
                  activeCategory === cat ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                ),
                onClick: () => setActiveCategory(cat),
                children: [
                  /* @__PURE__ */ jsx12(Icon2, { className: "h-5 w-5 mx-auto mb-1 text-muted-foreground" }),
                  /* @__PURE__ */ jsx12("div", { className: "text-xs font-medium truncate", children: CATEGORY_LABELS[cat] }),
                  /* @__PURE__ */ jsxs8("div", { className: "text-xs text-muted-foreground", children: [
                    catHealth.configured,
                    "/",
                    catHealth.total
                  ] })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx12(TooltipContent, { children: /* @__PURE__ */ jsxs8("p", { children: [
              CATEGORY_LABELS[cat],
              ": ",
              percentage,
              "% configured"
            ] }) })
          ] }, cat);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs8("div", { className: "flex flex-col sm:flex-row gap-4", children: [
      /* @__PURE__ */ jsxs8("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx12(Search2, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx12(
          Input,
          {
            placeholder: "Search variables...",
            className: "pl-9",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx12(
          Button,
          {
            variant: activeCategory === "all" ? "default" : "outline",
            onClick: () => setActiveCategory("all"),
            children: "All"
          }
        ),
        /* @__PURE__ */ jsxs8(Button, { variant: "outline", onClick: () => setShowImportDialog(true), children: [
          /* @__PURE__ */ jsx12(Upload2, { className: "h-4 w-4 mr-2" }),
          "Import"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx12(Accordion, { type: "multiple", defaultValue: Object.keys(groupedVariables), className: "space-y-4", children: Object.entries(groupedVariables).map(
      ([category, vars]) => {
        const Icon2 = CATEGORY_ICONS[category];
        return /* @__PURE__ */ jsxs8(AccordionItem, { value: category, className: "border rounded-lg", children: [
          /* @__PURE__ */ jsx12(AccordionTrigger, { className: "px-4 hover:no-underline hover:bg-muted/50", children: /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx12(Icon2, { className: "h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ jsx12("span", { className: "font-medium", children: CATEGORY_LABELS[category] }),
            /* @__PURE__ */ jsxs8(Badge, { variant: "secondary", className: "ml-2", children: [
              vars.filter((v) => v.configured).length,
              "/",
              vars.length
            ] })
          ] }) }),
          /* @__PURE__ */ jsx12(AccordionContent, { className: "px-4 pb-4", children: /* @__PURE__ */ jsx12("div", { className: "space-y-3", children: vars.map((v) => /* @__PURE__ */ jsx12(
            "div",
            {
              className: cn(
                "p-4 rounded-lg border",
                !v.configured && v.required && "border-destructive/50 bg-destructive/5"
              ),
              children: /* @__PURE__ */ jsxs8("div", { className: "flex items-start justify-between gap-4", children: [
                /* @__PURE__ */ jsxs8("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ jsx12("span", { className: "font-mono text-sm font-medium", children: v.key }),
                    v.required && /* @__PURE__ */ jsx12(Badge, { variant: "destructive", className: "text-xs", children: "Required" }),
                    v.sensitive && /* @__PURE__ */ jsxs8(Badge, { variant: "secondary", className: "text-xs", children: [
                      /* @__PURE__ */ jsx12(Shield, { className: "h-3 w-3 mr-1" }),
                      "Encrypted"
                    ] }),
                    v.public && /* @__PURE__ */ jsx12(Badge, { variant: "outline", className: "text-xs", children: "Public" })
                  ] }),
                  /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted-foreground mt-1", children: v.description }),
                  /* @__PURE__ */ jsx12("div", { className: "flex items-center gap-2 mt-2", children: v.configured ? /* @__PURE__ */ jsxs8("div", { className: "flex items-center text-sm text-green-600 dark:text-green-400", children: [
                    /* @__PURE__ */ jsx12(Check2, { className: "h-4 w-4 mr-1" }),
                    /* @__PURE__ */ jsx12("span", { className: "font-mono", children: v.maskedValue }),
                    /* @__PURE__ */ jsx12(Badge, { variant: "outline", className: "ml-2 text-xs", children: v.source === "database" ? "Database" : "ENV File" })
                  ] }) : /* @__PURE__ */ jsx12("span", { className: "text-sm text-muted-foreground italic", children: "Not configured" }) })
                ] }),
                /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx12(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => {
                        setEditingVar(v);
                        setEditValue("");
                        setShowValue(false);
                      },
                      children: v.configured ? "Update" : "Configure"
                    }
                  ),
                  v.configured && v.source === "database" && /* @__PURE__ */ jsxs8(Tooltip, { children: [
                    /* @__PURE__ */ jsx12(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx12(
                      Button,
                      {
                        variant: "ghost",
                        size: "icon",
                        className: "h-8 w-8 text-destructive",
                        onClick: () => handleDeleteVar(v.key),
                        children: /* @__PURE__ */ jsx12(X3, { className: "h-4 w-4" })
                      }
                    ) }),
                    /* @__PURE__ */ jsx12(TooltipContent, { children: /* @__PURE__ */ jsx12("p", { children: "Remove from database" }) })
                  ] })
                ] })
              ] })
            },
            v.key
          )) }) })
        ] }, category);
      }
    ) }),
    filteredVariables.length === 0 && /* @__PURE__ */ jsx12(Card, { children: /* @__PURE__ */ jsx12(CardContent, { className: "py-8 text-center", children: /* @__PURE__ */ jsx12("p", { className: "text-muted-foreground", children: "No environment variables found matching your search." }) }) }),
    /* @__PURE__ */ jsx12(Dialog, { open: !!editingVar, onOpenChange: () => setEditingVar(null), children: /* @__PURE__ */ jsxs8(DialogContent, { children: [
      /* @__PURE__ */ jsxs8(DialogHeader, { children: [
        /* @__PURE__ */ jsxs8(DialogTitle, { children: [
          (editingVar == null ? void 0 : editingVar.configured) ? "Update" : "Configure",
          " ",
          editingVar == null ? void 0 : editingVar.label
        ] }),
        /* @__PURE__ */ jsx12(DialogDescription, { children: editingVar == null ? void 0 : editingVar.description })
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxs8("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs8(Label, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx12("span", { className: "font-mono text-sm", children: editingVar == null ? void 0 : editingVar.key }),
            (editingVar == null ? void 0 : editingVar.sensitive) && /* @__PURE__ */ jsxs8(Badge, { variant: "secondary", className: "text-xs", children: [
              /* @__PURE__ */ jsx12(Shield, { className: "h-3 w-3 mr-1" }),
              "Will be encrypted"
            ] })
          ] }),
          /* @__PURE__ */ jsxs8("div", { className: "relative", children: [
            /* @__PURE__ */ jsx12(
              Input,
              {
                type: showValue || !(editingVar == null ? void 0 : editingVar.sensitive) ? "text" : "password",
                value: editValue,
                onChange: (e) => setEditValue(e.target.value),
                placeholder: (editingVar == null ? void 0 : editingVar.placeholder) || "Enter value..."
              }
            ),
            (editingVar == null ? void 0 : editingVar.sensitive) && /* @__PURE__ */ jsx12(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                className: "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7",
                onClick: () => setShowValue(!showValue),
                children: showValue ? /* @__PURE__ */ jsx12(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx12(Eye, { className: "h-4 w-4" })
              }
            )
          ] }),
          (editingVar == null ? void 0 : editingVar.placeholder) && /* @__PURE__ */ jsxs8("p", { className: "text-xs text-muted-foreground", children: [
            "Example: ",
            editingVar.placeholder
          ] })
        ] }),
        (editingVar == null ? void 0 : editingVar.configured) && editingVar.source === "env_file" && /* @__PURE__ */ jsxs8(Alert, { children: [
          /* @__PURE__ */ jsx12(Info, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx12(AlertDescription, { children: "This variable is currently set in your .env file. Setting it here will override the file value with an encrypted database value." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs8(DialogFooter, { children: [
        /* @__PURE__ */ jsx12(Button, { variant: "outline", onClick: () => setEditingVar(null), children: "Cancel" }),
        /* @__PURE__ */ jsx12(Button, { onClick: handleSaveVar, disabled: !editValue || isSaving, children: isSaving ? /* @__PURE__ */ jsxs8(Fragment4, { children: [
          /* @__PURE__ */ jsx12(Loader23, { className: "h-4 w-4 mr-2 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ jsxs8(Fragment4, { children: [
          /* @__PURE__ */ jsx12(Check2, { className: "h-4 w-4 mr-2" }),
          "Save"
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx12(Dialog, { open: showImportDialog, onOpenChange: setShowImportDialog, children: /* @__PURE__ */ jsxs8(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsxs8(DialogHeader, { children: [
        /* @__PURE__ */ jsx12(DialogTitle, { children: "Import Environment Variables" }),
        /* @__PURE__ */ jsx12(DialogDescription, { children: "Paste your .env file contents below. Only recognized variables will be imported." })
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsx12(
          Textarea,
          {
            value: importText,
            onChange: (e) => setImportText(e.target.value),
            placeholder: `# Paste your .env contents here
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...`,
            className: "font-mono text-sm h-64"
          }
        ),
        /* @__PURE__ */ jsxs8(Alert, { children: [
          /* @__PURE__ */ jsx12(Info, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx12(AlertDescription, { children: "Existing values will not be overwritten. Only new variables will be imported. Sensitive values will be automatically encrypted." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs8(DialogFooter, { children: [
        /* @__PURE__ */ jsx12(Button, { variant: "outline", onClick: () => setShowImportDialog(false), children: "Cancel" }),
        /* @__PURE__ */ jsx12(Button, { onClick: handleImport, disabled: !importText.trim() || isImporting, children: isImporting ? /* @__PURE__ */ jsxs8(Fragment4, { children: [
          /* @__PURE__ */ jsx12(Loader23, { className: "h-4 w-4 mr-2 animate-spin" }),
          "Importing..."
        ] }) : /* @__PURE__ */ jsxs8(Fragment4, { children: [
          /* @__PURE__ */ jsx12(Upload2, { className: "h-4 w-4 mr-2" }),
          "Import"
        ] }) })
      ] })
    ] }) })
  ] }) });
}

// src/components/admin/EmailProviderSettings.tsx
import { useState as useState8, useEffect as useEffect6 } from "react";
import { toast as toast4 } from "sonner";
import {
  Save,
  Loader2 as Loader24,
  CheckCircle,
  XCircle,
  Eye as Eye2,
  EyeOff as EyeOff2,
  Mail as Mail4,
  Server,
  Send
} from "lucide-react";

// src/components/ui/switch.tsx
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { jsx as jsx13 } from "react/jsx-runtime";
function Switch(_a) {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx13(
    SwitchPrimitive.Root,
    __spreadProps(__spreadValues({
      "data-slot": "switch",
      className: cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )
    }, props), {
      children: /* @__PURE__ */ jsx13(
        SwitchPrimitive.Thumb,
        {
          "data-slot": "switch-thumb",
          className: cn(
            "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
          )
        }
      )
    })
  );
}

// src/components/ui/select.tsx
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { jsx as jsx14, jsxs as jsxs9 } from "react/jsx-runtime";
function Select(_a) {
  var props = __objRest(_a, []);
  return /* @__PURE__ */ jsx14(SelectPrimitive.Root, __spreadValues({ "data-slot": "select" }, props));
}
function SelectValue(_a) {
  var props = __objRest(_a, []);
  return /* @__PURE__ */ jsx14(SelectPrimitive.Value, __spreadValues({ "data-slot": "select-value" }, props));
}
function SelectTrigger(_a) {
  var _b = _a, {
    className,
    size = "default",
    children
  } = _b, props = __objRest(_b, [
    "className",
    "size",
    "children"
  ]);
  return /* @__PURE__ */ jsxs9(
    SelectPrimitive.Trigger,
    __spreadProps(__spreadValues({
      "data-slot": "select-trigger",
      "data-size": size,
      className: cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )
    }, props), {
      children: [
        children,
        /* @__PURE__ */ jsx14(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx14(ChevronDownIcon, { className: "size-4 opacity-50" }) })
      ]
    })
  );
}
function SelectContent(_a) {
  var _b = _a, {
    className,
    children,
    position = "item-aligned",
    align = "center"
  } = _b, props = __objRest(_b, [
    "className",
    "children",
    "position",
    "align"
  ]);
  return /* @__PURE__ */ jsx14(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs9(
    SelectPrimitive.Content,
    __spreadProps(__spreadValues({
      "data-slot": "select-content",
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      ),
      position,
      align
    }, props), {
      children: [
        /* @__PURE__ */ jsx14(SelectScrollUpButton, {}),
        /* @__PURE__ */ jsx14(
          SelectPrimitive.Viewport,
          {
            className: cn(
              "p-1",
              position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
            ),
            children
          }
        ),
        /* @__PURE__ */ jsx14(SelectScrollDownButton, {})
      ]
    })
  ) });
}
function SelectItem(_a) {
  var _b = _a, {
    className,
    children
  } = _b, props = __objRest(_b, [
    "className",
    "children"
  ]);
  return /* @__PURE__ */ jsxs9(
    SelectPrimitive.Item,
    __spreadProps(__spreadValues({
      "data-slot": "select-item",
      className: cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )
    }, props), {
      children: [
        /* @__PURE__ */ jsx14(
          "span",
          {
            "data-slot": "select-item-indicator",
            className: "absolute right-2 flex size-3.5 items-center justify-center",
            children: /* @__PURE__ */ jsx14(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx14(CheckIcon, { className: "size-4" }) })
          }
        ),
        /* @__PURE__ */ jsx14(SelectPrimitive.ItemText, { children })
      ]
    })
  );
}
function SelectScrollUpButton(_a) {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx14(
    SelectPrimitive.ScrollUpButton,
    __spreadProps(__spreadValues({
      "data-slot": "select-scroll-up-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )
    }, props), {
      children: /* @__PURE__ */ jsx14(ChevronUpIcon, { className: "size-4" })
    })
  );
}
function SelectScrollDownButton(_a) {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx14(
    SelectPrimitive.ScrollDownButton,
    __spreadProps(__spreadValues({
      "data-slot": "select-scroll-down-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )
    }, props), {
      children: /* @__PURE__ */ jsx14(ChevronDownIcon, { className: "size-4" })
    })
  );
}

// src/components/admin/EmailProviderSettings.tsx
import { jsx as jsx15, jsxs as jsxs10 } from "react/jsx-runtime";
function EmailProviderSettings() {
  const [loading, setLoading] = useState8(true);
  const [saving, setSaving] = useState8(false);
  const [testing, setTesting] = useState8(false);
  const [envVars, setEnvVars] = useState8([]);
  const [showSecrets, setShowSecrets] = useState8({});
  const [form, setForm] = useState8({
    provider: "smtp",
    fromName: "",
    fromEmail: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpSecure: false,
    sendgridApiKey: "",
    resendApiKey: "",
    mailgunApiKey: "",
    mailgunDomain: "",
    sesAccessKeyId: "",
    sesSecretAccessKey: "",
    sesRegion: "us-east-1"
  });
  useEffect6(() => {
    fetchSettings();
  }, []);
  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      if (data.success) {
        if (data.settings.email) {
          setForm((prev) => __spreadValues(__spreadValues({}, prev), data.settings.email));
        }
        if (data.settings.envVars) {
          setEnvVars(data.settings.envVars.filter((v) => v.group === "email"));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast4.error("Failed to load email settings");
    } finally {
      setLoading(false);
    }
  };
  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group: "email",
          settings: form
        })
      });
      const data = await response.json();
      if (data.success) {
        toast4.success("Email settings saved successfully");
        if (data.settings.email) {
          setForm((prev) => __spreadValues(__spreadValues({}, prev), data.settings.email));
        }
      } else {
        toast4.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast4.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };
  const sendTestEmail = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/emails/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.fromEmail,
          subject: "Test Email from CMS",
          content: "<h1>Test Email</h1><p>Your email configuration is working correctly!</p>"
        })
      });
      const data = await response.json();
      if (data.success) {
        toast4.success(`Test email sent to ${form.fromEmail}`);
      } else {
        toast4.error(data.error || "Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast4.error("Failed to send test email");
    } finally {
      setTesting(false);
    }
  };
  const toggleSecret = (key) => {
    setShowSecrets((prev) => __spreadProps(__spreadValues({}, prev), { [key]: !prev[key] }));
  };
  const renderSecretInput = (label, key, placeholder) => {
    const value = form[key] || "";
    const isVisible = showSecrets[key];
    const isMasked = value === "********";
    return /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx15(Label, { children: label }),
      /* @__PURE__ */ jsxs10("div", { className: "relative", children: [
        /* @__PURE__ */ jsx15(
          Input,
          {
            type: isVisible ? "text" : "password",
            value,
            onChange: (e) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { [key]: e.target.value })),
            placeholder: isMasked ? "Enter new value to change" : placeholder
          }
        ),
        /* @__PURE__ */ jsx15(
          "button",
          {
            type: "button",
            onClick: () => toggleSecret(key),
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
            children: isVisible ? /* @__PURE__ */ jsx15(EyeOff2, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx15(Eye2, { className: "h-4 w-4" })
          }
        )
      ] }),
      isMasked && /* @__PURE__ */ jsx15("p", { className: "text-xs text-muted-foreground", children: "Value is configured. Enter a new value to change it." })
    ] });
  };
  if (loading) {
    return /* @__PURE__ */ jsx15("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx15(Loader24, { className: "h-8 w-8 animate-spin text-muted-foreground" }) });
  }
  return /* @__PURE__ */ jsxs10("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs10(Card, { children: [
      /* @__PURE__ */ jsxs10(CardHeader, { children: [
        /* @__PURE__ */ jsxs10(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx15(Mail4, { className: "h-5 w-5" }),
          "Email Provider"
        ] }),
        /* @__PURE__ */ jsx15(CardDescription, { children: "Configure your email sending provider. SMTP (nodemailer) allows unlimited sending with your own mail server. All credentials are encrypted in the database." })
      ] }),
      /* @__PURE__ */ jsxs10(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx15(Label, { children: "Email Provider" }),
          /* @__PURE__ */ jsx15("div", { className: "grid grid-cols-5 gap-2", children: ["smtp", "sendgrid", "resend", "mailgun", "ses"].map((provider) => /* @__PURE__ */ jsx15(
            Button,
            {
              variant: form.provider === provider ? "default" : "outline",
              onClick: () => setForm((prev) => __spreadProps(__spreadValues({}, prev), { provider })),
              className: "w-full",
              children: provider === "smtp" ? "SMTP" : provider === "ses" ? "AWS SES" : provider.charAt(0).toUpperCase() + provider.slice(1)
            },
            provider
          )) })
        ] }),
        /* @__PURE__ */ jsxs10("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx15(Label, { children: "From Name" }),
            /* @__PURE__ */ jsx15(
              Input,
              {
                value: form.fromName || "",
                onChange: (e) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { fromName: e.target.value })),
                placeholder: "Your Company"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx15(Label, { children: "From Email" }),
            /* @__PURE__ */ jsx15(
              Input,
              {
                type: "email",
                value: form.fromEmail || "",
                onChange: (e) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { fromEmail: e.target.value })),
                placeholder: "noreply@yourdomain.com"
              }
            )
          ] })
        ] }),
        form.provider === "smtp" && /* @__PURE__ */ jsxs10("div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx15(Server, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx15("h3", { className: "font-medium", children: "SMTP Settings (Nodemailer)" })
          ] }),
          /* @__PURE__ */ jsx15(Alert, { children: /* @__PURE__ */ jsx15(AlertDescription, { children: "Use your own mail server for unlimited email sending without per-email costs." }) }),
          /* @__PURE__ */ jsxs10("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx15(Label, { children: "SMTP Host" }),
              /* @__PURE__ */ jsx15(
                Input,
                {
                  value: form.smtpHost || "",
                  onChange: (e) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { smtpHost: e.target.value })),
                  placeholder: "smtp.yourdomain.com"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx15(Label, { children: "SMTP Port" }),
              /* @__PURE__ */ jsx15(
                Input,
                {
                  type: "number",
                  value: form.smtpPort || 587,
                  onChange: (e) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { smtpPort: parseInt(e.target.value) })),
                  placeholder: "587"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx15(Label, { children: "SMTP Username" }),
              /* @__PURE__ */ jsx15(
                Input,
                {
                  value: form.smtpUser || "",
                  onChange: (e) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { smtpUser: e.target.value })),
                  placeholder: "username"
                }
              )
            ] }),
            renderSecretInput("SMTP Password", "smtpPass", "Enter password")
          ] }),
          /* @__PURE__ */ jsxs10("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx15(
              Switch,
              {
                id: "smtp-secure",
                checked: form.smtpSecure || false,
                onCheckedChange: (checked) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { smtpSecure: checked }))
              }
            ),
            /* @__PURE__ */ jsx15(Label, { htmlFor: "smtp-secure", children: "Use TLS/SSL (typically port 465)" })
          ] })
        ] }),
        form.provider === "sendgrid" && /* @__PURE__ */ jsxs10("div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ jsx15("h3", { className: "font-medium", children: "SendGrid Settings" }),
          renderSecretInput("API Key", "sendgridApiKey", "SG.xxxxxx")
        ] }),
        form.provider === "resend" && /* @__PURE__ */ jsxs10("div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ jsx15("h3", { className: "font-medium", children: "Resend Settings" }),
          renderSecretInput("API Key", "resendApiKey", "re_xxxxxx")
        ] }),
        form.provider === "mailgun" && /* @__PURE__ */ jsxs10("div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ jsx15("h3", { className: "font-medium", children: "Mailgun Settings" }),
          /* @__PURE__ */ jsxs10("div", { className: "grid grid-cols-2 gap-4", children: [
            renderSecretInput("API Key", "mailgunApiKey", "key-xxxxxx"),
            /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx15(Label, { children: "Domain" }),
              /* @__PURE__ */ jsx15(
                Input,
                {
                  value: form.mailgunDomain || "",
                  onChange: (e) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { mailgunDomain: e.target.value })),
                  placeholder: "mg.yourdomain.com"
                }
              )
            ] })
          ] })
        ] }),
        form.provider === "ses" && /* @__PURE__ */ jsxs10("div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ jsx15("h3", { className: "font-medium", children: "AWS SES Settings" }),
          /* @__PURE__ */ jsxs10("div", { className: "grid grid-cols-2 gap-4", children: [
            renderSecretInput("Access Key ID", "sesAccessKeyId", "AKIAXXXXXXXX"),
            renderSecretInput("Secret Access Key", "sesSecretAccessKey", "xxxxxx"),
            /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx15(Label, { children: "Region" }),
              /* @__PURE__ */ jsxs10(
                Select,
                {
                  value: form.sesRegion || "us-east-1",
                  onValueChange: (value) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { sesRegion: value })),
                  children: [
                    /* @__PURE__ */ jsx15(SelectTrigger, { children: /* @__PURE__ */ jsx15(SelectValue, {}) }),
                    /* @__PURE__ */ jsxs10(SelectContent, { children: [
                      /* @__PURE__ */ jsx15(SelectItem, { value: "us-east-1", children: "US East (N. Virginia)" }),
                      /* @__PURE__ */ jsx15(SelectItem, { value: "us-west-2", children: "US West (Oregon)" }),
                      /* @__PURE__ */ jsx15(SelectItem, { value: "eu-west-1", children: "EU (Ireland)" }),
                      /* @__PURE__ */ jsx15(SelectItem, { value: "eu-central-1", children: "EU (Frankfurt)" }),
                      /* @__PURE__ */ jsx15(SelectItem, { value: "ap-southeast-1", children: "Asia Pacific (Singapore)" }),
                      /* @__PURE__ */ jsx15(SelectItem, { value: "ap-southeast-2", children: "Asia Pacific (Sydney)" })
                    ] })
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] }),
    envVars.length > 0 && /* @__PURE__ */ jsxs10(Card, { children: [
      /* @__PURE__ */ jsxs10(CardHeader, { children: [
        /* @__PURE__ */ jsx15(CardTitle, { className: "text-base", children: "Environment Variables" }),
        /* @__PURE__ */ jsx15(CardDescription, { children: "Settings configured in the database take precedence over environment variables." })
      ] }),
      /* @__PURE__ */ jsx15(CardContent, { children: /* @__PURE__ */ jsx15("div", { className: "grid grid-cols-2 gap-2", children: envVars.map((envVar) => /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-2 text-sm", children: [
        envVar.configured ? /* @__PURE__ */ jsx15(CheckCircle, { className: "h-4 w-4 text-green-500" }) : /* @__PURE__ */ jsx15(XCircle, { className: "h-4 w-4 text-muted-foreground/30" }),
        /* @__PURE__ */ jsx15("span", { className: envVar.configured ? "" : "text-muted-foreground", children: envVar.name })
      ] }, envVar.name)) }) })
    ] }),
    /* @__PURE__ */ jsxs10("div", { className: "flex justify-between", children: [
      /* @__PURE__ */ jsxs10(
        Button,
        {
          variant: "outline",
          onClick: sendTestEmail,
          disabled: testing || !form.fromEmail,
          children: [
            testing ? /* @__PURE__ */ jsx15(Loader24, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx15(Send, { className: "mr-2 h-4 w-4" }),
            "Send Test Email"
          ]
        }
      ),
      /* @__PURE__ */ jsxs10(Button, { onClick: saveSettings, disabled: saving, children: [
        saving ? /* @__PURE__ */ jsx15(Loader24, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx15(Save, { className: "mr-2 h-4 w-4" }),
        "Save Settings"
      ] })
    ] })
  ] });
}

// src/components/admin/media/MediaManager.tsx
import { useState as useState14, useCallback as useCallback5, useEffect as useEffect10 } from "react";

// src/hooks/use-media.ts
import { useState as useState9, useCallback as useCallback3, useEffect as useEffect7 } from "react";
var DEFAULT_FILTERS = {
  page: 1,
  limit: 50,
  sortBy: "createdAt",
  sortOrder: "desc",
  includeDeleted: false
};
function useMedia() {
  const [media, setMedia] = useState9([]);
  const [folders, setFolders] = useState9([]);
  const [tags, setTags] = useState9([]);
  const [selectedIds, setSelectedIds] = useState9(/* @__PURE__ */ new Set());
  const [viewMode, setViewModeState] = useState9("grid");
  const [filters, setFiltersState] = useState9(DEFAULT_FILTERS);
  const [loading, setLoading] = useState9(false);
  const [error, setError] = useState9(null);
  const [pagination, setPagination] = useState9({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  useEffect7(() => {
    const saved = localStorage.getItem("media-view-mode");
    if (saved === "grid" || saved === "list") {
      setViewModeState(saved);
    }
  }, []);
  const setViewMode = useCallback3((mode) => {
    setViewModeState(mode);
    localStorage.setItem("media-view-mode", mode);
  }, []);
  const setFilters = useCallback3((newFilters) => {
    setFiltersState((prev) => __spreadProps(__spreadValues(__spreadValues({}, prev), newFilters), { page: 1 }));
  }, []);
  const setPage = useCallback3((page) => {
    setFiltersState((prev) => __spreadProps(__spreadValues({}, prev), { page }));
  }, []);
  const fetchMedia = useCallback3(async () => {
    var _a;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.folderId !== void 0) {
        params.set("folderId", filters.folderId === null ? "null" : filters.folderId);
      }
      if (filters.type) params.set("type", filters.type);
      if (filters.search) params.set("search", filters.search);
      if ((_a = filters.tagIds) == null ? void 0 : _a.length) params.set("tagIds", filters.tagIds.join(","));
      if (filters.includeDeleted) params.set("includeDeleted", "true");
      if (filters.page) params.set("page", filters.page.toString());
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }
      const data = await response.json();
      const mediaItems = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      setMedia(mediaItems);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 50,
        total: data.total || mediaItems.length || 0,
        totalPages: data.totalPages || 1
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch media");
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  const fetchFolders = useCallback3(async () => {
    try {
      const response = await fetch("/api/media/folders?tree=true");
      if (!response.ok) {
        throw new Error("Failed to fetch folders");
      }
      const data = await response.json();
      setFolders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch folders:", err);
      setFolders([]);
    }
  }, []);
  const fetchTags = useCallback3(async () => {
    try {
      const response = await fetch("/api/media/tags");
      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }
      const data = await response.json();
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
      setTags([]);
    }
  }, []);
  const selectItem = useCallback3((id) => {
    setSelectedIds(/* @__PURE__ */ new Set([id]));
  }, []);
  const toggleItem = useCallback3((id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  const selectAll = useCallback3(() => {
    setSelectedIds(new Set(media.map((m) => m.id)));
  }, [media]);
  const clearSelection = useCallback3(() => {
    setSelectedIds(/* @__PURE__ */ new Set());
  }, []);
  const deleteSelected = useCallback3(
    async (hard = false) => {
      if (selectedIds.size === 0) return;
      try {
        const response = await fetch("/api/media/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "delete",
            mediaIds: Array.from(selectedIds),
            hard
          })
        });
        if (!response.ok) {
          throw new Error("Failed to delete media");
        }
        clearSelection();
        await fetchMedia();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete media");
      }
    },
    [selectedIds, clearSelection, fetchMedia]
  );
  const moveSelected = useCallback3(
    async (folderId) => {
      if (selectedIds.size === 0) return;
      try {
        const response = await fetch("/api/media/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "move",
            mediaIds: Array.from(selectedIds),
            folderId
          })
        });
        if (!response.ok) {
          throw new Error("Failed to move media");
        }
        clearSelection();
        await fetchMedia();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to move media");
      }
    },
    [selectedIds, clearSelection, fetchMedia]
  );
  const tagSelected = useCallback3(
    async (tagIds) => {
      if (selectedIds.size === 0 || tagIds.length === 0) return;
      try {
        const response = await fetch("/api/media/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "tag",
            mediaIds: Array.from(selectedIds),
            tagIds
          })
        });
        if (!response.ok) {
          throw new Error("Failed to tag media");
        }
        clearSelection();
        await fetchMedia();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to tag media");
      }
    },
    [selectedIds, clearSelection, fetchMedia]
  );
  const refreshAll = useCallback3(async () => {
    await Promise.all([fetchMedia(), fetchFolders(), fetchTags()]);
  }, [fetchMedia, fetchFolders, fetchTags]);
  useEffect7(() => {
    fetchMedia();
  }, [fetchMedia]);
  useEffect7(() => {
    fetchFolders();
    fetchTags();
  }, [fetchFolders, fetchTags]);
  return {
    media,
    folders,
    tags,
    selectedIds,
    viewMode,
    filters,
    loading,
    error,
    pagination,
    fetchMedia,
    fetchFolders,
    fetchTags,
    setViewMode,
    setFilters,
    setPage,
    selectItem,
    toggleItem,
    selectAll,
    clearSelection,
    deleteSelected,
    moveSelected,
    tagSelected,
    refreshAll
  };
}

// src/components/admin/media/MediaCard.tsx
import { forwardRef as forwardRef5 } from "react";
import Image4 from "next/image";

// src/components/ui/checkbox.tsx
import * as React7 from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check as Check3 } from "lucide-react";
import { jsx as jsx16 } from "react/jsx-runtime";
var Checkbox = React7.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx16(
    CheckboxPrimitive.Root,
    __spreadProps(__spreadValues({
      ref,
      className: cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )
    }, props), {
      children: /* @__PURE__ */ jsx16(
        CheckboxPrimitive.Indicator,
        {
          className: cn("flex items-center justify-center text-current"),
          children: /* @__PURE__ */ jsx16(Check3, { className: "h-4 w-4" })
        }
      )
    })
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// src/components/admin/media/MediaCard.tsx
import {
  FileText as FileText3,
  Film,
  Music,
  ImageIcon,
  File
} from "lucide-react";
import { jsx as jsx17, jsxs as jsxs11 } from "react/jsx-runtime";
var typeIcons = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  document: FileText3,
  other: File
};
var MediaCard = forwardRef5(
  ({ media, selected, onSelect, onToggle, onClick, onContextMenu }, ref) => {
    var _a;
    const mediaType = getMediaType(media.mimeType);
    const Icon2 = typeIcons[mediaType];
    return /* @__PURE__ */ jsxs11(
      "div",
      {
        ref,
        className: cn(
          "group relative bg-card rounded-lg border cursor-pointer transition-all hover:shadow-md",
          selected && "ring-2 ring-primary"
        ),
        onClick,
        onContextMenu,
        children: [
          /* @__PURE__ */ jsx17(
            "div",
            {
              className: cn(
                "absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
                selected && "opacity-100"
              ),
              onClick: (e) => e.stopPropagation(),
              children: /* @__PURE__ */ jsx17(
                Checkbox,
                {
                  checked: selected,
                  onCheckedChange: () => onToggle(),
                  className: "bg-background/80 backdrop-blur-sm"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs11("div", { className: "aspect-square relative bg-muted rounded-t-lg overflow-hidden", children: [
            mediaType === "image" ? /* @__PURE__ */ jsx17(
              Image4,
              {
                src: media.url,
                alt: media.alt || media.filename,
                fill: true,
                className: "object-cover",
                sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              }
            ) : /* @__PURE__ */ jsx17("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx17(Icon2, { className: "h-16 w-16 text-muted-foreground" }) }),
            mediaType !== "image" && /* @__PURE__ */ jsx17(
              Badge,
              {
                variant: "secondary",
                className: "absolute bottom-2 right-2 text-xs",
                children: ((_a = media.mimeType.split("/")[1]) == null ? void 0 : _a.toUpperCase()) || mediaType
              }
            )
          ] }),
          /* @__PURE__ */ jsxs11("div", { className: "p-3", children: [
            /* @__PURE__ */ jsx17("p", { className: "font-medium text-sm truncate", title: media.title || media.filename, children: media.title || media.filename }),
            /* @__PURE__ */ jsxs11("p", { className: "text-xs text-muted-foreground mt-1", children: [
              formatFileSize(media.size),
              media.width && media.height && /* @__PURE__ */ jsxs11("span", { className: "ml-2", children: [
                media.width,
                " \xD7 ",
                media.height
              ] })
            ] }),
            media.tags && media.tags.length > 0 && /* @__PURE__ */ jsxs11("div", { className: "flex flex-wrap gap-1 mt-2", children: [
              media.tags.slice(0, 3).map((tagRelation) => /* @__PURE__ */ jsx17(
                Badge,
                {
                  variant: "outline",
                  className: "text-xs py-0",
                  style: tagRelation.tag.color ? { borderColor: tagRelation.tag.color } : void 0,
                  children: tagRelation.tag.name
                },
                tagRelation.tag.id
              )),
              media.tags.length > 3 && /* @__PURE__ */ jsxs11(Badge, { variant: "outline", className: "text-xs py-0", children: [
                "+",
                media.tags.length - 3
              ] })
            ] })
          ] })
        ]
      }
    );
  }
);
MediaCard.displayName = "MediaCard";

// src/components/ui/context-menu.tsx
import * as React8 from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check as Check4, ChevronRight as ChevronRight3, Circle } from "lucide-react";
import { jsx as jsx18, jsxs as jsxs12 } from "react/jsx-runtime";
var ContextMenu = ContextMenuPrimitive.Root;
var ContextMenuTrigger = ContextMenuPrimitive.Trigger;
var ContextMenuSub = ContextMenuPrimitive.Sub;
var ContextMenuSubTrigger = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, inset, children } = _b, props = __objRest(_b, ["className", "inset", "children"]);
  return /* @__PURE__ */ jsxs12(
    ContextMenuPrimitive.SubTrigger,
    __spreadProps(__spreadValues({
      ref,
      className: cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        inset && "pl-8",
        className
      )
    }, props), {
      children: [
        children,
        /* @__PURE__ */ jsx18(ChevronRight3, { className: "ml-auto h-4 w-4" })
      ]
    })
  );
});
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;
var ContextMenuSubContent = React8.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx18(
    ContextMenuPrimitive.SubContent,
    __spreadValues({
      ref,
      className: cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )
    }, props)
  );
});
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;
var ContextMenuContent = React8.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx18(ContextMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx18(
    ContextMenuPrimitive.Content,
    __spreadValues({
      ref,
      className: cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )
    }, props)
  ) });
});
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;
var ContextMenuItem = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, inset } = _b, props = __objRest(_b, ["className", "inset"]);
  return /* @__PURE__ */ jsx18(
    ContextMenuPrimitive.Item,
    __spreadValues({
      ref,
      className: cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )
    }, props)
  );
});
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;
var ContextMenuCheckboxItem = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, children, checked } = _b, props = __objRest(_b, ["className", "children", "checked"]);
  return /* @__PURE__ */ jsxs12(
    ContextMenuPrimitive.CheckboxItem,
    __spreadProps(__spreadValues({
      ref,
      className: cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      ),
      checked
    }, props), {
      children: [
        /* @__PURE__ */ jsx18("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx18(ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx18(Check4, { className: "h-4 w-4" }) }) }),
        children
      ]
    })
  );
});
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;
var ContextMenuRadioItem = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, children } = _b, props = __objRest(_b, ["className", "children"]);
  return /* @__PURE__ */ jsxs12(
    ContextMenuPrimitive.RadioItem,
    __spreadProps(__spreadValues({
      ref,
      className: cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )
    }, props), {
      children: [
        /* @__PURE__ */ jsx18("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx18(ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx18(Circle, { className: "h-2 w-2 fill-current" }) }) }),
        children
      ]
    })
  );
});
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;
var ContextMenuLabel = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, inset } = _b, props = __objRest(_b, ["className", "inset"]);
  return /* @__PURE__ */ jsx18(
    ContextMenuPrimitive.Label,
    __spreadValues({
      ref,
      className: cn(
        "px-2 py-1.5 text-sm font-semibold text-foreground",
        inset && "pl-8",
        className
      )
    }, props)
  );
});
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;
var ContextMenuSeparator = React8.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx18(
    ContextMenuPrimitive.Separator,
    __spreadValues({
      ref,
      className: cn("-mx-1 my-1 h-px bg-border", className)
    }, props)
  );
});
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;
var ContextMenuShortcut = (_a) => {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx18(
    "span",
    __spreadValues({
      className: cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )
    }, props)
  );
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

// src/components/admin/media/MediaContextMenu.tsx
import {
  Eye as Eye3,
  ExternalLink,
  Copy,
  Download as Download3,
  Pencil,
  FolderInput,
  Tags,
  FileSearch,
  Trash,
  FolderIcon,
  Tag
} from "lucide-react";
import { jsx as jsx19, jsxs as jsxs13 } from "react/jsx-runtime";
function MediaContextMenu({
  children,
  media,
  folders,
  tags,
  onPreview,
  onOpenInNewTab,
  onCopyUrl,
  onDownload,
  onRename,
  onEditDetails,
  onMove,
  onAddTag,
  onViewUsage,
  onDelete
}) {
  var _a;
  const existingTagIds = new Set(((_a = media.tags) == null ? void 0 : _a.map((t) => t.tag.id)) || []);
  const renderFolderOptions = (folders2, depth = 0) => {
    return folders2.map((folder) => /* @__PURE__ */ jsxs13("div", { children: [
      /* @__PURE__ */ jsx19(
        ContextMenuItem,
        {
          onClick: () => onMove(folder.id),
          disabled: media.folderId === folder.id,
          children: /* @__PURE__ */ jsxs13("span", { style: { paddingLeft: depth * 12 }, children: [
            /* @__PURE__ */ jsx19(FolderIcon, { className: "mr-2 h-4 w-4 inline" }),
            folder.name
          ] })
        }
      ),
      folder.children && folder.children.length > 0 && renderFolderOptions(folder.children, depth + 1)
    ] }, folder.id));
  };
  return /* @__PURE__ */ jsxs13(ContextMenu, { children: [
    /* @__PURE__ */ jsx19(ContextMenuTrigger, { asChild: true, children }),
    /* @__PURE__ */ jsxs13(ContextMenuContent, { className: "w-64", children: [
      /* @__PURE__ */ jsxs13(ContextMenuItem, { onClick: onPreview, children: [
        /* @__PURE__ */ jsx19(Eye3, { className: "mr-2 h-4 w-4" }),
        "Preview"
      ] }),
      /* @__PURE__ */ jsxs13(ContextMenuItem, { onClick: onOpenInNewTab, children: [
        /* @__PURE__ */ jsx19(ExternalLink, { className: "mr-2 h-4 w-4" }),
        "Open in new tab"
      ] }),
      /* @__PURE__ */ jsxs13(ContextMenuItem, { onClick: onCopyUrl, children: [
        /* @__PURE__ */ jsx19(Copy, { className: "mr-2 h-4 w-4" }),
        "Copy URL"
      ] }),
      /* @__PURE__ */ jsxs13(ContextMenuItem, { onClick: onDownload, children: [
        /* @__PURE__ */ jsx19(Download3, { className: "mr-2 h-4 w-4" }),
        "Download"
      ] }),
      /* @__PURE__ */ jsx19(ContextMenuSeparator, {}),
      /* @__PURE__ */ jsxs13(ContextMenuItem, { onClick: onRename, children: [
        /* @__PURE__ */ jsx19(Pencil, { className: "mr-2 h-4 w-4" }),
        "Rename"
      ] }),
      /* @__PURE__ */ jsxs13(ContextMenuItem, { onClick: onEditDetails, children: [
        /* @__PURE__ */ jsx19(Pencil, { className: "mr-2 h-4 w-4" }),
        "Edit details"
      ] }),
      /* @__PURE__ */ jsxs13(ContextMenuSub, { children: [
        /* @__PURE__ */ jsxs13(ContextMenuSubTrigger, { children: [
          /* @__PURE__ */ jsx19(FolderInput, { className: "mr-2 h-4 w-4" }),
          "Move to folder"
        ] }),
        /* @__PURE__ */ jsxs13(ContextMenuSubContent, { className: "w-48 max-h-64 overflow-y-auto", children: [
          /* @__PURE__ */ jsxs13(
            ContextMenuItem,
            {
              onClick: () => onMove(null),
              disabled: media.folderId === null,
              children: [
                /* @__PURE__ */ jsx19(FolderIcon, { className: "mr-2 h-4 w-4" }),
                "Root (No folder)"
              ]
            }
          ),
          /* @__PURE__ */ jsx19(ContextMenuSeparator, {}),
          folders.length > 0 ? renderFolderOptions(folders) : /* @__PURE__ */ jsx19(ContextMenuItem, { disabled: true, children: "No folders available" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs13(ContextMenuSub, { children: [
        /* @__PURE__ */ jsxs13(ContextMenuSubTrigger, { children: [
          /* @__PURE__ */ jsx19(Tags, { className: "mr-2 h-4 w-4" }),
          "Add tags"
        ] }),
        /* @__PURE__ */ jsx19(ContextMenuSubContent, { className: "w-48 max-h-64 overflow-y-auto", children: tags.length > 0 ? tags.map((tag) => /* @__PURE__ */ jsxs13(
          ContextMenuItem,
          {
            onClick: () => onAddTag(tag.id),
            disabled: existingTagIds.has(tag.id),
            children: [
              /* @__PURE__ */ jsx19(
                Tag,
                {
                  className: "mr-2 h-4 w-4",
                  style: tag.color ? { color: tag.color } : void 0
                }
              ),
              tag.name,
              existingTagIds.has(tag.id) && /* @__PURE__ */ jsx19("span", { className: "ml-auto text-xs text-muted-foreground", children: "Added" })
            ]
          },
          tag.id
        )) : /* @__PURE__ */ jsx19(ContextMenuItem, { disabled: true, children: "No tags available" }) })
      ] }),
      /* @__PURE__ */ jsx19(ContextMenuSeparator, {}),
      /* @__PURE__ */ jsxs13(ContextMenuItem, { onClick: onViewUsage, children: [
        /* @__PURE__ */ jsx19(FileSearch, { className: "mr-2 h-4 w-4" }),
        "View usage"
      ] }),
      /* @__PURE__ */ jsx19(ContextMenuSeparator, {}),
      /* @__PURE__ */ jsxs13(ContextMenuItem, { onClick: onDelete, className: "text-destructive", children: [
        /* @__PURE__ */ jsx19(Trash, { className: "mr-2 h-4 w-4" }),
        "Delete"
      ] })
    ] })
  ] });
}

// src/components/ui/skeleton.tsx
import { jsx as jsx20 } from "react/jsx-runtime";
function Skeleton(_a) {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx20(
    "div",
    __spreadValues({
      className: cn("animate-pulse rounded-md bg-muted", className)
    }, props)
  );
}

// src/components/admin/media/MediaGrid.tsx
import { jsx as jsx21, jsxs as jsxs14 } from "react/jsx-runtime";
function MediaGrid({
  media,
  selectedIds,
  folders,
  tags,
  loading,
  onSelect,
  onToggle,
  onClick,
  onPreview,
  onMove,
  onAddTag,
  onDelete,
  onRename,
  onEditDetails,
  onViewUsage
}) {
  if (loading) {
    return /* @__PURE__ */ jsx21("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4", children: Array.from({ length: 12 }).map((_, i) => /* @__PURE__ */ jsxs14("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx21(Skeleton, { className: "aspect-square rounded-lg" }),
      /* @__PURE__ */ jsx21(Skeleton, { className: "h-4 w-3/4" }),
      /* @__PURE__ */ jsx21(Skeleton, { className: "h-3 w-1/2" })
    ] }, i)) });
  }
  if (media.length === 0) {
    return /* @__PURE__ */ jsxs14("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
      /* @__PURE__ */ jsx21("p", { className: "text-muted-foreground", children: "No media files found" }),
      /* @__PURE__ */ jsx21("p", { className: "text-sm text-muted-foreground mt-1", children: "Upload files or change your filters" })
    ] });
  }
  return /* @__PURE__ */ jsx21("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4", children: media.map((item) => /* @__PURE__ */ jsx21(
    MediaContextMenu,
    {
      media: item,
      folders,
      tags,
      onPreview: () => onPreview(item),
      onOpenInNewTab: () => window.open(item.url, "_blank"),
      onCopyUrl: () => navigator.clipboard.writeText(item.url),
      onDownload: () => {
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.filename;
        a.click();
      },
      onRename: () => onRename(item),
      onEditDetails: () => onEditDetails(item),
      onMove: (folderId) => onMove(item.id, folderId),
      onAddTag: (tagId) => onAddTag(item.id, tagId),
      onViewUsage: () => onViewUsage(item),
      onDelete: () => onDelete(item.id),
      children: /* @__PURE__ */ jsx21(
        MediaCard,
        {
          media: item,
          selected: selectedIds.has(item.id),
          onSelect: () => onSelect(item.id),
          onToggle: () => onToggle(item.id),
          onClick: () => onClick(item)
        }
      )
    },
    item.id
  )) });
}

// src/components/admin/media/MediaRow.tsx
import { forwardRef as forwardRef8 } from "react";
import Image5 from "next/image";

// src/components/ui/table.tsx
import * as React9 from "react";
import { jsx as jsx22 } from "react/jsx-runtime";
var Table = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx22("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsx22(
    "table",
    __spreadValues({
      ref,
      className: cn("w-full caption-bottom text-sm", className)
    }, props)
  ) });
});
Table.displayName = "Table";
var TableHeader = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx22("thead", __spreadValues({ ref, className: cn("[&_tr]:border-b", className) }, props));
});
TableHeader.displayName = "TableHeader";
var TableBody = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx22(
    "tbody",
    __spreadValues({
      ref,
      className: cn("[&_tr:last-child]:border-0", className)
    }, props)
  );
});
TableBody.displayName = "TableBody";
var TableFooter = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx22(
    "tfoot",
    __spreadValues({
      ref,
      className: cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )
    }, props)
  );
});
TableFooter.displayName = "TableFooter";
var TableRow = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx22(
    "tr",
    __spreadValues({
      ref,
      className: cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )
    }, props)
  );
});
TableRow.displayName = "TableRow";
var TableHead = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx22(
    "th",
    __spreadValues({
      ref,
      className: cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )
    }, props)
  );
});
TableHead.displayName = "TableHead";
var TableCell = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx22(
    "td",
    __spreadValues({
      ref,
      className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)
    }, props)
  );
});
TableCell.displayName = "TableCell";
var TableCaption = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx22(
    "caption",
    __spreadValues({
      ref,
      className: cn("mt-4 text-sm text-muted-foreground", className)
    }, props)
  );
});
TableCaption.displayName = "TableCaption";

// src/components/admin/media/MediaRow.tsx
import { format } from "date-fns";
import {
  FileText as FileText4,
  Film as Film2,
  Music as Music2,
  ImageIcon as ImageIcon2,
  File as File2
} from "lucide-react";
import { jsx as jsx23, jsxs as jsxs15 } from "react/jsx-runtime";
var typeIcons2 = {
  image: ImageIcon2,
  video: Film2,
  audio: Music2,
  document: FileText4,
  other: File2
};
var MediaRow = forwardRef8(
  ({ media, selected, onSelect, onToggle, onClick, onContextMenu }, ref) => {
    const mediaType = getMediaType(media.mimeType);
    const Icon2 = typeIcons2[mediaType];
    return /* @__PURE__ */ jsxs15(
      TableRow,
      {
        ref,
        className: cn("cursor-pointer", selected && "bg-accent"),
        onClick,
        onContextMenu,
        children: [
          /* @__PURE__ */ jsx23(TableCell, { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx23(Checkbox, { checked: selected, onCheckedChange: () => onToggle() }) }),
          /* @__PURE__ */ jsx23(TableCell, { className: "w-12", children: /* @__PURE__ */ jsx23("div", { className: "w-10 h-10 relative bg-muted rounded overflow-hidden", children: mediaType === "image" ? /* @__PURE__ */ jsx23(
            Image5,
            {
              src: media.url,
              alt: media.alt || media.filename,
              fill: true,
              className: "object-cover",
              sizes: "40px"
            }
          ) : /* @__PURE__ */ jsx23("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx23(Icon2, { className: "h-5 w-5 text-muted-foreground" }) }) }) }),
          /* @__PURE__ */ jsx23(TableCell, { children: /* @__PURE__ */ jsxs15("div", { children: [
            /* @__PURE__ */ jsx23("p", { className: "font-medium truncate max-w-[200px]", children: media.title || media.filename }),
            /* @__PURE__ */ jsx23("p", { className: "text-xs text-muted-foreground", children: media.filename })
          ] }) }),
          /* @__PURE__ */ jsx23(TableCell, { children: /* @__PURE__ */ jsx23(Badge, { variant: "outline", className: "text-xs", children: mediaType }) }),
          /* @__PURE__ */ jsx23(TableCell, { className: "text-muted-foreground", children: formatFileSize(media.size) }),
          /* @__PURE__ */ jsx23(TableCell, { className: "text-muted-foreground", children: media.width && media.height ? `${media.width} \xD7 ${media.height}` : "-" }),
          /* @__PURE__ */ jsx23(TableCell, { children: media.tags && media.tags.length > 0 && /* @__PURE__ */ jsxs15("div", { className: "flex flex-wrap gap-1", children: [
            media.tags.slice(0, 2).map((tagRelation) => /* @__PURE__ */ jsx23(
              Badge,
              {
                variant: "outline",
                className: "text-xs py-0",
                style: tagRelation.tag.color ? { borderColor: tagRelation.tag.color } : void 0,
                children: tagRelation.tag.name
              },
              tagRelation.tag.id
            )),
            media.tags.length > 2 && /* @__PURE__ */ jsxs15(Badge, { variant: "outline", className: "text-xs py-0", children: [
              "+",
              media.tags.length - 2
            ] })
          ] }) }),
          /* @__PURE__ */ jsx23(TableCell, { className: "text-muted-foreground text-sm", children: format(new Date(media.createdAt), "MMM d, yyyy") })
        ]
      }
    );
  }
);
MediaRow.displayName = "MediaRow";

// src/components/admin/media/MediaList.tsx
import { jsx as jsx24, jsxs as jsxs16 } from "react/jsx-runtime";
function MediaList({
  media,
  selectedIds,
  folders,
  tags,
  loading,
  onSelect,
  onToggle,
  onSelectAll,
  onClick,
  onPreview,
  onMove,
  onAddTag,
  onDelete,
  onRename,
  onEditDetails,
  onViewUsage
}) {
  const allSelected = media.length > 0 && selectedIds.size === media.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < media.length;
  if (loading) {
    return /* @__PURE__ */ jsx24("div", { className: "space-y-2", children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-4 py-3", children: [
      /* @__PURE__ */ jsx24(Skeleton, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx24(Skeleton, { className: "h-10 w-10 rounded" }),
      /* @__PURE__ */ jsxs16("div", { className: "flex-1 space-y-1", children: [
        /* @__PURE__ */ jsx24(Skeleton, { className: "h-4 w-48" }),
        /* @__PURE__ */ jsx24(Skeleton, { className: "h-3 w-32" })
      ] }),
      /* @__PURE__ */ jsx24(Skeleton, { className: "h-4 w-16" }),
      /* @__PURE__ */ jsx24(Skeleton, { className: "h-4 w-20" })
    ] }, i)) });
  }
  if (media.length === 0) {
    return /* @__PURE__ */ jsxs16("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
      /* @__PURE__ */ jsx24("p", { className: "text-muted-foreground", children: "No media files found" }),
      /* @__PURE__ */ jsx24("p", { className: "text-sm text-muted-foreground mt-1", children: "Upload files or change your filters" })
    ] });
  }
  return /* @__PURE__ */ jsx24("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs16(Table, { children: [
    /* @__PURE__ */ jsx24(TableHeader, { children: /* @__PURE__ */ jsxs16(TableRow, { children: [
      /* @__PURE__ */ jsx24(TableHead, { className: "w-12", children: /* @__PURE__ */ jsx24(
        Checkbox,
        {
          checked: allSelected,
          ref: (el) => {
            if (el) {
              el.indeterminate = someSelected;
            }
          },
          onCheckedChange: onSelectAll
        }
      ) }),
      /* @__PURE__ */ jsx24(TableHead, { className: "w-12" }),
      /* @__PURE__ */ jsx24(TableHead, { children: "Name" }),
      /* @__PURE__ */ jsx24(TableHead, { children: "Type" }),
      /* @__PURE__ */ jsx24(TableHead, { children: "Size" }),
      /* @__PURE__ */ jsx24(TableHead, { children: "Dimensions" }),
      /* @__PURE__ */ jsx24(TableHead, { children: "Tags" }),
      /* @__PURE__ */ jsx24(TableHead, { children: "Date" })
    ] }) }),
    /* @__PURE__ */ jsx24(TableBody, { children: media.map((item) => /* @__PURE__ */ jsx24(
      MediaContextMenu,
      {
        media: item,
        folders,
        tags,
        onPreview: () => onPreview(item),
        onOpenInNewTab: () => window.open(item.url, "_blank"),
        onCopyUrl: () => navigator.clipboard.writeText(item.url),
        onDownload: () => {
          const a = document.createElement("a");
          a.href = item.url;
          a.download = item.filename;
          a.click();
        },
        onRename: () => onRename(item),
        onEditDetails: () => onEditDetails(item),
        onMove: (folderId) => onMove(item.id, folderId),
        onAddTag: (tagId) => onAddTag(item.id, tagId),
        onViewUsage: () => onViewUsage(item),
        onDelete: () => onDelete(item.id),
        children: /* @__PURE__ */ jsx24(
          MediaRow,
          {
            media: item,
            selected: selectedIds.has(item.id),
            onSelect: () => onSelect(item.id),
            onToggle: () => onToggle(item.id),
            onClick: () => onClick(item)
          }
        )
      },
      item.id
    )) })
  ] }) });
}

// src/components/admin/media/MediaToolbar.tsx
import { LayoutGrid, List, Upload as Upload3, Search as Search3, SlidersHorizontal } from "lucide-react";
import { jsx as jsx25, jsxs as jsxs17 } from "react/jsx-runtime";
var typeOptions = [
  { value: "all", label: "All Types" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Documents" }
];
var sortOptions = [
  { value: "createdAt-desc", label: "Newest first" },
  { value: "createdAt-asc", label: "Oldest first" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "size-desc", label: "Largest first" },
  { value: "size-asc", label: "Smallest first" }
];
function MediaToolbar({
  viewMode,
  filters,
  onViewModeChange,
  onSearch,
  onTypeFilter,
  onSortChange,
  onUpload
}) {
  const currentSort = `${filters.sortBy || "createdAt"}-${filters.sortOrder || "desc"}`;
  return /* @__PURE__ */ jsxs17("div", { className: "flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between", children: [
    /* @__PURE__ */ jsxs17("div", { className: "flex flex-wrap gap-2 items-center", children: [
      /* @__PURE__ */ jsxs17("div", { className: "relative", children: [
        /* @__PURE__ */ jsx25(Search3, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx25(
          Input,
          {
            placeholder: "Search media...",
            value: filters.search || "",
            onChange: (e) => onSearch(e.target.value),
            className: "pl-8 w-[200px]"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs17(
        Select,
        {
          value: filters.type || "all",
          onValueChange: (value) => onTypeFilter(value === "all" ? void 0 : value),
          children: [
            /* @__PURE__ */ jsx25(SelectTrigger, { className: "w-[140px]", children: /* @__PURE__ */ jsx25(SelectValue, { placeholder: "All types" }) }),
            /* @__PURE__ */ jsx25(SelectContent, { children: typeOptions.map((option) => /* @__PURE__ */ jsx25(SelectItem, { value: option.value, children: option.label }, option.value)) })
          ]
        }
      ),
      /* @__PURE__ */ jsxs17(
        Select,
        {
          value: currentSort,
          onValueChange: (value) => {
            const [sortBy, sortOrder] = value.split("-");
            onSortChange(sortBy, sortOrder);
          },
          children: [
            /* @__PURE__ */ jsxs17(SelectTrigger, { className: "w-[160px]", children: [
              /* @__PURE__ */ jsx25(SlidersHorizontal, { className: "h-4 w-4 mr-2" }),
              /* @__PURE__ */ jsx25(SelectValue, { placeholder: "Sort by" })
            ] }),
            /* @__PURE__ */ jsx25(SelectContent, { children: sortOptions.map((option) => /* @__PURE__ */ jsx25(SelectItem, { value: option.value, children: option.label }, option.value)) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs17("div", { className: "flex gap-2 items-center", children: [
      /* @__PURE__ */ jsxs17("div", { className: "flex border rounded-md", children: [
        /* @__PURE__ */ jsx25(
          Button,
          {
            variant: viewMode === "grid" ? "secondary" : "ghost",
            size: "sm",
            className: "rounded-r-none",
            onClick: () => onViewModeChange("grid"),
            children: /* @__PURE__ */ jsx25(LayoutGrid, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsx25(
          Button,
          {
            variant: viewMode === "list" ? "secondary" : "ghost",
            size: "sm",
            className: "rounded-l-none",
            onClick: () => onViewModeChange("list"),
            children: /* @__PURE__ */ jsx25(List, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs17(Button, { onClick: onUpload, children: [
        /* @__PURE__ */ jsx25(Upload3, { className: "h-4 w-4 mr-2" }),
        "Upload"
      ] })
    ] })
  ] });
}

// src/components/admin/media/MediaFolderTree.tsx
import { useState as useState10 } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight as ChevronRight4,
  ChevronDown as ChevronDown3,
  Clock,
  Image as Image6,
  FolderPlus
} from "lucide-react";
import { jsx as jsx26, jsxs as jsxs18 } from "react/jsx-runtime";
function FolderNode({
  folder,
  selectedFolderId,
  onSelect,
  depth = 0
}) {
  const [expanded, setExpanded] = useState10(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;
  const FolderIcon3 = expanded ? FolderOpen : Folder;
  return /* @__PURE__ */ jsxs18("div", { children: [
    /* @__PURE__ */ jsxs18(
      "button",
      {
        onClick: () => onSelect(folder.id),
        className: cn(
          "w-full flex items-center gap-1 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
          isSelected && "bg-accent"
        ),
        style: { paddingLeft: 8 + depth * 16 },
        children: [
          hasChildren ? /* @__PURE__ */ jsx26(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              },
              className: "p-0.5 hover:bg-muted rounded",
              children: expanded ? /* @__PURE__ */ jsx26(ChevronDown3, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx26(ChevronRight4, { className: "h-3 w-3" })
            }
          ) : /* @__PURE__ */ jsx26("span", { className: "w-4" }),
          /* @__PURE__ */ jsx26(
            FolderIcon3,
            {
              className: "h-4 w-4 text-muted-foreground flex-shrink-0",
              style: folder.color ? { color: folder.color } : void 0
            }
          ),
          /* @__PURE__ */ jsx26("span", { className: "truncate flex-1 text-left", children: folder.name }),
          folder.mediaCount !== void 0 && folder.mediaCount > 0 && /* @__PURE__ */ jsx26("span", { className: "text-xs text-muted-foreground", children: folder.mediaCount })
        ]
      }
    ),
    expanded && hasChildren && /* @__PURE__ */ jsx26("div", { children: folder.children.map((child) => /* @__PURE__ */ jsx26(
      FolderNode,
      {
        folder: child,
        selectedFolderId,
        onSelect,
        depth: depth + 1
      },
      child.id
    )) })
  ] });
}
function MediaFolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder
}) {
  return /* @__PURE__ */ jsxs18("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsx26("div", { className: "p-3 border-b", children: /* @__PURE__ */ jsx26("h3", { className: "font-semibold text-sm", children: "Folders" }) }),
    /* @__PURE__ */ jsx26(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxs18("div", { className: "p-2 space-y-1", children: [
      /* @__PURE__ */ jsxs18(
        "button",
        {
          onClick: () => onSelectFolder(void 0),
          className: cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
            selectedFolderId === void 0 && "bg-accent"
          ),
          children: [
            /* @__PURE__ */ jsx26(Clock, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx26("span", { children: "Recent" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs18(
        "button",
        {
          onClick: () => onSelectFolder(null),
          className: cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
            selectedFolderId === null && "bg-accent"
          ),
          children: [
            /* @__PURE__ */ jsx26(Image6, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx26("span", { children: "All Media" })
          ]
        }
      ),
      folders.length > 0 && /* @__PURE__ */ jsx26("div", { className: "pt-2 mt-2 border-t", children: folders.map((folder) => /* @__PURE__ */ jsx26(
        FolderNode,
        {
          folder,
          selectedFolderId,
          onSelect: onSelectFolder
        },
        folder.id
      )) })
    ] }) }),
    /* @__PURE__ */ jsx26("div", { className: "p-3 border-t", children: /* @__PURE__ */ jsxs18(
      Button,
      {
        variant: "outline",
        size: "sm",
        className: "w-full",
        onClick: onCreateFolder,
        children: [
          /* @__PURE__ */ jsx26(FolderPlus, { className: "h-4 w-4 mr-2" }),
          "New Folder"
        ]
      }
    ) })
  ] });
}

// src/components/ui/dropdown-menu.tsx
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon as CheckIcon2, ChevronRightIcon, CircleIcon } from "lucide-react";
import { jsx as jsx27, jsxs as jsxs19 } from "react/jsx-runtime";
function DropdownMenu(_a) {
  var props = __objRest(_a, []);
  return /* @__PURE__ */ jsx27(DropdownMenuPrimitive.Root, __spreadValues({ "data-slot": "dropdown-menu" }, props));
}
function DropdownMenuTrigger(_a) {
  var props = __objRest(_a, []);
  return /* @__PURE__ */ jsx27(
    DropdownMenuPrimitive.Trigger,
    __spreadValues({
      "data-slot": "dropdown-menu-trigger"
    }, props)
  );
}
function DropdownMenuContent(_a) {
  var _b = _a, {
    className,
    sideOffset = 4
  } = _b, props = __objRest(_b, [
    "className",
    "sideOffset"
  ]);
  return /* @__PURE__ */ jsx27(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx27(
    DropdownMenuPrimitive.Content,
    __spreadValues({
      "data-slot": "dropdown-menu-content",
      sideOffset,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className
      )
    }, props)
  ) });
}
function DropdownMenuItem(_a) {
  var _b = _a, {
    className,
    inset,
    variant = "default"
  } = _b, props = __objRest(_b, [
    "className",
    "inset",
    "variant"
  ]);
  return /* @__PURE__ */ jsx27(
    DropdownMenuPrimitive.Item,
    __spreadValues({
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )
    }, props)
  );
}
function DropdownMenuSeparator(_a) {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx27(
    DropdownMenuPrimitive.Separator,
    __spreadValues({
      "data-slot": "dropdown-menu-separator",
      className: cn("bg-border -mx-1 my-1 h-px", className)
    }, props)
  );
}

// src/components/admin/media/MediaBulkActions.tsx
import {
  X as X4,
  FolderInput as FolderInput2,
  Tags as Tags2,
  Trash as Trash2,
  FolderIcon as FolderIcon2,
  Tag as Tag2
} from "lucide-react";
import { Fragment as Fragment5, jsx as jsx28, jsxs as jsxs20 } from "react/jsx-runtime";
function MediaBulkActions({
  selectedCount,
  folders,
  tags,
  onClearSelection,
  onMove,
  onTag,
  onDelete
}) {
  if (selectedCount === 0) return null;
  const renderFolderOptions = (folders2, depth = 0) => {
    return folders2.flatMap((folder) => [
      /* @__PURE__ */ jsx28(DropdownMenuItem, { onClick: () => onMove(folder.id), children: /* @__PURE__ */ jsxs20("span", { style: { paddingLeft: depth * 12 }, children: [
        /* @__PURE__ */ jsx28(FolderIcon2, { className: "mr-2 h-4 w-4 inline" }),
        folder.name
      ] }) }, folder.id),
      ...folder.children && folder.children.length > 0 ? renderFolderOptions(folder.children, depth + 1) : []
    ]);
  };
  return /* @__PURE__ */ jsxs20("div", { className: "flex items-center gap-3 p-3 bg-muted rounded-lg", children: [
    /* @__PURE__ */ jsxs20("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx28(Button, { variant: "ghost", size: "sm", onClick: onClearSelection, children: /* @__PURE__ */ jsx28(X4, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxs20("span", { className: "text-sm font-medium", children: [
        selectedCount,
        " item",
        selectedCount !== 1 ? "s" : "",
        " selected"
      ] })
    ] }),
    /* @__PURE__ */ jsxs20("div", { className: "flex items-center gap-2 ml-auto", children: [
      /* @__PURE__ */ jsxs20(DropdownMenu, { children: [
        /* @__PURE__ */ jsx28(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs20(Button, { variant: "outline", size: "sm", children: [
          /* @__PURE__ */ jsx28(FolderInput2, { className: "h-4 w-4 mr-2" }),
          "Move"
        ] }) }),
        /* @__PURE__ */ jsxs20(DropdownMenuContent, { className: "w-48 max-h-64 overflow-y-auto", children: [
          /* @__PURE__ */ jsxs20(DropdownMenuItem, { onClick: () => onMove(null), children: [
            /* @__PURE__ */ jsx28(FolderIcon2, { className: "mr-2 h-4 w-4" }),
            "Root (No folder)"
          ] }),
          folders.length > 0 && /* @__PURE__ */ jsxs20(Fragment5, { children: [
            /* @__PURE__ */ jsx28(DropdownMenuSeparator, {}),
            renderFolderOptions(folders)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs20(DropdownMenu, { children: [
        /* @__PURE__ */ jsx28(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs20(Button, { variant: "outline", size: "sm", children: [
          /* @__PURE__ */ jsx28(Tags2, { className: "h-4 w-4 mr-2" }),
          "Tag"
        ] }) }),
        /* @__PURE__ */ jsx28(DropdownMenuContent, { className: "w-48 max-h-64 overflow-y-auto", children: tags.length > 0 ? tags.map((tag) => /* @__PURE__ */ jsxs20(DropdownMenuItem, { onClick: () => onTag([tag.id]), children: [
          /* @__PURE__ */ jsx28(
            Tag2,
            {
              className: "mr-2 h-4 w-4",
              style: tag.color ? { color: tag.color } : void 0
            }
          ),
          tag.name
        ] }, tag.id)) : /* @__PURE__ */ jsx28(DropdownMenuItem, { disabled: true, children: "No tags available" }) })
      ] }),
      /* @__PURE__ */ jsxs20(Button, { variant: "destructive", size: "sm", onClick: onDelete, children: [
        /* @__PURE__ */ jsx28(Trash2, { className: "h-4 w-4 mr-2" }),
        "Delete"
      ] })
    ] })
  ] });
}

// src/components/admin/media/MediaPreviewSheet.tsx
import { useState as useState11, useEffect as useEffect8 } from "react";
import Image7 from "next/image";

// src/components/ui/sheet.tsx
import * as React10 from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva as cva2 } from "class-variance-authority";
import { X as X5 } from "lucide-react";
import { jsx as jsx29, jsxs as jsxs21 } from "react/jsx-runtime";
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React10.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx29(
    SheetPrimitive.Overlay,
    __spreadProps(__spreadValues({
      className: cn(
        "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )
    }, props), {
      ref
    })
  );
});
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = cva2(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
var SheetContent = React10.forwardRef((_a, ref) => {
  var _b = _a, { side = "right", className, children } = _b, props = __objRest(_b, ["side", "className", "children"]);
  return /* @__PURE__ */ jsxs21(SheetPortal, { children: [
    /* @__PURE__ */ jsx29(SheetOverlay, {}),
    /* @__PURE__ */ jsxs21(
      SheetPrimitive.Content,
      __spreadProps(__spreadValues({
        ref,
        className: cn(sheetVariants({ side }), className)
      }, props), {
        children: [
          children,
          /* @__PURE__ */ jsxs21(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
            /* @__PURE__ */ jsx29(X5, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx29("span", { className: "sr-only", children: "Close" })
          ] })
        ]
      })
    )
  ] });
});
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = (_a) => {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx29(
    "div",
    __spreadValues({
      className: cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )
    }, props)
  );
};
SheetHeader.displayName = "SheetHeader";
var SheetFooter = (_a) => {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx29(
    "div",
    __spreadValues({
      className: cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )
    }, props)
  );
};
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React10.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx29(
    SheetPrimitive.Title,
    __spreadValues({
      ref,
      className: cn("text-lg font-semibold text-foreground", className)
    }, props)
  );
});
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React10.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx29(
    SheetPrimitive.Description,
    __spreadValues({
      ref,
      className: cn("text-sm text-muted-foreground", className)
    }, props)
  );
});
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/admin/media/MediaPreviewSheet.tsx
import { format as format2 } from "date-fns";
import {
  FileText as FileText5,
  Film as Film3,
  Music as Music3,
  ImageIcon as ImageIcon3,
  File as File3,
  ExternalLink as ExternalLink2,
  Copy as Copy2,
  Download as Download4,
  Trash as Trash3,
  Save as Save2
} from "lucide-react";
import { Fragment as Fragment6, jsx as jsx30, jsxs as jsxs22 } from "react/jsx-runtime";
var typeIcons3 = {
  image: ImageIcon3,
  video: Film3,
  audio: Music3,
  document: FileText5,
  other: File3
};
function MediaPreviewSheet({
  media,
  open,
  onClose,
  onSave,
  onDelete
}) {
  const [title, setTitle] = useState11("");
  const [alt, setAlt] = useState11("");
  const [caption, setCaption] = useState11("");
  const [description, setDescription] = useState11("");
  const [usage, setUsage] = useState11([]);
  const [loadingUsage, setLoadingUsage] = useState11(false);
  const [saving, setSaving] = useState11(false);
  useEffect8(() => {
    if (media) {
      setTitle(media.title || "");
      setAlt(media.alt || "");
      setCaption(media.caption || "");
      setDescription(media.description || "");
      setLoadingUsage(true);
      fetch(`/api/media/${media.id}/usage`).then((res) => res.json()).then((data) => setUsage(data.usages || [])).catch(console.error).finally(() => setLoadingUsage(false));
    }
  }, [media]);
  if (!media) return null;
  const mediaType = getMediaType(media.mimeType);
  const Icon2 = typeIcons3[mediaType];
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(media.id, { title, alt, caption, description });
    } finally {
      setSaving(false);
    }
  };
  const hasChanges = title !== (media.title || "") || alt !== (media.alt || "") || caption !== (media.caption || "") || description !== (media.description || "");
  return /* @__PURE__ */ jsx30(Sheet, { open, onOpenChange: (open2) => !open2 && onClose(), children: /* @__PURE__ */ jsxs22(SheetContent, { className: "w-full sm:max-w-lg", children: [
    /* @__PURE__ */ jsx30(SheetHeader, { children: /* @__PURE__ */ jsxs22(SheetTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx30(Icon2, { className: "h-5 w-5" }),
      "Media Details"
    ] }) }),
    /* @__PURE__ */ jsx30(ScrollArea, { className: "h-[calc(100vh-8rem)] pr-4", children: /* @__PURE__ */ jsxs22("div", { className: "space-y-6 py-4", children: [
      /* @__PURE__ */ jsx30("div", { className: "aspect-video relative bg-muted rounded-lg overflow-hidden", children: mediaType === "image" ? /* @__PURE__ */ jsx30(
        Image7,
        {
          src: media.url,
          alt: media.alt || media.filename,
          fill: true,
          className: "object-contain"
        }
      ) : mediaType === "video" ? /* @__PURE__ */ jsx30(
        "video",
        {
          src: media.url,
          controls: true,
          className: "w-full h-full object-contain"
        }
      ) : mediaType === "audio" ? /* @__PURE__ */ jsx30("div", { className: "w-full h-full flex items-center justify-center p-4", children: /* @__PURE__ */ jsx30("audio", { src: media.url, controls: true, className: "w-full" }) }) : /* @__PURE__ */ jsx30("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx30(Icon2, { className: "h-16 w-16 text-muted-foreground" }) }) }),
      /* @__PURE__ */ jsxs22("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs22(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => window.open(media.url, "_blank"),
            children: [
              /* @__PURE__ */ jsx30(ExternalLink2, { className: "h-4 w-4 mr-1" }),
              "Open"
            ]
          }
        ),
        /* @__PURE__ */ jsxs22(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => navigator.clipboard.writeText(media.url),
            children: [
              /* @__PURE__ */ jsx30(Copy2, { className: "h-4 w-4 mr-1" }),
              "Copy URL"
            ]
          }
        ),
        /* @__PURE__ */ jsxs22(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => {
              const a = document.createElement("a");
              a.href = media.url;
              a.download = media.filename;
              a.click();
            },
            children: [
              /* @__PURE__ */ jsx30(Download4, { className: "h-4 w-4 mr-1" }),
              "Download"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx30(Separator, {}),
      /* @__PURE__ */ jsxs22("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30("p", { className: "text-muted-foreground", children: "Filename" }),
          /* @__PURE__ */ jsx30("p", { className: "font-medium truncate", children: media.filename })
        ] }),
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30("p", { className: "text-muted-foreground", children: "Original Name" }),
          /* @__PURE__ */ jsx30("p", { className: "font-medium truncate", children: media.originalName })
        ] }),
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30("p", { className: "text-muted-foreground", children: "Type" }),
          /* @__PURE__ */ jsx30("p", { className: "font-medium", children: media.mimeType })
        ] }),
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30("p", { className: "text-muted-foreground", children: "Size" }),
          /* @__PURE__ */ jsx30("p", { className: "font-medium", children: formatFileSize(media.size) })
        ] }),
        media.width && media.height && /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30("p", { className: "text-muted-foreground", children: "Dimensions" }),
          /* @__PURE__ */ jsxs22("p", { className: "font-medium", children: [
            media.width,
            " \xD7 ",
            media.height
          ] })
        ] }),
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30("p", { className: "text-muted-foreground", children: "Uploaded" }),
          /* @__PURE__ */ jsx30("p", { className: "font-medium", children: format2(new Date(media.createdAt), "MMM d, yyyy") })
        ] })
      ] }),
      /* @__PURE__ */ jsx30(Separator, {}),
      /* @__PURE__ */ jsxs22("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30(Label, { htmlFor: "title", children: "Title" }),
          /* @__PURE__ */ jsx30(
            Input,
            {
              id: "title",
              value: title,
              onChange: (e) => setTitle(e.target.value),
              placeholder: "Enter title..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30(Label, { htmlFor: "alt", children: "Alt Text" }),
          /* @__PURE__ */ jsx30(
            Input,
            {
              id: "alt",
              value: alt,
              onChange: (e) => setAlt(e.target.value),
              placeholder: "Describe the image for accessibility..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30(Label, { htmlFor: "caption", children: "Caption" }),
          /* @__PURE__ */ jsx30(
            Input,
            {
              id: "caption",
              value: caption,
              onChange: (e) => setCaption(e.target.value),
              placeholder: "Caption to display..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30(Label, { htmlFor: "description", children: "Description" }),
          /* @__PURE__ */ jsx30(
            Textarea,
            {
              id: "description",
              value: description,
              onChange: (e) => setDescription(e.target.value),
              placeholder: "Longer description...",
              rows: 3
            }
          )
        ] })
      ] }),
      media.tags && media.tags.length > 0 && /* @__PURE__ */ jsxs22(Fragment6, { children: [
        /* @__PURE__ */ jsx30(Separator, {}),
        /* @__PURE__ */ jsxs22("div", { children: [
          /* @__PURE__ */ jsx30("p", { className: "text-sm font-medium mb-2", children: "Tags" }),
          /* @__PURE__ */ jsx30("div", { className: "flex flex-wrap gap-1", children: media.tags.map((tagRelation) => /* @__PURE__ */ jsx30(
            Badge,
            {
              variant: "secondary",
              style: tagRelation.tag.color ? { borderColor: tagRelation.tag.color } : void 0,
              children: tagRelation.tag.name
            },
            tagRelation.tag.id
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsx30(Separator, {}),
      /* @__PURE__ */ jsxs22("div", { children: [
        /* @__PURE__ */ jsx30("p", { className: "text-sm font-medium mb-2", children: "Usage" }),
        loadingUsage ? /* @__PURE__ */ jsx30("p", { className: "text-sm text-muted-foreground", children: "Loading..." }) : usage.length > 0 ? /* @__PURE__ */ jsx30("div", { className: "space-y-2", children: usage.map((u) => /* @__PURE__ */ jsxs22(
          "a",
          {
            href: u.url,
            className: "block p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors",
            children: [
              /* @__PURE__ */ jsx30("p", { className: "text-sm font-medium", children: u.entityTitle }),
              /* @__PURE__ */ jsxs22("p", { className: "text-xs text-muted-foreground", children: [
                u.entityType,
                u.fieldName && ` \u2022 ${u.fieldName}`
              ] })
            ]
          },
          u.id
        )) }) : /* @__PURE__ */ jsx30("p", { className: "text-sm text-muted-foreground", children: "Not used anywhere" })
      ] }),
      /* @__PURE__ */ jsx30(Separator, {}),
      /* @__PURE__ */ jsxs22("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs22(
          Button,
          {
            onClick: handleSave,
            disabled: !hasChanges || saving,
            className: "flex-1",
            children: [
              /* @__PURE__ */ jsx30(Save2, { className: "h-4 w-4 mr-2" }),
              saving ? "Saving..." : "Save Changes"
            ]
          }
        ),
        /* @__PURE__ */ jsx30(
          Button,
          {
            variant: "destructive",
            onClick: () => onDelete(media.id),
            children: /* @__PURE__ */ jsx30(Trash3, { className: "h-4 w-4" })
          }
        )
      ] })
    ] }) })
  ] }) });
}

// src/components/admin/media/MediaUploader.tsx
import { useCallback as useCallback4, useState as useState12 } from "react";
import { useDropzone as useDropzone2 } from "react-dropzone";
import { Upload as Upload4, Check as Check5, AlertCircle as AlertCircle2, FileIcon } from "lucide-react";
import { jsx as jsx31, jsxs as jsxs23 } from "react/jsx-runtime";
function MediaUploader({
  folderId,
  uploads,
  isUploading,
  onUpload,
  onClearCompleted,
  className
}) {
  const [isDragActive, setIsDragActive] = useState12(false);
  const onDrop = useCallback4(
    async (acceptedFiles) => {
      await onUpload(acceptedFiles);
    },
    [onUpload]
  );
  const { getRootProps, getInputProps, open } = useDropzone2({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    noClick: true,
    noKeyboard: true
  });
  const hasUploads = uploads.length > 0;
  const hasCompleted = uploads.some(
    (u) => u.status === "complete" || u.status === "error"
  );
  return /* @__PURE__ */ jsxs23("div", { className: cn("space-y-4", className), children: [
    /* @__PURE__ */ jsxs23(
      "div",
      __spreadProps(__spreadValues({}, getRootProps()), {
        className: cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "pointer-events-none opacity-50"
        ),
        children: [
          /* @__PURE__ */ jsx31("input", __spreadValues({}, getInputProps())),
          /* @__PURE__ */ jsxs23("div", { className: "flex flex-col items-center gap-2", children: [
            /* @__PURE__ */ jsx31(
              Upload4,
              {
                className: cn(
                  "h-10 w-10 transition-colors",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )
              }
            ),
            /* @__PURE__ */ jsxs23("div", { children: [
              /* @__PURE__ */ jsx31("p", { className: "font-medium", children: isDragActive ? "Drop files here" : "Drag and drop files here" }),
              /* @__PURE__ */ jsxs23("p", { className: "text-sm text-muted-foreground mt-1", children: [
                "or",
                " ",
                /* @__PURE__ */ jsx31(
                  "button",
                  {
                    type: "button",
                    onClick: open,
                    className: "text-primary hover:underline",
                    disabled: isUploading,
                    children: "browse files"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx31("p", { className: "text-xs text-muted-foreground", children: "Images, videos, audio, and documents up to 50MB" })
          ] })
        ]
      })
    ),
    hasUploads && /* @__PURE__ */ jsxs23("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs23("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx31("p", { className: "text-sm font-medium", children: "Uploads" }),
        hasCompleted && /* @__PURE__ */ jsx31(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: onClearCompleted,
            className: "h-auto py-1 px-2 text-xs",
            children: "Clear completed"
          }
        )
      ] }),
      /* @__PURE__ */ jsx31("div", { className: "space-y-2 max-h-48 overflow-y-auto", children: uploads.map((upload) => /* @__PURE__ */ jsxs23(
        "div",
        {
          className: "flex items-center gap-3 p-2 rounded-md bg-muted/50",
          children: [
            /* @__PURE__ */ jsx31("div", { className: "flex-shrink-0", children: upload.status === "complete" ? /* @__PURE__ */ jsx31("div", { className: "h-8 w-8 rounded-full bg-green-100 flex items-center justify-center", children: /* @__PURE__ */ jsx31(Check5, { className: "h-4 w-4 text-green-600" }) }) : upload.status === "error" ? /* @__PURE__ */ jsx31("div", { className: "h-8 w-8 rounded-full bg-red-100 flex items-center justify-center", children: /* @__PURE__ */ jsx31(AlertCircle2, { className: "h-4 w-4 text-red-600" }) }) : /* @__PURE__ */ jsx31("div", { className: "h-8 w-8 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx31(FileIcon, { className: "h-4 w-4 text-muted-foreground" }) }) }),
            /* @__PURE__ */ jsxs23("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx31("p", { className: "text-sm font-medium truncate", children: upload.filename }),
              /* @__PURE__ */ jsxs23("div", { className: "flex items-center gap-2", children: [
                upload.status === "uploading" ? /* @__PURE__ */ jsx31(Progress, { value: upload.progress, className: "h-1 flex-1" }) : upload.status === "error" ? /* @__PURE__ */ jsx31("p", { className: "text-xs text-red-600 truncate", children: upload.error }) : upload.status === "complete" ? /* @__PURE__ */ jsx31("p", { className: "text-xs text-muted-foreground", children: "Complete" }) : /* @__PURE__ */ jsx31("p", { className: "text-xs text-muted-foreground", children: "Pending" }),
                upload.size && /* @__PURE__ */ jsx31("span", { className: "text-xs text-muted-foreground flex-shrink-0", children: formatFileSize(upload.size) })
              ] })
            ] })
          ]
        },
        upload.id
      )) })
    ] })
  ] });
}

// src/components/admin/media/FolderDialog.tsx
import { useState as useState13, useEffect as useEffect9 } from "react";
import { Folder as Folder2 } from "lucide-react";
import { jsx as jsx32, jsxs as jsxs24 } from "react/jsx-runtime";
var colorOptions = [
  { value: "", label: "Default" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" }
];
function FolderDialog({
  open,
  folder,
  folders,
  onClose,
  onSave
}) {
  const [name, setName] = useState13("");
  const [description, setDescription] = useState13("");
  const [color, setColor] = useState13("");
  const [parentId, setParentId] = useState13(null);
  const [saving, setSaving] = useState13(false);
  const isEditing = !!folder;
  useEffect9(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description || "");
      setColor(folder.color || "");
      setParentId(folder.parentId);
    } else {
      setName("");
      setDescription("");
      setColor("");
      setParentId(null);
    }
  }, [folder, open]);
  const flattenFolders = (folders2, depth = 0, exclude) => {
    const result = [];
    for (const f of folders2) {
      if (f.id !== exclude) {
        result.push({ id: f.id, name: f.name, depth });
        if (f.children && f.children.length > 0) {
          result.push(...flattenFolders(f.children, depth + 1, exclude));
        }
      }
    }
    return result;
  };
  const availableFolders = flattenFolders(folders, 0, folder == null ? void 0 : folder.id);
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || void 0,
        color: color || void 0,
        parentId
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx32(Dialog, { open, onOpenChange: (open2) => !open2 && onClose(), children: /* @__PURE__ */ jsxs24(DialogContent, { children: [
    /* @__PURE__ */ jsx32(DialogHeader, { children: /* @__PURE__ */ jsxs24(DialogTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx32(Folder2, { className: "h-5 w-5" }),
      isEditing ? "Edit Folder" : "New Folder"
    ] }) }),
    /* @__PURE__ */ jsxs24("div", { className: "space-y-4 py-4", children: [
      /* @__PURE__ */ jsxs24("div", { children: [
        /* @__PURE__ */ jsx32(Label, { htmlFor: "name", children: "Name" }),
        /* @__PURE__ */ jsx32(
          Input,
          {
            id: "name",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: "Folder name...",
            autoFocus: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs24("div", { children: [
        /* @__PURE__ */ jsx32(Label, { htmlFor: "description", children: "Description" }),
        /* @__PURE__ */ jsx32(
          Textarea,
          {
            id: "description",
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: "Optional description...",
            rows: 2
          }
        )
      ] }),
      /* @__PURE__ */ jsxs24("div", { children: [
        /* @__PURE__ */ jsx32(Label, { htmlFor: "parent", children: "Parent Folder" }),
        /* @__PURE__ */ jsxs24(
          Select,
          {
            value: parentId || "root",
            onValueChange: (value) => setParentId(value === "root" ? null : value),
            children: [
              /* @__PURE__ */ jsx32(SelectTrigger, { children: /* @__PURE__ */ jsx32(SelectValue, { placeholder: "Select parent folder" }) }),
              /* @__PURE__ */ jsxs24(SelectContent, { children: [
                /* @__PURE__ */ jsx32(SelectItem, { value: "root", children: "Root (No parent)" }),
                availableFolders.map((f) => /* @__PURE__ */ jsx32(SelectItem, { value: f.id, children: /* @__PURE__ */ jsx32("span", { style: { paddingLeft: f.depth * 12 }, children: f.name }) }, f.id))
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs24("div", { children: [
        /* @__PURE__ */ jsx32(Label, { htmlFor: "color", children: "Color" }),
        /* @__PURE__ */ jsxs24(Select, { value: color, onValueChange: setColor, children: [
          /* @__PURE__ */ jsx32(SelectTrigger, { children: /* @__PURE__ */ jsx32(SelectValue, { placeholder: "Select color" }) }),
          /* @__PURE__ */ jsx32(SelectContent, { children: colorOptions.map((option) => /* @__PURE__ */ jsx32(SelectItem, { value: option.value || "default", children: /* @__PURE__ */ jsxs24("div", { className: "flex items-center gap-2", children: [
            option.value && /* @__PURE__ */ jsx32(
              "div",
              {
                className: "w-4 h-4 rounded",
                style: { backgroundColor: option.value }
              }
            ),
            option.label
          ] }) }, option.value || "default")) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs24(DialogFooter, { children: [
      /* @__PURE__ */ jsx32(Button, { variant: "outline", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsx32(Button, { onClick: handleSave, disabled: !name.trim() || saving, children: saving ? "Saving..." : isEditing ? "Save Changes" : "Create Folder" })
    ] })
  ] }) });
}

// src/components/ui/alert-dialog.tsx
import * as React11 from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { jsx as jsx33, jsxs as jsxs25 } from "react/jsx-runtime";
var AlertDialog = AlertDialogPrimitive.Root;
var AlertDialogPortal = AlertDialogPrimitive.Portal;
var AlertDialogOverlay = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx33(
    AlertDialogPrimitive.Overlay,
    __spreadProps(__spreadValues({
      className: cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )
    }, props), {
      ref
    })
  );
});
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
var AlertDialogContent = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsxs25(AlertDialogPortal, { children: [
    /* @__PURE__ */ jsx33(AlertDialogOverlay, {}),
    /* @__PURE__ */ jsx33(
      AlertDialogPrimitive.Content,
      __spreadValues({
        ref,
        className: cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )
      }, props)
    )
  ] });
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
var AlertDialogHeader = (_a) => {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx33(
    "div",
    __spreadValues({
      className: cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )
    }, props)
  );
};
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = (_a) => {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  return /* @__PURE__ */ jsx33(
    "div",
    __spreadValues({
      className: cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )
    }, props)
  );
};
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx33(
    AlertDialogPrimitive.Title,
    __spreadValues({
      ref,
      className: cn("text-lg font-semibold", className)
    }, props)
  );
});
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
var AlertDialogDescription = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx33(
    AlertDialogPrimitive.Description,
    __spreadValues({
      ref,
      className: cn("text-sm text-muted-foreground", className)
    }, props)
  );
});
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
var AlertDialogAction = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx33(
    AlertDialogPrimitive.Action,
    __spreadValues({
      ref,
      className: cn(buttonVariants(), className)
    }, props)
  );
});
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
var AlertDialogCancel = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx33(
    AlertDialogPrimitive.Cancel,
    __spreadValues({
      ref,
      className: cn(
        buttonVariants({ variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      )
    }, props)
  );
});
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

// src/components/admin/media/MediaManager.tsx
import { AlertTriangle, Settings as Settings4 } from "lucide-react";
import Link3 from "next/link";
import { jsx as jsx34, jsxs as jsxs26 } from "react/jsx-runtime";
function MediaManager() {
  const mediaState = useMedia();
  const [storageStatus, setStorageStatus] = useState14(null);
  useEffect10(() => {
    async function checkStorage() {
      try {
        const response = await fetch("/api/media/storage-status");
        if (response.ok) {
          const status = await response.json();
          setStorageStatus(status);
        }
      } catch (error2) {
        console.error("Failed to check storage status:", error2);
      }
    }
    checkStorage();
  }, []);
  const {
    media,
    folders,
    tags,
    selectedIds,
    viewMode,
    filters,
    loading,
    error,
    pagination,
    setViewMode,
    setFilters,
    setPage,
    selectItem,
    toggleItem,
    selectAll,
    clearSelection,
    deleteSelected,
    moveSelected,
    tagSelected,
    refreshAll
  } = mediaState;
  const { uploads, isUploading, uploadFiles, clearCompleted } = useMediaUpload({
    folderId: filters.folderId,
    onSuccess: () => refreshAll()
  });
  const [showUploader, setShowUploader] = useState14(false);
  const [showFolderDialog, setShowFolderDialog] = useState14(false);
  const [editingFolder, setEditingFolder] = useState14(null);
  const [previewMedia, setPreviewMedia] = useState14(null);
  const [renameMedia, setRenameMedia] = useState14(null);
  const [renameName, setRenameName] = useState14("");
  const [deleteConfirm, setDeleteConfirm] = useState14(null);
  const handleFolderSelect = useCallback5(
    (folderId) => {
      setFilters({ folderId: folderId === null ? null : folderId });
    },
    [setFilters]
  );
  const handleCreateFolder = useCallback5(async (data) => {
    const response = await fetch("/api/media/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error("Failed to create folder");
    }
    await refreshAll();
  }, [refreshAll]);
  const handleUpdateFolder = useCallback5(async (id, data) => {
    const response = await fetch(`/api/media/folders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error("Failed to update folder");
    }
    await refreshAll();
  }, [refreshAll]);
  const handleMoveMedia = useCallback5(
    async (mediaId, folderId) => {
      const response = await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "move",
          mediaIds: [mediaId],
          folderId
        })
      });
      if (!response.ok) {
        throw new Error("Failed to move media");
      }
      await refreshAll();
    },
    [refreshAll]
  );
  const handleAddTag = useCallback5(
    async (mediaId, tagId) => {
      const response = await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "tag",
          mediaIds: [mediaId],
          tagIds: [tagId]
        })
      });
      if (!response.ok) {
        throw new Error("Failed to add tag");
      }
      await refreshAll();
    },
    [refreshAll]
  );
  const handleDeleteMedia = useCallback5((mediaId) => {
    setDeleteConfirm({ ids: [mediaId], hard: false });
  }, []);
  const handleBulkDelete = useCallback5(() => {
    setDeleteConfirm({ ids: Array.from(selectedIds), hard: false });
  }, [selectedIds]);
  const confirmDelete = useCallback5(async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.ids.length === 1) {
      const response = await fetch(
        `/api/media/${deleteConfirm.ids[0]}?hard=${deleteConfirm.hard}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error("Failed to delete media");
      }
    } else {
      await deleteSelected(deleteConfirm.hard);
    }
    setDeleteConfirm(null);
    await refreshAll();
  }, [deleteConfirm, deleteSelected, refreshAll]);
  const handleRename = useCallback5((media2) => {
    setRenameMedia(media2);
    setRenameName(media2.title || media2.filename);
  }, []);
  const handleSaveRename = useCallback5(async () => {
    if (!renameMedia || !renameName.trim()) return;
    const response = await fetch(`/api/media/${renameMedia.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameName.trim() })
    });
    if (!response.ok) {
      throw new Error("Failed to rename media");
    }
    setRenameMedia(null);
    await refreshAll();
  }, [renameMedia, renameName, refreshAll]);
  const handleSaveMediaDetails = useCallback5(
    async (id, data) => {
      const response = await fetch(`/api/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error("Failed to update media");
      }
      await refreshAll();
    },
    [refreshAll]
  );
  return /* @__PURE__ */ jsxs26("div", { className: "flex flex-col h-[calc(100vh-12rem)]", children: [
    storageStatus && !storageStatus.configured && /* @__PURE__ */ jsxs26(Alert, { variant: "destructive", className: "mx-6 mt-4 mb-0", children: [
      /* @__PURE__ */ jsx34(AlertTriangle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx34(AlertTitle, { children: "Storage Not Configured" }),
      /* @__PURE__ */ jsxs26(AlertDescription, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx34("span", { children: storageStatus.message }),
        /* @__PURE__ */ jsx34(Button, { variant: "outline", size: "sm", asChild: true, className: "ml-4", children: /* @__PURE__ */ jsxs26(Link3, { href: "/admin/settings?tab=storage", children: [
          /* @__PURE__ */ jsx34(Settings4, { className: "h-4 w-4 mr-2" }),
          "Configure Storage"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs26("div", { className: "flex flex-1 min-h-0", children: [
      /* @__PURE__ */ jsx34("div", { className: "w-64 border-r flex-shrink-0", children: /* @__PURE__ */ jsx34(
        MediaFolderTree,
        {
          folders,
          selectedFolderId: filters.folderId,
          onSelectFolder: handleFolderSelect,
          onCreateFolder: () => {
            setEditingFolder(null);
            setShowFolderDialog(true);
          }
        }
      ) }),
      /* @__PURE__ */ jsxs26("div", { className: "flex-1 flex flex-col min-w-0", children: [
        /* @__PURE__ */ jsx34("div", { className: "p-4 border-b", children: /* @__PURE__ */ jsx34(
          MediaToolbar,
          {
            viewMode,
            filters,
            onViewModeChange: setViewMode,
            onSearch: (search) => setFilters({ search }),
            onTypeFilter: (type) => setFilters({ type }),
            onSortChange: (sortBy, sortOrder) => setFilters({ sortBy, sortOrder }),
            onUpload: () => setShowUploader(true)
          }
        ) }),
        selectedIds.size > 0 && /* @__PURE__ */ jsx34("div", { className: "px-4 pt-4", children: /* @__PURE__ */ jsx34(
          MediaBulkActions,
          {
            selectedCount: selectedIds.size,
            folders,
            tags,
            onClearSelection: clearSelection,
            onMove: moveSelected,
            onTag: tagSelected,
            onDelete: handleBulkDelete
          }
        ) }),
        /* @__PURE__ */ jsx34("div", { className: "flex-1 p-4 overflow-auto", children: viewMode === "grid" ? /* @__PURE__ */ jsx34(
          MediaGrid,
          {
            media,
            selectedIds,
            folders,
            tags,
            loading,
            onSelect: selectItem,
            onToggle: toggleItem,
            onClick: setPreviewMedia,
            onPreview: setPreviewMedia,
            onMove: handleMoveMedia,
            onAddTag: handleAddTag,
            onDelete: handleDeleteMedia,
            onRename: handleRename,
            onEditDetails: setPreviewMedia,
            onViewUsage: setPreviewMedia
          }
        ) : /* @__PURE__ */ jsx34(
          MediaList,
          {
            media,
            selectedIds,
            folders,
            tags,
            loading,
            onSelect: selectItem,
            onToggle: toggleItem,
            onSelectAll: selectAll,
            onClick: setPreviewMedia,
            onPreview: setPreviewMedia,
            onMove: handleMoveMedia,
            onAddTag: handleAddTag,
            onDelete: handleDeleteMedia,
            onRename: handleRename,
            onEditDetails: setPreviewMedia,
            onViewUsage: setPreviewMedia
          }
        ) }),
        pagination.totalPages > 1 && /* @__PURE__ */ jsxs26("div", { className: "p-4 border-t flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs26("p", { className: "text-sm text-muted-foreground", children: [
            "Showing ",
            (pagination.page - 1) * pagination.limit + 1,
            " to",
            " ",
            Math.min(pagination.page * pagination.limit, pagination.total),
            " of",
            " ",
            pagination.total,
            " items"
          ] }),
          /* @__PURE__ */ jsxs26("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx34(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => setPage(pagination.page - 1),
                disabled: pagination.page <= 1,
                children: "Previous"
              }
            ),
            /* @__PURE__ */ jsx34(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => setPage(pagination.page + 1),
                disabled: pagination.page >= pagination.totalPages,
                children: "Next"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx34(Dialog, { open: showUploader, onOpenChange: setShowUploader, children: /* @__PURE__ */ jsxs26(DialogContent, { className: "sm:max-w-lg", children: [
      /* @__PURE__ */ jsx34(DialogHeader, { children: /* @__PURE__ */ jsx34(DialogTitle, { children: "Upload Media" }) }),
      /* @__PURE__ */ jsx34(
        MediaUploader,
        {
          folderId: filters.folderId,
          uploads,
          isUploading,
          onUpload: uploadFiles,
          onClearCompleted: clearCompleted
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx34(
      FolderDialog,
      {
        open: showFolderDialog,
        folder: editingFolder,
        folders,
        onClose: () => {
          setShowFolderDialog(false);
          setEditingFolder(null);
        },
        onSave: async (data) => {
          if (editingFolder) {
            await handleUpdateFolder(editingFolder.id, data);
          } else {
            await handleCreateFolder(data);
          }
        }
      }
    ),
    /* @__PURE__ */ jsx34(
      MediaPreviewSheet,
      {
        media: previewMedia,
        open: !!previewMedia,
        onClose: () => setPreviewMedia(null),
        onSave: handleSaveMediaDetails,
        onDelete: (id) => {
          setPreviewMedia(null);
          setDeleteConfirm({ ids: [id], hard: false });
        }
      }
    ),
    /* @__PURE__ */ jsx34(Dialog, { open: !!renameMedia, onOpenChange: (open) => !open && setRenameMedia(null), children: /* @__PURE__ */ jsxs26(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsx34(DialogHeader, { children: /* @__PURE__ */ jsx34(DialogTitle, { children: "Rename Media" }) }),
      /* @__PURE__ */ jsx34("div", { className: "space-y-4 py-4", children: /* @__PURE__ */ jsxs26("div", { children: [
        /* @__PURE__ */ jsx34(Label, { htmlFor: "rename", children: "Name" }),
        /* @__PURE__ */ jsx34(
          Input,
          {
            id: "rename",
            value: renameName,
            onChange: (e) => setRenameName(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleSaveRename(),
            autoFocus: true
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs26("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx34(Button, { variant: "outline", onClick: () => setRenameMedia(null), children: "Cancel" }),
        /* @__PURE__ */ jsx34(Button, { onClick: handleSaveRename, disabled: !renameName.trim(), children: "Save" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx34(
      AlertDialog,
      {
        open: !!deleteConfirm,
        onOpenChange: (open) => !open && setDeleteConfirm(null),
        children: /* @__PURE__ */ jsxs26(AlertDialogContent, { children: [
          /* @__PURE__ */ jsxs26(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsx34(AlertDialogTitle, { children: "Delete Media" }),
            /* @__PURE__ */ jsxs26(AlertDialogDescription, { children: [
              "Are you sure you want to delete",
              " ",
              (deleteConfirm == null ? void 0 : deleteConfirm.ids.length) === 1 ? "this item" : `${deleteConfirm == null ? void 0 : deleteConfirm.ids.length} items`,
              "? This action cannot be undone."
            ] })
          ] }),
          /* @__PURE__ */ jsxs26(AlertDialogFooter, { children: [
            /* @__PURE__ */ jsx34(AlertDialogCancel, { children: "Cancel" }),
            /* @__PURE__ */ jsx34(
              AlertDialogAction,
              {
                onClick: confirmDelete,
                className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                children: "Delete"
              }
            )
          ] })
        ] })
      }
    )
  ] });
}

export {
  WizardProvider,
  useWizard,
  AdminChat,
  Logo,
  AdminShell,
  MediaPicker,
  BrandingSettings,
  DashboardMetrics,
  QuickActions,
  EnvManager,
  EmailProviderSettings,
  MediaCard,
  MediaContextMenu,
  MediaGrid,
  MediaRow,
  MediaList,
  MediaToolbar,
  MediaFolderTree,
  MediaBulkActions,
  MediaPreviewSheet,
  MediaUploader,
  FolderDialog,
  MediaManager
};
//# sourceMappingURL=chunk-TW4A7IPE.mjs.map