/**
 * Default Help Content
 *
 * Code-based fallback content for help mode.
 * This provides baseline documentation that can be overridden
 * by database content or AI-generated content.
 */

import type { DefaultContentRegistry } from './types'

export const defaultHelpContent: DefaultContentRegistry = {
  // Admin Header
  'admin.header.search': {
    title: 'Global Search',
    summary: 'Search products, orders, and customers across your store.',
    details: `Quickly find anything in your admin:

- **Products:** Search by name, SKU, or description
- **Orders:** Search by order number or customer email
- **Customers:** Search by name or email

Start typing and results will appear. Press Enter to search or use keyboard navigation to select.`,
  },

  'admin.header.notifications': {
    title: 'Notifications',
    summary: 'View important alerts and updates about your store.',
    details: `Stay informed about your store activity:

- **New Orders:** Get notified when orders come in
- **Low Stock:** Alerts when inventory is running low
- **System Updates:** Important platform announcements
- **Customer Activity:** Reviews and feedback

Click the bell icon to see recent notifications.`,
  },

  'admin.header.help': {
    title: 'Help Mode',
    summary: 'Get contextual help for any element on the page.',
    details: `Enter help mode to learn about any feature:

1. **Click** this button or press **Ctrl+Q**
2. **Orange outlines** appear on interactive elements
3. **Hover** to highlight, **click** to see detailed help
4. Press **Escape** or click the button again to exit

Perfect for learning new features or getting quick reminders!`,
  },

  // Admin Sidebar
  'admin.sidebar.user-info': {
    title: 'Your Account',
    summary: 'View your current logged-in account information.',
    details: `This shows who you're logged in as:

- **Display Name:** Your name in the system
- **Email:** Your login email address
- **Role Badge:** Your permission level (Super Admin, Editor, etc.)

Your role determines what you can access and modify in the admin panel.`,
  },

  'admin.sidebar.view-site': {
    title: 'View Site',
    summary: 'Open your live website in a new context.',
    details: `Switch from admin to the customer-facing site:

- Opens your storefront as visitors see it
- Useful for checking how changes look to customers
- Admin tools are hidden when viewing the site

**Tip:** Open in a new tab to keep the admin panel available.`,
  },

  'admin.sidebar.sign-out': {
    title: 'Sign Out',
    summary: 'Log out of the admin panel.',
    details: `End your current admin session:

- Closes your authenticated session
- Returns you to the login page
- Protects your account on shared computers

**Security Tip:** Always sign out when using shared or public computers.`,
  },

  'admin.sidebar.collapse': {
    title: 'Collapse Sidebar',
    summary: 'Toggle sidebar between expanded and collapsed views.',
    details: `Customize your workspace:

- **Collapsed:** Shows only icons for more screen space
- **Expanded:** Shows full navigation labels
- Hover over icons in collapsed mode for tooltips
- Your preference is saved automatically

Great for maximizing content area on smaller screens.`,
  },

  // Admin Sidebar Navigation
  'admin.sidebar.dashboard': {
    title: 'Dashboard',
    summary: 'View your store overview and key metrics at a glance.',
    details: `The dashboard provides a quick snapshot of your store's performance including:

- Recent orders and revenue
- Inventory alerts
- Customer activity
- Quick actions for common tasks

Use this as your starting point each time you log in to see what needs attention.`,
  },

  'admin.sidebar.products': {
    title: 'Products',
    summary: 'Manage your product catalog, variants, and inventory.',
    details: `The products section allows you to:

- Add new products with images, descriptions, and pricing
- Create product variants (size, color, etc.)
- Manage inventory levels
- Set up product categories and tags
- Configure shipping weights and dimensions

**Tip:** Use the bulk editor to update multiple products at once.`,
  },

  'admin.sidebar.orders': {
    title: 'Orders',
    summary: 'View and manage customer orders and fulfillment.',
    details: `Process orders from placement to delivery:

- View order details and customer information
- Update order status through your workflow
- Create shipping labels
- Process refunds and returns
- Track shipment status

Orders are organized by status so you can focus on what needs action.`,
  },

  'admin.sidebar.customers': {
    title: 'Customers',
    summary: 'View customer profiles and order history.',
    details: `The customers section shows everyone who has placed an order:

- View customer contact information
- See order history and lifetime value
- Add notes to customer profiles
- Manage customer tags for segmentation

Use this to provide personalized service and understand your audience.`,
  },

  'admin.sidebar.pages': {
    title: 'Pages',
    summary: 'Create and edit website pages using the visual editor.',
    details: `Build custom pages for your website:

- Use the drag-and-drop Puck editor
- Choose from pre-built components
- Preview on different device sizes
- Publish or schedule pages

Great for landing pages, about pages, and custom content.`,
  },

  'admin.sidebar.blog': {
    title: 'Blog',
    summary: 'Write and publish blog posts to engage your audience.',
    details: `Create content to drive traffic and engagement:

- Write posts with the rich text editor
- Add featured images and media
- Organize with categories and tags
- Schedule posts for future publication
- Enable or disable comments

Regular blog content helps with SEO and customer engagement.`,
  },

  'admin.sidebar.media': {
    title: 'Media Library',
    summary: 'Upload and manage images, videos, and files.',
    details: `Centralized storage for all your media:

- Drag and drop to upload files
- Organize with folders
- Search by filename
- View usage across your site

Supported formats include images, videos, PDFs, and more.`,
  },

  'admin.sidebar.settings': {
    title: 'Settings',
    summary: 'Configure your store, payments, shipping, and more.',
    details: `Customize how your store operates:

- **General:** Store name, address, contact info
- **Payments:** Stripe integration
- **Shipping:** Carriers and rates
- **Email:** Notification templates
- **AI:** Chat assistant configuration

Take time to configure these properly when setting up.`,
  },

  // Common Actions
  'action.save': {
    title: 'Save',
    summary: 'Save your current changes.',
    details: 'Saves all modifications you have made. Changes are not visible until saved.',
  },

  'action.publish': {
    title: 'Publish',
    summary: 'Make this content live and visible to visitors.',
    details: `Publishing will:

- Make the content visible on your website
- Update any existing published version
- Trigger any configured notifications

If you want to preview first, use the Preview button instead.`,
  },

  'action.delete': {
    title: 'Delete',
    summary: 'Permanently remove this item.',
    details: `**Warning:** This action cannot be undone.

Deleting will permanently remove this item and any associated data. Make sure you want to proceed before confirming.`,
  },

  // Puck Editor
  'puck.editor': {
    title: 'Visual Editor',
    summary: 'Drag and drop components to build your page.',
    details: `The Puck editor provides a visual way to build pages:

- **Left Panel:** Component library
- **Center:** Page preview and editing
- **Right Panel:** Component settings

Drag components from the left panel onto your page. Click any component to edit its content and styling.`,
  },

  'puck.components': {
    title: 'Component Library',
    summary: 'Available building blocks for your page.',
    details: `Browse and add components to your page:

- **Layout:** Containers, columns, spacers
- **Content:** Text, images, videos
- **Actions:** Buttons, forms, CTAs
- **Commerce:** Product grids, carts

Drag any component onto the canvas or click to add at the end.`,
  },

  // Forms
  'form.required': {
    title: 'Required Field',
    summary: 'This field must be filled out.',
    details: 'Fields marked with an asterisk (*) are required. The form cannot be submitted until all required fields have valid values.',
  },

  // Product Management
  'admin.products.list': {
    title: 'Product List',
    summary: 'All products in your catalog.',
    details: `This table shows all your products with key information:

- **Title:** Product name shown to customers
- **SKU:** Internal stock keeping unit
- **Price:** Base price before variants
- **Status:** Active, Draft, or Archived
- **Inventory:** Total stock across all variants

Use the search and filters to find specific products. Click any row to edit.`,
  },

  'admin.products.create': {
    title: 'Add Product',
    summary: 'Create a new product in your catalog.',
    details: `Start by entering the essential information:

1. **Title:** Clear, descriptive product name
2. **Description:** Benefits and features
3. **Price:** Base price in your currency
4. **Images:** High-quality product photos

You can add variants (sizes, colors) after creating the base product.`,
  },

  'admin.products.variants': {
    title: 'Product Variants',
    summary: 'Different versions of this product (size, color, etc.).',
    details: `Variants let you sell one product in multiple configurations:

- Each variant has its own SKU, price, and inventory
- Customers select options when adding to cart
- Track inventory separately per variant

**Tip:** Common variant types are Size, Color, and Material.`,
  },

  'admin.products.inventory': {
    title: 'Inventory',
    summary: 'Track stock levels and get low-stock alerts.',
    details: `Inventory management ensures you don't oversell:

- **Quantity:** Current stock count
- **Low Stock Alert:** Get notified when stock is low
- **Track Inventory:** Enable/disable tracking

When inventory reaches zero with tracking enabled, customers can't purchase.`,
  },

  'admin.products.pricing': {
    title: 'Pricing',
    summary: 'Set prices, compare-at prices, and cost.',
    details: `Configure how products are priced:

- **Price:** What customers pay
- **Compare at Price:** Shows as crossed out (sale effect)
- **Cost:** Your cost for profit reporting

**Tip:** Set a compare-at price to show savings to customers.`,
  },

  // Order Management
  'admin.orders.list': {
    title: 'Order List',
    summary: 'View and manage all customer orders.',
    details: `Orders are organized by status for easy processing:

- **Pending:** Awaiting payment or processing
- **Processing:** Being prepared for shipment
- **Shipped:** On the way to customer
- **Delivered:** Successfully completed
- **Cancelled:** Order was cancelled

Click any order to view full details and take actions.`,
  },

  'admin.orders.details': {
    title: 'Order Details',
    summary: 'Full information about this order.',
    details: `Everything you need to fulfill this order:

- **Customer Info:** Contact and shipping address
- **Items:** What was ordered with quantities
- **Payment:** Status and method
- **Shipping:** Carrier and tracking info
- **Timeline:** Order history and notes

Use the actions menu to update status, create shipping labels, or process refunds.`,
  },

  'admin.orders.status': {
    title: 'Order Status',
    summary: 'Current stage in the fulfillment workflow.',
    details: `Status progression:

1. **Pending** → Order received, awaiting action
2. **Processing** → Picking and packing
3. **Shipped** → Handed off to carrier
4. **Delivered** → Customer received
5. **Cancelled/Refunded** → Order didn't complete

Status changes trigger email notifications to customers.`,
  },

  'admin.orders.refund': {
    title: 'Process Refund',
    summary: 'Return money to the customer.',
    details: `Refund options:

- **Full Refund:** Return entire order amount
- **Partial Refund:** Return specific amount
- **Restock:** Return items to inventory

Refunds are processed through your payment provider and may take 5-10 business days to appear.`,
  },

  // Customer Management
  'admin.customers.list': {
    title: 'Customer List',
    summary: 'All customers who have placed orders.',
    details: `Customer profiles are created automatically when orders are placed:

- **Name & Email:** Contact information
- **Orders:** Number of orders placed
- **Total Spent:** Lifetime value
- **Last Order:** Most recent activity

Click to view full profile including order history.`,
  },

  'admin.customers.profile': {
    title: 'Customer Profile',
    summary: 'Detailed view of a customer.',
    details: `Everything about this customer:

- **Contact Info:** Email, phone, addresses
- **Order History:** All past orders
- **Notes:** Your internal notes
- **Tags:** Segmentation labels

Use notes to record special requests or interactions.`,
  },

  // Page Builder
  'admin.pages.list': {
    title: 'Page List',
    summary: 'All website pages you can edit.',
    details: `Pages in your site:

- **Home:** Your landing page
- **Custom Pages:** Created by you
- **System Pages:** Cart, checkout, account

Click any page to open the visual editor.`,
  },

  'admin.pages.editor': {
    title: 'Page Editor',
    summary: 'Visual drag-and-drop page builder.',
    details: `Build pages without code:

- **Left Panel:** Component library
- **Canvas:** Your page preview
- **Right Panel:** Component settings

Drag components to add them. Click to select and edit.`,
  },

  // Blog
  'admin.blog.list': {
    title: 'Blog Posts',
    summary: 'All your blog content.',
    details: `Manage your blog:

- **Published:** Live on your site
- **Draft:** Work in progress
- **Scheduled:** Will publish automatically

Regular blogging helps SEO and customer engagement.`,
  },

  'admin.blog.editor': {
    title: 'Blog Editor',
    summary: 'Write and format blog posts.',
    details: `Create engaging content:

- **Title:** Post headline
- **Content:** Rich text editor
- **Featured Image:** Header image
- **SEO:** Meta title and description
- **Categories/Tags:** Organization

Preview before publishing to check formatting.`,
  },

  // Settings
  'admin.settings.general': {
    title: 'General Settings',
    summary: 'Basic store configuration.',
    details: `Configure your store basics:

- **Store Name:** Appears in emails and receipts
- **Contact Email:** For notifications
- **Address:** Your business address
- **Timezone:** For scheduling and reports

Changes take effect immediately.`,
  },

  'admin.settings.payments': {
    title: 'Payment Settings',
    summary: 'Configure payment processing.',
    details: `Set up how you accept payments:

- **Stripe:** Credit/debit cards
- **PayPal:** PayPal accounts
- **Test Mode:** Safe testing environment

Always test with test mode before going live.`,
  },

  'admin.settings.shipping': {
    title: 'Shipping Settings',
    summary: 'Configure shipping carriers and rates.',
    details: `Set up shipping:

- **Carriers:** USPS, UPS, FedEx, etc.
- **Rates:** Flat rate or calculated
- **Free Shipping:** Threshold settings
- **Zones:** Regional rate variations

Accurate shipping settings prevent lost revenue.`,
  },

  'admin.settings.email': {
    title: 'Email Settings',
    summary: 'Configure email notifications.',
    details: `Control what emails are sent:

- **Order Confirmation:** Sent after purchase
- **Shipping Updates:** Tracking notifications
- **Account Emails:** Password reset, etc.

Customize templates to match your brand.`,
  },

  // Settings Page
  'admin.settings.page': {
    title: 'Settings',
    summary: 'Configure your store settings and preferences.',
    details: `Manage all aspects of your store:

- Branding and appearance
- Store information
- Email and notifications
- Shipping and taxes
- Security and API access

Changes are saved when you click Save Changes.`,
  },

  'admin.settings.tabs': {
    title: 'Settings Categories',
    summary: 'Navigate between different settings sections.',
    details: `Settings are organized into tabs:

- **Branding:** Logo and colors
- **Store:** Business information
- **Email:** Email provider configuration
- **AI:** AI assistant settings
- **Alerts:** Notification preferences
- **Shipping/Taxes:** Commerce settings
- **Environment:** System variables
- **Theme:** Appearance settings
- **Security:** Account security`,
  },

  'admin.settings.branding-tab': {
    title: 'Branding Settings',
    summary: 'Configure your brand identity.',
    details: `Customize your brand:

- Upload logo and favicon
- Set primary brand colors
- Configure social media links
- Add custom CSS if needed`,
  },

  'admin.settings.store-info': {
    title: 'Store Information',
    summary: 'Basic information about your business.',
    details: `Configure store basics:

- **Store Name:** Appears in emails and receipts
- **Contact Email:** Customer communication
- **Phone Number:** Support contact
- **Address:** Business location
- **Currency/Timezone:** Regional settings`,
  },

  'admin.settings.email-notifications': {
    title: 'Email Notifications',
    summary: 'Configure email alerts for store events.',
    details: `Choose which events trigger emails:

- Order confirmations
- Shipping notifications
- Low stock alerts
- New customer registrations

Enable only what you need to avoid notification fatigue.`,
  },

  'admin.settings.shipping-config': {
    title: 'Shipping Settings',
    summary: 'Configure shipping options.',
    details: `Set up shipping:

- Enable/disable free shipping
- Set free shipping threshold
- Configure default shipping rate
- Enable local pickup option`,
  },

  'admin.settings.tax-config': {
    title: 'Tax Settings',
    summary: 'Configure tax collection.',
    details: `Manage taxes:

- Enable/disable tax collection
- Set default tax rate
- Choose if prices include tax

Consult your accountant for proper tax configuration.`,
  },

  'admin.settings.theme-config': {
    title: 'Theme Settings',
    summary: 'Customize dashboard appearance.',
    details: `Personalize your experience:

- Choose light, dark, or system theme
- Select primary color
- Select accent color

Changes apply immediately.`,
  },

  'admin.settings.security-config': {
    title: 'Security Settings',
    summary: 'Manage account security.',
    details: `Protect your account:

- Change password
- Enable two-factor authentication
- Manage API keys

Regular security reviews recommended.`,
  },

  'admin.settings.danger-zone': {
    title: 'Danger Zone',
    summary: 'Irreversible account actions.',
    details: `Critical actions:

- **Export Data:** Download all store data
- **Delete Store:** Permanently remove everything

These actions cannot be undone. Use with extreme caution.`,
  },

  // Email Marketing
  'admin.email-marketing.page': {
    title: 'Email Marketing',
    summary: 'Create and manage email campaigns.',
    details: `Build your email marketing strategy:

- Create email campaigns
- Design with visual editor
- Set up automated sequences
- Track performance metrics

Email marketing helps engage customers and drive sales.`,
  },

  'admin.email-marketing.stats': {
    title: 'Email Statistics',
    summary: 'Overview of email performance.',
    details: `Key metrics:

- **Campaigns:** Total campaigns created
- **Emails Sent:** Total emails delivered
- **Open Rate:** Percentage opened
- **Click Rate:** Percentage clicked
- **Subscribers:** Active subscriber count`,
  },

  'admin.email-marketing.tabs': {
    title: 'Email Marketing Sections',
    summary: 'Navigate email marketing features.',
    details: `Sections available:

- **All Campaigns:** View and manage all campaigns
- **Automated:** Set up email automation
- **Templates:** Create reusable templates
- **Subscribers:** Manage email list`,
  },

  'admin.email-marketing.table': {
    title: 'Campaigns Table',
    summary: 'All your email campaigns.',
    details: `View campaign details:

- **Campaign:** Name and subject
- **Type:** Campaign, Automated, or Transactional
- **Status:** Draft, Scheduled, Sent, etc.
- **Recipients:** Audience size
- **Performance:** Open and click rates

Click actions to edit, preview, or duplicate.`,
  },

  'admin.email-marketing.automated-workflows': {
    title: 'Automated Workflows',
    summary: 'Set up automated email sequences.',
    details: `Automate customer engagement:

- **Welcome Series:** Onboard new subscribers
- **Abandoned Cart:** Recover lost sales
- **Post-Purchase:** Follow up after orders

Configure triggers and timing for each sequence.`,
  },

  // Shipping
  'admin.shipping.page': {
    title: 'Shipping Management',
    summary: 'Manage shipping configuration and shipments.',
    details: `Handle all shipping needs:

- Create shipments and labels
- Configure shipping settings
- Manage carrier integrations
- Track shipment history`,
  },

  'admin.shipping.tabs': {
    title: 'Shipping Sections',
    summary: 'Navigate shipping features.',
    details: `Available sections:

- **Create Shipment:** Generate shipping labels
- **Settings:** Configure carriers and rates
- **Shipments:** View shipment history`,
  },

  'admin.shipping.api-config': {
    title: 'API Configuration',
    summary: 'Configure shipping provider API.',
    details: `Set up your shipping API:

- Enter API credentials
- Select test or live mode
- Verify connection

Get API keys from your shipping provider (e.g., Shippo).`,
  },

  'admin.shipping.carriers': {
    title: 'Carrier Settings',
    summary: 'Enable shipping carriers.',
    details: `Choose carriers for your store:

- USPS
- UPS
- FedEx
- DHL

Enable only carriers you have accounts with.`,
  },

  // Customers
  'admin.customers.page': {
    title: 'Customer Management',
    summary: 'View and manage all customers.',
    details: `Customer relationship management:

- View customer profiles
- See order history
- Track customer value
- Export customer data`,
  },

  'admin.customers.stats': {
    title: 'Customer Statistics',
    summary: 'Overview of your customer base.',
    details: `Key metrics:

- **Total Customers:** All registered customers
- **Active:** Recently active customers
- **New This Month:** Recent registrations
- **Data Size:** Storage used by customer data`,
  },

  'admin.customers.table': {
    title: 'Customers Table',
    summary: 'All your customers.',
    details: `View customer information:

- **Customer:** Name and email
- **Orders:** Purchase history
- **Total Spent:** Lifetime value
- **Status:** Active or inactive
- **Joined:** Registration date

Click to view full customer profile.`,
  },

  // Pages
  'admin.pages.page': {
    title: 'Pages Management',
    summary: 'Create and manage website pages.',
    details: `Build your website:

- Create custom pages
- Use visual Puck editor
- Organize page hierarchy
- Manage page status`,
  },

  'admin.pages.stats': {
    title: 'Page Statistics',
    summary: 'Overview of your pages.',
    details: `Quick metrics:

- **Total Pages:** All pages created
- **Published:** Live pages
- **Drafts:** Work in progress

Click cards for filtered views.`,
  },

  'admin.pages.table': {
    title: 'Pages Table',
    summary: 'All your website pages.',
    details: `View page information:

- **Title:** Page name
- **Slug:** URL path
- **Status:** Published or Draft
- **Views:** Page visits
- **Updated:** Last modification

Click to open the visual editor.`,
  },

  // Blog
  'admin.blog.page': {
    title: 'Blog Management',
    summary: 'Create and manage blog content.',
    details: `Build your blog:

- Write and edit posts
- Organize with categories and tags
- Schedule publications
- Track engagement`,
  },

  'admin.blog.tabs': {
    title: 'Blog Filters',
    summary: 'Filter posts by status.',
    details: `Quick filters:

- **All Posts:** Show everything
- **Published:** Live content
- **Drafts:** Work in progress
- **Scheduled:** Upcoming posts

Click tabs to filter the list.`,
  },

  'admin.blog.table': {
    title: 'Blog Posts Table',
    summary: 'All your blog posts.',
    details: `View post information:

- **Title:** Post headline
- **Author:** Who wrote it
- **Categories:** Topic organization
- **Status:** Publication state
- **Views:** Read count
- **Published:** When it went live

Click to edit posts.`,
  },

  // Media
  'admin.media.page': {
    title: 'Media Library',
    summary: 'Manage all your media files.',
    details: `Central media management:

- Upload images, videos, and documents
- Organize with folders
- Search by filename
- View file usage across the site`,
  },

  'admin.media.manager': {
    title: 'Media Manager',
    summary: 'Browse and manage your media files.',
    details: `Upload and organize media:

- Drag and drop to upload
- Create folders for organization
- Preview files before use
- Copy URLs for sharing

Supported: Images, videos, PDFs, documents.`,
  },

  // Analytics
  'admin.analytics.dashboard': {
    title: 'Analytics Dashboard',
    summary: 'Key metrics and performance data.',
    details: `Track your store performance:

- **Revenue:** Sales over time
- **Orders:** Order volume trends
- **Customers:** New vs returning
- **Products:** Best sellers

Use date range selector to analyze different periods.`,
  },

  // Media
  'admin.media.library': {
    title: 'Media Library',
    summary: 'All uploaded images and files.',
    details: `Manage your media:

- **Upload:** Drag and drop files
- **Organize:** Create folders
- **Search:** Find by filename
- **Usage:** See where files are used

Supported: Images, videos, PDFs, documents.`,
  },

  // AI Chat
  'admin.chat.assistant': {
    title: 'AI Assistant',
    summary: 'Your intelligent admin helper.',
    details: `The AI assistant can help you:

- **Navigate:** Find pages and features
- **Search:** Find products, orders, customers
- **Explain:** Understand how things work
- **Guide:** Walk through complex tasks

Try asking questions in natural language!`,
  },

  // Help Mode
  'admin.help.mode': {
    title: 'Help Mode',
    summary: 'Interactive help for any element.',
    details: `Help mode highlights what you can click:

1. Press **Ctrl+Q** or click the help button
2. Blue highlights appear on interactive elements
3. Click any highlight for explanation
4. Press **Escape** to exit

Perfect for learning new features!`,
  },

  // Common UI Elements
  'ui.search': {
    title: 'Search',
    summary: 'Find items quickly.',
    details: 'Type to search. Results update as you type. Press Enter to search or Escape to clear.',
  },

  'ui.filter': {
    title: 'Filters',
    summary: 'Narrow down the list.',
    details: 'Use filters to show only items matching your criteria. Multiple filters can be combined.',
  },

  'ui.pagination': {
    title: 'Pagination',
    summary: 'Navigate through pages of results.',
    details: 'Click page numbers or arrows to see more results. Adjust items per page in settings.',
  },

  'ui.bulk.actions': {
    title: 'Bulk Actions',
    summary: 'Act on multiple items at once.',
    details: `Select items with checkboxes, then:

- **Select All:** Check the header checkbox
- **Choose Action:** Pick from dropdown
- **Apply:** Click to execute

Faster than editing items one by one.`,
  },

  // Forms
  'admin.forms': {
    title: 'Form Builder',
    summary: 'Create and manage forms for your website.',
    details: `Build custom forms for contact, feedback, surveys, and more:

- **Form Fields:** Text, email, select, checkbox, file upload
- **Validation:** Required fields, format checking
- **Submissions:** View and export form responses
- **Notifications:** Email alerts for new submissions

Forms can be embedded on any page using the form component.`,
  },

  'admin.forms.page': {
    title: 'Forms Management',
    summary: 'Create and manage all forms for your website.',
    details: `The forms page lets you:

- View all forms with status and submission counts
- Create new forms for different purposes
- Manage form fields and validation
- View and export form submissions

Use forms for contact, feedback, surveys, registration, and more.`,
  },

  'admin.forms.stats': {
    title: 'Form Statistics',
    summary: 'Overview of your forms and submissions.',
    details: `Quick metrics:

- **Total Forms:** All forms created
- **Active:** Forms accepting submissions
- **Drafts:** Forms in progress
- **Submissions:** Total responses received`,
  },

  'admin.forms.table': {
    title: 'Forms Table',
    summary: 'All your forms with key information.',
    details: `View and manage forms:

- **Form:** Name and description
- **Slug:** URL identifier
- **Status:** Active, Draft, or Archived
- **Submissions:** Number of responses
- **Actions:** Edit, view submissions, duplicate, delete`,
  },

  'admin.forms.types-info': {
    title: 'Form Types',
    summary: 'Different types of forms you can create.',
    details: `Create forms for various purposes:

- **Contact Forms:** Collect customer inquiries
- **Surveys:** Gather feedback with multiple choice
- **Registration Forms:** Sign up for events or newsletters

Choose the right type when creating a new form.`,
  },

  // User Management
  'admin.users': {
    title: 'User Management',
    summary: 'Manage admin users and their access.',
    details: `Control who can access the admin panel:

- **Add Users:** Invite new team members
- **Edit Roles:** Assign permissions
- **Activity Log:** Track user actions
- **Deactivate:** Disable accounts without deleting

Keep your admin panel secure with proper user management.`,
  },

  'admin.users.page': {
    title: 'Users Management',
    summary: 'View and manage all platform users.',
    details: `Manage user access and permissions:

- View all registered users
- See user roles and status
- Manage individual permissions
- Track user activity`,
  },

  'admin.users.stats': {
    title: 'User Statistics',
    summary: 'Overview of platform users.',
    details: `Quick metrics:

- **Total Users:** All registered users
- **Super Admins:** Full access users
- **With Roles:** Users with assigned roles
- **Active (30d):** Recently logged in users`,
  },

  'admin.users.table': {
    title: 'Users Table',
    summary: 'All platform users.',
    details: `View user information:

- **User:** Name, email, and avatar
- **Roles:** Assigned roles
- **Status:** Active or inactive
- **Last Login:** Recent activity
- **Joined:** Registration date

Click to manage permissions.`,
  },

  'admin.users.quick-actions': {
    title: 'Quick Actions',
    summary: 'Common user management tasks.',
    details: `Quick links to:

- **Manage Roles:** Define and edit roles
- **Create New Role:** Define custom permission bundles

Access frequently needed user management features.`,
  },

  // Roles & Permissions
  'admin.roles': {
    title: 'Roles & Permissions',
    summary: 'Configure access control for different user types.',
    details: `Define what each role can do:

- **View:** See content without editing
- **Edit:** Modify existing content
- **Create:** Add new content
- **Delete:** Remove content
- **Publish:** Make content live

Create custom roles to match your team structure.`,
  },

  'admin.roles.page': {
    title: 'Roles Management',
    summary: 'Manage user roles and their permission bundles.',
    details: `Control access by creating and managing roles:

- View all roles with permission counts
- Create custom roles for your team
- Duplicate system roles for customization
- Assign users to appropriate roles`,
  },

  'admin.roles.stats': {
    title: 'Role Statistics',
    summary: 'Overview of roles and assignments.',
    details: `Quick metrics:

- **Total Roles:** System and custom roles
- **Assignments:** Users with roles
- **System Roles:** Built-in presets
- **Custom Roles:** User-defined roles`,
  },

  'admin.roles.list': {
    title: 'Roles List',
    summary: 'All defined roles in your system.',
    details: `Each role card shows:

- **Display Name:** Human-readable name
- **Permissions:** Number of permissions granted
- **Users:** Number of assigned users
- **Type:** System (built-in) or Custom

Click to edit or duplicate roles.`,
  },

  'admin.roles.help-section': {
    title: 'About Roles & Permissions',
    summary: 'Understanding the role system.',
    details: `Roles simplify access control:

- Group related permissions together
- Assign users to roles instead of individual permissions
- System roles cannot be deleted but can be duplicated
- Override individual permissions on users when needed`,
  },

  // Workflows
  'admin.workflows': {
    title: 'Workflows',
    summary: 'Automate business processes with visual workflows.',
    details: `Build automation without code:

- **Triggers:** Start workflows on events
- **Actions:** Send emails, update records, call APIs
- **Conditions:** Branch logic based on data
- **Scheduling:** Time-based execution

Workflows help automate repetitive tasks and ensure consistency.`,
  },

  'admin.workflows.page': {
    title: 'Workflow Automation',
    summary: 'Create and manage automated workflows.',
    details: `Build powerful automation:

- Create workflows with visual builder
- Set triggers: manual, scheduled, webhook, or event
- Enable/disable workflows as needed
- Track execution history and results`,
  },

  'admin.workflows.table': {
    title: 'Workflows Table',
    summary: 'All your automated workflows.',
    details: `View and manage workflows:

- **Name:** Workflow identifier
- **Trigger:** What starts the workflow
- **Status:** Enabled or Disabled
- **Last Run:** When it last executed
- **Executions:** Total run count

Click the play button to run a workflow manually.`,
  },

  'admin.workflows.new': {
    title: 'New Workflow',
    summary: 'Create a new automated workflow.',
    details: `Opens the visual workflow builder where you can:

- Define workflow triggers
- Add action steps
- Configure conditions and branching
- Test before enabling

Use workflows to automate repetitive tasks.`,
  },

  // Dashboard Page Elements
  'admin.dashboard.metrics': {
    title: 'Performance Metrics',
    summary: 'Visual charts showing your store performance over time.',
    details: `Track key performance indicators:

- **Revenue Trends:** Sales over time
- **Order Volume:** Daily/weekly/monthly orders
- **Traffic:** Visitor statistics
- **Conversion Rate:** Visitors to customers

Use the date range selector to analyze different periods.`,
  },

  'admin.dashboard.quick-actions': {
    title: 'Quick Actions',
    summary: 'Common tasks you can do with one click.',
    details: `Speed up your workflow with quick actions:

- **Add Product:** Create a new product
- **View Orders:** Jump to recent orders
- **Create Page:** Start building a new page

These shortcuts save time on frequent tasks.`,
  },

  'admin.dashboard.stats': {
    title: 'Store Statistics',
    summary: 'At-a-glance numbers for your store.',
    details: `Key metrics updated in real-time:

- **Total Users:** Registered accounts
- **Products:** Items in your catalog
- **Orders:** Total orders placed
- **Blog Posts:** Published content

Click any card to see more details.`,
  },

  'admin.dashboard.stat.users': {
    title: 'Total Users',
    summary: 'Number of registered user accounts.',
    details: 'This shows all users who have created an account. Click to manage users and their permissions.',
  },

  'admin.dashboard.stat.products': {
    title: 'Products Count',
    summary: 'Total products in your catalog.',
    details: 'The number of products you have listed. Includes both active and draft products.',
  },

  'admin.dashboard.stat.orders': {
    title: 'Orders Count',
    summary: 'Total orders received.',
    details: 'All orders placed on your store, including pending, completed, and cancelled orders.',
  },

  'admin.dashboard.stat.blog': {
    title: 'Blog Posts Count',
    summary: 'Total blog posts created.',
    details: 'All blog posts including published, scheduled, and draft posts.',
  },

  'admin.dashboard.quick-links': {
    title: 'Quick Links',
    summary: 'Navigate quickly to common sections.',
    details: `Jump to frequently used areas:

- **Products:** Manage your product catalog
- **Orders:** View and process orders
- **Customers:** Access customer profiles

Click any link to navigate directly.`,
  },

  'admin.dashboard.content-management': {
    title: 'Content Management',
    summary: 'Manage your site content from here.',
    details: `Access all content tools:

- **Pages:** Create and edit website pages
- **Blog:** Write and publish blog posts
- **Media:** Upload and organize media files

Build and maintain your site content.`,
  },

  // Products Page Elements
  'admin.products.actions': {
    title: 'Product Actions',
    summary: 'Tools for managing your product catalog.',
    details: 'Use these buttons to refresh the list, or add new products to your catalog.',
  },

  'admin.products.refresh': {
    title: 'Refresh Products',
    summary: 'Reload the product list.',
    details: 'Click to fetch the latest product data. Useful if products were updated elsewhere.',
  },

  'admin.products.add': {
    title: 'Add Product',
    summary: 'Create a new product.',
    details: `Opens the product creation form where you can:

- Enter product title and description
- Set pricing and SKU
- Upload product images
- Configure variants and inventory

Start building your catalog!`,
  },

  'admin.products.tabs': {
    title: 'Product Status Tabs',
    summary: 'Filter products by their status.',
    details: `Quick filters for product status:

- **All Products:** Show everything
- **Active:** Products visible to customers
- **Drafts:** Work in progress, not published

Click a tab to filter the list.`,
  },

  'admin.products.filters': {
    title: 'Product Filters',
    summary: 'Narrow down the product list.',
    details: 'Use search and dropdown filters to find specific products by name, category, or status.',
  },

  'admin.products.search': {
    title: 'Search Products',
    summary: 'Find products by name.',
    details: 'Type to search. Results filter as you type. Search matches product names and descriptions.',
  },

  'admin.products.table': {
    title: 'Products Table',
    summary: 'Your complete product catalog.',
    details: `View and manage all products:

- **Product:** Name and category
- **SKU:** Stock keeping unit
- **Price:** Current price
- **Stock:** Inventory level (color-coded)
- **Status:** Active or Draft
- **Actions:** Edit, view, or delete

Click any row to see more details.`,
  },

  // Orders Page Elements
  'admin.orders.actions': {
    title: 'Order Actions',
    summary: 'Tools for managing orders.',
    details: 'Refresh the order list, export orders to CSV, or create a new manual order.',
  },

  'admin.orders.refresh': {
    title: 'Refresh Orders',
    summary: 'Reload the order list.',
    details: 'Click to fetch the latest order data from the server.',
  },

  'admin.orders.export': {
    title: 'Export Orders',
    summary: 'Download orders as CSV.',
    details: 'Export your order data to a spreadsheet for reporting, accounting, or analysis.',
  },

  'admin.orders.new': {
    title: 'New Order',
    summary: 'Create a manual order.',
    details: `Create an order manually for:

- Phone orders
- In-person sales
- Special requests
- Test orders

Useful when customers order outside the website.`,
  },

  'admin.orders.stats': {
    title: 'Order Statistics',
    summary: 'Overview of order status and revenue.',
    details: `Quick view of order metrics:

- **Total Orders:** All orders received
- **Pending:** Awaiting action
- **Processing:** Being prepared
- **Shipped:** On the way
- **Revenue:** Total from paid orders`,
  },

  'admin.orders.tabs': {
    title: 'Order Status Tabs',
    summary: 'Filter orders by fulfillment status.',
    details: `Quick status filters:

- **All:** Show all orders
- **Pending:** Needs attention
- **Processing:** Being fulfilled
- **Shipped:** In transit
- **Delivered:** Completed

Click to filter the list by status.`,
  },

  'admin.orders.filters': {
    title: 'Order Filters',
    summary: 'Narrow down the order list.',
    details: 'Use search and filters to find orders by number, customer, status, or payment status.',
  },

  'admin.orders.search': {
    title: 'Search Orders',
    summary: 'Find orders quickly.',
    details: 'Search by order number, customer name, or email address. Results filter as you type.',
  },

  'admin.orders.bulk-actions': {
    title: 'Bulk Actions',
    summary: 'Act on multiple orders at once.',
    details: `When orders are selected:

- **Send Email:** Email all selected customers
- **Print Labels:** Generate shipping labels

Select orders using the checkboxes, then choose an action.`,
  },

  'admin.orders.table': {
    title: 'Orders Table',
    summary: 'All customer orders.',
    details: `View and manage orders:

- **Order:** Order number (click to view)
- **Customer:** Name and email
- **Items:** Number of items ordered
- **Total:** Order amount
- **Status:** Fulfillment status
- **Payment:** Payment status
- **Actions:** View, email, update, or cancel

Use checkboxes for bulk actions.`,
  },
}

/**
 * Get default content for an element key
 */
export function getDefaultContent(elementKey: string) {
  const content = defaultHelpContent[elementKey]
  if (!content) return null

  return {
    ...content,
    elementKey,
    createdBy: 'SYSTEM' as const,
  }
}
