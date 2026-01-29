"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }









var _chunkSBUKOAXSjs = require('./chunk-SBUKOAXS.js');



var _chunkNY5MFDNPjs = require('./chunk-NY5MFDNP.js');


var _chunkHQVSQ2EOjs = require('./chunk-HQVSQ2EO.js');


var _chunkPWJHQH3Pjs = require('./chunk-PWJHQH3P.js');



var _chunkHY7GTCJMjs = require('./chunk-HY7GTCJM.js');

// src/puck/dashboard/components/index.tsx
var _react = require('react'); var _react2 = _interopRequireDefault(_react);





















var _lucidereact = require('lucide-react'); var LucideIcons = _interopRequireWildcard(_lucidereact);

// src/puck/dashboard/hooks/index.ts
var _swr = require('swr'); var _swr2 = _interopRequireDefault(_swr);
var fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Failed to fetch data");
    error.status = res.status;
    throw error;
  }
  return res.json();
};
function useCustomerOrders(options) {
  const params = new URLSearchParams();
  if (options == null ? void 0 : options.limit) params.set("limit", String(options.limit));
  if (options == null ? void 0 : options.offset) params.set("offset", String(options.offset));
  if (options == null ? void 0 : options.status) params.set("status", options.status);
  const queryString = params.toString();
  const url = `/api/customer/orders${queryString ? `?${queryString}` : ""}`;
  const { data, error, isLoading, mutate } = _swr2.default.call(void 0, url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3e4
    // 30 seconds
  });
  return {
    orders: (data == null ? void 0 : data.orders) || [],
    total: (data == null ? void 0 : data.total) || 0,
    isLoading,
    isError: !!error,
    error,
    mutate
  };
}
function useCustomerProfile() {
  const { data, error, isLoading, mutate } = _swr2.default.call(void 0, 
    "/api/customer/profile",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 6e4
      // 1 minute
    }
  );
  return {
    profile: data,
    isLoading,
    isError: !!error,
    isAuthenticated: !error || error.status !== 401,
    error,
    mutate
  };
}

// src/puck/dashboard/components/index.tsx
var _jsxruntime = require('react/jsx-runtime');
function OrderSummaryCard({
  orderNumber = "ORD-12345",
  date = "2024-01-15",
  status = "processing",
  total = "$99.99",
  itemCount = 3,
  trackingNumber,
  showViewButton = true,
  viewOrderUrl = "/orders/{id}"
}) {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: _lucidereact.Clock, label: "Pending" },
    processing: { color: "bg-blue-100 text-blue-800", icon: _lucidereact.RefreshCw, label: "Processing" },
    shipped: { color: "bg-purple-100 text-purple-800", icon: _lucidereact.Truck, label: "Shipped" },
    delivered: { color: "bg-green-100 text-green-800", icon: _lucidereact.CheckCircle, label: "Delivered" },
    cancelled: { color: "bg-red-100 text-red-800", icon: _lucidereact.AlertCircle, label: "Cancelled" }
  };
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-start justify-between mb-3", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "font-semibold text-gray-900 dark:text-white", children: [
          "#",
          orderNumber
        ] }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-gray-500 dark:text-gray-400", children: date })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, StatusIcon, { className: "h-3.5 w-3.5" }),
        config.label
      ] })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between text-sm mb-3", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "text-gray-600 dark:text-gray-300", children: [
        itemCount,
        " item",
        itemCount !== 1 ? "s" : ""
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-semibold text-gray-900 dark:text-white", children: total })
    ] }),
    trackingNumber && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-3", children: [
      "Tracking: ",
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-mono", children: trackingNumber })
    ] }),
    showViewButton && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "a",
      {
        href: viewOrderUrl.replace("{id}", orderNumber),
        className: "inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400",
        children: [
          "View Details",
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronRight, { className: "h-4 w-4" })
        ]
      }
    )
  ] });
}
function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function OrderHistoryList({
  title = "Recent Orders",
  emptyMessage = "No orders yet",
  showFilters = true,
  maxItems = 5,
  viewAllUrl = "/account/orders"
}) {
  const [statusFilter, setStatusFilter] = _react2.default.useState("all");
  const { orders, isLoading, isError } = useCustomerOrders({
    limit: maxItems,
    status: statusFilter !== "all" ? statusFilter : void 0
  });
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ShoppingBag, { className: "h-5 w-5" }),
        title
      ] }),
      showFilters && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "select",
        {
          className: "text-sm border rounded-md px-2 py-1 dark:bg-gray-700 dark:border-gray-600",
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value),
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "option", { value: "all", children: "All Orders" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "option", { value: "pending", children: "Pending" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "option", { value: "processing", children: "Processing" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "option", { value: "shipped", children: "Shipped" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "option", { value: "delivered", children: "Delivered" })
          ]
        }
      )
    ] }),
    isLoading ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-8 w-8 animate-spin text-gray-400" }) }) : isError ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.AlertCircle, { className: "h-12 w-12 mx-auto mb-3 opacity-50 text-red-400" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: "Unable to load orders" })
    ] }) : orders.length === 0 ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Package, { className: "h-12 w-12 mx-auto mb-3 opacity-50" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: emptyMessage })
    ] }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-3", children: orders.slice(0, maxItems).map((order) => {
      var _a;
      return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        OrderSummaryCard,
        {
          orderNumber: order.orderNumber,
          date: formatDate(order.createdAt),
          status: order.status,
          total: formatCurrency(order.total),
          itemCount: order.itemCount,
          trackingNumber: (_a = order.shipment) == null ? void 0 : _a.trackingNumber,
          showViewButton: true,
          viewOrderUrl: `/orders/${order.id}`
        },
        order.id
      );
    }) }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "a",
      {
        href: viewAllUrl,
        className: "mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400",
        children: [
          "View All Orders",
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronRight, { className: "h-4 w-4" })
        ]
      }
    )
  ] });
}
function ShippingTracker({
  title = "Shipment Tracking",
  carrier = "USPS",
  trackingNumber = "9400111899223033005282",
  estimatedDelivery = "Dec 31, 2024",
  currentStatus = "in_transit",
  showHistory = true
}) {
  const steps = [
    { key: "label_created", label: "Label Created", icon: _lucidereact.Package },
    { key: "picked_up", label: "Picked Up", icon: _lucidereact.Truck },
    { key: "in_transit", label: "In Transit", icon: _lucidereact.MapPin },
    { key: "out_for_delivery", label: "Out for Delivery", icon: _lucidereact.Truck },
    { key: "delivered", label: "Delivered", icon: _lucidereact.CheckCircle }
  ];
  const currentIndex = steps.findIndex((s) => s.key === currentStatus);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Truck, { className: "h-5 w-5" }),
      title
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between text-sm mb-6", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-gray-500 dark:text-gray-400", children: "Carrier" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium text-gray-900 dark:text-white", children: carrier })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-right", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-gray-500 dark:text-gray-400", children: "Est. Delivery" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium text-gray-900 dark:text-white", children: estimatedDelivery })
      ] })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "relative mb-6", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex justify-between", children: steps.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col items-center relative z-10", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "div",
            {
              className: `w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-400"} ${isCurrent ? "ring-2 ring-green-300 ring-offset-2" : ""}`,
              children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, StepIcon, { className: "h-5 w-5" })
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: `text-xs mt-2 text-center ${isCompleted ? "text-green-600 font-medium" : "text-gray-400"}`, children: step.label })
        ] }, step.key);
      }) }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0", style: { marginLeft: "20px", marginRight: "20px" }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "div",
        {
          className: "h-full bg-green-500 transition-all duration-500",
          style: { width: `${currentIndex / (steps.length - 1) * 100}%` }
        }
      ) })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-sm", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-gray-500 dark:text-gray-400", children: "Tracking Number" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-mono text-gray-900 dark:text-white", children: trackingNumber })
    ] })
  ] });
}
function AccountOverview({
  title = "Account Overview",
  showAvatar = true,
  showEmail = true,
  showMemberSince = true,
  showEditButton = true,
  editProfileUrl = "/account/profile"
}) {
  var _a, _b, _c, _d;
  const { profile, isLoading, isAuthenticated } = useCustomerProfile();
  const memberSince = (profile == null ? void 0 : profile.memberSince) ? new Date(profile.memberSince).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  }) : "";
  const displayName = (profile == null ? void 0 : profile.name) || (((_a = profile == null ? void 0 : profile.customer) == null ? void 0 : _a.firstName) && ((_b = profile == null ? void 0 : profile.customer) == null ? void 0 : _b.lastName) ? `${profile.customer.firstName} ${profile.customer.lastName}` : ((_c = profile == null ? void 0 : profile.customer) == null ? void 0 : _c.firstName) || ((_d = profile == null ? void 0 : profile.email) == null ? void 0 : _d.split("@")[0]) || "User");
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (isLoading) {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-8 w-8 animate-spin text-gray-400" }) }) });
  }
  if (!isAuthenticated || !profile) {
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.User, { className: "h-5 w-5" }),
        title
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Please sign in to view your account." }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "a",
        {
          href: "/handler/sign-in",
          className: "mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400",
          children: [
            "Sign In",
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.User, { className: "h-5 w-5" }),
      title
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-4", children: [
      showAvatar && (profile.avatar ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "img",
        {
          src: profile.avatar,
          alt: displayName,
          className: "w-16 h-16 rounded-full object-cover"
        }
      ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold", children: initials })),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex-1", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-semibold text-gray-900 dark:text-white", children: displayName }),
        showEmail && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Mail, { className: "h-3.5 w-3.5" }),
          profile.email
        ] }),
        showMemberSince && memberSince && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Calendar, { className: "h-3.5 w-3.5" }),
          "Member since ",
          memberSince
        ] })
      ] })
    ] }),
    showEditButton && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "a",
      {
        href: editProfileUrl,
        className: "mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400",
        children: [
          "Edit Profile",
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronRight, { className: "h-4 w-4" })
        ]
      }
    )
  ] });
}
function AddressCard({
  type = "shipping",
  isDefault = false,
  name = "John Doe",
  street = "123 Main St",
  city = "San Francisco",
  state = "CA",
  zip = "94102",
  country = "US",
  phone,
  showEditButton = true,
  showDeleteButton = true
}) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-start justify-between mb-2", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.MapPin, { className: "h-4 w-4 text-gray-400" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-sm font-medium text-gray-600 dark:text-gray-300 capitalize", children: type })
      ] }),
      isDefault && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded", children: "Default" })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-sm text-gray-900 dark:text-white", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "font-medium", children: name }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: street }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { children: [
        city,
        ", ",
        state,
        " ",
        zip
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: country }),
      phone && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "flex items-center gap-1 mt-1 text-gray-500 dark:text-gray-400", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Phone, { className: "h-3.5 w-3.5" }),
        phone
      ] })
    ] }),
    (showEditButton || showDeleteButton) && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-3 mt-3", children: [
      showEditButton && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { className: "text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400", children: "Edit" }),
      showDeleteButton && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { className: "text-sm text-red-600 hover:text-red-800 dark:text-red-400", children: "Delete" })
    ] })
  ] });
}
function WishlistItem({
  productName = "Product Name",
  productImage = "/placeholder.jpg",
  price = "$49.99",
  originalPrice,
  inStock = true,
  showAddToCart = true,
  showRemove = true
}) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      "img",
      {
        src: productImage,
        alt: productName,
        className: "w-full h-full object-cover",
        onError: (e) => {
          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12">No Image</text></svg>';
        }
      }
    ) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h4", { className: "font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-2", children: productName }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2 mb-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-semibold text-gray-900 dark:text-white", children: price }),
      originalPrice && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-sm text-gray-400 line-through", children: originalPrice })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: `text-xs mb-3 ${inStock ? "text-green-600" : "text-red-600"}`, children: inStock ? "In Stock" : "Out of Stock" }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex gap-2", children: [
      showAddToCart && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "button",
        {
          disabled: !inStock,
          className: "flex-1 text-sm bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed",
          children: "Add to Cart"
        }
      ),
      showRemove && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { className: "p-2 text-gray-400 hover:text-red-500", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Heart, { className: "h-5 w-5 fill-current" }) })
    ] })
  ] });
}
function LoyaltyPointsWidget({
  title = "Rewards Points",
  points = 2500,
  tier = "Gold",
  pointsToNextTier = 500,
  showRedeemButton = true,
  redeemUrl = "/account/rewards"
}) {
  const tierColors = {
    Bronze: "from-amber-600 to-amber-800",
    Silver: "from-gray-400 to-gray-600",
    Gold: "from-yellow-400 to-yellow-600",
    Platinum: "from-purple-400 to-purple-600"
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Gift, { className: "h-5 w-5" }),
      title
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-4 mb-4", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: `w-16 h-16 rounded-full bg-gradient-to-br ${tierColors[tier] || tierColors.Bronze} flex items-center justify-center`, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Star, { className: "h-8 w-8 text-white" }) }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: points.toLocaleString() }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-sm text-gray-500 dark:text-gray-400", children: [
          tier,
          " Member"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "mb-4", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-between text-sm mb-1", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-gray-500 dark:text-gray-400", children: "Next Tier" }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "text-gray-700 dark:text-gray-300", children: [
          pointsToNextTier,
          " points away"
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "div",
        {
          className: `h-full bg-gradient-to-r ${tierColors[tier] || tierColors.Bronze}`,
          style: { width: `${Math.max(10, 100 - pointsToNextTier / 50)}%` }
        }
      ) })
    ] }),
    showRedeemButton && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "a",
      {
        href: redeemUrl,
        className: "inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400",
        children: [
          "Redeem Points",
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronRight, { className: "h-4 w-4" })
        ]
      }
    )
  ] });
}
function SupportWidget({
  title = "Need Help?",
  description = "Our support team is here to help",
  showEmail = true,
  showPhone = true,
  showChat = true,
  showFaq = true,
  email = "support@example.com",
  phone = "1-800-123-4567",
  faqUrl = "/help/faq"
}) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.HelpCircle, { className: "h-5 w-5" }),
      title
    ] }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-4", children: description }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-3", children: [
      showEmail && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "a",
        {
          href: `mailto:${email}`,
          className: "flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600",
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Mail, { className: "h-4 w-4" }),
            email
          ]
        }
      ),
      showPhone && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "a",
        {
          href: `tel:${phone}`,
          className: "flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600",
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Phone, { className: "h-4 w-4" }),
            phone
          ]
        }
      ),
      showChat && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "button", { className: "flex items-center gap-3 text-sm text-blue-600 hover:text-blue-800", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ExternalLink, { className: "h-4 w-4" }),
        "Start Live Chat"
      ] }),
      showFaq && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "a",
        {
          href: faqUrl,
          className: "flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600",
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.HelpCircle, { className: "h-4 w-4" }),
            "Browse FAQ"
          ]
        }
      )
    ] })
  ] });
}
function QuickActionsGrid({
  title = "Quick Actions",
  actions = [
    { label: "Track Order", icon: "Truck", url: "/track", color: "blue" },
    { label: "My Orders", icon: "Package", url: "/orders", color: "green" },
    { label: "Wishlist", icon: "Heart", url: "/wishlist", color: "red" },
    { label: "Settings", icon: "Settings", url: "/settings", color: "gray" }
  ]
}) {
  const iconMap = {
    Truck: _lucidereact.Truck,
    Package: _lucidereact.Package,
    Heart: _lucidereact.Heart,
    User: _lucidereact.User,
    CreditCard: _lucidereact.CreditCard,
    Gift: _lucidereact.Gift,
    HelpCircle: _lucidereact.HelpCircle,
    MapPin: _lucidereact.MapPin,
    Mail: _lucidereact.Mail,
    Phone: _lucidereact.Phone,
    Star: _lucidereact.Star,
    ShoppingBag: _lucidereact.ShoppingBag
  };
  const colorMap = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: title }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: actions.map((action, index) => {
      const Icon = iconMap[action.icon] || _lucidereact.Package;
      const colorClass = colorMap[action.color || "blue"];
      return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "a",
        {
          href: action.url,
          className: "flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
          children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: `w-12 h-12 rounded-full ${colorClass} flex items-center justify-center mb-2`, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon, { className: "h-6 w-6" }) }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-sm text-gray-700 dark:text-gray-300 text-center", children: action.label })
          ]
        },
        index
      );
    }) })
  ] });
}
function PaymentMethodsList({
  title = "Payment Methods",
  showAddButton = true,
  addPaymentUrl = "/account/payments/add"
}) {
  var _a;
  const { profile, isLoading, isAuthenticated } = useCustomerProfile();
  const [methods, setMethods] = _react2.default.useState([]);
  const [isLoadingMethods, setIsLoadingMethods] = _react2.default.useState(false);
  _react2.default.useEffect(() => {
    const fetchPaymentMethods = async () => {
      var _a2;
      if (!((_a2 = profile == null ? void 0 : profile.customer) == null ? void 0 : _a2.id)) return;
      setIsLoadingMethods(true);
      try {
        const res = await fetch("/api/customer/payment-methods");
        if (res.ok) {
          const data = await res.json();
          setMethods(data.methods || []);
        }
      } catch (e) {
        console.log("Payment methods API not available");
      } finally {
        setIsLoadingMethods(false);
      }
    };
    fetchPaymentMethods();
  }, [(_a = profile == null ? void 0 : profile.customer) == null ? void 0 : _a.id]);
  const cardIcons = {
    visa: "VISA",
    mastercard: "MC",
    amex: "AMEX",
    discover: "DISC"
  };
  if (isLoading || isLoadingMethods) {
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.CreditCard, { className: "h-5 w-5" }),
        title
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-8 w-8 animate-spin text-gray-400" }) })
    ] });
  }
  if (!isAuthenticated) {
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.CreditCard, { className: "h-5 w-5" }),
        title
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Please sign in to view your payment methods." })
    ] });
  }
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.CreditCard, { className: "h-5 w-5" }),
      title
    ] }),
    methods.length === 0 ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-center py-6 text-gray-500 dark:text-gray-400", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.CreditCard, { className: "h-10 w-10 mx-auto mb-2 opacity-50" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm", children: "No payment methods saved" })
    ] }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-3", children: methods.map((method) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "div",
      {
        className: "flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg",
        children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-12 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400", children: cardIcons[method.type] || method.type.toUpperCase() }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
                "\u2022\u2022\u2022\u2022 ",
                method.last4
              ] }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
                "Expires ",
                method.expiry
              ] })
            ] })
          ] }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2", children: [
            method.isDefault && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded", children: "Default" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { className: "text-sm text-gray-400 hover:text-gray-600", children: "Edit" })
          ] })
        ]
      },
      method.id
    )) }),
    showAddButton && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "a",
      {
        href: addPaymentUrl,
        className: "mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400",
        children: [
          "Add Payment Method",
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.ChevronRight, { className: "h-4 w-4" })
        ]
      }
    )
  ] });
}

// src/puck/dashboard/config.tsx
var dashboardPuckConfig = {
  categories: {
    orders: {
      title: "Orders",
      components: ["OrderSummaryCard", "OrderHistoryList", "ShippingTracker"]
    },
    account: {
      title: "Account",
      components: ["AccountOverview", "AddressCard", "PaymentMethodsList"]
    },
    engagement: {
      title: "Engagement",
      components: ["WishlistItem", "LoyaltyPointsWidget"]
    },
    support: {
      title: "Support & Actions",
      components: ["SupportWidget", "QuickActionsGrid"]
    }
  },
  components: {
    // ========== ORDERS ==========
    OrderSummaryCard: {
      label: "Order Summary Card",
      fields: {
        orderNumber: { type: "text", label: "Order Number" },
        date: { type: "text", label: "Order Date" },
        status: {
          type: "select",
          label: "Status",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Processing", value: "processing" },
            { label: "Shipped", value: "shipped" },
            { label: "Delivered", value: "delivered" },
            { label: "Cancelled", value: "cancelled" }
          ]
        },
        total: { type: "text", label: "Total Amount" },
        itemCount: { type: "number", label: "Item Count" },
        trackingNumber: { type: "text", label: "Tracking Number" },
        showViewButton: {
          type: "radio",
          label: "Show View Button",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        viewOrderUrl: { type: "text", label: "View Order URL" }
      },
      defaultProps: {
        orderNumber: "ORD-12345",
        date: "2024-01-15",
        status: "processing",
        total: "$99.99",
        itemCount: 3,
        trackingNumber: "",
        showViewButton: true,
        viewOrderUrl: "/orders/{id}"
      },
      render: OrderSummaryCard
    },
    OrderHistoryList: {
      label: "Order History List",
      fields: {
        title: { type: "text", label: "Title" },
        emptyMessage: { type: "text", label: "Empty Message" },
        showFilters: {
          type: "radio",
          label: "Show Filters",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        maxItems: { type: "number", label: "Max Items to Display" },
        viewAllUrl: { type: "text", label: "View All URL" }
      },
      defaultProps: {
        title: "Recent Orders",
        emptyMessage: "No orders yet",
        showFilters: true,
        maxItems: 5,
        viewAllUrl: "/account/orders"
      },
      render: OrderHistoryList
    },
    ShippingTracker: {
      label: "Shipping Tracker",
      fields: {
        title: { type: "text", label: "Title" },
        carrier: { type: "text", label: "Carrier Name" },
        trackingNumber: { type: "text", label: "Tracking Number" },
        estimatedDelivery: { type: "text", label: "Estimated Delivery" },
        currentStatus: {
          type: "select",
          label: "Current Status",
          options: [
            { label: "Label Created", value: "label_created" },
            { label: "Picked Up", value: "picked_up" },
            { label: "In Transit", value: "in_transit" },
            { label: "Out for Delivery", value: "out_for_delivery" },
            { label: "Delivered", value: "delivered" }
          ]
        },
        showHistory: {
          type: "radio",
          label: "Show History",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        }
      },
      defaultProps: {
        title: "Shipment Tracking",
        carrier: "USPS",
        trackingNumber: "9400111899223033005282",
        estimatedDelivery: "Dec 31, 2024",
        currentStatus: "in_transit",
        showHistory: true
      },
      render: ShippingTracker
    },
    // ========== ACCOUNT ==========
    AccountOverview: {
      label: "Account Overview",
      fields: {
        title: { type: "text", label: "Title" },
        showAvatar: {
          type: "radio",
          label: "Show Avatar",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        showEmail: {
          type: "radio",
          label: "Show Email",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        showMemberSince: {
          type: "radio",
          label: "Show Member Since",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        showEditButton: {
          type: "radio",
          label: "Show Edit Button",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        editProfileUrl: { type: "text", label: "Edit Profile URL" }
      },
      defaultProps: {
        title: "Account Overview",
        showAvatar: true,
        showEmail: true,
        showMemberSince: true,
        showEditButton: true,
        editProfileUrl: "/account/profile"
      },
      render: AccountOverview
    },
    AddressCard: {
      label: "Address Card",
      fields: {
        type: {
          type: "select",
          label: "Address Type",
          options: [
            { label: "Shipping", value: "shipping" },
            { label: "Billing", value: "billing" }
          ]
        },
        isDefault: {
          type: "radio",
          label: "Default Address",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        name: { type: "text", label: "Name" },
        street: { type: "text", label: "Street Address" },
        city: { type: "text", label: "City" },
        state: { type: "text", label: "State" },
        zip: { type: "text", label: "ZIP Code" },
        country: { type: "text", label: "Country" },
        phone: { type: "text", label: "Phone Number" },
        showEditButton: {
          type: "radio",
          label: "Show Edit Button",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        showDeleteButton: {
          type: "radio",
          label: "Show Delete Button",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        }
      },
      defaultProps: {
        type: "shipping",
        isDefault: false,
        name: "John Doe",
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zip: "94102",
        country: "US",
        phone: "",
        showEditButton: true,
        showDeleteButton: true
      },
      render: AddressCard
    },
    PaymentMethodsList: {
      label: "Payment Methods",
      fields: {
        title: { type: "text", label: "Title" },
        showAddButton: {
          type: "radio",
          label: "Show Add Button",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        addPaymentUrl: { type: "text", label: "Add Payment URL" }
      },
      defaultProps: {
        title: "Payment Methods",
        showAddButton: true,
        addPaymentUrl: "/account/payments/add"
      },
      render: PaymentMethodsList
    },
    // ========== ENGAGEMENT ==========
    WishlistItem: {
      label: "Wishlist Item",
      fields: {
        productName: { type: "text", label: "Product Name" },
        productImage: { type: "text", label: "Product Image URL" },
        price: { type: "text", label: "Price" },
        originalPrice: { type: "text", label: "Original Price (for sale items)" },
        inStock: {
          type: "radio",
          label: "In Stock",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        showAddToCart: {
          type: "radio",
          label: "Show Add to Cart",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        showRemove: {
          type: "radio",
          label: "Show Remove Button",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        }
      },
      defaultProps: {
        productName: "Product Name",
        productImage: "/placeholder.jpg",
        price: "$49.99",
        originalPrice: "",
        inStock: true,
        showAddToCart: true,
        showRemove: true
      },
      render: WishlistItem
    },
    LoyaltyPointsWidget: {
      label: "Loyalty Points",
      fields: {
        title: { type: "text", label: "Title" },
        points: { type: "number", label: "Points Balance" },
        tier: {
          type: "select",
          label: "Tier",
          options: [
            { label: "Bronze", value: "Bronze" },
            { label: "Silver", value: "Silver" },
            { label: "Gold", value: "Gold" },
            { label: "Platinum", value: "Platinum" }
          ]
        },
        pointsToNextTier: { type: "number", label: "Points to Next Tier" },
        showRedeemButton: {
          type: "radio",
          label: "Show Redeem Button",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        redeemUrl: { type: "text", label: "Redeem URL" }
      },
      defaultProps: {
        title: "Rewards Points",
        points: 2500,
        tier: "Gold",
        pointsToNextTier: 500,
        showRedeemButton: true,
        redeemUrl: "/account/rewards"
      },
      render: LoyaltyPointsWidget
    },
    // ========== SUPPORT & ACTIONS ==========
    SupportWidget: {
      label: "Support Widget",
      fields: {
        title: { type: "text", label: "Title" },
        description: { type: "textarea", label: "Description" },
        showEmail: {
          type: "radio",
          label: "Show Email",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        showPhone: {
          type: "radio",
          label: "Show Phone",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        showChat: {
          type: "radio",
          label: "Show Chat",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        showFaq: {
          type: "radio",
          label: "Show FAQ",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        email: { type: "text", label: "Support Email" },
        phone: { type: "text", label: "Support Phone" },
        faqUrl: { type: "text", label: "FAQ URL" }
      },
      defaultProps: {
        title: "Need Help?",
        description: "Our support team is here to help",
        showEmail: true,
        showPhone: true,
        showChat: true,
        showFaq: true,
        email: "support@example.com",
        phone: "1-800-123-4567",
        faqUrl: "/help/faq"
      },
      render: SupportWidget
    },
    QuickActionsGrid: {
      label: "Quick Actions",
      fields: {
        title: { type: "text", label: "Title" },
        actions: {
          type: "textarea",
          label: "Actions (JSON array)"
        }
      },
      defaultProps: {
        title: "Quick Actions",
        actions: [
          { label: "Track Order", icon: "Truck", url: "/track", color: "blue" },
          { label: "My Orders", icon: "Package", url: "/orders", color: "green" },
          { label: "Wishlist", icon: "Heart", url: "/wishlist", color: "red" },
          { label: "Help", icon: "HelpCircle", url: "/help", color: "gray" }
        ]
      },
      render: QuickActionsGrid
    }
  }
};

// src/puck/ecommerce/components/index.tsx

function PricingTable({
  title = "Pricing Plans",
  subtitle,
  plans = [],
  columns = 3,
  style = "cards"
}) {
  const parsedPlans = typeof plans === "string" ? [] : plans;
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4"
  };
  const cardStyles = {
    cards: "bg-white rounded-xl shadow-lg",
    minimal: "bg-transparent border-0",
    bordered: "bg-white border-2 border-gray-200 rounded-lg"
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "section", { className: "py-12 px-4", children: [
    (title || subtitle) && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-center mb-10", children: [
      title && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h2", { className: "text-3xl font-bold text-gray-900 mb-2", children: title }),
      subtitle && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-lg text-gray-600", children: subtitle })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: `grid grid-cols-1 ${gridCols[columns]} gap-6 max-w-6xl mx-auto`, children: parsedPlans.map((plan, index) => {
      var _a;
      const features = ((_a = plan.features) == null ? void 0 : _a.split("\n").filter(Boolean)) || [];
      return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "div",
        {
          className: `relative p-6 ${cardStyles[style]} ${plan.highlighted ? "ring-2 ring-indigo-500 scale-105" : ""}`,
          children: [
            plan.badge && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full", children: plan.badge }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-center mb-6", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: plan.name }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-baseline justify-center", children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-4xl font-bold text-gray-900", children: plan.price }),
                plan.period && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "ml-1 text-gray-500", children: [
                  "/",
                  plan.period
                ] })
              ] }),
              plan.description && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "mt-2 text-sm text-gray-600", children: plan.description })
            ] }),
            features.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { className: "space-y-3 mb-6", children: features.map((feature, i) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "li", { className: "flex items-start", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                "svg",
                {
                  className: "w-5 h-5 text-green-500 mr-2 flex-shrink-0",
                  fill: "currentColor",
                  viewBox: "0 0 20 20",
                  children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                    "path",
                    {
                      fillRule: "evenodd",
                      d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                      clipRule: "evenodd"
                    }
                  )
                }
              ),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-sm text-gray-700", children: feature })
            ] }, i)) }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              "a",
              {
                href: plan.buttonUrl || "#",
                className: `block w-full py-3 px-4 text-center font-medium rounded-lg transition-colors ${plan.highlighted ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}`,
                children: plan.buttonText || "Get Started"
              }
            )
          ]
        },
        index
      );
    }) })
  ] });
}
function ProductCard({
  name,
  description,
  price,
  originalPrice,
  image,
  badge,
  buttonText = "Add to Cart",
  buttonUrl = "#",
  rating,
  reviewCount,
  showAddToCart = true,
  style = "simple"
}) {
  const hasDiscount = originalPrice && originalPrice !== price;
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: `group relative ${style === "minimal" ? "" : "bg-white rounded-lg shadow-md overflow-hidden"}`, children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "relative aspect-square overflow-hidden bg-gray-100", children: [
      image ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "img",
        {
          src: image,
          alt: name,
          className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        }
      ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-full h-full flex items-center justify-center text-gray-400", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-16 h-16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }) }) }),
      badge && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded", children: badge })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: `p-4 ${style === "minimal" ? "px-0" : ""}`, children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "font-semibold text-gray-900 mb-1 truncate", children: name }),
      description && style === "detailed" && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-gray-600 mb-2 line-clamp-2", children: description }),
      rating !== void 0 && style === "detailed" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center mb-2", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex", children: [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "svg",
          {
            className: `w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`,
            fill: "currentColor",
            viewBox: "0 0 20 20",
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" })
          },
          star
        )) }),
        reviewCount !== void 0 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "ml-1 text-xs text-gray-500", children: [
          "(",
          reviewCount,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-lg font-bold text-gray-900", children: price }),
        hasDiscount && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-sm text-gray-500 line-through", children: originalPrice })
      ] }),
      showAddToCart && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "a",
        {
          href: buttonUrl,
          className: "block w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-medium rounded-lg transition-colors",
          children: buttonText
        }
      )
    ] })
  ] });
}
function ProductGrid({
  title,
  products = [],
  columns = 4,
  showAddToCart = true,
  buttonText = "Add to Cart"
}) {
  const parsedProducts = typeof products === "string" ? [] : products;
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4"
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "section", { className: "py-8 px-4", children: [
    title && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: title }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: `grid grid-cols-1 ${gridCols[columns]} gap-6`, children: parsedProducts.map((product, index) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      ProductCard,
      {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        badge: product.badge,
        buttonUrl: product.buttonUrl,
        buttonText,
        showAddToCart,
        style: "simple"
      },
      index
    )) })
  ] });
}
function OrderSummary({
  items = [],
  subtotal,
  shipping,
  tax,
  discount,
  total,
  showCheckoutButton = true,
  checkoutUrl = "/checkout",
  checkoutButtonText = "Proceed to Checkout",
  style = "simple"
}) {
  const parsedItems = typeof items === "string" ? [] : items;
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: `bg-gray-50 rounded-lg p-6 ${style === "compact" ? "text-sm" : ""}`, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Order Summary" }),
    style !== "compact" && parsedItems.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-3 mb-4 pb-4 border-b border-gray-200", children: parsedItems.map((item, index) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-between text-sm", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "text-gray-600", children: [
        item.name,
        " x ",
        item.quantity
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-medium text-gray-900", children: item.price })
    ] }, index)) }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-2", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-between text-sm", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-gray-600", children: "Subtotal" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-gray-900", children: subtotal })
      ] }),
      shipping && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-between text-sm", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-gray-600", children: "Shipping" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-gray-900", children: shipping })
      ] }),
      tax && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-between text-sm", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-gray-600", children: "Tax" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-gray-900", children: tax })
      ] }),
      discount && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-between text-sm text-green-600", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: "Discount" }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { children: [
          "-",
          discount
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex justify-between pt-2 border-t border-gray-200", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-semibold text-gray-900", children: "Total" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-bold text-lg text-gray-900", children: total })
      ] })
    ] }),
    showCheckoutButton && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      "a",
      {
        href: checkoutUrl,
        className: "mt-6 block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-medium rounded-lg transition-colors",
        children: checkoutButtonText
      }
    )
  ] });
}
function CheckoutSection({
  title = "Secure Checkout",
  description = "Complete your purchase securely",
  paymentMethods = ["visa", "mastercard", "amex", "paypal"],
  securityBadges = true,
  guaranteeText = "30-day money-back guarantee",
  backgroundColor = "#f9fafb",
  accentColor = "#4f46e5"
}) {
  const paymentIcons = {
    visa: "https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg",
    mastercard: "https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/eu.svg",
    amex: "https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg",
    paypal: "https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg"
  };
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "section",
    {
      className: "py-12 px-4",
      style: { backgroundColor },
      children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "max-w-xl mx-auto text-center", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "div",
          {
            className: "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
            style: { backgroundColor: accentColor },
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-8 h-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) })
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: title }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-gray-600 mb-6", children: description }),
        paymentMethods.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex justify-center gap-4 mb-6", children: paymentMethods.map((method) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "div",
          {
            className: "w-12 h-8 bg-white rounded shadow flex items-center justify-center text-xs font-semibold text-gray-500 uppercase",
            children: method
          },
          method
        )) }),
        securityBadges && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-center gap-2 text-sm text-gray-500 mb-4", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { fillRule: "evenodd", d: "M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: "256-bit SSL Encryption" })
        ] }),
        guaranteeText && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-gray-500", children: guaranteeText }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "mt-8 p-6 bg-white rounded-lg border-2 border-dashed border-gray-300", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-gray-400", children: "Payment form will be rendered here via Stripe Elements" }) })
      ] })
    }
  );
}
function FeatureList({
  title,
  features = [],
  columns = 2,
  showIcons = true,
  iconColor = "#22c55e"
}) {
  const parsedFeatures = typeof features === "string" ? [] : features;
  const gridCols = {
    1: "",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3"
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "section", { className: "py-8 px-4", children: [
    title && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h2", { className: "text-2xl font-bold text-gray-900 mb-6 text-center", children: title }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: `grid grid-cols-1 ${gridCols[columns]} gap-4 max-w-4xl mx-auto`, children: parsedFeatures.map((feature, index) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-start p-4 bg-white rounded-lg", children: [
      showIcons && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "div",
        {
          className: "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3",
          style: { backgroundColor: feature.included ? iconColor : "#e5e7eb" },
          children: feature.included ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-4 h-4 text-gray-400", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) })
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: `font-medium ${feature.included ? "text-gray-900" : "text-gray-400"}`, children: feature.title }),
        feature.description && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-gray-500 mt-1", children: feature.description })
      ] })
    ] }, index)) })
  ] });
}
function Testimonial({
  quote,
  authorName,
  authorTitle,
  authorImage,
  companyLogo,
  rating,
  style = "card"
}) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: `${style === "featured" ? "bg-indigo-50 p-8 rounded-2xl" : style === "card" ? "bg-white p-6 rounded-lg shadow-md" : "p-4"}`, children: [
    rating !== void 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex mb-4", children: [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      "svg",
      {
        className: `w-5 h-5 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`,
        fill: "currentColor",
        viewBox: "0 0 20 20",
        children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" })
      },
      star
    )) }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "blockquote", { className: `text-gray-700 mb-4 ${style === "featured" ? "text-lg" : ""}`, children: [
      "\u201C",
      quote,
      "\u201D"
    ] }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center", children: [
      authorImage && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "img",
        {
          src: authorImage,
          alt: authorName,
          className: "w-10 h-10 rounded-full object-cover mr-3"
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "font-semibold text-gray-900", children: authorName }),
        authorTitle && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "text-sm text-gray-500", children: authorTitle })
      ] }),
      companyLogo && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "img",
        {
          src: companyLogo,
          alt: "Company",
          className: "h-8 ml-auto"
        }
      )
    ] })
  ] });
}

// src/puck/ecommerce/config.tsx
var ecommercePuckConfig = {
  categories: {
    pricing: {
      title: "Pricing",
      components: ["PricingTable", "FeatureList"]
    },
    products: {
      title: "Products",
      components: ["ProductCard", "ProductGrid"]
    },
    checkout: {
      title: "Checkout",
      components: ["OrderSummary", "CheckoutSection"]
    },
    social: {
      title: "Social Proof",
      components: ["Testimonial"]
    }
  },
  components: {
    // ========== PRICING ==========
    PricingTable: {
      label: "Pricing Table",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "textarea", label: "Subtitle" },
        plans: {
          type: "array",
          label: "Plans",
          arrayFields: {
            name: { type: "text", label: "Plan Name" },
            price: { type: "text", label: "Price (e.g., $29)" },
            period: { type: "text", label: "Period (e.g., month)" },
            description: { type: "text", label: "Description" },
            features: { type: "textarea", label: "Features (one per line)" },
            buttonText: { type: "text", label: "Button Text" },
            buttonUrl: { type: "text", label: "Button URL" },
            highlighted: {
              type: "radio",
              label: "Highlighted",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false }
              ]
            },
            badge: { type: "text", label: "Badge (e.g., Popular)" }
          },
          defaultItemProps: {
            name: "Plan",
            price: "$29",
            period: "month",
            description: "Perfect for getting started",
            features: "Feature 1\nFeature 2\nFeature 3",
            buttonText: "Get Started",
            buttonUrl: "#",
            highlighted: false
          }
        },
        columns: {
          type: "select",
          label: "Columns",
          options: [
            { label: "2 Columns", value: 2 },
            { label: "3 Columns", value: 3 },
            { label: "4 Columns", value: 4 }
          ]
        },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Cards", value: "cards" },
            { label: "Minimal", value: "minimal" },
            { label: "Bordered", value: "bordered" }
          ]
        }
      },
      defaultProps: {
        title: "Choose Your Plan",
        subtitle: "Simple, transparent pricing that grows with you.",
        plans: [
          {
            name: "Starter",
            price: "$9",
            period: "month",
            description: "Perfect for individuals",
            features: "1 User\n5 Projects\nBasic Support",
            buttonText: "Start Free",
            buttonUrl: "#",
            highlighted: false
          },
          {
            name: "Professional",
            price: "$29",
            period: "month",
            description: "Best for growing teams",
            features: "5 Users\nUnlimited Projects\nPriority Support\nAdvanced Analytics",
            buttonText: "Get Started",
            buttonUrl: "#",
            highlighted: true,
            badge: "Popular"
          },
          {
            name: "Enterprise",
            price: "$99",
            period: "month",
            description: "For large organizations",
            features: "Unlimited Users\nUnlimited Projects\n24/7 Support\nCustom Integrations\nDedicated Manager",
            buttonText: "Contact Sales",
            buttonUrl: "#",
            highlighted: false
          }
        ],
        columns: 3,
        style: "cards"
      },
      render: PricingTable
    },
    FeatureList: {
      label: "Feature List",
      fields: {
        title: { type: "text", label: "Title" },
        features: {
          type: "array",
          label: "Features",
          arrayFields: {
            title: { type: "text", label: "Feature Title" },
            description: { type: "text", label: "Description" },
            included: {
              type: "radio",
              label: "Included",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false }
              ]
            }
          },
          defaultItemProps: {
            title: "Feature",
            description: "Description of this feature",
            included: true
          }
        },
        columns: {
          type: "select",
          label: "Columns",
          options: [
            { label: "1 Column", value: 1 },
            { label: "2 Columns", value: 2 },
            { label: "3 Columns", value: 3 }
          ]
        },
        showIcons: {
          type: "radio",
          label: "Show Icons",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        iconColor: { type: "text", label: "Icon Color" }
      },
      defaultProps: {
        title: "Everything you need",
        features: [
          { title: "Unlimited projects", description: "Create as many as you need", included: true },
          { title: "Team collaboration", description: "Work together seamlessly", included: true },
          { title: "Advanced analytics", description: "Track your performance", included: true },
          { title: "Priority support", description: "Get help when you need it", included: true }
        ],
        columns: 2,
        showIcons: true,
        iconColor: "#22c55e"
      },
      render: FeatureList
    },
    // ========== PRODUCTS ==========
    ProductCard: {
      label: "Product Card",
      fields: {
        name: { type: "text", label: "Product Name" },
        description: { type: "textarea", label: "Description" },
        price: { type: "text", label: "Price" },
        originalPrice: { type: "text", label: "Original Price (for discount)" },
        image: { type: "text", label: "Image URL" },
        badge: { type: "text", label: "Badge (e.g., Sale)" },
        buttonText: { type: "text", label: "Button Text" },
        buttonUrl: { type: "text", label: "Button URL" },
        rating: { type: "number", label: "Rating (1-5)", min: 1, max: 5 },
        reviewCount: { type: "number", label: "Review Count" },
        showAddToCart: {
          type: "radio",
          label: "Show Add to Cart",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Simple", value: "simple" },
            { label: "Detailed", value: "detailed" },
            { label: "Minimal", value: "minimal" }
          ]
        }
      },
      defaultProps: {
        name: "Product Name",
        description: "A great product description goes here.",
        price: "$49.99",
        image: "https://placehold.co/400x400",
        buttonText: "Add to Cart",
        buttonUrl: "#",
        showAddToCart: true,
        style: "simple"
      },
      render: ProductCard
    },
    ProductGrid: {
      label: "Product Grid",
      fields: {
        title: { type: "text", label: "Section Title" },
        products: {
          type: "array",
          label: "Products",
          arrayFields: {
            name: { type: "text", label: "Product Name" },
            price: { type: "text", label: "Price" },
            originalPrice: { type: "text", label: "Original Price" },
            image: { type: "text", label: "Image URL" },
            badge: { type: "text", label: "Badge" },
            buttonUrl: { type: "text", label: "Button URL" }
          },
          defaultItemProps: {
            name: "Product",
            price: "$29.99",
            image: "https://placehold.co/400x400",
            buttonUrl: "#"
          }
        },
        columns: {
          type: "select",
          label: "Columns",
          options: [
            { label: "2 Columns", value: 2 },
            { label: "3 Columns", value: 3 },
            { label: "4 Columns", value: 4 }
          ]
        },
        showAddToCart: {
          type: "radio",
          label: "Show Add to Cart",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        buttonText: { type: "text", label: "Button Text" }
      },
      defaultProps: {
        title: "Featured Products",
        products: [
          { name: "Product 1", price: "$29.99", image: "https://placehold.co/400x400", buttonUrl: "#" },
          { name: "Product 2", price: "$39.99", image: "https://placehold.co/400x400", buttonUrl: "#" },
          { name: "Product 3", price: "$49.99", image: "https://placehold.co/400x400", badge: "Sale", buttonUrl: "#" },
          { name: "Product 4", price: "$59.99", image: "https://placehold.co/400x400", buttonUrl: "#" }
        ],
        columns: 4,
        showAddToCart: true,
        buttonText: "Add to Cart"
      },
      render: ProductGrid
    },
    // ========== CHECKOUT ==========
    OrderSummary: {
      label: "Order Summary",
      fields: {
        items: {
          type: "array",
          label: "Items",
          arrayFields: {
            name: { type: "text", label: "Item Name" },
            quantity: { type: "number", label: "Quantity" },
            price: { type: "text", label: "Price" }
          },
          defaultItemProps: {
            name: "Item",
            quantity: 1,
            price: "$29.99"
          }
        },
        subtotal: { type: "text", label: "Subtotal" },
        shipping: { type: "text", label: "Shipping" },
        tax: { type: "text", label: "Tax" },
        discount: { type: "text", label: "Discount" },
        total: { type: "text", label: "Total" },
        showCheckoutButton: {
          type: "radio",
          label: "Show Checkout Button",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        checkoutUrl: { type: "text", label: "Checkout URL" },
        checkoutButtonText: { type: "text", label: "Button Text" },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Simple", value: "simple" },
            { label: "Detailed", value: "detailed" },
            { label: "Compact", value: "compact" }
          ]
        }
      },
      defaultProps: {
        items: [
          { name: "Product 1", quantity: 2, price: "$59.98" },
          { name: "Product 2", quantity: 1, price: "$29.99" }
        ],
        subtotal: "$89.97",
        shipping: "$9.99",
        tax: "$7.20",
        total: "$107.16",
        showCheckoutButton: true,
        checkoutUrl: "/checkout",
        checkoutButtonText: "Proceed to Checkout",
        style: "simple"
      },
      render: OrderSummary
    },
    CheckoutSection: {
      label: "Checkout Section",
      fields: {
        title: { type: "text", label: "Title" },
        description: { type: "textarea", label: "Description" },
        paymentMethods: {
          type: "array",
          label: "Payment Methods",
          arrayFields: {
            method: { type: "text", label: "Method" }
          }
        },
        securityBadges: {
          type: "radio",
          label: "Show Security Badges",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        guaranteeText: { type: "text", label: "Guarantee Text" },
        backgroundColor: { type: "text", label: "Background Color" },
        accentColor: { type: "text", label: "Accent Color" }
      },
      defaultProps: {
        title: "Secure Checkout",
        description: "Complete your purchase securely with our encrypted payment system.",
        paymentMethods: ["visa", "mastercard", "amex", "paypal"],
        securityBadges: true,
        guaranteeText: "30-day money-back guarantee",
        backgroundColor: "#f9fafb",
        accentColor: "#4f46e5"
      },
      render: CheckoutSection
    },
    // ========== SOCIAL PROOF ==========
    Testimonial: {
      label: "Testimonial",
      fields: {
        quote: { type: "textarea", label: "Quote" },
        authorName: { type: "text", label: "Author Name" },
        authorTitle: { type: "text", label: "Author Title" },
        authorImage: { type: "text", label: "Author Image URL" },
        companyLogo: { type: "text", label: "Company Logo URL" },
        rating: { type: "number", label: "Rating (1-5)", min: 1, max: 5 },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Simple", value: "simple" },
            { label: "Card", value: "card" },
            { label: "Featured", value: "featured" }
          ]
        }
      },
      defaultProps: {
        quote: "This product has completely transformed how we work. The team is more productive than ever.",
        authorName: "Jane Smith",
        authorTitle: "CEO at TechCorp",
        rating: 5,
        style: "card"
      },
      render: Testimonial
    }
  }
};

// src/puck/fields/MediaPickerField.tsx


var _reactdropzone = require('react-dropzone');
var _sonner = require('sonner');

function MediaPickerField({
  value,
  onChange,
  label = "Image",
  placeholder = "Enter image URL or select from library"
}) {
  const [isOpen, setIsOpen] = _react.useState.call(void 0, false);
  const [activeTab, setActiveTab] = _react.useState.call(void 0, "library");
  const [mediaItems, setMediaItems] = _react.useState.call(void 0, []);
  const [isLoadingMedia, setIsLoadingMedia] = _react.useState.call(void 0, false);
  const [isUploading, setIsUploading] = _react.useState.call(void 0, false);
  const [uploadProgress, setUploadProgress] = _react.useState.call(void 0, 0);
  const [urlInput, setUrlInput] = _react.useState.call(void 0, "");
  const [selectedMedia, setSelectedMedia] = _react.useState.call(void 0, null);
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
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]
    },
    maxSize: 10 * 1024 * 1024,
    // 10MB
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
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground mt-4", children: "PNG, JPG, GIF, WebP, or SVG up to 10MB" })
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
          className: "max-h-32 w-full object-contain",
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
var mediaPickerFieldConfig = {
  type: "custom",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: ({ value, onChange }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, MediaPickerField, { value: value || "", onChange: (v) => onChange(v || "") })
};

// src/puck/email/components/index.tsx















var _components = require('@react-email/components');

var EmailContainer = ({
  backgroundColor,
  width,
  padding
}) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
  _components.Container,
  {
    style: {
      maxWidth: width,
      margin: "0 auto",
      backgroundColor,
      padding
    },
    children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { padding: 20, textAlign: "center", color: "#666" }, children: "[Email Container - Add content blocks here]" })
  }
);
var EmailHeader = ({
  logoUrl,
  logoAlt,
  logoWidth,
  alignment,
  backgroundColor
}) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Section, { style: { backgroundColor, padding: "20px 0", textAlign: alignment }, children: logoUrl ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
  _components.Img,
  {
    src: logoUrl,
    alt: logoAlt,
    width: logoWidth,
    style: { display: "inline-block" }
  }
) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { fontSize: 24, fontWeight: "bold", color: "#1a56db", margin: 0 }, children: "Your Logo" }) });
var EmailText = ({
  content,
  fontSize,
  color,
  alignment,
  fontWeight,
  lineHeight
}) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
  _components.Text,
  {
    style: {
      fontSize,
      color,
      textAlign: alignment,
      fontWeight,
      lineHeight,
      margin: "0 0 16px 0",
      fontFamily: "Arial, sans-serif"
    },
    children: content
  }
);
var EmailButton = ({
  label,
  href,
  backgroundColor,
  textColor,
  borderRadius,
  fullWidth,
  alignment
}) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Section, { style: { textAlign: alignment }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
  _components.Button,
  {
    href,
    style: {
      display: fullWidth ? "block" : "inline-block",
      backgroundColor,
      color: textColor,
      padding: "14px 28px",
      borderRadius,
      textDecoration: "none",
      fontWeight: 600,
      textAlign: "center",
      fontFamily: "Arial, sans-serif"
    },
    children: label
  }
) });
var EmailImage = ({
  src,
  alt,
  width,
  alignment,
  borderRadius
}) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Section, { style: { textAlign: alignment }, children: src ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
  _components.Img,
  {
    src,
    alt,
    width: width === "full" ? "100%" : width,
    style: {
      display: "inline-block",
      borderRadius,
      maxWidth: "100%"
    }
  }
) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
  "div",
  {
    style: {
      width: width === "full" ? "100%" : width,
      height: 200,
      backgroundColor: "#e5e7eb",
      borderRadius,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#6b7280"
    },
    children: "Image Placeholder"
  }
) });
var EmailDivider = ({
  color,
  thickness,
  style
}) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
  _components.Hr,
  {
    style: {
      border: "none",
      borderTop: `${thickness}px ${style} ${color}`,
      margin: "20px 0"
    }
  }
);
var EmailColumns = ({
  columns,
  gap,
  content
}) => {
  const contentItems = content.split("\n").filter(Boolean);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Row, { children: Array.from({ length: columns }).map((_, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _components.Column,
    {
      style: {
        width: `${100 / columns}%`,
        padding: `0 ${gap / 2}px`,
        verticalAlign: "top"
      },
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { margin: 0 }, children: contentItems[i] || `Column ${i + 1}` })
    },
    i
  )) });
};
var EmailFooter = ({
  companyName,
  address,
  unsubscribeUrl,
  socialLinks,
  textColor
}) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
  _components.Section,
  {
    style: {
      borderTop: "1px solid #e5e7eb",
      padding: "20px 0",
      marginTop: 20,
      textAlign: "center"
    },
    children: [
      socialLinks && socialLinks.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Row, { style: { marginBottom: 16 }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Column, { style: { textAlign: "center" }, children: socialLinks.map((link, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _components.Link,
        {
          href: link.url,
          style: {
            color: textColor,
            textDecoration: "none",
            margin: "0 8px",
            fontSize: 12
          },
          children: link.platform
        },
        i
      )) }) }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { color: textColor, fontSize: 12, margin: "0 0 8px 0", fontFamily: "Arial, sans-serif" }, children: companyName }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { color: textColor, fontSize: 12, margin: "0 0 8px 0", whiteSpace: "pre-line", fontFamily: "Arial, sans-serif" }, children: address }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _components.Link,
        {
          href: unsubscribeUrl,
          style: { color: textColor, fontSize: 12, textDecoration: "underline" },
          children: "Unsubscribe"
        }
      )
    ]
  }
);
var EmailHero = ({
  heading,
  subheading,
  imageUrl,
  ctaLabel,
  ctaUrl,
  backgroundColor,
  textColor,
  imagePosition
}) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
  _components.Section,
  {
    style: {
      backgroundColor,
      padding: 40,
      textAlign: "center",
      backgroundImage: imagePosition === "background" && imageUrl ? `url(${imageUrl})` : "none",
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    children: [
      imagePosition === "above" && imageUrl && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _components.Img,
        {
          src: imageUrl,
          alt: "",
          style: { maxWidth: "100%", marginBottom: 20 }
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _components.Heading,
        {
          style: {
            color: textColor,
            fontSize: 32,
            fontWeight: "bold",
            margin: "0 0 16px 0",
            fontFamily: "Arial, sans-serif"
          },
          children: heading
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _components.Text,
        {
          style: {
            color: textColor,
            fontSize: 18,
            margin: "0 0 24px 0",
            opacity: 0.9,
            fontFamily: "Arial, sans-serif"
          },
          children: subheading
        }
      ),
      ctaLabel && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _components.Button,
        {
          href: ctaUrl,
          style: {
            display: "inline-block",
            backgroundColor: textColor === "#ffffff" ? "#ffffff" : "#1a56db",
            color: textColor === "#ffffff" ? "#111827" : "#ffffff",
            padding: "14px 32px",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 600,
            fontFamily: "Arial, sans-serif"
          },
          children: ctaLabel
        }
      ),
      imagePosition === "below" && imageUrl && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _components.Img,
        {
          src: imageUrl,
          alt: "",
          style: { maxWidth: "100%", marginTop: 20 }
        }
      )
    ]
  }
);
var EmailCard = ({
  title,
  description,
  imageUrl,
  ctaLabel,
  ctaUrl,
  backgroundColor,
  borderRadius
}) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
  _components.Section,
  {
    style: {
      backgroundColor,
      borderRadius,
      overflow: "hidden",
      border: "1px solid #e5e7eb"
    },
    children: [
      imageUrl && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Img, { src: imageUrl, alt: "", style: { width: "100%" } }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Row, { style: { padding: 20 }, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _components.Column, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Heading, { as: "h3", style: { margin: "0 0 8px 0", fontSize: 18, fontWeight: 600, fontFamily: "Arial, sans-serif" }, children: title }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { margin: "0 0 16px 0", color: "#6b7280", fontSize: 14, fontFamily: "Arial, sans-serif" }, children: description }),
        ctaLabel && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _components.Link,
          {
            href: ctaUrl,
            style: {
              color: "#1a56db",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "Arial, sans-serif"
            },
            children: [
              ctaLabel,
              " \u2192"
            ]
          }
        )
      ] }) })
    ]
  }
);
var EmailList = ({
  items,
  style,
  color
}) => {
  const itemsList = items.split("\n").filter(Boolean);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Section, { style: { fontFamily: "Arial, sans-serif" }, children: itemsList.map((item, i) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _components.Row, { style: { marginBottom: 8 }, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Column, { style: { width: 24, color, verticalAlign: "top" }, children: style === "check" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { style: { color: "#10b981" }, children: "\u2713" }) : style === "number" ? `${i + 1}.` : "\u2022" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Column, { style: { color }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { margin: 0, color }, children: item }) })
  ] }, i)) });
};
var EmailSpacer = ({ height }) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Section, { style: { height } });
var EmailProduct = ({
  productName,
  productImage,
  productPrice,
  productDescription,
  ctaLabel,
  ctaUrl
}) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
  _components.Section,
  {
    style: {
      backgroundColor: "#ffffff",
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid #e5e7eb",
      marginBottom: 16
    },
    children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _components.Row, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Column, { style: { width: 120, padding: 16, verticalAlign: "top" }, children: productImage ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _components.Img,
        {
          src: productImage,
          alt: productName,
          width: 100,
          height: 100,
          style: { objectFit: "cover", borderRadius: 8 }
        }
      ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "div",
        {
          style: {
            width: 100,
            height: 100,
            backgroundColor: "#f3f4f6",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: 12
          },
          children: "No Image"
        }
      ) }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _components.Column, { style: { padding: 16, verticalAlign: "top" }, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Heading, { as: "h4", style: { margin: "0 0 8px 0", fontSize: 16, fontWeight: 600, fontFamily: "Arial, sans-serif" }, children: productName }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { margin: "0 0 8px 0", color: "#1a56db", fontSize: 18, fontWeight: 700, fontFamily: "Arial, sans-serif" }, children: productPrice }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { margin: "0 0 12px 0", color: "#6b7280", fontSize: 14, fontFamily: "Arial, sans-serif" }, children: productDescription }),
        ctaLabel && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _components.Button,
          {
            href: ctaUrl,
            style: {
              display: "inline-block",
              backgroundColor: "#1a56db",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: 4,
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 14,
              fontFamily: "Arial, sans-serif"
            },
            children: ctaLabel
          }
        )
      ] })
    ] })
  }
);
var EmailCoupon = ({
  code,
  discount,
  expiryDate,
  backgroundColor,
  borderColor
}) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
  _components.Section,
  {
    style: {
      backgroundColor,
      border: `2px dashed ${borderColor}`,
      borderRadius: 8,
      padding: 24,
      textAlign: "center"
    },
    children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { margin: "0 0 8px 0", fontSize: 14, color: "#6b7280", fontFamily: "Arial, sans-serif" }, children: "USE CODE" }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _components.Text,
        {
          style: {
            margin: "0 0 8px 0",
            fontSize: 28,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: 2,
            fontFamily: "monospace"
          },
          children: code
        }
      ),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _components.Text, { style: { margin: "0 0 8px 0", fontSize: 20, color: "#059669", fontWeight: 600, fontFamily: "Arial, sans-serif" }, children: discount }),
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _components.Text, { style: { margin: 0, fontSize: 12, color: "#9ca3af", fontFamily: "Arial, sans-serif" }, children: [
        "Expires: ",
        expiryDate
      ] })
    ]
  }
);

// src/puck/email/config.tsx
var emailPuckConfig = {
  categories: {
    structure: {
      title: "Structure",
      components: ["EmailContainer", "EmailHeader", "EmailDivider", "EmailSpacer", "EmailColumns", "EmailFooter"]
    },
    content: {
      title: "Content",
      components: ["EmailText", "EmailImage", "EmailList"]
    },
    hero: {
      title: "Hero & Cards",
      components: ["EmailHero", "EmailCard"]
    },
    actions: {
      title: "Actions",
      components: ["EmailButton"]
    },
    ecommerce: {
      title: "E-commerce",
      components: ["EmailProduct", "EmailCoupon"]
    }
  },
  components: {
    EmailContainer: {
      label: "Container",
      fields: {
        backgroundColor: {
          type: "text",
          label: "Background Color"
        },
        width: {
          type: "number",
          label: "Max Width"
        },
        padding: {
          type: "number",
          label: "Padding"
        }
      },
      defaultProps: {
        backgroundColor: "#ffffff",
        width: 600,
        padding: 20
      },
      render: EmailContainer
    },
    EmailHeader: {
      label: "Header",
      fields: {
        logoUrl: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, mediaPickerFieldConfig), {
          label: "Logo Image"
        }),
        logoAlt: {
          type: "text",
          label: "Logo Alt Text"
        },
        logoWidth: {
          type: "number",
          label: "Logo Width"
        },
        alignment: {
          type: "select",
          label: "Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" }
          ]
        },
        backgroundColor: {
          type: "text",
          label: "Background Color"
        }
      },
      defaultProps: {
        logoUrl: "",
        logoAlt: "Company Logo",
        logoWidth: 150,
        alignment: "center",
        backgroundColor: "transparent"
      },
      render: EmailHeader
    },
    EmailText: {
      label: "Text",
      fields: {
        content: {
          type: "textarea",
          label: "Content"
        },
        fontSize: {
          type: "number",
          label: "Font Size"
        },
        color: {
          type: "text",
          label: "Color"
        },
        alignment: {
          type: "select",
          label: "Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" }
          ]
        },
        fontWeight: {
          type: "select",
          label: "Font Weight",
          options: [
            { label: "Normal", value: "normal" },
            { label: "Bold", value: "bold" }
          ]
        },
        lineHeight: {
          type: "number",
          label: "Line Height"
        }
      },
      defaultProps: {
        content: "Enter your text here...",
        fontSize: 16,
        color: "#374151",
        alignment: "left",
        fontWeight: "normal",
        lineHeight: 1.5
      },
      render: EmailText
    },
    EmailButton: {
      label: "Button",
      fields: {
        label: {
          type: "text",
          label: "Button Text"
        },
        href: {
          type: "text",
          label: "Link URL"
        },
        backgroundColor: {
          type: "text",
          label: "Background Color"
        },
        textColor: {
          type: "text",
          label: "Text Color"
        },
        borderRadius: {
          type: "number",
          label: "Border Radius"
        },
        fullWidth: {
          type: "radio",
          label: "Full Width",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        alignment: {
          type: "select",
          label: "Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" }
          ]
        }
      },
      defaultProps: {
        label: "Click Here",
        href: "#",
        backgroundColor: "#1a56db",
        textColor: "#ffffff",
        borderRadius: 6,
        fullWidth: false,
        alignment: "center"
      },
      render: EmailButton
    },
    EmailImage: {
      label: "Image",
      fields: {
        src: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, mediaPickerFieldConfig), {
          label: "Image"
        }),
        alt: {
          type: "text",
          label: "Alt Text"
        },
        width: {
          type: "text",
          label: 'Width (number or "full")'
        },
        alignment: {
          type: "select",
          label: "Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" }
          ]
        },
        borderRadius: {
          type: "number",
          label: "Border Radius"
        }
      },
      defaultProps: {
        src: "",
        alt: "",
        width: "full",
        alignment: "center",
        borderRadius: 0
      },
      render: EmailImage
    },
    EmailDivider: {
      label: "Divider",
      fields: {
        color: {
          type: "text",
          label: "Color"
        },
        thickness: {
          type: "number",
          label: "Thickness"
        },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Dashed", value: "dashed" },
            { label: "Dotted", value: "dotted" }
          ]
        }
      },
      defaultProps: {
        color: "#e5e7eb",
        thickness: 1,
        style: "solid"
      },
      render: EmailDivider
    },
    EmailColumns: {
      label: "Columns",
      fields: {
        columns: {
          type: "number",
          label: "Number of Columns",
          min: 1,
          max: 4
        },
        gap: {
          type: "number",
          label: "Gap"
        },
        content: {
          type: "textarea",
          label: "Column Content (one per line)"
        }
      },
      defaultProps: {
        columns: 2,
        gap: 20,
        content: "Column 1\nColumn 2"
      },
      render: EmailColumns
    },
    EmailFooter: {
      label: "Footer",
      fields: {
        companyName: {
          type: "text",
          label: "Company Name"
        },
        address: {
          type: "textarea",
          label: "Address"
        },
        unsubscribeUrl: {
          type: "text",
          label: "Unsubscribe URL"
        },
        socialLinks: {
          type: "array",
          label: "Social Links",
          arrayFields: {
            platform: {
              type: "select",
              label: "Platform",
              options: [
                { label: "Twitter/X", value: "twitter" },
                { label: "Facebook", value: "facebook" },
                { label: "LinkedIn", value: "linkedin" },
                { label: "Instagram", value: "instagram" }
              ]
            },
            url: {
              type: "text",
              label: "URL"
            }
          }
        },
        textColor: {
          type: "text",
          label: "Text Color"
        }
      },
      defaultProps: {
        companyName: "Your Company",
        address: "123 Main St, City, State 12345",
        unsubscribeUrl: "{{unsubscribeUrl}}",
        socialLinks: [],
        textColor: "#6b7280"
      },
      render: EmailFooter
    },
    EmailHero: {
      label: "Hero",
      fields: {
        heading: {
          type: "text",
          label: "Heading"
        },
        subheading: {
          type: "textarea",
          label: "Subheading"
        },
        imageUrl: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, mediaPickerFieldConfig), {
          label: "Hero Image"
        }),
        ctaLabel: {
          type: "text",
          label: "CTA Label"
        },
        ctaUrl: {
          type: "text",
          label: "CTA URL"
        },
        backgroundColor: {
          type: "text",
          label: "Background Color"
        },
        textColor: {
          type: "text",
          label: "Text Color"
        },
        imagePosition: {
          type: "select",
          label: "Image Position",
          options: [
            { label: "Above", value: "above" },
            { label: "Below", value: "below" },
            { label: "Background", value: "background" }
          ]
        }
      },
      defaultProps: {
        heading: "Welcome to Our Newsletter",
        subheading: "Stay updated with the latest news and offers.",
        imageUrl: "",
        ctaLabel: "Learn More",
        ctaUrl: "#",
        backgroundColor: "#f3f4f6",
        textColor: "#111827",
        imagePosition: "above"
      },
      render: EmailHero
    },
    EmailCard: {
      label: "Card",
      fields: {
        title: {
          type: "text",
          label: "Title"
        },
        description: {
          type: "textarea",
          label: "Description"
        },
        imageUrl: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, mediaPickerFieldConfig), {
          label: "Card Image"
        }),
        ctaLabel: {
          type: "text",
          label: "CTA Label"
        },
        ctaUrl: {
          type: "text",
          label: "CTA URL"
        },
        backgroundColor: {
          type: "text",
          label: "Background Color"
        },
        borderRadius: {
          type: "number",
          label: "Border Radius"
        }
      },
      defaultProps: {
        title: "Card Title",
        description: "Card description goes here.",
        imageUrl: "",
        ctaLabel: "",
        ctaUrl: "#",
        backgroundColor: "#ffffff",
        borderRadius: 8
      },
      render: EmailCard
    },
    EmailList: {
      label: "List",
      fields: {
        items: {
          type: "textarea",
          label: "Items (one per line)"
        },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Bullet", value: "bullet" },
            { label: "Number", value: "number" },
            { label: "Check", value: "check" }
          ]
        },
        color: {
          type: "text",
          label: "Text Color"
        }
      },
      defaultProps: {
        items: "Item 1\nItem 2\nItem 3",
        style: "bullet",
        color: "#374151"
      },
      render: EmailList
    },
    EmailSpacer: {
      label: "Spacer",
      fields: {
        height: {
          type: "number",
          label: "Height (px)"
        }
      },
      defaultProps: {
        height: 20
      },
      render: EmailSpacer
    },
    EmailProduct: {
      label: "Product",
      fields: {
        productName: {
          type: "text",
          label: "Product Name"
        },
        productImage: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, mediaPickerFieldConfig), {
          label: "Product Image"
        }),
        productPrice: {
          type: "text",
          label: "Price"
        },
        productDescription: {
          type: "textarea",
          label: "Description"
        },
        ctaLabel: {
          type: "text",
          label: "Button Label"
        },
        ctaUrl: {
          type: "text",
          label: "Button URL"
        }
      },
      defaultProps: {
        productName: "Product Name",
        productImage: "",
        productPrice: "$29.99",
        productDescription: "A brief description of the product.",
        ctaLabel: "Shop Now",
        ctaUrl: "#"
      },
      render: EmailProduct
    },
    EmailCoupon: {
      label: "Coupon",
      fields: {
        code: {
          type: "text",
          label: "Coupon Code"
        },
        discount: {
          type: "text",
          label: "Discount Text"
        },
        expiryDate: {
          type: "text",
          label: "Expiry Date"
        },
        backgroundColor: {
          type: "text",
          label: "Background Color"
        },
        borderColor: {
          type: "text",
          label: "Border Color"
        }
      },
      defaultProps: {
        code: "SAVE20",
        discount: "20% OFF",
        expiryDate: "December 31, 2024",
        backgroundColor: "#fef3c7",
        borderColor: "#f59e0b"
      },
      render: EmailCoupon
    }
  }
};

// src/puck/layout/components/index.tsx

var _link = require('next/link'); var _link2 = _interopRequireDefault(_link);
var _image = require('next/image'); var _image2 = _interopRequireDefault(_image);

function Header({
  logo = { type: "text", text: "Your Brand" },
  navLinks = [],
  showSearch = false,
  showCart = false,
  showAccount = false,
  ctaButton,
  sticky = true,
  transparent = false,
  backgroundColor = "#ffffff",
  textColor = "#18181b",
  maxWidth = "xl"
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = _react2.default.useState(false);
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full"
  };
  const buttonVariants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-900 text-white hover:bg-gray-800",
    outline: "border-2 border-current hover:bg-gray-100"
  };
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "header",
    {
      className: `w-full z-50 ${sticky ? "sticky top-0" : ""} ${transparent ? "bg-transparent" : ""}`,
      style: {
        backgroundColor: transparent ? "transparent" : backgroundColor,
        color: textColor
      },
      children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: `mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]}`, children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between h-16 lg:h-20", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex-shrink-0", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _link2.default, { href: "/", className: "flex items-center", children: logo.type === "image" && logo.imageUrl ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _image2.default,
            {
              src: logo.imageUrl,
              alt: logo.imageAlt || "Logo",
              width: logo.width || 120,
              height: logo.height || 40,
              className: "h-8 lg:h-10 w-auto"
            }
          ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-xl lg:text-2xl font-bold", children: logo.text }) }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "nav", { className: "hidden lg:flex items-center space-x-8", children: navLinks.map((link, index) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _link2.default,
            {
              href: link.href,
              target: link.openInNewTab ? "_blank" : void 0,
              rel: link.openInNewTab ? "noopener noreferrer" : void 0,
              className: "text-sm font-medium hover:opacity-70 transition-opacity",
              children: link.label
            },
            index
          )) }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center space-x-4", children: [
            showSearch && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              "button",
              {
                className: "p-2 hover:bg-gray-100 rounded-full transition-colors",
                "aria-label": "Search",
                children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  }
                ) })
              }
            ),
            showCart && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _link2.default,
              {
                href: "/cart",
                className: "p-2 hover:bg-gray-100 rounded-full transition-colors relative",
                "aria-label": "Cart",
                children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  }
                ) })
              }
            ),
            showAccount && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _link2.default,
              {
                href: "/account",
                className: "p-2 hover:bg-gray-100 rounded-full transition-colors",
                "aria-label": "Account",
                children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  }
                ) })
              }
            ),
            ctaButton && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _link2.default,
              {
                href: ctaButton.href,
                className: `hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-medium transition-colors ${buttonVariants[ctaButton.variant]}`,
                children: ctaButton.label
              }
            ),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              "button",
              {
                className: "lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors",
                onClick: () => setMobileMenuOpen(!mobileMenuOpen),
                "aria-label": "Toggle menu",
                children: mobileMenuOpen ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M6 18L18 6M6 6l12 12"
                  }
                ) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M4 6h16M4 12h16M4 18h16"
                  }
                ) })
              }
            )
          ] })
        ] }),
        mobileMenuOpen && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "lg:hidden py-4 border-t", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "nav", { className: "flex flex-col space-y-4", children: [
          navLinks.map((link, index) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _link2.default,
            {
              href: link.href,
              target: link.openInNewTab ? "_blank" : void 0,
              rel: link.openInNewTab ? "noopener noreferrer" : void 0,
              className: "text-base font-medium hover:opacity-70 transition-opacity",
              onClick: () => setMobileMenuOpen(false),
              children: link.label
            },
            index
          )),
          ctaButton && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _link2.default,
            {
              href: ctaButton.href,
              className: `inline-flex justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${buttonVariants[ctaButton.variant]}`,
              onClick: () => setMobileMenuOpen(false),
              children: ctaButton.label
            }
          )
        ] }) })
      ] })
    }
  );
}
var SocialIcon = ({ platform }) => {
  const icons = {
    facebook: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) }),
    twitter: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" }) }),
    instagram: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" }) }),
    linkedin: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" }) }),
    youtube: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" }) }),
    tiktok: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" }) }),
    github: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" }) })
  };
  return icons[platform] || null;
};
function Footer({
  logo = { type: "text", text: "Your Brand" },
  tagline,
  columns = [],
  socialLinks = [],
  newsletter = { enabled: false },
  bottomLinks = [],
  copyrightText,
  backgroundColor = "#18181b",
  textColor = "#ffffff",
  maxWidth = "xl",
  layout = "columns"
}) {
  const [email, setEmail] = _react2.default.useState("");
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full"
  };
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    console.log("Newsletter signup:", email);
    setEmail("");
  };
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "footer", { style: { backgroundColor, color: textColor }, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: `mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 ${maxWidthClasses[maxWidth]}`, children: [
    layout === "centered" ? (
      /* Centered Layout */
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-center", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex justify-center mb-6", children: logo.type === "image" && logo.imageUrl ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _image2.default,
          {
            src: logo.imageUrl,
            alt: logo.imageAlt || "Logo",
            width: logo.width || 150,
            height: logo.height || 50,
            className: "h-10 w-auto"
          }
        ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-2xl font-bold", children: logo.text }) }),
        tagline && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm opacity-70 mb-8 max-w-md mx-auto", children: tagline }),
        socialLinks.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex justify-center space-x-6 mb-8", children: socialLinks.map((social, index) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "a",
          {
            href: social.url,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "opacity-70 hover:opacity-100 transition-opacity",
            "aria-label": social.platform,
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SocialIcon, { platform: social.platform })
          },
          index
        )) }),
        newsletter.enabled && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "max-w-md mx-auto mb-8", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "form", { onSubmit: handleNewsletterSubmit, className: "flex gap-2", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "input",
            {
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: newsletter.placeholder || "Enter your email",
              className: "flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40",
              required: true
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "button",
            {
              type: "submit",
              className: "px-6 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors",
              children: newsletter.buttonLabel || "Subscribe"
            }
          )
        ] }) })
      ] })
    ) : (
      /* Columns Layout */
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "lg:col-span-1", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "mb-4", children: logo.type === "image" && logo.imageUrl ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _image2.default,
            {
              src: logo.imageUrl,
              alt: logo.imageAlt || "Logo",
              width: logo.width || 150,
              height: logo.height || 50,
              className: "h-10 w-auto"
            }
          ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-xl font-bold", children: logo.text }) }),
          tagline && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm opacity-70 mb-6", children: tagline }),
          socialLinks.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex space-x-4", children: socialLinks.map((social, index) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "a",
            {
              href: social.url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "opacity-70 hover:opacity-100 transition-opacity",
              "aria-label": social.platform,
              children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, SocialIcon, { platform: social.platform })
            },
            index
          )) })
        ] }),
        columns.map((column, colIndex) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "font-semibold mb-4", children: column.title }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { className: "space-y-3", children: column.links.map((link, linkIndex) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "li", { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            _link2.default,
            {
              href: link.href,
              target: link.openInNewTab ? "_blank" : void 0,
              rel: link.openInNewTab ? "noopener noreferrer" : void 0,
              className: "text-sm opacity-70 hover:opacity-100 transition-opacity",
              children: link.label
            }
          ) }, linkIndex)) })
        ] }, colIndex)),
        newsletter.enabled && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "font-semibold mb-4", children: newsletter.title || "Newsletter" }),
          newsletter.description && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm opacity-70 mb-4", children: newsletter.description }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "form", { onSubmit: handleNewsletterSubmit, className: "space-y-3", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              "input",
              {
                type: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: newsletter.placeholder || "Enter your email",
                className: "w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 text-sm",
                required: true
              }
            ),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              "button",
              {
                type: "submit",
                className: "w-full px-4 py-2 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors",
                children: newsletter.buttonLabel || "Subscribe"
              }
            )
          ] })
        ] })
      ] })
    ),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "mt-12 pt-8 border-t border-white/10", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col sm:flex-row justify-between items-center gap-4", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm opacity-70", children: copyrightText || `\xA9 ${currentYear} ${logo.text || "Your Brand"}. All rights reserved.` }),
      bottomLinks.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex flex-wrap justify-center gap-6", children: bottomLinks.map((link, index) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        _link2.default,
        {
          href: link.href,
          target: link.openInNewTab ? "_blank" : void 0,
          rel: link.openInNewTab ? "noopener noreferrer" : void 0,
          className: "text-sm opacity-70 hover:opacity-100 transition-opacity",
          children: link.label
        },
        index
      )) })
    ] }) })
  ] }) });
}
function AnnouncementBar({
  message,
  link,
  dismissible = true,
  backgroundColor = "#2563eb",
  textColor = "#ffffff"
}) {
  const [dismissed, setDismissed] = _react2.default.useState(false);
  if (dismissed) return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "hidden" });
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "div",
    {
      className: "relative py-2 px-4 text-center text-sm",
      style: { backgroundColor, color: textColor },
      children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: message }),
        link && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _link2.default,
          {
            href: link.href,
            className: "ml-2 underline hover:no-underline font-medium",
            children: link.label
          }
        ),
        dismissible && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "button",
          {
            onClick: () => setDismissed(true),
            className: "absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100",
            "aria-label": "Dismiss",
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M6 18L18 6M6 6l12 12"
              }
            ) })
          }
        )
      ]
    }
  );
}

// src/puck/layout/config.tsx
var headerConfig = {
  label: "Header",
  render: Header,
  defaultProps: {
    logo: {
      type: "text",
      text: "Your Brand"
    },
    navLinks: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" }
    ],
    showSearch: true,
    showCart: true,
    showAccount: false,
    sticky: true,
    transparent: false,
    backgroundColor: "#ffffff",
    textColor: "#18181b",
    maxWidth: "xl"
  },
  fields: {
    logo: {
      type: "object",
      objectFields: {
        type: {
          type: "radio",
          label: "Logo Type",
          options: [
            { label: "Text", value: "text" },
            { label: "Image", value: "image" }
          ]
        },
        text: {
          type: "text",
          label: "Logo Text"
        },
        imageUrl: {
          type: "text",
          label: "Logo Image URL"
        },
        imageAlt: {
          type: "text",
          label: "Logo Alt Text"
        },
        width: {
          type: "number",
          label: "Logo Width (px)"
        },
        height: {
          type: "number",
          label: "Logo Height (px)"
        }
      }
    },
    navLinks: {
      type: "array",
      label: "Navigation Links",
      arrayFields: {
        label: {
          type: "text",
          label: "Label"
        },
        href: {
          type: "text",
          label: "URL"
        },
        openInNewTab: {
          type: "radio",
          label: "Open in New Tab",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true }
          ]
        }
      },
      defaultItemProps: {
        label: "New Link",
        href: "/",
        openInNewTab: false
      }
    },
    showSearch: {
      type: "radio",
      label: "Show Search",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false }
      ]
    },
    showCart: {
      type: "radio",
      label: "Show Cart",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false }
      ]
    },
    showAccount: {
      type: "radio",
      label: "Show Account",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false }
      ]
    },
    ctaButton: {
      type: "object",
      label: "CTA Button (Optional)",
      objectFields: {
        label: {
          type: "text",
          label: "Button Label"
        },
        href: {
          type: "text",
          label: "Button URL"
        },
        variant: {
          type: "select",
          label: "Button Style",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
            { label: "Outline", value: "outline" }
          ]
        }
      }
    },
    sticky: {
      type: "radio",
      label: "Sticky Header",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false }
      ]
    },
    transparent: {
      type: "radio",
      label: "Transparent Background",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false }
      ]
    },
    backgroundColor: {
      type: "text",
      label: "Background Color"
    },
    textColor: {
      type: "text",
      label: "Text Color"
    },
    maxWidth: {
      type: "select",
      label: "Max Width",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
        { label: "Full Width", value: "full" }
      ]
    }
  }
};
var footerConfig = {
  label: "Footer",
  render: Footer,
  defaultProps: {
    logo: {
      type: "text",
      text: "Your Brand"
    },
    tagline: "Building amazing products for our customers.",
    columns: [
      {
        title: "Products",
        links: [
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Integrations", href: "/integrations" }
        ]
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Careers", href: "/careers" },
          { label: "Contact", href: "/contact" }
        ]
      }
    ],
    socialLinks: [
      { platform: "twitter", url: "https://twitter.com" },
      { platform: "instagram", url: "https://instagram.com" },
      { platform: "linkedin", url: "https://linkedin.com" }
    ],
    newsletter: {
      enabled: true,
      title: "Stay Updated",
      description: "Subscribe to our newsletter for the latest updates.",
      placeholder: "Enter your email",
      buttonLabel: "Subscribe"
    },
    bottomLinks: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" }
    ],
    backgroundColor: "#18181b",
    textColor: "#ffffff",
    maxWidth: "xl",
    layout: "columns"
  },
  fields: {
    logo: {
      type: "object",
      label: "Logo",
      objectFields: {
        type: {
          type: "radio",
          label: "Logo Type",
          options: [
            { label: "Text", value: "text" },
            { label: "Image", value: "image" }
          ]
        },
        text: {
          type: "text",
          label: "Logo Text"
        },
        imageUrl: {
          type: "text",
          label: "Logo Image URL"
        },
        imageAlt: {
          type: "text",
          label: "Logo Alt Text"
        },
        width: {
          type: "number",
          label: "Logo Width (px)"
        },
        height: {
          type: "number",
          label: "Logo Height (px)"
        }
      }
    },
    tagline: {
      type: "textarea",
      label: "Tagline"
    },
    layout: {
      type: "select",
      label: "Layout Style",
      options: [
        { label: "Columns", value: "columns" },
        { label: "Centered", value: "centered" },
        { label: "Simple", value: "simple" }
      ]
    },
    columns: {
      type: "array",
      label: "Link Columns",
      arrayFields: {
        title: {
          type: "text",
          label: "Column Title"
        },
        links: {
          type: "array",
          label: "Links",
          arrayFields: {
            label: {
              type: "text",
              label: "Label"
            },
            href: {
              type: "text",
              label: "URL"
            },
            openInNewTab: {
              type: "radio",
              label: "Open in New Tab",
              options: [
                { label: "No", value: false },
                { label: "Yes", value: true }
              ]
            }
          },
          defaultItemProps: {
            label: "New Link",
            href: "/",
            openInNewTab: false
          }
        }
      },
      defaultItemProps: {
        title: "New Column",
        links: []
      }
    },
    socialLinks: {
      type: "array",
      label: "Social Links",
      arrayFields: {
        platform: {
          type: "select",
          label: "Platform",
          options: [
            { label: "Facebook", value: "facebook" },
            { label: "Twitter/X", value: "twitter" },
            { label: "Instagram", value: "instagram" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "YouTube", value: "youtube" },
            { label: "TikTok", value: "tiktok" },
            { label: "GitHub", value: "github" }
          ]
        },
        url: {
          type: "text",
          label: "URL"
        }
      },
      defaultItemProps: {
        platform: "twitter",
        url: ""
      }
    },
    newsletter: {
      type: "object",
      label: "Newsletter",
      objectFields: {
        enabled: {
          type: "radio",
          label: "Enable Newsletter",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        title: {
          type: "text",
          label: "Title"
        },
        description: {
          type: "textarea",
          label: "Description"
        },
        placeholder: {
          type: "text",
          label: "Input Placeholder"
        },
        buttonLabel: {
          type: "text",
          label: "Button Label"
        }
      }
    },
    bottomLinks: {
      type: "array",
      label: "Bottom Links",
      arrayFields: {
        label: {
          type: "text",
          label: "Label"
        },
        href: {
          type: "text",
          label: "URL"
        },
        openInNewTab: {
          type: "radio",
          label: "Open in New Tab",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true }
          ]
        }
      },
      defaultItemProps: {
        label: "New Link",
        href: "/",
        openInNewTab: false
      }
    },
    copyrightText: {
      type: "text",
      label: "Copyright Text (Optional)"
    },
    backgroundColor: {
      type: "text",
      label: "Background Color"
    },
    textColor: {
      type: "text",
      label: "Text Color"
    },
    maxWidth: {
      type: "select",
      label: "Max Width",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
        { label: "Full Width", value: "full" }
      ]
    }
  }
};
var announcementBarConfig = {
  label: "Announcement Bar",
  render: AnnouncementBar,
  defaultProps: {
    message: "Free shipping on orders over $50!",
    link: {
      label: "Shop Now",
      href: "/products"
    },
    dismissible: true,
    backgroundColor: "#2563eb",
    textColor: "#ffffff"
  },
  fields: {
    message: {
      type: "text",
      label: "Message"
    },
    link: {
      type: "object",
      label: "Link (Optional)",
      objectFields: {
        label: {
          type: "text",
          label: "Link Text"
        },
        href: {
          type: "text",
          label: "Link URL"
        }
      }
    },
    dismissible: {
      type: "radio",
      label: "Dismissible",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false }
      ]
    },
    backgroundColor: {
      type: "text",
      label: "Background Color"
    },
    textColor: {
      type: "text",
      label: "Text Color"
    }
  }
};
var layoutPuckConfig = {
  categories: {
    layout: {
      title: "Site Layout",
      components: ["Header", "Footer", "AnnouncementBar"]
    }
  },
  components: {
    Header: headerConfig,
    Footer: footerConfig,
    AnnouncementBar: announcementBarConfig
  }
};
var config_default = layoutPuckConfig;

// src/puck/plugin/components/index.tsx



function StatWidget({
  title,
  value,
  change,
  changeType = "neutral",
  icon = "BarChart",
  backgroundColor = "#ffffff"
}) {
  const Icon = LucideIcons[icon] || LucideIcons.BarChart;
  const changeColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600"
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "div",
    {
      className: "rounded-lg border border-gray-200 p-4 shadow-sm",
      style: { backgroundColor },
      children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium text-gray-600", children: title }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon, { className: "h-5 w-5 text-gray-400" })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "mt-2 text-2xl font-bold text-gray-900", children: value }),
        change && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: `mt-1 text-sm ${changeColors[changeType]}`, children: change })
      ]
    }
  );
}
function ChartWidget({
  title,
  chartType = "bar",
  height = 200,
  backgroundColor = "#ffffff"
}) {
  const chartIcons = {
    bar: LucideIcons.BarChart3,
    line: LucideIcons.LineChart,
    pie: LucideIcons.PieChart
  };
  const Icon = chartIcons[chartType];
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "div",
    {
      className: "rounded-lg border border-gray-200 p-4 shadow-sm",
      style: { backgroundColor },
      children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium text-gray-600 mb-4", children: title }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "div",
          {
            className: "flex items-center justify-center bg-gray-50 rounded-md border border-dashed border-gray-300",
            style: { height },
            children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-center", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon, { className: "h-12 w-12 text-gray-300 mx-auto" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "mt-2 text-sm text-gray-400", children: "Chart Placeholder" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-gray-400", children: "Connect to data source" })
            ] })
          }
        )
      ]
    }
  );
}
function TableWidget({
  title,
  columns = "Name,Value,Status",
  maxRows = 5,
  backgroundColor = "#ffffff"
}) {
  const cols = columns.split(",").map((c) => c.trim());
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "div",
    {
      className: "rounded-lg border border-gray-200 p-4 shadow-sm",
      style: { backgroundColor },
      children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium text-gray-600 mb-4", children: title }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "overflow-x-auto", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "table", { className: "min-w-full divide-y divide-gray-200", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "thead", { className: "bg-gray-50", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "tr", { children: cols.map((col, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "th",
            {
              className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase",
              children: col
            },
            i
          )) }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "tbody", { className: "divide-y divide-gray-200", children: Array.from({ length: maxRows }).map((_, rowIndex) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "tr", { className: "hover:bg-gray-50", children: cols.map((_2, colIndex) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "td", { className: "px-4 py-2 text-sm text-gray-400", children: "\u2014" }, colIndex)) }, rowIndex)) })
        ] }) })
      ]
    }
  );
}
function ActivityWidget({
  title = "Recent Activity",
  maxItems = 5,
  backgroundColor = "#ffffff"
}) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "div",
    {
      className: "rounded-lg border border-gray-200 p-4 shadow-sm",
      style: { backgroundColor },
      children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm font-medium text-gray-600 mb-4", children: title }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-3", children: Array.from({ length: maxItems }).map((_, i) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "w-2 h-2 mt-2 rounded-full bg-gray-300" }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex-1", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-4 bg-gray-100 rounded w-3/4" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "h-3 bg-gray-50 rounded w-1/2 mt-1" })
          ] })
        ] }, i)) })
      ]
    }
  );
}
function FormSection({
  title,
  description,
  children
}) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "border-b border-gray-200 pb-6 mb-6", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "text-lg font-medium text-gray-900", children: title }),
    description && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "mt-1 text-sm text-gray-500", children: description }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "mt-4 space-y-4", children })
  ] });
}
function TextInputField({
  label,
  name,
  placeholder = "",
  helpText,
  required = false,
  type = "text"
}) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "label", { htmlFor: name, className: "block text-sm font-medium text-gray-700", children: [
      label,
      required && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-red-500 ml-1", children: "*" })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      "input",
      {
        type,
        id: name,
        name,
        placeholder,
        className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      }
    ),
    helpText && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "mt-1 text-xs text-gray-500", children: helpText })
  ] });
}
function SelectField({
  label,
  name,
  options = "Option 1,Option 2,Option 3",
  helpText,
  required = false
}) {
  const opts = options.split(",").map((o) => o.trim());
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "label", { htmlFor: name, className: "block text-sm font-medium text-gray-700", children: [
      label,
      required && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-red-500 ml-1", children: "*" })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      "select",
      {
        id: name,
        name,
        className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
        children: opts.map((opt, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "option", { value: opt, children: opt }, i))
      }
    ),
    helpText && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "mt-1 text-xs text-gray-500", children: helpText })
  ] });
}
function ToggleField({
  label,
  name,
  description,
  defaultEnabled = false,
  onChange
}) {
  const [enabled, setEnabled] = _react2.default.useState(defaultEnabled);
  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "label", { htmlFor: name, className: "text-sm font-medium text-gray-700", children: label }),
      description && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-gray-500", children: description })
    ] }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      "button",
      {
        type: "button",
        id: name,
        role: "switch",
        "aria-checked": enabled,
        onClick: handleToggle,
        className: `relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${enabled ? "bg-blue-600" : "bg-gray-200"}`,
        children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "span",
          {
            className: `pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"}`
          }
        )
      }
    )
  ] });
}
function PageHeader({
  title,
  description,
  showBackButton = false,
  onBack
}) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "border-b border-gray-200 pb-4 mb-6", children: [
    showBackButton && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "button",
      {
        onClick: handleBack,
        className: "flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2",
        "aria-label": "Go back",
        children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, LucideIcons.ArrowLeft, { className: "h-4 w-4" }),
          "Back"
        ]
      }
    ),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h1", { className: "text-2xl font-bold text-gray-900", children: title }),
    description && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "mt-1 text-sm text-gray-500", children: description })
  ] });
}
function CardContainer({
  title,
  padding = 16,
  backgroundColor = "#ffffff",
  children
}) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "div",
    {
      className: "rounded-lg border border-gray-200 shadow-sm",
      style: { backgroundColor, padding },
      children: [
        title && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: "text-lg font-medium text-gray-900 mb-4", children: title }),
        children
      ]
    }
  );
}
function GridLayout({
  columns = 2,
  gap = 16,
  children
}) {
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    {
      className: "grid",
      style: {
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap
      },
      children
    }
  );
}
function TabsContainer({
  tabs = "General,Advanced,API",
  defaultTab,
  onTabChange
}) {
  const tabList = tabs.split(",").map((t) => t.trim());
  const [activeTab, setActiveTab] = _react2.default.useState(defaultTab || tabList[0]);
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "border-b border-gray-200", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "nav", { className: "-mb-px flex space-x-8", role: "tablist", children: tabList.map((tab) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      "button",
      {
        onClick: () => handleTabClick(tab),
        role: "tab",
        "aria-selected": tab === activeTab,
        className: `whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium ${tab === activeTab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,
        children: tab
      },
      tab
    )) }) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "py-4", role: "tabpanel", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-gray-50 rounded-lg p-8 border border-dashed border-gray-300 text-center text-gray-400", children: [
      'Tab content for "',
      activeTab,
      '"'
    ] }) })
  ] });
}
function ActionButton({
  label,
  variant = "primary",
  icon,
  fullWidth = false,
  onClick,
  disabled = false,
  type = "button"
}) {
  const Icon = icon ? LucideIcons[icon] : null;
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "button",
    {
      type,
      onClick,
      disabled,
      className: `inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${variants[variant]} ${fullWidth ? "w-full" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`,
      children: [
        Icon && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon, { className: "h-4 w-4" }),
        label
      ]
    }
  );
}
function AlertBox({
  type = "info",
  title,
  message,
  dismissible = false,
  onDismiss
}) {
  const [visible, setVisible] = _react2.default.useState(true);
  const styles = {
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: LucideIcons.Info },
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: LucideIcons.CheckCircle },
    warning: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", icon: LucideIcons.AlertTriangle },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: LucideIcons.XCircle }
  };
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  const { bg, border, text, icon: Icon } = styles[type];
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    {
      className: `${bg} ${border} border rounded-lg p-4 ${!visible ? "hidden" : ""}`,
      role: "alert",
      "aria-hidden": !visible,
      children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex", children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Icon, { className: `h-5 w-5 ${text} flex-shrink-0` }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "ml-3 flex-1", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { className: `text-sm font-medium ${text}`, children: title }),
          message && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: `mt-1 text-sm ${text} opacity-80`, children: message })
        ] }),
        dismissible && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "button",
          {
            onClick: handleDismiss,
            "aria-label": "Dismiss alert",
            className: `${text} hover:opacity-70`,
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, LucideIcons.X, { className: "h-4 w-4" })
          }
        )
      ] })
    }
  );
}

// src/puck/plugin/config.tsx
var pluginUIPuckConfig = {
  categories: {
    layout: {
      title: "Layout",
      components: ["PageHeader", "CardContainer", "GridLayout", "TabsContainer"]
    },
    widgets: {
      title: "Dashboard Widgets",
      components: ["StatWidget", "ChartWidget", "TableWidget", "ActivityWidget"]
    },
    forms: {
      title: "Form Elements",
      components: ["FormSection", "TextInputField", "SelectField", "ToggleField"]
    },
    actions: {
      title: "Actions & Feedback",
      components: ["ActionButton", "AlertBox"]
    }
  },
  components: {
    // ========== WIDGETS ==========
    StatWidget: {
      label: "Stat Widget",
      fields: {
        title: { type: "text", label: "Title" },
        value: { type: "text", label: "Value" },
        change: { type: "text", label: "Change Text" },
        changeType: {
          type: "select",
          label: "Change Type",
          options: [
            { label: "Positive", value: "positive" },
            { label: "Negative", value: "negative" },
            { label: "Neutral", value: "neutral" }
          ]
        },
        icon: { type: "text", label: "Icon Name (Lucide)" },
        backgroundColor: { type: "text", label: "Background Color" }
      },
      defaultProps: {
        title: "Total Users",
        value: "1,234",
        change: "+12% from last month",
        changeType: "positive",
        icon: "Users",
        backgroundColor: "#ffffff"
      },
      render: StatWidget
    },
    ChartWidget: {
      label: "Chart Widget",
      fields: {
        title: { type: "text", label: "Title" },
        chartType: {
          type: "select",
          label: "Chart Type",
          options: [
            { label: "Bar Chart", value: "bar" },
            { label: "Line Chart", value: "line" },
            { label: "Pie Chart", value: "pie" }
          ]
        },
        dataSource: { type: "text", label: "Data Source (API endpoint)" },
        height: { type: "number", label: "Height (px)" },
        backgroundColor: { type: "text", label: "Background Color" }
      },
      defaultProps: {
        title: "Revenue Over Time",
        chartType: "line",
        dataSource: "",
        height: 200,
        backgroundColor: "#ffffff"
      },
      render: ChartWidget
    },
    TableWidget: {
      label: "Table Widget",
      fields: {
        title: { type: "text", label: "Title" },
        columns: { type: "text", label: "Columns (comma-separated)" },
        dataSource: { type: "text", label: "Data Source (API endpoint)" },
        maxRows: { type: "number", label: "Max Rows" },
        backgroundColor: { type: "text", label: "Background Color" }
      },
      defaultProps: {
        title: "Recent Orders",
        columns: "Order ID,Customer,Amount,Status",
        dataSource: "",
        maxRows: 5,
        backgroundColor: "#ffffff"
      },
      render: TableWidget
    },
    ActivityWidget: {
      label: "Activity Feed",
      fields: {
        title: { type: "text", label: "Title" },
        maxItems: { type: "number", label: "Max Items" },
        backgroundColor: { type: "text", label: "Background Color" }
      },
      defaultProps: {
        title: "Recent Activity",
        maxItems: 5,
        backgroundColor: "#ffffff"
      },
      render: ActivityWidget
    },
    // ========== FORMS ==========
    FormSection: {
      label: "Form Section",
      fields: {
        title: { type: "text", label: "Section Title" },
        description: { type: "textarea", label: "Description" }
      },
      defaultProps: {
        title: "General Settings",
        description: "Configure the basic settings for this plugin."
      },
      render: FormSection
    },
    TextInputField: {
      label: "Text Input",
      fields: {
        label: { type: "text", label: "Label" },
        name: { type: "text", label: "Field Name" },
        placeholder: { type: "text", label: "Placeholder" },
        helpText: { type: "text", label: "Help Text" },
        required: {
          type: "radio",
          label: "Required",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        },
        type: {
          type: "select",
          label: "Input Type",
          options: [
            { label: "Text", value: "text" },
            { label: "Email", value: "email" },
            { label: "URL", value: "url" },
            { label: "Password", value: "password" }
          ]
        }
      },
      defaultProps: {
        label: "API Key",
        name: "apiKey",
        placeholder: "Enter your API key",
        helpText: "You can find this in your dashboard settings.",
        required: true,
        type: "text"
      },
      render: TextInputField
    },
    SelectField: {
      label: "Select Dropdown",
      fields: {
        label: { type: "text", label: "Label" },
        name: { type: "text", label: "Field Name" },
        options: { type: "text", label: "Options (comma-separated)" },
        helpText: { type: "text", label: "Help Text" },
        required: {
          type: "radio",
          label: "Required",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        }
      },
      defaultProps: {
        label: "Environment",
        name: "environment",
        options: "Development,Staging,Production",
        helpText: "",
        required: false
      },
      render: SelectField
    },
    ToggleField: {
      label: "Toggle Switch",
      fields: {
        label: { type: "text", label: "Label" },
        name: { type: "text", label: "Field Name" },
        description: { type: "text", label: "Description" },
        defaultEnabled: {
          type: "radio",
          label: "Default State",
          options: [
            { label: "Enabled", value: true },
            { label: "Disabled", value: false }
          ]
        }
      },
      defaultProps: {
        label: "Enable Notifications",
        name: "enableNotifications",
        description: "Receive email notifications when events occur.",
        defaultEnabled: false
      },
      render: ToggleField
    },
    // ========== LAYOUT ==========
    PageHeader: {
      label: "Page Header",
      fields: {
        title: { type: "text", label: "Title" },
        description: { type: "textarea", label: "Description" },
        showBackButton: {
          type: "radio",
          label: "Show Back Button",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        }
      },
      defaultProps: {
        title: "Plugin Settings",
        description: "Configure your plugin options below.",
        showBackButton: false
      },
      render: PageHeader
    },
    CardContainer: {
      label: "Card Container",
      fields: {
        title: { type: "text", label: "Title" },
        padding: { type: "number", label: "Padding (px)" },
        backgroundColor: { type: "text", label: "Background Color" }
      },
      defaultProps: {
        title: "",
        padding: 16,
        backgroundColor: "#ffffff"
      },
      render: CardContainer
    },
    GridLayout: {
      label: "Grid Layout",
      fields: {
        columns: {
          type: "number",
          label: "Columns",
          min: 1,
          max: 4
        },
        gap: { type: "number", label: "Gap (px)" }
      },
      defaultProps: {
        columns: 2,
        gap: 16
      },
      render: GridLayout
    },
    TabsContainer: {
      label: "Tabs",
      fields: {
        tabs: { type: "text", label: "Tab Names (comma-separated)" },
        defaultTab: { type: "text", label: "Default Tab" }
      },
      defaultProps: {
        tabs: "General,Advanced,API",
        defaultTab: "General"
      },
      render: TabsContainer
    },
    // ========== ACTIONS ==========
    ActionButton: {
      label: "Button",
      fields: {
        label: { type: "text", label: "Button Text" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
            { label: "Danger", value: "danger" }
          ]
        },
        icon: { type: "text", label: "Icon Name (Lucide)" },
        fullWidth: {
          type: "radio",
          label: "Full Width",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        }
      },
      defaultProps: {
        label: "Save Changes",
        variant: "primary",
        icon: "Save",
        fullWidth: false
      },
      render: ActionButton
    },
    AlertBox: {
      label: "Alert Box",
      fields: {
        type: {
          type: "select",
          label: "Type",
          options: [
            { label: "Info", value: "info" },
            { label: "Success", value: "success" },
            { label: "Warning", value: "warning" },
            { label: "Error", value: "error" }
          ]
        },
        title: { type: "text", label: "Title" },
        message: { type: "textarea", label: "Message" },
        dismissible: {
          type: "radio",
          label: "Dismissible",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ]
        }
      },
      defaultProps: {
        type: "info",
        title: "Information",
        message: "This is an informational message.",
        dismissible: false
      },
      render: AlertBox
    }
  }
};





































































exports.OrderSummaryCard = OrderSummaryCard; exports.OrderHistoryList = OrderHistoryList; exports.ShippingTracker = ShippingTracker; exports.AccountOverview = AccountOverview; exports.AddressCard = AddressCard; exports.WishlistItem = WishlistItem; exports.LoyaltyPointsWidget = LoyaltyPointsWidget; exports.SupportWidget = SupportWidget; exports.QuickActionsGrid = QuickActionsGrid; exports.PaymentMethodsList = PaymentMethodsList; exports.dashboardPuckConfig = dashboardPuckConfig; exports.PricingTable = PricingTable; exports.ProductCard = ProductCard; exports.ProductGrid = ProductGrid; exports.OrderSummary = OrderSummary; exports.CheckoutSection = CheckoutSection; exports.FeatureList = FeatureList; exports.Testimonial = Testimonial; exports.ecommercePuckConfig = ecommercePuckConfig; exports.Body = _components.Body; exports.Button = _components.Button; exports.Column = _components.Column; exports.Container = _components.Container; exports.Head = _components.Head; exports.Heading = _components.Heading; exports.Hr = _components.Hr; exports.Html = _components.Html; exports.Img = _components.Img; exports.Link = _components.Link; exports.Preview = _components.Preview; exports.Row = _components.Row; exports.Section = _components.Section; exports.Text = _components.Text; exports.EmailContainer = EmailContainer; exports.EmailHeader = EmailHeader; exports.EmailText = EmailText; exports.EmailButton = EmailButton; exports.EmailImage = EmailImage; exports.EmailDivider = EmailDivider; exports.EmailColumns = EmailColumns; exports.EmailFooter = EmailFooter; exports.EmailHero = EmailHero; exports.EmailCard = EmailCard; exports.EmailList = EmailList; exports.EmailSpacer = EmailSpacer; exports.EmailProduct = EmailProduct; exports.EmailCoupon = EmailCoupon; exports.emailPuckConfig = emailPuckConfig; exports.Header = Header; exports.Footer = Footer; exports.AnnouncementBar = AnnouncementBar; exports.config_default = config_default; exports.StatWidget = StatWidget; exports.ChartWidget = ChartWidget; exports.TableWidget = TableWidget; exports.ActivityWidget = ActivityWidget; exports.FormSection = FormSection; exports.TextInputField = TextInputField; exports.SelectField = SelectField; exports.ToggleField = ToggleField; exports.PageHeader = PageHeader; exports.CardContainer = CardContainer; exports.GridLayout = GridLayout; exports.TabsContainer = TabsContainer; exports.ActionButton = ActionButton; exports.AlertBox = AlertBox; exports.pluginUIPuckConfig = pluginUIPuckConfig;
//# sourceMappingURL=chunk-LR2NQKSX.js.map