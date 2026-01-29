"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }







var _chunkTLZBOFEDjs = require('./chunk-TLZBOFED.js');





var _chunk72BQHJ6Fjs = require('./chunk-72BQHJ6F.js');



var _chunkBHKDPOTYjs = require('./chunk-BHKDPOTY.js');












var _chunkSBUKOAXSjs = require('./chunk-SBUKOAXS.js');



var _chunkNY5MFDNPjs = require('./chunk-NY5MFDNP.js');






var _chunkV746VSQLjs = require('./chunk-V746VSQL.js');


var _chunkHQVSQ2EOjs = require('./chunk-HQVSQ2EO.js');



var _chunkPWJHQH3Pjs = require('./chunk-PWJHQH3P.js');


var _chunkSKQV2OMQjs = require('./chunk-SKQV2OMQ.js');




var _chunkHY7GTCJMjs = require('./chunk-HY7GTCJM.js');

// src/app/admin/AdminShell.tsx
var _react = require('react'); var React3 = _interopRequireWildcard(_react); var React4 = _interopRequireWildcard(_react); var React5 = _interopRequireWildcard(_react); var React7 = _interopRequireWildcard(_react); var React8 = _interopRequireWildcard(_react); var React9 = _interopRequireWildcard(_react); var React10 = _interopRequireWildcard(_react); var React11 = _interopRequireWildcard(_react);
var _link = require('next/link'); var _link2 = _interopRequireDefault(_link);
var _navigation = require('next/navigation');

// src/contexts/WizardContext.tsx

var _shepherdjs = require('shepherd.js'); var _shepherdjs2 = _interopRequireDefault(_shepherdjs);
require('shepherd.js/dist/css/shepherd.css');
var _jsxruntime = require('react/jsx-runtime');
var WizardContext = _react.createContext.call(void 0, void 0);
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
  const [isTourActive, setIsTourActive] = _react.useState.call(void 0, false);
  const [currentTourId, setCurrentTourId] = _react.useState.call(void 0, null);
  const [completedTours, setCompletedTours] = _react.useState.call(void 0, /* @__PURE__ */ new Set());
  const tourRef = _react.useRef.call(void 0, null);
  _react.useEffect.call(void 0, () => {
    const stored = localStorage.getItem("completedTours");
    if (stored) {
      setCompletedTours(new Set(JSON.parse(stored)));
    }
  }, []);
  _react.useEffect.call(void 0, () => {
    if (completedTours.size > 0) {
      localStorage.setItem("completedTours", JSON.stringify(Array.from(completedTours)));
    }
  }, [completedTours]);
  _react.useEffect.call(void 0, () => {
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
    const tour = new _shepherdjs2.default.Tour({
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
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
  const context = _react.useContext.call(void 0, WizardContext);
  if (context === void 0) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}

// src/components/admin-chat/index.tsx
var _dynamic = require('next/dynamic'); var _dynamic2 = _interopRequireDefault(_dynamic);

var ChatPanel2 = _dynamic2.default.call(void 0, 
  () => Promise.resolve().then(() => _interopRequireWildcard(require("./chat-panel-AJXPKM5A.js"))).then((mod) => ({ default: mod.ChatPanel })),
  { ssr: false }
);
function AdminChat() {
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ChatPanel2, {});
}

// src/app/admin/AdminShell.tsx


























var _lucidereact = require('lucide-react');

// src/components/branding/Logo.tsx

var _nextthemes = require('next-themes');

var _image = require('next/image'); var _image2 = _interopRequireDefault(_image);

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
  const { resolvedTheme } = _nextthemes.useTheme.call(void 0, );
  const [branding, setBranding] = _react.useState.call(void 0, {
    siteName: "My Site"
  });
  const [mounted, setMounted] = _react.useState.call(void 0, false);
  _react.useEffect.call(void 0, () => {
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
  const content = /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: `flex items-center gap-2 ${className}`, children: [
    logoUrl ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      _image2.default,
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
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "div",
        {
          className: `${sizeClasses[size]} aspect-square rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold ${size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-xl"}`,
          children: branding.siteName.charAt(0).toUpperCase()
        }
      )
    ),
    showText && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: `font-semibold ${textSizeClasses[size]}`, children: branding.siteName })
  ] });
  if (href) {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _link2.default, { href, className: "hover:opacity-80 transition-opacity", children: content });
  }
  return content;
}

// src/app/admin/AdminShell.tsx

function AdminShell({
  children,
  config = {}
}) {
  const { user, signOut } = _chunk72BQHJ6Fjs.useAuth.call(void 0, );
  const pathname = _navigation.usePathname.call(void 0, );
  const [isSidebarOpen, setIsSidebarOpen] = _react.useState.call(void 0, true);
  const [expandedGroups, setExpandedGroups] = _react.useState.call(void 0, ["Main", "E-Commerce", "Content"]);
  const [searchQuery, setSearchQuery] = _react.useState.call(void 0, "");
  const {
    basePath = "",
    hiddenGroups = [],
    hiddenItems = [],
    siteUrl = "/",
    siteName,
    userRole = "Super Admin",
    showChat = true
  } = config;
  const buildPath = (path) => {
    if (!basePath) return path;
    return path.replace("/admin", `${basePath}/admin`);
  };
  const allNavigationGroups = [
    {
      name: "Main",
      items: [
        { name: "Dashboard", href: "/admin", icon: _lucidereact.LayoutDashboard },
        { name: "Analytics", href: "/admin/analytics", icon: _lucidereact.BarChart3 }
      ]
    },
    {
      name: "E-Commerce",
      items: [
        { name: "Products", href: "/admin/products", icon: _lucidereact.Package },
        { name: "Orders", href: "/admin/orders", icon: _lucidereact.ShoppingCart },
        { name: "Order Workflows", href: "/admin/order-workflows", icon: _lucidereact.Workflow },
        { name: "Shipping", href: "/admin/shipping", icon: _lucidereact.Truck },
        { name: "Customers", href: "/admin/customers", icon: _lucidereact.Users }
      ]
    },
    {
      name: "Content",
      items: [
        { name: "Pages", href: "/admin/pages", icon: _lucidereact.Layers },
        { name: "Blog", href: "/admin/blog", icon: _lucidereact.FileText },
        { name: "Forms", href: "/admin/forms", icon: _lucidereact.ClipboardList },
        { name: "Media", href: "/admin/media", icon: _lucidereact.Image },
        { name: "Email Marketing", href: "/admin/email-marketing", icon: _lucidereact.Mail }
      ]
    },
    {
      name: "System",
      items: [
        { name: "Users", href: "/admin/users", icon: _lucidereact.Users },
        { name: "Roles & Permissions", href: "/admin/roles", icon: _lucidereact.Key },
        { name: "Plugins", href: "/admin/plugins", icon: _lucidereact.Puzzle },
        { name: "Workflows", href: "/admin/workflows", icon: _lucidereact.GitBranch },
        { name: "Settings", href: "/admin/settings", icon: _lucidereact.Settings }
      ]
    }
  ];
  const navigationGroups = allNavigationGroups.filter((group) => !hiddenGroups.includes(group.name)).map((group) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, group), {
    items: group.items.filter((item) => !hiddenItems.includes(item.name))
  })).filter((group) => group.items.length > 0);
  const toggleGroup = (groupName) => {
    setExpandedGroups(
      (prev) => prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName]
    );
  };
  const isActiveLink = (href) => {
    const fullHref = buildPath(href);
    if (href === "/admin") {
      return pathname === fullHref;
    }
    return pathname == null ? void 0 : pathname.startsWith(fullHref);
  };
  if (!user) {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children });
  }
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk72BQHJ6Fjs.CMSConfigProvider, { config, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, WizardProvider, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "lg:hidden fixed top-4 left-4 z-50", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      "button",
      {
        onClick: () => setIsSidebarOpen(!isSidebarOpen),
        className: "p-2 rounded-md bg-card border border-border",
        children: isSidebarOpen ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.X, { className: "h-5 w-5" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Menu, { className: "h-5 w-5" })
      }
    ) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: `fixed inset-y-0 left-0 z-40 w-56 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "px-4 py-4 border-b border-border", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Logo, { href: buildPath("/admin"), size: "sm" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground mt-1 pl-8", children: siteName ? `${siteName} Admin` : "Admin Panel" })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "px-4 py-3 border-b border-border", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium", children: user.displayName || "Admin" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: user.primaryEmail }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-primary/10 text-primary", children: userRole })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "nav", { className: "flex-1 px-2 py-4 overflow-y-auto", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-4", children: navigationGroups.map((group) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          "button",
          {
            onClick: () => toggleGroup(group.name),
            className: "flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors",
            children: [
              group.name,
              expandedGroups.includes(group.name) ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronDown, { className: "h-3 w-3" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronRight, { className: "h-3 w-3" })
            ]
          }
        ),
        expandedGroups.includes(group.name) && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { className: "mt-1 space-y-0.5", children: group.items.map((item) => {
          const Icon2 = item.icon;
          const isActive = isActiveLink(item.href);
          return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "li", { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
            _link2.default,
            {
              href: buildPath(item.href),
              className: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"}`,
              children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon2, { className: "h-4 w-4" }),
                item.name
              ]
            }
          ) }, item.name);
        }) })
      ] }, group.name)) }) }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "p-4 border-t border-border", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _link2.default,
          {
            href: siteUrl,
            className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors mb-2",
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ArrowLeft, { className: "h-4 w-4" }),
              "View Site"
            ]
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          "button",
          {
            onClick: () => signOut(),
            className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full",
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.LogOut, { className: "h-4 w-4" }),
              "Sign Out"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "lg:pl-56", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "header", { className: "sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between h-16 px-6 lg:px-8", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex-1 max-w-xl", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "relative", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkNY5MFDNPjs.Input,
            {
              type: "search",
              placeholder: "Search products, orders, customers...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "pl-10 w-full"
            }
          )
        ] }) }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2 ml-4", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "button",
            {
              className: "p-2 rounded-md hover:bg-accent transition-colors",
              title: "Notifications (coming soon)",
              children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Bell, { className: "h-5 w-5 text-muted-foreground" })
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "button",
            {
              className: "p-2 rounded-md hover:bg-accent transition-colors",
              title: "Help (coming soon)",
              children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.HelpCircle, { className: "h-5 w-5 text-muted-foreground" })
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "main", { className: "min-h-[calc(100vh-4rem)]", children })
    ] }),
    showChat && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AdminChat, {})
  ] }) }) });
}

// src/components/admin/BrandingSettings.tsx


var _sonner = require('sonner');

// src/components/admin/MediaPicker.tsx


var _reactdropzone = require('react-dropzone');


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
  const [isOpen, setIsOpen] = _react.useState.call(void 0, false);
  const [activeTab, setActiveTab] = _react.useState.call(void 0, "library");
  const [mediaItems, setMediaItems] = _react.useState.call(void 0, []);
  const [isLoadingMedia, setIsLoadingMedia] = _react.useState.call(void 0, false);
  const [isUploading, setIsUploading] = _react.useState.call(void 0, false);
  const [uploadProgress, setUploadProgress] = _react.useState.call(void 0, 0);
  const [urlInput, setUrlInput] = _react.useState.call(void 0, "");
  const [selectedMedia, setSelectedMedia] = _react.useState.call(void 0, null);
  const previewSizes = {
    small: "max-h-16",
    medium: "max-h-32",
    large: "max-h-48"
  };
  const loadMedia = _react.useCallback.call(void 0, async () => {
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
  const uploadFile = _react.useCallback.call(void 0, async (file) => {
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
      _sonner.toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      _sonner.toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onChange]);
  const { getRootProps, getInputProps, isDragActive } = _reactdropzone.useDropzone.call(void 0, {
    accept: accept.reduce((acc, type) => {
      if (type === "image/*") {
        return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, acc), { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"] });
      }
      return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, acc), { [type]: [] });
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
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
    label && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { className: "text-sm font-medium", children: label }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _chunkNY5MFDNPjs.Input,
        {
          value: value || "",
          onChange: (e) => onChange(e.target.value),
          placeholder,
          className: "flex-1"
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.Dialog, { open: isOpen, onOpenChange: handleOpenChange, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", size: "icon", type: "button", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Image, { className: "h-4 w-4" }) }) }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogContent, { className: "max-w-3xl max-h-[80vh]", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogHeader, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogTitle, { children: "Select Image" }) }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.Tabs, { value: activeTab, onValueChange: (v) => setActiveTab(v), children: [
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.TabsList, { className: "grid w-full grid-cols-3", children: [
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.TabsTrigger, { value: "library", children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Image, { className: "h-4 w-4 mr-2" }),
                "Library"
              ] }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.TabsTrigger, { value: "upload", children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Upload, { className: "h-4 w-4 mr-2" }),
                "Upload"
              ] }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.TabsTrigger, { value: "url", children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Link, { className: "h-4 w-4 mr-2" }),
                "URL"
              ] })
            ] }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.TabsContent, { value: "library", className: "mt-4", children: isLoadingMedia ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : mediaItems.length === 0 ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-center py-12 text-muted-foreground", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Image, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: "No images in library" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm", children: "Upload some images first" })
            ] }) : /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkHQVSQ2EOjs.ScrollArea, { className: "h-[400px]", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid grid-cols-4 gap-3 p-1", children: mediaItems.map((media) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                "div",
                {
                  className: `relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${(selectedMedia == null ? void 0 : selectedMedia.id) === media.id ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"}`,
                  onClick: () => handleMediaSelect(media),
                  children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                      "img",
                      {
                        src: media.url,
                        alt: media.alt || media.filename,
                        className: "w-full h-full object-cover"
                      }
                    ),
                    (selectedMedia == null ? void 0 : selectedMedia.id) === media.id && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "absolute inset-0 bg-primary/20 flex items-center justify-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Check, { className: "h-8 w-8 text-primary" }) })
                  ]
                },
                media.id
              )) }) }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex justify-end mt-4 pt-4 border-t", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkPWJHQH3Pjs.Button,
                {
                  onClick: handleConfirmSelection,
                  disabled: !selectedMedia,
                  children: "Select Image"
                }
              ) })
            ] }) }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.TabsContent, { value: "upload", className: "mt-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
              "div",
              _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, getRootProps()), {
                className: `border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`,
                children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "input", _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, getInputProps())),
                  isUploading ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4", children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-12 w-12 mx-auto animate-spin text-primary" }),
                    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-muted-foreground", children: [
                      "Uploading... ",
                      uploadProgress,
                      "%"
                    ] }),
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-48 mx-auto h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                      "div",
                      {
                        className: "h-full bg-primary transition-all duration-300",
                        style: { width: `${uploadProgress}%` }
                      }
                    ) })
                  ] }) : /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Upload, { className: "h-12 w-12 mx-auto mb-4 text-muted-foreground" }),
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-lg font-medium", children: isDragActive ? "Drop the image here" : "Drag & drop an image" }),
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-muted-foreground mt-2", children: "or click to select a file" }),
                    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-xs text-muted-foreground mt-4", children: [
                      "PNG, JPG, GIF, WebP, SVG, or ICO up to ",
                      Math.round(maxSize / 1024 / 1024),
                      "MB"
                    ] })
                  ] })
                ]
              })
            ) }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.TabsContent, { value: "url", className: "mt-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4", children: [
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "imageUrl", children: "Image URL" }),
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  _chunkNY5MFDNPjs.Input,
                  {
                    id: "imageUrl",
                    value: urlInput,
                    onChange: (e) => setUrlInput(e.target.value),
                    placeholder: "https://example.com/image.jpg",
                    onKeyDown: (e) => e.key === "Enter" && handleUrlSubmit()
                  }
                )
              ] }),
              urlInput && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "border rounded-lg p-4", children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-muted-foreground mb-2", children: "Preview:" }),
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex justify-end", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { onClick: handleUrlSubmit, disabled: !urlInput.trim(), children: "Use This URL" }) })
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    value && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "relative mt-2 rounded-lg overflow-hidden border bg-muted/30", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _chunkPWJHQH3Pjs.Button,
        {
          variant: "destructive",
          size: "icon",
          className: "absolute top-2 right-2 h-6 w-6",
          onClick: () => onChange(""),
          children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.X, { className: "h-3 w-3" })
        }
      )
    ] })
  ] });
}

// src/components/admin/BrandingSettings.tsx

function BrandingSettings() {
  const [branding, setBranding] = _react.useState.call(void 0, {
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
  const [isLoading, setIsLoading] = _react.useState.call(void 0, true);
  const [isSaving, setIsSaving] = _react.useState.call(void 0, false);
  const [hasChanges, setHasChanges] = _react.useState.call(void 0, false);
  _react.useEffect.call(void 0, () => {
    fetchBranding();
  }, []);
  const fetchBranding = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings?group=branding");
      if (response.ok) {
        const data = await response.json();
        if (data.branding) {
          setBranding((prev) => _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), data.branding));
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
        _sonner.toast.success("Branding settings saved successfully");
        setHasChanges(false);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      _sonner.toast.error("Failed to save branding settings");
    } finally {
      setIsSaving(false);
    }
  };
  const updateField = (field, value) => {
    setBranding((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { [field]: value }));
    setHasChanges(true);
  };
  if (isLoading) {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) });
  }
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-6", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardTitle, { children: "Site Identity" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardDescription, { children: "Your site name and tagline appear in headers and metadata" })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardContent, { className: "space-y-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "siteName", children: "Site Name" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkNY5MFDNPjs.Input,
            {
              id: "siteName",
              value: branding.siteName,
              onChange: (e) => updateField("siteName", e.target.value),
              placeholder: "My Awesome Site"
            }
          )
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "siteTagline", children: "Tagline" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkNY5MFDNPjs.Input,
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
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardTitle, { children: "Logo" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardDescription, { children: "Upload your logo for light and dark themes. Recommended size: 200x50px or larger." })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid gap-6 md:grid-cols-2", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            MediaPicker,
            {
              label: "Logo (Light Mode)",
              value: branding.logoUrl || "",
              onChange: (value) => updateField("logoUrl", value),
              placeholder: "Select or upload logo",
              previewSize: "small"
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "logoAlt", children: "Logo Alt Text" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkNY5MFDNPjs.Input,
            {
              id: "logoAlt",
              value: branding.logoAlt || "",
              onChange: (e) => updateField("logoAlt", e.target.value),
              placeholder: "Company Logo"
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: "Describes the logo for accessibility and SEO" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardTitle, { children: "Favicon & Icons" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardDescription, { children: "Browser tab icon and mobile app icons" })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardContent, { className: "space-y-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            MediaPicker,
            {
              label: "Favicon",
              value: branding.faviconUrl || "",
              onChange: (value) => updateField("faviconUrl", value),
              placeholder: "Select or upload favicon",
              previewSize: "small"
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: "Recommended: 32x32px .ico or .png" })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            MediaPicker,
            {
              label: "Apple Touch Icon",
              value: branding.appleTouchIconUrl || "",
              onChange: (value) => updateField("appleTouchIconUrl", value),
              placeholder: "Select or upload icon",
              previewSize: "small"
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: "Recommended: 180x180px .png" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardTitle, { children: "Social Sharing" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardDescription, { children: "Default image for social media shares" })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardContent, { className: "space-y-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          MediaPicker,
          {
            label: "Default Open Graph Image",
            value: branding.ogImageUrl || "",
            onChange: (value) => updateField("ogImageUrl", value),
            placeholder: "Select or upload social sharing image",
            previewSize: "large"
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: "Recommended: 1200x630px for best display on social platforms" })
      ] }) })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardTitle, { children: "Brand Colors" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardDescription, { children: "Primary colors used throughout the site" })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardContent, { className: "space-y-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-3", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "primaryColor", children: "Primary Color" }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-3", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              "input",
              {
                type: "color",
                id: "primaryColor",
                value: branding.primaryColor || "#0066cc",
                onChange: (e) => updateField("primaryColor", e.target.value),
                className: "h-10 w-14 rounded border cursor-pointer"
              }
            ),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkNY5MFDNPjs.Input,
              {
                value: branding.primaryColor || "#0066cc",
                onChange: (e) => updateField("primaryColor", e.target.value),
                placeholder: "#0066cc",
                className: "flex-1"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-3", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "accentColor", children: "Accent Color" }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-3", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              "input",
              {
                type: "color",
                id: "accentColor",
                value: branding.accentColor || "#6366f1",
                onChange: (e) => updateField("accentColor", e.target.value),
                className: "h-10 w-14 rounded border cursor-pointer"
              }
            ),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkNY5MFDNPjs.Input,
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
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-end gap-4", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _chunkPWJHQH3Pjs.Button,
        {
          variant: "outline",
          onClick: fetchBranding,
          disabled: !hasChanges || isSaving,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { onClick: handleSave, disabled: !hasChanges || isSaving, children: isSaving ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
        "Saving..."
      ] }) : "Save Branding" })
    ] })
  ] });
}

// src/components/admin/DashboardMetrics.tsx











function DashboardMetrics() {
  const [metrics, setMetrics] = _react.useState.call(void 0, null);
  const [loading, setLoading] = _react.useState.call(void 0, true);
  _react.useEffect.call(void 0, () => {
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
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [...Array(8)].map((_, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Card, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { className: "animate-pulse", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-4 bg-gray-200 rounded w-3/4" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-8 bg-gray-200 rounded w-1/2 mt-2" })
    ] }) }, i)) });
  }
  if (!metrics) {
    return null;
  }
  const cards = [
    {
      title: "Total Users",
      value: metrics.totalUsers,
      icon: _lucidereact.Users,
      description: "Registered user accounts",
      color: "text-blue-600"
    },
    {
      title: "Active Subscriptions",
      value: metrics.activeSubscriptions,
      icon: _lucidereact.TrendingUp,
      description: "Paying customers",
      color: "text-green-600"
    },
    {
      title: "Active Trials",
      value: metrics.trialsActive,
      icon: _lucidereact.Activity,
      description: "Trial accounts",
      color: "text-yellow-600"
    },
    {
      title: "Total Customers",
      value: metrics.totalCustomers,
      icon: _lucidereact.Users,
      description: "End users across all businesses",
      color: "text-purple-600"
    },
    {
      title: "Monthly Revenue",
      value: `$${metrics.monthlyRevenue.toLocaleString()}`,
      icon: _lucidereact.DollarSign,
      description: "Recurring revenue",
      color: "text-green-600"
    },
    {
      title: "Total Products",
      value: metrics.totalProducts,
      icon: _lucidereact.Package,
      description: "Products across all stores",
      color: "text-orange-600"
    },
    {
      title: "Total Orders",
      value: metrics.totalOrders,
      icon: _lucidereact.ShoppingCart,
      description: "Orders this month",
      color: "text-indigo-600"
    },
    {
      title: "API Calls Today",
      value: metrics.apiCallsToday.toLocaleString(),
      icon: _lucidereact.Zap,
      description: "Platform API usage",
      color: "text-pink-600"
    }
  ];
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: cards.map((card, index) => {
    const Icon2 = card.icon;
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardTitle, { className: "text-sm font-medium", children: card.title }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon2, { className: `h-4 w-4 ${card.color}` })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardContent, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "text-2xl font-bold", children: card.value }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: card.description })
      ] })
    ] }, index);
  }) });
}

// src/components/admin/QuickActions.tsx










function QuickActions() {
  const router = _navigation.useRouter.call(void 0, );
  const { buildPath } = _chunk72BQHJ6Fjs.useCMSConfig.call(void 0, );
  const actions = [
    {
      title: "Add Product",
      description: "Create a new product",
      icon: _lucidereact.Plus,
      action: () => router.push(buildPath("/admin/products/new")),
      variant: "default"
    },
    {
      title: "View Analytics",
      description: "Performance metrics",
      icon: _lucidereact.TrendingUp,
      action: () => router.push(buildPath("/admin/analytics")),
      variant: "outline"
    },
    {
      title: "New Blog Post",
      description: "Write a new article",
      icon: _lucidereact.FileText,
      action: () => router.push(buildPath("/admin/blog/new")),
      variant: "outline"
    },
    {
      title: "Export Data",
      description: "Download reports",
      icon: _lucidereact.Download,
      action: () => handleExport(),
      variant: "outline"
    },
    {
      title: "Email Marketing",
      description: "Send email campaigns",
      icon: _lucidereact.Mail,
      action: () => router.push(buildPath("/admin/email-marketing")),
      variant: "outline"
    },
    {
      title: "System Settings",
      description: "Configure settings",
      icon: _lucidereact.Settings,
      action: () => router.push(buildPath("/admin/settings")),
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
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardTitle, { children: "Quick Actions" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardDescription, { children: "Common administrative tasks" })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardContent, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid gap-2 md:grid-cols-2 lg:grid-cols-3", children: actions.map((action, index) => {
      const Icon2 = action.icon;
      return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        _chunkPWJHQH3Pjs.Button,
        {
          variant: action.variant,
          className: "justify-start",
          onClick: action.action,
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon2, { className: "mr-2 h-4 w-4" }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-left", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "font-medium", children: action.title }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "text-xs opacity-70", children: action.description })
            ] })
          ]
        },
        index
      );
    }) }) })
  ] });
}

// src/components/admin/EnvManager.tsx
























// src/components/ui/progress.tsx

var _reactprogress = require('@radix-ui/react-progress'); var ProgressPrimitive = _interopRequireWildcard(_reactprogress);

var Progress = React3.forwardRef((_a, ref) => {
  var _b = _a, { className, value } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "value"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ProgressPrimitive.Root,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )
    }, props), {
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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

var _classvarianceauthority = require('class-variance-authority');

var alertVariants = _classvarianceauthority.cva.call(void 0, 
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
  var _b = _a, { className, variant } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "variant"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      role: "alert",
      className: _chunkSKQV2OMQjs.cn.call(void 0, alertVariants({ variant }), className)
    }, props)
  );
});
Alert.displayName = "Alert";
var AlertTitle = React4.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "h5",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "mb-1 font-medium leading-none tracking-tight", className)
    }, props)
  );
});
AlertTitle.displayName = "AlertTitle";
var AlertDescription = React4.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "text-sm [&_p]:leading-relaxed", className)
    }, props)
  );
});
AlertDescription.displayName = "AlertDescription";

// src/components/ui/accordion.tsx

var _reactaccordion = require('@radix-ui/react-accordion'); var AccordionPrimitive = _interopRequireWildcard(_reactaccordion);


var Accordion = AccordionPrimitive.Root;
var AccordionItem = React5.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    AccordionPrimitive.Item,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "border-b", className)
    }, props)
  );
});
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = React5.forwardRef((_a, ref) => {
  var _b = _a, { className, children } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "children"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    AccordionPrimitive.Trigger,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )
    }, props), {
      children: [
        children,
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronDown, { className: "h-4 w-4 shrink-0 transition-transform duration-200" })
      ]
    })
  ) });
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
var AccordionContent = React5.forwardRef((_a, ref) => {
  var _b = _a, { className, children } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "children"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    AccordionPrimitive.Content,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    }, props), {
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: _chunkSKQV2OMQjs.cn.call(void 0, "pb-4 pt-0", className), children })
    })
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// src/components/admin/EnvManager.tsx

var CATEGORY_ICONS = {
  database: _lucidereact.Database,
  auth: _lucidereact.Shield,
  payments: _lucidereact.CreditCard,
  shipping: _lucidereact.Truck,
  storage: _lucidereact.HardDrive,
  email: _lucidereact.Mail,
  analytics: _lucidereact.BarChart,
  ai: _lucidereact.Bot,
  general: _lucidereact.Settings
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
  const [variables, setVariables] = _react.useState.call(void 0, []);
  const [health, setHealth] = _react.useState.call(void 0, null);
  const [isLoading, setIsLoading] = _react.useState.call(void 0, true);
  const [activeCategory, setActiveCategory] = _react.useState.call(void 0, "all");
  const [searchQuery, setSearchQuery] = _react.useState.call(void 0, "");
  const [editingVar, setEditingVar] = _react.useState.call(void 0, null);
  const [editValue, setEditValue] = _react.useState.call(void 0, "");
  const [showValue, setShowValue] = _react.useState.call(void 0, false);
  const [isSaving, setIsSaving] = _react.useState.call(void 0, false);
  const [showImportDialog, setShowImportDialog] = _react.useState.call(void 0, false);
  const [importText, setImportText] = _react.useState.call(void 0, "");
  const [isImporting, setIsImporting] = _react.useState.call(void 0, false);
  const loadEnvVars = _react.useCallback.call(void 0, async () => {
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
      _sonner.toast.error("Failed to load environment variables");
    } finally {
      setIsLoading(false);
    }
  }, []);
  _react.useEffect.call(void 0, () => {
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
      _sonner.toast.success(`${editingVar.label} has been updated`);
      setEditingVar(null);
      setEditValue("");
      setShowValue(false);
      loadEnvVars();
    } catch (error) {
      _sonner.toast.error(error instanceof Error ? error.message : "Failed to save");
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
      _sonner.toast.success("Environment variable removed");
      loadEnvVars();
    } catch (error) {
      _sonner.toast.error("Failed to delete environment variable");
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
      _sonner.toast.success(`Imported ${data.imported} variables (${data.skipped} skipped)`);
      if (((_a = data.errors) == null ? void 0 : _a.length) > 0) {
        _sonner.toast.warning(`${data.errors.length} errors occurred during import`);
      }
      setShowImportDialog(false);
      setImportText("");
      loadEnvVars();
    } catch (error) {
      _sonner.toast.error("Failed to import environment variables");
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
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "animate-pulse space-y-4", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-20 bg-muted rounded-lg" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-64 bg-muted rounded-lg" })
    ] }) });
  }
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkV746VSQLjs.TooltipProvider, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-6", children: [
    health && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardHeader, { className: "pb-2", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardTitle, { className: "text-lg", children: "Configuration Health" }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardDescription, { children: [
            health.requiredConfigured,
            "/",
            health.required,
            " required variables configured"
          ] })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", size: "sm", onClick: loadEnvVars, children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.RefreshCw, { className: "h-4 w-4 mr-2" }),
          "Refresh"
        ] })
      ] }) }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: "Overall Progress" }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { children: [
              health.configured,
              "/",
              health.total,
              " (",
              Math.round(health.configured / health.total * 100),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Progress, { value: health.configured / health.total * 100 })
        ] }),
        health.missingRequired.length > 0 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Alert, { variant: "destructive", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, AlertDescription, { children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-medium", children: "Missing required variables: " }),
            health.missingRequired.join(", ")
          ] })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid grid-cols-3 md:grid-cols-5 gap-2 pt-2", children: Object.keys(health.categories).map((cat) => {
          const Icon2 = CATEGORY_ICONS[cat];
          const catHealth = health.categories[cat];
          const percentage = catHealth.total > 0 ? Math.round(catHealth.configured / catHealth.total * 100) : 0;
          return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkV746VSQLjs.Tooltip, { children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkV746VSQLjs.TooltipTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
              "button",
              {
                className: _chunkSKQV2OMQjs.cn.call(void 0, 
                  "p-3 rounded-lg border text-center transition-colors",
                  activeCategory === cat ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                ),
                onClick: () => setActiveCategory(cat),
                children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon2, { className: "h-5 w-5 mx-auto mb-1 text-muted-foreground" }),
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "text-xs font-medium truncate", children: CATEGORY_LABELS[cat] }),
                  /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-xs text-muted-foreground", children: [
                    catHealth.configured,
                    "/",
                    catHealth.total
                  ] })
                ]
              }
            ) }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkV746VSQLjs.TooltipContent, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { children: [
              CATEGORY_LABELS[cat],
              ": ",
              percentage,
              "% configured"
            ] }) })
          ] }, cat);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col sm:flex-row gap-4", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "relative flex-1", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkNY5MFDNPjs.Input,
          {
            placeholder: "Search variables...",
            className: "pl-9",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkPWJHQH3Pjs.Button,
          {
            variant: activeCategory === "all" ? "default" : "outline",
            onClick: () => setActiveCategory("all"),
            children: "All"
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", onClick: () => setShowImportDialog(true), children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Upload, { className: "h-4 w-4 mr-2" }),
          "Import"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Accordion, { type: "multiple", defaultValue: Object.keys(groupedVariables), className: "space-y-4", children: Object.entries(groupedVariables).map(
      ([category, vars]) => {
        const Icon2 = CATEGORY_ICONS[category];
        return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, AccordionItem, { value: category, className: "border rounded-lg", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AccordionTrigger, { className: "px-4 hover:no-underline hover:bg-muted/50", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon2, { className: "h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-medium", children: CATEGORY_LABELS[category] }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Badge, { variant: "secondary", className: "ml-2", children: [
              vars.filter((v) => v.configured).length,
              "/",
              vars.length
            ] })
          ] }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AccordionContent, { className: "px-4 pb-4", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-3", children: vars.map((v) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "div",
            {
              className: _chunkSKQV2OMQjs.cn.call(void 0, 
                "p-4 rounded-lg border",
                !v.configured && v.required && "border-destructive/50 bg-destructive/5"
              ),
              children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-start justify-between gap-4", children: [
                /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-mono text-sm font-medium", children: v.key }),
                    v.required && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Badge, { variant: "destructive", className: "text-xs", children: "Required" }),
                    v.sensitive && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Badge, { variant: "secondary", className: "text-xs", children: [
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Shield, { className: "h-3 w-3 mr-1" }),
                      "Encrypted"
                    ] }),
                    v.public && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Badge, { variant: "outline", className: "text-xs", children: "Public" })
                  ] }),
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-muted-foreground mt-1", children: v.description }),
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex items-center gap-2 mt-2", children: v.configured ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center text-sm text-green-600 dark:text-green-400", children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Check, { className: "h-4 w-4 mr-1" }),
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-mono", children: v.maskedValue }),
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Badge, { variant: "outline", className: "ml-2 text-xs", children: v.source === "database" ? "Database" : "ENV File" })
                  ] }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-sm text-muted-foreground italic", children: "Not configured" }) })
                ] }),
                /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                    _chunkPWJHQH3Pjs.Button,
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
                  v.configured && v.source === "database" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkV746VSQLjs.Tooltip, { children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkV746VSQLjs.TooltipTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                      _chunkPWJHQH3Pjs.Button,
                      {
                        variant: "ghost",
                        size: "icon",
                        className: "h-8 w-8 text-destructive",
                        onClick: () => handleDeleteVar(v.key),
                        children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.X, { className: "h-4 w-4" })
                      }
                    ) }),
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkV746VSQLjs.TooltipContent, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: "Remove from database" }) })
                  ] })
                ] })
              ] })
            },
            v.key
          )) }) })
        ] }, category);
      }
    ) }),
    filteredVariables.length === 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Card, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardContent, { className: "py-8 text-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-muted-foreground", children: "No environment variables found matching your search." }) }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.Dialog, { open: !!editingVar, onOpenChange: () => setEditingVar(null), children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogContent, { children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogHeader, { children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogTitle, { children: [
          (editingVar == null ? void 0 : editingVar.configured) ? "Update" : "Configure",
          " ",
          editingVar == null ? void 0 : editingVar.label
        ] }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogDescription, { children: editingVar == null ? void 0 : editingVar.description })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkNY5MFDNPjs.Label, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-mono text-sm", children: editingVar == null ? void 0 : editingVar.key }),
            (editingVar == null ? void 0 : editingVar.sensitive) && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Badge, { variant: "secondary", className: "text-xs", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Shield, { className: "h-3 w-3 mr-1" }),
              "Will be encrypted"
            ] })
          ] }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "relative", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkNY5MFDNPjs.Input,
              {
                type: showValue || !(editingVar == null ? void 0 : editingVar.sensitive) ? "text" : "password",
                value: editValue,
                onChange: (e) => setEditValue(e.target.value),
                placeholder: (editingVar == null ? void 0 : editingVar.placeholder) || "Enter value..."
              }
            ),
            (editingVar == null ? void 0 : editingVar.sensitive) && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkPWJHQH3Pjs.Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                className: "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7",
                onClick: () => setShowValue(!showValue),
                children: showValue ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Eye, { className: "h-4 w-4" })
              }
            )
          ] }),
          (editingVar == null ? void 0 : editingVar.placeholder) && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-xs text-muted-foreground", children: [
            "Example: ",
            editingVar.placeholder
          ] })
        ] }),
        (editingVar == null ? void 0 : editingVar.configured) && editingVar.source === "env_file" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Alert, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Info, { className: "h-4 w-4" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AlertDescription, { children: "This variable is currently set in your .env file. Setting it here will override the file value with an encrypted database value." })
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogFooter, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", onClick: () => setEditingVar(null), children: "Cancel" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { onClick: handleSaveVar, disabled: !editValue || isSaving, children: isSaving ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
          "Saving..."
        ] }) : /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Check, { className: "h-4 w-4 mr-2" }),
          "Save"
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.Dialog, { open: showImportDialog, onOpenChange: setShowImportDialog, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogHeader, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogTitle, { children: "Import Environment Variables" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogDescription, { children: "Paste your .env file contents below. Only recognized variables will be imported." })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkV746VSQLjs.Textarea,
          {
            value: importText,
            onChange: (e) => setImportText(e.target.value),
            placeholder: `# Paste your .env contents here
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...`,
            className: "font-mono text-sm h-64"
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Alert, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Info, { className: "h-4 w-4" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AlertDescription, { children: "Existing values will not be overwritten. Only new variables will be imported. Sensitive values will be automatically encrypted." })
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogFooter, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", onClick: () => setShowImportDialog(false), children: "Cancel" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { onClick: handleImport, disabled: !importText.trim() || isImporting, children: isImporting ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
          "Importing..."
        ] }) : /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Upload, { className: "h-4 w-4 mr-2" }),
          "Import"
        ] }) })
      ] })
    ] }) })
  ] }) });
}

// src/components/admin/EmailProviderSettings.tsx














// src/components/ui/switch.tsx
var _reactswitch = require('@radix-ui/react-switch'); var SwitchPrimitive = _interopRequireWildcard(_reactswitch);

function Switch(_a) {
  var _b = _a, {
    className
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    SwitchPrimitive.Root,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "switch",
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )
    }, props), {
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        SwitchPrimitive.Thumb,
        {
          "data-slot": "switch-thumb",
          className: _chunkSKQV2OMQjs.cn.call(void 0, 
            "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
          )
        }
      )
    })
  );
}

// src/components/ui/select.tsx
var _reactselect = require('@radix-ui/react-select'); var SelectPrimitive = _interopRequireWildcard(_reactselect);


function Select(_a) {
  var props = _chunkHY7GTCJMjs.__objRest.call(void 0, _a, []);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectPrimitive.Root, _chunkHY7GTCJMjs.__spreadValues.call(void 0, { "data-slot": "select" }, props));
}
function SelectValue(_a) {
  var props = _chunkHY7GTCJMjs.__objRest.call(void 0, _a, []);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectPrimitive.Value, _chunkHY7GTCJMjs.__spreadValues.call(void 0, { "data-slot": "select-value" }, props));
}
function SelectTrigger(_a) {
  var _b = _a, {
    className,
    size = "default",
    children
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className",
    "size",
    "children"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    SelectPrimitive.Trigger,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "select-trigger",
      "data-size": size,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )
    }, props), {
      children: [
        children,
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronDownIcon, { className: "size-4 opacity-50" }) })
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
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className",
    "children",
    "position",
    "align"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectPrimitive.Portal, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    SelectPrimitive.Content,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "select-content",
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      ),
      position,
      align
    }, props), {
      children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectScrollUpButton, {}),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          SelectPrimitive.Viewport,
          {
            className: _chunkSKQV2OMQjs.cn.call(void 0, 
              "p-1",
              position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
            ),
            children
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectScrollDownButton, {})
      ]
    })
  ) });
}
function SelectItem(_a) {
  var _b = _a, {
    className,
    children
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className",
    "children"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    SelectPrimitive.Item,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "select-item",
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )
    }, props), {
      children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "span",
          {
            "data-slot": "select-item-indicator",
            className: "absolute right-2 flex size-3.5 items-center justify-center",
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.CheckIcon, { className: "size-4" }) })
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectPrimitive.ItemText, { children })
      ]
    })
  );
}
function SelectScrollUpButton(_a) {
  var _b = _a, {
    className
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    SelectPrimitive.ScrollUpButton,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "select-scroll-up-button",
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "flex cursor-default items-center justify-center py-1",
        className
      )
    }, props), {
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronUpIcon, { className: "size-4" })
    })
  );
}
function SelectScrollDownButton(_a) {
  var _b = _a, {
    className
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    SelectPrimitive.ScrollDownButton,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "select-scroll-down-button",
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "flex cursor-default items-center justify-center py-1",
        className
      )
    }, props), {
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronDownIcon, { className: "size-4" })
    })
  );
}

// src/components/admin/EmailProviderSettings.tsx

function EmailProviderSettings() {
  const [loading, setLoading] = _react.useState.call(void 0, true);
  const [saving, setSaving] = _react.useState.call(void 0, false);
  const [testing, setTesting] = _react.useState.call(void 0, false);
  const [envVars, setEnvVars] = _react.useState.call(void 0, []);
  const [showSecrets, setShowSecrets] = _react.useState.call(void 0, {});
  const [form, setForm] = _react.useState.call(void 0, {
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
  _react.useEffect.call(void 0, () => {
    fetchSettings();
  }, []);
  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      if (data.success) {
        if (data.settings.email) {
          setForm((prev) => _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), data.settings.email));
        }
        if (data.settings.envVars) {
          setEnvVars(data.settings.envVars.filter((v) => v.group === "email"));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      _sonner.toast.error("Failed to load email settings");
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
        _sonner.toast.success("Email settings saved successfully");
        if (data.settings.email) {
          setForm((prev) => _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), data.settings.email));
        }
      } else {
        _sonner.toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      _sonner.toast.error("Failed to save settings");
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
        _sonner.toast.success(`Test email sent to ${form.fromEmail}`);
      } else {
        _sonner.toast.error(data.error || "Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      _sonner.toast.error("Failed to send test email");
    } finally {
      setTesting(false);
    }
  };
  const toggleSecret = (key) => {
    setShowSecrets((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { [key]: !prev[key] }));
  };
  const renderSecretInput = (label, key, placeholder) => {
    const value = form[key] || "";
    const isVisible = showSecrets[key];
    const isMasked = value === "********";
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { children: label }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "relative", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkNY5MFDNPjs.Input,
          {
            type: isVisible ? "text" : "password",
            value,
            onChange: (e) => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { [key]: e.target.value })),
            placeholder: isMasked ? "Enter new value to change" : placeholder
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "button",
          {
            type: "button",
            onClick: () => toggleSecret(key),
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
            children: isVisible ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Eye, { className: "h-4 w-4" })
          }
        )
      ] }),
      isMasked && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: "Value is configured. Enter a new value to change it." })
    ] });
  };
  if (loading) {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) });
  }
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-6", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Mail, { className: "h-5 w-5" }),
          "Email Provider"
        ] }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardDescription, { children: "Configure your email sending provider. SMTP (nodemailer) allows unlimited sending with your own mail server. All credentials are encrypted in the database." })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { children: "Email Provider" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid grid-cols-5 gap-2", children: ["smtp", "sendgrid", "resend", "mailgun", "ses"].map((provider) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkPWJHQH3Pjs.Button,
            {
              variant: form.provider === provider ? "default" : "outline",
              onClick: () => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { provider })),
              className: "w-full",
              children: provider === "smtp" ? "SMTP" : provider === "ses" ? "AWS SES" : provider.charAt(0).toUpperCase() + provider.slice(1)
            },
            provider
          )) })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { children: "From Name" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkNY5MFDNPjs.Input,
              {
                value: form.fromName || "",
                onChange: (e) => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { fromName: e.target.value })),
                placeholder: "Your Company"
              }
            )
          ] }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { children: "From Email" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkNY5MFDNPjs.Input,
              {
                type: "email",
                value: form.fromEmail || "",
                onChange: (e) => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { fromEmail: e.target.value })),
                placeholder: "noreply@yourdomain.com"
              }
            )
          ] })
        ] }),
        form.provider === "smtp" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Server, { className: "h-4 w-4" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "font-medium", children: "SMTP Settings (Nodemailer)" })
          ] }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Alert, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AlertDescription, { children: "Use your own mail server for unlimited email sending without per-email costs." }) }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { children: "SMTP Host" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkNY5MFDNPjs.Input,
                {
                  value: form.smtpHost || "",
                  onChange: (e) => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { smtpHost: e.target.value })),
                  placeholder: "smtp.yourdomain.com"
                }
              )
            ] }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { children: "SMTP Port" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkNY5MFDNPjs.Input,
                {
                  type: "number",
                  value: form.smtpPort || 587,
                  onChange: (e) => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { smtpPort: parseInt(e.target.value) })),
                  placeholder: "587"
                }
              )
            ] }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { children: "SMTP Username" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkNY5MFDNPjs.Input,
                {
                  value: form.smtpUser || "",
                  onChange: (e) => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { smtpUser: e.target.value })),
                  placeholder: "username"
                }
              )
            ] }),
            renderSecretInput("SMTP Password", "smtpPass", "Enter password")
          ] }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              Switch,
              {
                id: "smtp-secure",
                checked: form.smtpSecure || false,
                onCheckedChange: (checked) => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { smtpSecure: checked }))
              }
            ),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "smtp-secure", children: "Use TLS/SSL (typically port 465)" })
          ] })
        ] }),
        form.provider === "sendgrid" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "font-medium", children: "SendGrid Settings" }),
          renderSecretInput("API Key", "sendgridApiKey", "SG.xxxxxx")
        ] }),
        form.provider === "resend" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "font-medium", children: "Resend Settings" }),
          renderSecretInput("API Key", "resendApiKey", "re_xxxxxx")
        ] }),
        form.provider === "mailgun" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "font-medium", children: "Mailgun Settings" }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid grid-cols-2 gap-4", children: [
            renderSecretInput("API Key", "mailgunApiKey", "key-xxxxxx"),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { children: "Domain" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkNY5MFDNPjs.Input,
                {
                  value: form.mailgunDomain || "",
                  onChange: (e) => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { mailgunDomain: e.target.value })),
                  placeholder: "mg.yourdomain.com"
                }
              )
            ] })
          ] })
        ] }),
        form.provider === "ses" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "font-medium", children: "AWS SES Settings" }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid grid-cols-2 gap-4", children: [
            renderSecretInput("Access Key ID", "sesAccessKeyId", "AKIAXXXXXXXX"),
            renderSecretInput("Secret Access Key", "sesSecretAccessKey", "xxxxxx"),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { children: "Region" }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                Select,
                {
                  value: form.sesRegion || "us-east-1",
                  onValueChange: (value) => setForm((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { sesRegion: value })),
                  children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectTrigger, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectValue, {}) }),
                    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, SelectContent, { children: [
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: "us-east-1", children: "US East (N. Virginia)" }),
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: "us-west-2", children: "US West (Oregon)" }),
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: "eu-west-1", children: "EU (Ireland)" }),
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: "eu-central-1", children: "EU (Frankfurt)" }),
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: "ap-southeast-1", children: "Asia Pacific (Singapore)" }),
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: "ap-southeast-2", children: "Asia Pacific (Sydney)" })
                    ] })
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] }),
    envVars.length > 0 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Card, { children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.CardHeader, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardTitle, { className: "text-base", children: "Environment Variables" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardDescription, { children: "Settings configured in the database take precedence over environment variables." })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.CardContent, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid grid-cols-2 gap-2", children: envVars.map((envVar) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2 text-sm", children: [
        envVar.configured ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.CheckCircle, { className: "h-4 w-4 text-green-500" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.XCircle, { className: "h-4 w-4 text-muted-foreground/30" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: envVar.configured ? "" : "text-muted-foreground", children: envVar.name })
      ] }, envVar.name)) }) })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-between", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        _chunkPWJHQH3Pjs.Button,
        {
          variant: "outline",
          onClick: sendTestEmail,
          disabled: testing || !form.fromEmail,
          children: [
            testing ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Send, { className: "mr-2 h-4 w-4" }),
            "Send Test Email"
          ]
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkPWJHQH3Pjs.Button, { onClick: saveSettings, disabled: saving, children: [
        saving ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Save, { className: "mr-2 h-4 w-4" }),
        "Save Settings"
      ] })
    ] })
  ] });
}

// src/components/admin/media/MediaManager.tsx


// src/hooks/use-media.ts

var DEFAULT_FILTERS = {
  page: 1,
  limit: 50,
  sortBy: "createdAt",
  sortOrder: "desc",
  includeDeleted: false
};
function useMedia() {
  const [media, setMedia] = _react.useState.call(void 0, []);
  const [folders, setFolders] = _react.useState.call(void 0, []);
  const [tags, setTags] = _react.useState.call(void 0, []);
  const [selectedIds, setSelectedIds] = _react.useState.call(void 0, /* @__PURE__ */ new Set());
  const [viewMode, setViewModeState] = _react.useState.call(void 0, "grid");
  const [filters, setFiltersState] = _react.useState.call(void 0, DEFAULT_FILTERS);
  const [loading, setLoading] = _react.useState.call(void 0, false);
  const [error, setError] = _react.useState.call(void 0, null);
  const [pagination, setPagination] = _react.useState.call(void 0, {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  _react.useEffect.call(void 0, () => {
    const saved = localStorage.getItem("media-view-mode");
    if (saved === "grid" || saved === "list") {
      setViewModeState(saved);
    }
  }, []);
  const setViewMode = _react.useCallback.call(void 0, (mode) => {
    setViewModeState(mode);
    localStorage.setItem("media-view-mode", mode);
  }, []);
  const setFilters = _react.useCallback.call(void 0, (newFilters) => {
    setFiltersState((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), newFilters), { page: 1 }));
  }, []);
  const setPage = _react.useCallback.call(void 0, (page) => {
    setFiltersState((prev) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, prev), { page }));
  }, []);
  const fetchMedia = _react.useCallback.call(void 0, async () => {
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
      const mediaItems = Array.isArray(data.media) ? data.media : Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
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
  const fetchFolders = _react.useCallback.call(void 0, async () => {
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
  const fetchTags = _react.useCallback.call(void 0, async () => {
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
  const selectItem = _react.useCallback.call(void 0, (id) => {
    setSelectedIds(/* @__PURE__ */ new Set([id]));
  }, []);
  const toggleItem = _react.useCallback.call(void 0, (id) => {
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
  const selectAll = _react.useCallback.call(void 0, () => {
    setSelectedIds(new Set(media.map((m) => m.id)));
  }, [media]);
  const clearSelection = _react.useCallback.call(void 0, () => {
    setSelectedIds(/* @__PURE__ */ new Set());
  }, []);
  const deleteSelected = _react.useCallback.call(void 0, 
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
  const moveSelected = _react.useCallback.call(void 0, 
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
  const tagSelected = _react.useCallback.call(void 0, 
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
  const refreshAll = _react.useCallback.call(void 0, async () => {
    await Promise.all([fetchMedia(), fetchFolders(), fetchTags()]);
  }, [fetchMedia, fetchFolders, fetchTags]);
  _react.useEffect.call(void 0, () => {
    fetchMedia();
  }, [fetchMedia]);
  _react.useEffect.call(void 0, () => {
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



// src/components/ui/checkbox.tsx

var _reactcheckbox = require('@radix-ui/react-checkbox'); var CheckboxPrimitive = _interopRequireWildcard(_reactcheckbox);


var Checkbox = React7.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    CheckboxPrimitive.Root,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )
    }, props), {
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        CheckboxPrimitive.Indicator,
        {
          className: _chunkSKQV2OMQjs.cn.call(void 0, "flex items-center justify-center text-current"),
          children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Check, { className: "h-4 w-4" })
        }
      )
    })
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// src/components/admin/media/MediaCard.tsx









var typeIcons = {
  image: _lucidereact.ImageIcon,
  video: _lucidereact.Film,
  audio: _lucidereact.Music,
  document: _lucidereact.FileText,
  other: _lucidereact.File
};
var MediaCard = _react.forwardRef.call(void 0, 
  ({ media, selected, onSelect, onToggle, onClick, onContextMenu }, ref) => {
    var _a;
    const mediaType = _chunkBHKDPOTYjs.getMediaType.call(void 0, media.mimeType);
    const Icon2 = typeIcons[mediaType];
    const [imageError, setImageError] = _react.useState.call(void 0, false);
    const isValidUrl = (url) => {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    };
    const hasValidUrl = media.url && isValidUrl(media.url);
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "div",
      {
        ref,
        className: _chunkSKQV2OMQjs.cn.call(void 0, 
          "group relative bg-card rounded-lg border cursor-pointer transition-all hover:shadow-md",
          selected && "ring-2 ring-primary"
        ),
        onClick,
        onContextMenu,
        children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "div",
            {
              className: _chunkSKQV2OMQjs.cn.call(void 0, 
                "absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
                selected && "opacity-100"
              ),
              onClick: (e) => e.stopPropagation(),
              children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                Checkbox,
                {
                  checked: selected,
                  onCheckedChange: () => onToggle(),
                  className: "bg-background/80 backdrop-blur-sm"
                }
              )
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "aspect-square relative bg-muted rounded-t-lg overflow-hidden", children: [
            mediaType === "image" && hasValidUrl && !imageError ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _image2.default,
              {
                src: media.url,
                alt: media.alt || media.filename,
                fill: true,
                className: "object-cover",
                sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
                onError: () => setImageError(true),
                unoptimized: !media.url.includes(".r2.dev") && !media.url.includes(".amazonaws.com")
              }
            ) : imageError || !hasValidUrl ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.AlertCircle, { className: "h-12 w-12" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-xs", children: "Image unavailable" })
            ] }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon2, { className: "h-16 w-16 text-muted-foreground" }) }),
            mediaType !== "image" && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkTLZBOFEDjs.Badge,
              {
                variant: "secondary",
                className: "absolute bottom-2 right-2 text-xs",
                children: ((_a = media.mimeType.split("/")[1]) == null ? void 0 : _a.toUpperCase()) || mediaType
              }
            )
          ] }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "p-3", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium text-sm truncate", title: media.title || media.filename, children: media.title || media.filename }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-xs text-muted-foreground mt-1", children: [
              _chunkBHKDPOTYjs.formatFileSize.call(void 0, media.size),
              media.width && media.height && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "ml-2", children: [
                media.width,
                " \xD7 ",
                media.height
              ] })
            ] }),
            media.tags && media.tags.length > 0 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-wrap gap-1 mt-2", children: [
              media.tags.slice(0, 3).map((tagRelation) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkTLZBOFEDjs.Badge,
                {
                  variant: "outline",
                  className: "text-xs py-0",
                  style: tagRelation.tag.color ? { borderColor: tagRelation.tag.color } : void 0,
                  children: tagRelation.tag.name
                },
                tagRelation.tag.id
              )),
              media.tags.length > 3 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Badge, { variant: "outline", className: "text-xs py-0", children: [
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

var _reactcontextmenu = require('@radix-ui/react-context-menu'); var ContextMenuPrimitive = _interopRequireWildcard(_reactcontextmenu);


var ContextMenu = ContextMenuPrimitive.Root;
var ContextMenuTrigger = ContextMenuPrimitive.Trigger;
var ContextMenuSub = ContextMenuPrimitive.Sub;
var ContextMenuSubTrigger = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, inset, children } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "inset", "children"]);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    ContextMenuPrimitive.SubTrigger,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        inset && "pl-8",
        className
      )
    }, props), {
      children: [
        children,
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronRight, { className: "ml-auto h-4 w-4" })
      ]
    })
  );
});
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;
var ContextMenuSubContent = React8.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ContextMenuPrimitive.SubContent,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )
    }, props)
  );
});
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;
var ContextMenuContent = React8.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuPrimitive.Portal, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ContextMenuPrimitive.Content,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )
    }, props)
  ) });
});
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;
var ContextMenuItem = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, inset } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "inset"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ContextMenuPrimitive.Item,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )
    }, props)
  );
});
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;
var ContextMenuCheckboxItem = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, children, checked } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "children", "checked"]);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    ContextMenuPrimitive.CheckboxItem,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      ),
      checked
    }, props), {
      children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Check, { className: "h-4 w-4" }) }) }),
        children
      ]
    })
  );
});
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;
var ContextMenuRadioItem = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, children } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "children"]);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    ContextMenuPrimitive.RadioItem,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )
    }, props), {
      children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Circle, { className: "h-2 w-2 fill-current" }) }) }),
        children
      ]
    })
  );
});
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;
var ContextMenuLabel = React8.forwardRef((_a, ref) => {
  var _b = _a, { className, inset } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "inset"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ContextMenuPrimitive.Label,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "px-2 py-1.5 text-sm font-semibold text-foreground",
        inset && "pl-8",
        className
      )
    }, props)
  );
});
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;
var ContextMenuSeparator = React8.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ContextMenuPrimitive.Separator,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "-mx-1 my-1 h-px bg-border", className)
    }, props)
  );
});
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;
var ContextMenuShortcut = (_a) => {
  var _b = _a, {
    className
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "span",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )
    }, props)
  );
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

// src/components/admin/media/MediaContextMenu.tsx














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
    return folders2.map((folder) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        ContextMenuItem,
        {
          onClick: () => onMove(folder.id),
          disabled: media.folderId === folder.id,
          children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { style: { paddingLeft: depth * 12 }, children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.FolderIcon, { className: "mr-2 h-4 w-4 inline" }),
            folder.name
          ] })
        }
      ),
      folder.children && folder.children.length > 0 && renderFolderOptions(folder.children, depth + 1)
    ] }, folder.id));
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenu, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuTrigger, { asChild: true, children }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuContent, { className: "w-64", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuItem, { onClick: onPreview, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Eye, { className: "mr-2 h-4 w-4" }),
        "Preview"
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuItem, { onClick: onOpenInNewTab, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ExternalLink, { className: "mr-2 h-4 w-4" }),
        "Open in new tab"
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuItem, { onClick: onCopyUrl, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Copy, { className: "mr-2 h-4 w-4" }),
        "Copy URL"
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuItem, { onClick: onDownload, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Download, { className: "mr-2 h-4 w-4" }),
        "Download"
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuSeparator, {}),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuItem, { onClick: onRename, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Pencil, { className: "mr-2 h-4 w-4" }),
        "Rename"
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuItem, { onClick: onEditDetails, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Pencil, { className: "mr-2 h-4 w-4" }),
        "Edit details"
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuSub, { children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuSubTrigger, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.FolderInput, { className: "mr-2 h-4 w-4" }),
          "Move to folder"
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuSubContent, { className: "w-48 max-h-64 overflow-y-auto", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
            ContextMenuItem,
            {
              onClick: () => onMove(null),
              disabled: media.folderId === null,
              children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.FolderIcon, { className: "mr-2 h-4 w-4" }),
                "Root (No folder)"
              ]
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuSeparator, {}),
          folders.length > 0 ? renderFolderOptions(folders) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuItem, { disabled: true, children: "No folders available" })
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuSub, { children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuSubTrigger, { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Tags, { className: "mr-2 h-4 w-4" }),
          "Add tags"
        ] }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuSubContent, { className: "w-48 max-h-64 overflow-y-auto", children: tags.length > 0 ? tags.map((tag) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          ContextMenuItem,
          {
            onClick: () => onAddTag(tag.id),
            disabled: existingTagIds.has(tag.id),
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _lucidereact.Tag,
                {
                  className: "mr-2 h-4 w-4",
                  style: tag.color ? { color: tag.color } : void 0
                }
              ),
              tag.name,
              existingTagIds.has(tag.id) && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "ml-auto text-xs text-muted-foreground", children: "Added" })
            ]
          },
          tag.id
        )) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuItem, { disabled: true, children: "No tags available" }) })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuSeparator, {}),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuItem, { onClick: onViewUsage, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.FileSearch, { className: "mr-2 h-4 w-4" }),
        "View usage"
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ContextMenuSeparator, {}),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, ContextMenuItem, { onClick: onDelete, className: "text-destructive", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Trash, { className: "mr-2 h-4 w-4" }),
        "Delete"
      ] })
    ] })
  ] });
}

// src/components/ui/skeleton.tsx

function Skeleton(_a) {
  var _b = _a, {
    className
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      className: _chunkSKQV2OMQjs.cn.call(void 0, "animate-pulse rounded-md bg-muted", className)
    }, props)
  );
}

// src/components/admin/media/MediaGrid.tsx

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
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4", children: Array.from({ length: 12 }).map((_, i) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Skeleton, { className: "aspect-square rounded-lg" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Skeleton, { className: "h-4 w-3/4" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Skeleton, { className: "h-3 w-1/2" })
    ] }, i)) });
  }
  if (media.length === 0) {
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-muted-foreground", children: "No media files found" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-muted-foreground mt-1", children: "Upload files or change your filters" })
    ] });
  }
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4", children: media.map((item) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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



// src/components/ui/table.tsx


var Table = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "table",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "w-full caption-bottom text-sm", className)
    }, props)
  ) });
});
Table.displayName = "Table";
var TableHeader = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "thead", _chunkHY7GTCJMjs.__spreadValues.call(void 0, { ref, className: _chunkSKQV2OMQjs.cn.call(void 0, "[&_tr]:border-b", className) }, props));
});
TableHeader.displayName = "TableHeader";
var TableBody = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "tbody",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "[&_tr:last-child]:border-0", className)
    }, props)
  );
});
TableBody.displayName = "TableBody";
var TableFooter = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "tfoot",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )
    }, props)
  );
});
TableFooter.displayName = "TableFooter";
var TableRow = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "tr",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )
    }, props)
  );
});
TableRow.displayName = "TableRow";
var TableHead = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "th",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )
    }, props)
  );
});
TableHead.displayName = "TableHead";
var TableCell = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "td",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "p-4 align-middle [&:has([role=checkbox])]:pr-0", className)
    }, props)
  );
});
TableCell.displayName = "TableCell";
var TableCaption = React9.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "caption",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "mt-4 text-sm text-muted-foreground", className)
    }, props)
  );
});
TableCaption.displayName = "TableCaption";

// src/components/admin/media/MediaRow.tsx
var _datefns = require('date-fns');








var typeIcons2 = {
  image: _lucidereact.ImageIcon,
  video: _lucidereact.Film,
  audio: _lucidereact.Music,
  document: _lucidereact.FileText,
  other: _lucidereact.File
};
var MediaRow = _react.forwardRef.call(void 0, 
  ({ media, selected, onSelect, onToggle, onClick, onContextMenu }, ref) => {
    const mediaType = _chunkBHKDPOTYjs.getMediaType.call(void 0, media.mimeType);
    const Icon2 = typeIcons2[mediaType];
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      TableRow,
      {
        ref,
        className: _chunkSKQV2OMQjs.cn.call(void 0, "cursor-pointer", selected && "bg-accent"),
        onClick,
        onContextMenu,
        children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableCell, { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Checkbox, { checked: selected, onCheckedChange: () => onToggle() }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableCell, { className: "w-12", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-10 h-10 relative bg-muted rounded overflow-hidden", children: mediaType === "image" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _image2.default,
            {
              src: media.url,
              alt: media.alt || media.filename,
              fill: true,
              className: "object-cover",
              sizes: "40px"
            }
          ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon2, { className: "h-5 w-5 text-muted-foreground" }) }) }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableCell, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium truncate max-w-[200px]", children: media.title || media.filename }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: media.filename })
          ] }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableCell, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Badge, { variant: "outline", className: "text-xs", children: mediaType }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableCell, { className: "text-muted-foreground", children: _chunkBHKDPOTYjs.formatFileSize.call(void 0, media.size) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableCell, { className: "text-muted-foreground", children: media.width && media.height ? `${media.width} \xD7 ${media.height}` : "-" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableCell, { children: media.tags && media.tags.length > 0 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-wrap gap-1", children: [
            media.tags.slice(0, 2).map((tagRelation) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkTLZBOFEDjs.Badge,
              {
                variant: "outline",
                className: "text-xs py-0",
                style: tagRelation.tag.color ? { borderColor: tagRelation.tag.color } : void 0,
                children: tagRelation.tag.name
              },
              tagRelation.tag.id
            )),
            media.tags.length > 2 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkTLZBOFEDjs.Badge, { variant: "outline", className: "text-xs py-0", children: [
              "+",
              media.tags.length - 2
            ] })
          ] }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableCell, { className: "text-muted-foreground text-sm", children: _datefns.format.call(void 0, new Date(media.createdAt), "MMM d, yyyy") })
        ]
      }
    );
  }
);
MediaRow.displayName = "MediaRow";

// src/components/admin/media/MediaList.tsx

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
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-2", children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-4 py-3", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Skeleton, { className: "h-4 w-4" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Skeleton, { className: "h-10 w-10 rounded" }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex-1 space-y-1", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Skeleton, { className: "h-4 w-48" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Skeleton, { className: "h-3 w-32" })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Skeleton, { className: "h-4 w-16" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Skeleton, { className: "h-4 w-20" })
    ] }, i)) });
  }
  if (media.length === 0) {
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-muted-foreground", children: "No media files found" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-muted-foreground mt-1", children: "Upload files or change your filters" })
    ] });
  }
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "rounded-md border", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Table, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableHeader, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, TableRow, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableHead, { className: "w-12", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableHead, { className: "w-12" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableHead, { children: "Name" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableHead, { children: "Type" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableHead, { children: "Size" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableHead, { children: "Dimensions" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableHead, { children: "Tags" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableHead, { children: "Date" })
    ] }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TableBody, { children: media.map((item) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
        children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-wrap gap-2 items-center", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "relative", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkNY5MFDNPjs.Input,
          {
            placeholder: "Search media...",
            value: filters.search || "",
            onChange: (e) => onSearch(e.target.value),
            className: "pl-8 w-[200px]"
          }
        )
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        Select,
        {
          value: filters.type || "all",
          onValueChange: (value) => onTypeFilter(value === "all" ? void 0 : value),
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectTrigger, { className: "w-[140px]", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectValue, { placeholder: "All types" }) }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectContent, { children: typeOptions.map((option) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: option.value, children: option.label }, option.value)) })
          ]
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        Select,
        {
          value: currentSort,
          onValueChange: (value) => {
            const [sortBy, sortOrder] = value.split("-");
            onSortChange(sortBy, sortOrder);
          },
          children: [
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, SelectTrigger, { className: "w-[160px]", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.SlidersHorizontal, { className: "h-4 w-4 mr-2" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectValue, { placeholder: "Sort by" })
            ] }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectContent, { children: sortOptions.map((option) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: option.value, children: option.label }, option.value)) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-2 items-center", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex border rounded-md", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkPWJHQH3Pjs.Button,
          {
            variant: viewMode === "grid" ? "secondary" : "ghost",
            size: "sm",
            className: "rounded-r-none",
            onClick: () => onViewModeChange("grid"),
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.LayoutGrid, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkPWJHQH3Pjs.Button,
          {
            variant: viewMode === "list" ? "secondary" : "ghost",
            size: "sm",
            className: "rounded-l-none",
            onClick: () => onViewModeChange("list"),
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.List, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkPWJHQH3Pjs.Button, { onClick: onUpload, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Upload, { className: "h-4 w-4 mr-2" }),
        "Upload"
      ] })
    ] })
  ] });
}

// src/components/admin/media/MediaFolderTree.tsx











function FolderNode({
  folder,
  selectedFolderId,
  onSelect,
  depth = 0
}) {
  const [expanded, setExpanded] = _react.useState.call(void 0, true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;
  const FolderIcon3 = expanded ? _lucidereact.FolderOpen : _lucidereact.Folder;
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "button",
      {
        onClick: () => onSelect(folder.id),
        className: _chunkSKQV2OMQjs.cn.call(void 0, 
          "w-full flex items-center gap-1 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
          isSelected && "bg-accent"
        ),
        style: { paddingLeft: 8 + depth * 16 },
        children: [
          hasChildren ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              },
              className: "p-0.5 hover:bg-muted rounded",
              children: expanded ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronDown, { className: "h-3 w-3" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronRight, { className: "h-3 w-3" })
            }
          ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "w-4" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            FolderIcon3,
            {
              className: "h-4 w-4 text-muted-foreground flex-shrink-0",
              style: folder.color ? { color: folder.color } : void 0
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "truncate flex-1 text-left", children: folder.name }),
          folder.mediaCount !== void 0 && folder.mediaCount > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-xs text-muted-foreground", children: folder.mediaCount })
        ]
      }
    ),
    expanded && hasChildren && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { children: folder.children.map((child) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "p-3 border-b", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "font-semibold text-sm", children: "Folders" }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkHQVSQ2EOjs.ScrollArea, { className: "flex-1", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "p-2 space-y-1", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "button",
        {
          onClick: () => onSelectFolder(void 0),
          className: _chunkSKQV2OMQjs.cn.call(void 0, 
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
            selectedFolderId === void 0 && "bg-accent"
          ),
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Clock, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: "Recent" })
          ]
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "button",
        {
          onClick: () => onSelectFolder(null),
          className: _chunkSKQV2OMQjs.cn.call(void 0, 
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
            selectedFolderId === null && "bg-accent"
          ),
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Image, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: "All Media" })
          ]
        }
      ),
      folders.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "pt-2 mt-2 border-t", children: folders.map((folder) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        FolderNode,
        {
          folder,
          selectedFolderId,
          onSelect: onSelectFolder
        },
        folder.id
      )) })
    ] }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "p-3 border-t", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      _chunkPWJHQH3Pjs.Button,
      {
        variant: "outline",
        size: "sm",
        className: "w-full",
        onClick: onCreateFolder,
        children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.FolderPlus, { className: "h-4 w-4 mr-2" }),
          "New Folder"
        ]
      }
    ) })
  ] });
}

// src/components/ui/dropdown-menu.tsx
var _reactdropdownmenu = require('@radix-ui/react-dropdown-menu'); var DropdownMenuPrimitive = _interopRequireWildcard(_reactdropdownmenu);


function DropdownMenu(_a) {
  var props = _chunkHY7GTCJMjs.__objRest.call(void 0, _a, []);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DropdownMenuPrimitive.Root, _chunkHY7GTCJMjs.__spreadValues.call(void 0, { "data-slot": "dropdown-menu" }, props));
}
function DropdownMenuTrigger(_a) {
  var props = _chunkHY7GTCJMjs.__objRest.call(void 0, _a, []);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    DropdownMenuPrimitive.Trigger,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "dropdown-menu-trigger"
    }, props)
  );
}
function DropdownMenuContent(_a) {
  var _b = _a, {
    className,
    sideOffset = 4
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className",
    "sideOffset"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    DropdownMenuPrimitive.Content,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "dropdown-menu-content",
      sideOffset,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
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
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className",
    "inset",
    "variant"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    DropdownMenuPrimitive.Item,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )
    }, props)
  );
}
function DropdownMenuSeparator(_a) {
  var _b = _a, {
    className
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    DropdownMenuPrimitive.Separator,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "dropdown-menu-separator",
      className: _chunkSKQV2OMQjs.cn.call(void 0, "bg-border -mx-1 my-1 h-px", className)
    }, props)
  );
}

// src/components/admin/media/MediaBulkActions.tsx









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
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DropdownMenuItem, { onClick: () => onMove(folder.id), children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { style: { paddingLeft: depth * 12 }, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.FolderIcon, { className: "mr-2 h-4 w-4 inline" }),
        folder.name
      ] }) }, folder.id),
      ...folder.children && folder.children.length > 0 ? renderFolderOptions(folder.children, depth + 1) : []
    ]);
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-3 p-3 bg-muted rounded-lg", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "ghost", size: "sm", onClick: onClearSelection, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.X, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "text-sm font-medium", children: [
        selectedCount,
        " item",
        selectedCount !== 1 ? "s" : "",
        " selected"
      ] })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2 ml-auto", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, DropdownMenu, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", size: "sm", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.FolderInput, { className: "h-4 w-4 mr-2" }),
          "Move"
        ] }) }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, DropdownMenuContent, { className: "w-48 max-h-64 overflow-y-auto", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, DropdownMenuItem, { onClick: () => onMove(null), children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.FolderIcon, { className: "mr-2 h-4 w-4" }),
            "Root (No folder)"
          ] }),
          folders.length > 0 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DropdownMenuSeparator, {}),
            renderFolderOptions(folders)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, DropdownMenu, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", size: "sm", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Tags, { className: "h-4 w-4 mr-2" }),
          "Tag"
        ] }) }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DropdownMenuContent, { className: "w-48 max-h-64 overflow-y-auto", children: tags.length > 0 ? tags.map((tag) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, DropdownMenuItem, { onClick: () => onTag([tag.id]), children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _lucidereact.Tag,
            {
              className: "mr-2 h-4 w-4",
              style: tag.color ? { color: tag.color } : void 0
            }
          ),
          tag.name
        ] }, tag.id)) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DropdownMenuItem, { disabled: true, children: "No tags available" }) })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "destructive", size: "sm", onClick: onDelete, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Trash, { className: "h-4 w-4 mr-2" }),
        "Delete"
      ] })
    ] })
  ] });
}

// src/components/admin/media/MediaPreviewSheet.tsx



// src/components/ui/sheet.tsx

var _reactdialog = require('@radix-ui/react-dialog'); var SheetPrimitive = _interopRequireWildcard(_reactdialog);



var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React10.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    SheetPrimitive.Overlay,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )
    }, props), {
      ref
    })
  );
});
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = _classvarianceauthority.cva.call(void 0, 
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
  var _b = _a, { side = "right", className, children } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["side", "className", "children"]);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, SheetPortal, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SheetOverlay, {}),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      SheetPrimitive.Content,
      _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
        ref,
        className: _chunkSKQV2OMQjs.cn.call(void 0, sheetVariants({ side }), className)
      }, props), {
        children: [
          children,
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.X, { className: "h-4 w-4" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "sr-only", children: "Close" })
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
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
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
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )
    }, props)
  );
};
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React10.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    SheetPrimitive.Title,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "text-lg font-semibold text-foreground", className)
    }, props)
  );
});
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React10.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    SheetPrimitive.Description,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "text-sm text-muted-foreground", className)
    }, props)
  );
});
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/admin/media/MediaPreviewSheet.tsx














var typeIcons3 = {
  image: _lucidereact.ImageIcon,
  video: _lucidereact.Film,
  audio: _lucidereact.Music,
  document: _lucidereact.FileText,
  other: _lucidereact.File
};
function MediaPreviewSheet({
  media,
  open,
  onClose,
  onSave,
  onDelete
}) {
  const [title, setTitle] = _react.useState.call(void 0, "");
  const [alt, setAlt] = _react.useState.call(void 0, "");
  const [caption, setCaption] = _react.useState.call(void 0, "");
  const [description, setDescription] = _react.useState.call(void 0, "");
  const [usage, setUsage] = _react.useState.call(void 0, []);
  const [loadingUsage, setLoadingUsage] = _react.useState.call(void 0, false);
  const [saving, setSaving] = _react.useState.call(void 0, false);
  _react.useEffect.call(void 0, () => {
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
  const mediaType = _chunkBHKDPOTYjs.getMediaType.call(void 0, media.mimeType);
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
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Sheet, { open, onOpenChange: (open2) => !open2 && onClose(), children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, SheetContent, { className: "w-full sm:max-w-lg", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SheetHeader, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, SheetTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon2, { className: "h-5 w-5" }),
      "Media Details"
    ] }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkHQVSQ2EOjs.ScrollArea, { className: "h-[calc(100vh-8rem)] pr-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-6 py-4", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "aspect-video relative bg-muted rounded-lg overflow-hidden", children: mediaType === "image" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _image2.default,
        {
          src: media.url,
          alt: media.alt || media.filename,
          fill: true,
          className: "object-contain"
        }
      ) : mediaType === "video" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "video",
        {
          src: media.url,
          controls: true,
          className: "w-full h-full object-contain"
        }
      ) : mediaType === "audio" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-full h-full flex items-center justify-center p-4", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "audio", { src: media.url, controls: true, className: "w-full" }) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon2, { className: "h-16 w-16 text-muted-foreground" }) }) }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-2", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _chunkPWJHQH3Pjs.Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => window.open(media.url, "_blank"),
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ExternalLink, { className: "h-4 w-4 mr-1" }),
              "Open"
            ]
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _chunkPWJHQH3Pjs.Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => navigator.clipboard.writeText(media.url),
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Copy, { className: "h-4 w-4 mr-1" }),
              "Copy URL"
            ]
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _chunkPWJHQH3Pjs.Button,
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
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Download, { className: "h-4 w-4 mr-1" }),
              "Download"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Separator, {}),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-muted-foreground", children: "Filename" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium truncate", children: media.filename })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-muted-foreground", children: "Original Name" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium truncate", children: media.originalName })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-muted-foreground", children: "Type" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium", children: media.mimeType })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-muted-foreground", children: "Size" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium", children: _chunkBHKDPOTYjs.formatFileSize.call(void 0, media.size) })
        ] }),
        media.width && media.height && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-muted-foreground", children: "Dimensions" }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "font-medium", children: [
            media.width,
            " \xD7 ",
            media.height
          ] })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-muted-foreground", children: "Uploaded" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium", children: _datefns.format.call(void 0, new Date(media.createdAt), "MMM d, yyyy") })
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Separator, {}),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "title", children: "Title" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkNY5MFDNPjs.Input,
            {
              id: "title",
              value: title,
              onChange: (e) => setTitle(e.target.value),
              placeholder: "Enter title..."
            }
          )
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "alt", children: "Alt Text" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkNY5MFDNPjs.Input,
            {
              id: "alt",
              value: alt,
              onChange: (e) => setAlt(e.target.value),
              placeholder: "Describe the image for accessibility..."
            }
          )
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "caption", children: "Caption" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkNY5MFDNPjs.Input,
            {
              id: "caption",
              value: caption,
              onChange: (e) => setCaption(e.target.value),
              placeholder: "Caption to display..."
            }
          )
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "description", children: "Description" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkV746VSQLjs.Textarea,
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
      media.tags && media.tags.length > 0 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Separator, {}),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium mb-2", children: "Tags" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex flex-wrap gap-1", children: media.tags.map((tagRelation) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _chunkTLZBOFEDjs.Badge,
            {
              variant: "secondary",
              style: tagRelation.tag.color ? { borderColor: tagRelation.tag.color } : void 0,
              children: tagRelation.tag.name
            },
            tagRelation.tag.id
          )) })
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Separator, {}),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium mb-2", children: "Usage" }),
        loadingUsage ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-muted-foreground", children: "Loading..." }) : usage.length > 0 ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-2", children: usage.map((u) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          "a",
          {
            href: u.url,
            className: "block p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors",
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium", children: u.entityTitle }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-xs text-muted-foreground", children: [
                u.entityType,
                u.fieldName && ` \u2022 ${u.fieldName}`
              ] })
            ]
          },
          u.id
        )) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-muted-foreground", children: "Not used anywhere" })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkTLZBOFEDjs.Separator, {}),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-2", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _chunkPWJHQH3Pjs.Button,
          {
            onClick: handleSave,
            disabled: !hasChanges || saving,
            className: "flex-1",
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Save, { className: "h-4 w-4 mr-2" }),
              saving ? "Saving..." : "Save Changes"
            ]
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkPWJHQH3Pjs.Button,
          {
            variant: "destructive",
            onClick: () => onDelete(media.id),
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Trash, { className: "h-4 w-4" })
          }
        )
      ] })
    ] }) })
  ] }) });
}

// src/components/admin/media/MediaUploader.tsx




function MediaUploader({
  folderId,
  uploads,
  isUploading,
  onUpload,
  onClearCompleted,
  className
}) {
  const [isDragActive, setIsDragActive] = _react.useState.call(void 0, false);
  const onDrop = _react.useCallback.call(void 0, 
    async (acceptedFiles) => {
      await onUpload(acceptedFiles);
    },
    [onUpload]
  );
  const { getRootProps, getInputProps, open } = _reactdropzone.useDropzone.call(void 0, {
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
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: _chunkSKQV2OMQjs.cn.call(void 0, "space-y-4", className), children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "div",
      _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, getRootProps()), {
        className: _chunkSKQV2OMQjs.cn.call(void 0, 
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "pointer-events-none opacity-50"
        ),
        children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "input", _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, getInputProps())),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col items-center gap-2", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _lucidereact.Upload,
              {
                className: _chunkSKQV2OMQjs.cn.call(void 0, 
                  "h-10 w-10 transition-colors",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )
              }
            ),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium", children: isDragActive ? "Drop files here" : "Drag and drop files here" }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-sm text-muted-foreground mt-1", children: [
                "or",
                " ",
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: "Images, videos, audio, and documents up to 50MB" })
          ] })
        ]
      })
    ),
    hasUploads && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium", children: "Uploads" }),
        hasCompleted && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkPWJHQH3Pjs.Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: onClearCompleted,
            className: "h-auto py-1 px-2 text-xs",
            children: "Clear completed"
          }
        )
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-2 max-h-48 overflow-y-auto", children: uploads.map((upload) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "div",
        {
          className: "flex items-center gap-3 p-2 rounded-md bg-muted/50",
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex-shrink-0", children: upload.status === "complete" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-8 w-8 rounded-full bg-green-100 flex items-center justify-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Check, { className: "h-4 w-4 text-green-600" }) }) : upload.status === "error" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-8 w-8 rounded-full bg-red-100 flex items-center justify-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.AlertCircle, { className: "h-4 w-4 text-red-600" }) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-8 w-8 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.FileIcon, { className: "h-4 w-4 text-muted-foreground" }) }) }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium truncate", children: upload.filename }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2", children: [
                upload.status === "uploading" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Progress, { value: upload.progress, className: "h-1 flex-1" }) : upload.status === "error" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-red-600 truncate", children: upload.error }) : upload.status === "complete" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: "Complete" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground", children: "Pending" }),
                upload.size && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-xs text-muted-foreground flex-shrink-0", children: _chunkBHKDPOTYjs.formatFileSize.call(void 0, upload.size) })
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
  const [name, setName] = _react.useState.call(void 0, "");
  const [description, setDescription] = _react.useState.call(void 0, "");
  const [color, setColor] = _react.useState.call(void 0, "");
  const [parentId, setParentId] = _react.useState.call(void 0, null);
  const [saving, setSaving] = _react.useState.call(void 0, false);
  const isEditing = !!folder;
  _react.useEffect.call(void 0, () => {
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
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.Dialog, { open, onOpenChange: (open2) => !open2 && onClose(), children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogContent, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogHeader, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Folder, { className: "h-5 w-5" }),
      isEditing ? "Edit Folder" : "New Folder"
    ] }) }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4 py-4", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "name", children: "Name" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkNY5MFDNPjs.Input,
          {
            id: "name",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: "Folder name...",
            autoFocus: true
          }
        )
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "description", children: "Description" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkV746VSQLjs.Textarea,
          {
            id: "description",
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: "Optional description...",
            rows: 2
          }
        )
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "parent", children: "Parent Folder" }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          Select,
          {
            value: parentId || "root",
            onValueChange: (value) => setParentId(value === "root" ? null : value),
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectTrigger, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectValue, { placeholder: "Select parent folder" }) }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, SelectContent, { children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: "root", children: "Root (No parent)" }),
                availableFolders.map((f) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: f.id, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { style: { paddingLeft: f.depth * 12 }, children: f.name }) }, f.id))
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "color", children: "Color" }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Select, { value: color, onValueChange: setColor, children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectTrigger, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectValue, { placeholder: "Select color" }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectContent, { children: colorOptions.map((option) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SelectItem, { value: option.value || "default", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2", children: [
            option.value && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogFooter, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { onClick: handleSave, disabled: !name.trim() || saving, children: saving ? "Saving..." : isEditing ? "Save Changes" : "Create Folder" })
    ] })
  ] }) });
}

// src/components/ui/alert-dialog.tsx

var _reactalertdialog = require('@radix-ui/react-alert-dialog'); var AlertDialogPrimitive = _interopRequireWildcard(_reactalertdialog);

var AlertDialog = AlertDialogPrimitive.Root;
var AlertDialogPortal = AlertDialogPrimitive.Portal;
var AlertDialogOverlay = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    AlertDialogPrimitive.Overlay,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
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
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, AlertDialogPortal, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AlertDialogOverlay, {}),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      AlertDialogPrimitive.Content,
      _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
        ref,
        className: _chunkSKQV2OMQjs.cn.call(void 0, 
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
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
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
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )
    }, props)
  );
};
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    AlertDialogPrimitive.Title,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "text-lg font-semibold", className)
    }, props)
  );
});
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
var AlertDialogDescription = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    AlertDialogPrimitive.Description,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, "text-sm text-muted-foreground", className)
    }, props)
  );
});
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
var AlertDialogAction = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    AlertDialogPrimitive.Action,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, _chunkPWJHQH3Pjs.buttonVariants.call(void 0, ), className)
    }, props)
  );
});
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
var AlertDialogCancel = React11.forwardRef((_a, ref) => {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    AlertDialogPrimitive.Cancel,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      ref,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        _chunkPWJHQH3Pjs.buttonVariants.call(void 0, { variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      )
    }, props)
  );
});
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

// src/components/admin/media/MediaManager.tsx



function MediaManager() {
  const mediaState = useMedia();
  const [storageStatus, setStorageStatus] = _react.useState.call(void 0, null);
  _react.useEffect.call(void 0, () => {
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
  const { uploads, isUploading, uploadFiles, clearCompleted } = _chunk72BQHJ6Fjs.useMediaUpload.call(void 0, {
    folderId: filters.folderId,
    onSuccess: () => refreshAll()
  });
  const [showUploader, setShowUploader] = _react.useState.call(void 0, false);
  const [showFolderDialog, setShowFolderDialog] = _react.useState.call(void 0, false);
  const [editingFolder, setEditingFolder] = _react.useState.call(void 0, null);
  const [previewMedia, setPreviewMedia] = _react.useState.call(void 0, null);
  const [renameMedia, setRenameMedia] = _react.useState.call(void 0, null);
  const [renameName, setRenameName] = _react.useState.call(void 0, "");
  const [deleteConfirm, setDeleteConfirm] = _react.useState.call(void 0, null);
  const handleFolderSelect = _react.useCallback.call(void 0, 
    (folderId) => {
      setFilters({ folderId: folderId === null ? null : folderId });
    },
    [setFilters]
  );
  const handleCreateFolder = _react.useCallback.call(void 0, async (data) => {
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
  const handleUpdateFolder = _react.useCallback.call(void 0, async (id, data) => {
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
  const handleMoveMedia = _react.useCallback.call(void 0, 
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
  const handleAddTag = _react.useCallback.call(void 0, 
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
  const handleDeleteMedia = _react.useCallback.call(void 0, (mediaId) => {
    setDeleteConfirm({ ids: [mediaId], hard: false });
  }, []);
  const handleBulkDelete = _react.useCallback.call(void 0, () => {
    setDeleteConfirm({ ids: Array.from(selectedIds), hard: false });
  }, [selectedIds]);
  const confirmDelete = _react.useCallback.call(void 0, async () => {
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
  const handleRename = _react.useCallback.call(void 0, (media2) => {
    setRenameMedia(media2);
    setRenameName(media2.title || media2.filename);
  }, []);
  const handleSaveRename = _react.useCallback.call(void 0, async () => {
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
  const handleSaveMediaDetails = _react.useCallback.call(void 0, 
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
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col h-[calc(100vh-12rem)]", children: [
    storageStatus && !storageStatus.configured && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Alert, { variant: "destructive", className: "mx-6 mt-4 mb-0", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.AlertTriangle, { className: "h-4 w-4" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AlertTitle, { children: "Storage Not Configured" }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, AlertDescription, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: storageStatus.message }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", size: "sm", asChild: true, className: "ml-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _link2.default, { href: "/admin/settings?tab=storage", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Settings, { className: "h-4 w-4 mr-2" }),
          "Configure Storage"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-1 min-h-0", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-64 border-r flex-shrink-0", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex-1 flex flex-col min-w-0", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "p-4 border-b", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
        selectedIds.size > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "px-4 pt-4", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex-1 p-4 overflow-auto", children: viewMode === "grid" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
        ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
        pagination.totalPages > 1 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "p-4 border-t flex items-center justify-between", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-sm text-muted-foreground", children: [
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
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-2", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkPWJHQH3Pjs.Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => setPage(pagination.page - 1),
                disabled: pagination.page <= 1,
                children: "Previous"
              }
            ),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkPWJHQH3Pjs.Button,
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
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.Dialog, { open: showUploader, onOpenChange: setShowUploader, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogContent, { className: "sm:max-w-lg", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogHeader, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogTitle, { children: "Upload Media" }) }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.Dialog, { open: !!renameMedia, onOpenChange: (open) => !open && setRenameMedia(null), children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _chunkSBUKOAXSjs.DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogHeader, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkSBUKOAXSjs.DialogTitle, { children: "Rename Media" }) }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-4 py-4", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkNY5MFDNPjs.Label, { htmlFor: "rename", children: "Name" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkNY5MFDNPjs.Input,
          {
            id: "rename",
            value: renameName,
            onChange: (e) => setRenameName(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleSaveRename(),
            autoFocus: true
          }
        )
      ] }) }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { variant: "outline", onClick: () => setRenameMedia(null), children: "Cancel" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkPWJHQH3Pjs.Button, { onClick: handleSaveRename, disabled: !renameName.trim(), children: "Save" })
      ] })
    ] }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      AlertDialog,
      {
        open: !!deleteConfirm,
        onOpenChange: (open) => !open && setDeleteConfirm(null),
        children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, AlertDialogContent, { children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, AlertDialogHeader, { children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AlertDialogTitle, { children: "Delete Media" }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, AlertDialogDescription, { children: [
              "Are you sure you want to delete",
              " ",
              (deleteConfirm == null ? void 0 : deleteConfirm.ids.length) === 1 ? "this item" : `${deleteConfirm == null ? void 0 : deleteConfirm.ids.length} items`,
              "? This action cannot be undone."
            ] })
          ] }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, AlertDialogFooter, { children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, AlertDialogCancel, { children: "Cancel" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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

























exports.WizardProvider = WizardProvider; exports.useWizard = useWizard; exports.AdminChat = AdminChat; exports.Logo = Logo; exports.AdminShell = AdminShell; exports.MediaPicker = MediaPicker; exports.BrandingSettings = BrandingSettings; exports.DashboardMetrics = DashboardMetrics; exports.QuickActions = QuickActions; exports.EnvManager = EnvManager; exports.EmailProviderSettings = EmailProviderSettings; exports.MediaCard = MediaCard; exports.MediaContextMenu = MediaContextMenu; exports.MediaGrid = MediaGrid; exports.MediaRow = MediaRow; exports.MediaList = MediaList; exports.MediaToolbar = MediaToolbar; exports.MediaFolderTree = MediaFolderTree; exports.MediaBulkActions = MediaBulkActions; exports.MediaPreviewSheet = MediaPreviewSheet; exports.MediaUploader = MediaUploader; exports.FolderDialog = FolderDialog; exports.MediaManager = MediaManager;
//# sourceMappingURL=chunk-H5AODFHA.js.map