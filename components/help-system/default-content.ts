/**
 * Default Help Content
 *
 * Built-in help content for dashboard elements.
 * This serves as fallback when no database content exists.
 */

import type { HelpContent, DefaultContentRegistry } from './types'

/**
 * Dashboard help content registry
 */
export const defaultHelpContent: DefaultContentRegistry = {
  // Sidebar Navigation
  'dashboard.sidebar.sites': {
    title: 'Your Sites',
    summary: 'View and manage all your websites in one place.',
    details: `This is your site selector where you can:

- Switch between your active websites
- See which site you're currently managing
- Quick-access to each site's settings

**Tip:** Click the dropdown to switch sites or create a new one.`,
  },

  'dashboard.sidebar.overview': {
    title: 'Overview',
    summary: 'Your dashboard home page.',
    details: `The overview shows:

- All your sites at a glance
- Quick stats for each site
- Recent activity
- Quick actions like creating new sites

This is your starting point for managing everything.`,
  },

  'dashboard.sidebar.analytics': {
    title: 'Analytics',
    summary: 'View traffic and performance metrics.',
    details: `Track your site's performance:

- Page views and unique visitors
- Popular pages and content
- Traffic sources
- User engagement metrics

**Note:** Select a site first to see its analytics.`,
  },

  'dashboard.sidebar.visibility': {
    title: 'Site Visibility',
    summary: 'Control who can see your site.',
    details: `Manage site access:

- Make your site public or private
- Set up password protection
- Control search engine indexing
- Manage access restrictions

Perfect for staging sites or member-only content.`,
  },

  'dashboard.sidebar.domains': {
    title: 'Custom Domains',
    summary: 'Connect your own domain names.',
    details: `Connect your own domain names to your sites:

- Add custom domains (e.g., yourbusiness.com)
- Configure DNS settings
- Manage SSL certificates (automatic)
- Set primary domains for SEO

**DNS Setup:** After adding a domain, you'll need to update your DNS records at your registrar.`,
  },

  'dashboard.sidebar.settings': {
    title: 'Site Settings',
    summary: 'Configure your site preferences.',
    details: `Manage site configuration:

- Site name and description
- Default language and timezone
- Meta tags for SEO
- Social sharing settings
- Favicon and branding`,
  },

  'dashboard.sidebar.appearance': {
    title: 'Appearance',
    summary: 'Customize your site\'s look and feel.',
    details: `Control your site's visual design:

- Color schemes and themes
- Typography settings
- Layout options
- Custom CSS (advanced)

Make your site match your brand perfectly.`,
  },

  'dashboard.sidebar.frontend': {
    title: 'Hosting',
    summary: 'Manage your site\'s hosting and deployment.',
    details: `Control how your site is hosted:

- View deployment status
- Connect to Git repositories
- Manage build settings
- Configure environment variables

Your site is automatically deployed when you make changes.`,
  },

  'dashboard.sidebar.security': {
    title: 'Security',
    summary: 'Protect your site and data.',
    details: `Security settings include:

- SSL/HTTPS configuration
- Access controls
- Two-factor authentication
- Security headers
- Backup settings

Keep your site and visitors safe.`,
  },

  'dashboard.sidebar.billing': {
    title: 'Billing',
    summary: 'Manage your subscription and payments.',
    details: `Control your account billing:

- View current plan and usage
- Upgrade or downgrade your subscription
- Update payment methods
- Download invoices
- View billing history

**Plans:** Different plans offer varying numbers of sites, storage, and features.`,
  },

  // Header Elements
  'dashboard.header.search': {
    title: 'Quick Search',
    summary: 'Search across all your sites and content.',
    details: `Use search to quickly find:

- Specific sites by name
- Pages and blog posts
- Products (if using e-commerce)
- Settings and features

**Shortcut:** Press \`Ctrl+K\` or \`Cmd+K\` to open search from anywhere.`,
  },

  'dashboard.header.help': {
    title: 'Help Mode',
    summary: 'Get contextual help for any feature.',
    details: `You're using Help Mode right now!

**How it works:**
- Click the help button or press \`Ctrl+Q\`
- Highlighted elements are interactive
- Click any highlighted element to learn about it
- Press \`Esc\` to exit help mode

**Walkthroughs:** Some features have guided tours you can start from the help tooltip.`,
  },

  'dashboard.header.notifications': {
    title: 'Notifications',
    summary: 'Stay updated on important events.',
    details: `Notifications alert you to:

- New orders (for e-commerce sites)
- Form submissions
- Site issues or downtime
- Billing reminders
- Feature announcements

You can customize which notifications you receive in Settings.`,
  },

  'dashboard.header.user': {
    title: 'Account Menu',
    summary: 'Quick access to your account and sign out.',
    details: `From the account menu you can:

- View your profile
- Access account settings
- Switch between teams (if applicable)
- Sign out of your account`,
  },

  // Main Dashboard
  'dashboard.sites.create': {
    title: 'Create New Site',
    summary: 'Launch a new website in seconds.',
    details: `Click here to create a new website:

1. Choose a subdomain name
2. Select a template (optional)
3. Your site is instantly live!

**Subdomain:** Your site will be available at \`yourname.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}\`

Later, you can connect a custom domain.`,
  },

  'dashboard.sites.list': {
    title: 'Site List',
    summary: 'All your websites at a glance.',
    details: `Each site card shows:

- Site name and subdomain
- Current status (live, building, error)
- Quick stats (pages, posts, products)
- Last updated time

**Actions:** Click a site to open its CMS, or use the menu for more options.`,
  },

  'dashboard.sites.stats': {
    title: 'Site Statistics',
    summary: 'Quick overview of your site performance.',
    details: `Stats shown include:

- Total page views
- Unique visitors
- Popular pages
- Recent activity

For detailed analytics, click "View Analytics" on any site card.`,
  },

  // Site Card Elements
  'dashboard.site.status': {
    title: 'Site Status',
    summary: 'Current state of your website.',
    details: `Status indicators:

- **Live** (green): Site is published and accessible
- **Building** (yellow): Changes are being deployed
- **Error** (red): Something needs attention

If you see an error, click for details on how to resolve it.`,
  },

  'dashboard.site.manage': {
    title: 'Manage Site',
    summary: 'Open the CMS for this site.',
    details: `Opens the full CMS dashboard where you can:

- Edit pages and content
- Manage products (e-commerce)
- Write blog posts
- Configure site settings
- View detailed analytics`,
  },

  'dashboard.site.menu': {
    title: 'Site Options',
    summary: 'Additional actions for this site.',
    details: `Available actions:

- **View Site**: Open the live website
- **Duplicate**: Create a copy of this site
- **Export**: Download site data
- **Delete**: Remove the site permanently

**Warning:** Deleting a site cannot be undone.`,
  },

  // Domain Management
  'dashboard.domains.add': {
    title: 'Add Custom Domain',
    summary: 'Connect your own domain name.',
    details: `To add a custom domain:

1. Enter your domain (e.g., yourbusiness.com)
2. Click "Add Domain"
3. Update DNS at your registrar
4. Click "Verify" once DNS propagates

**DNS Records:** We'll show you exactly which records to add.

**SSL:** HTTPS is automatic once DNS is verified.`,
  },

  'dashboard.domains.verify': {
    title: 'Verify Domain',
    summary: 'Check if DNS is configured correctly.',
    details: `DNS verification checks:

- A record or CNAME is pointing to us
- TXT record for ownership verification
- SSL certificate can be issued

**Timing:** DNS changes can take 1-48 hours to propagate worldwide.`,
  },

  'dashboard.domains.primary': {
    title: 'Primary Domain',
    summary: 'Set the main URL for your site.',
    details: `The primary domain is:

- Used for SEO canonical URLs
- Shown in search results
- Used for social sharing previews

Other domains will redirect to the primary domain.`,
  },

  // Billing
  'dashboard.billing.plan': {
    title: 'Current Plan',
    summary: 'Your subscription details.',
    details: `Your plan includes:

- Number of sites allowed
- Storage quota
- Bandwidth limits
- Feature access

**Upgrading:** More sites or features? Upgrade anytime and only pay the difference.`,
  },

  'dashboard.billing.payment': {
    title: 'Payment Method',
    summary: 'How you pay for your subscription.',
    details: `Manage your payment:

- Update credit card
- View payment history
- Download invoices
- Set up auto-renewal

**Security:** Card details are securely stored by Stripe.`,
  },

  // Site Card Actions
  'dashboard.site.card': {
    title: 'Site Card',
    summary: 'Overview of a single site.',
    details: `Each site card displays:

- Site name and emoji
- Subdomain URL
- Creation date
- Quick action buttons

Use the buttons on the right to visit, manage, or delete the site.`,
  },

  'dashboard.site.visit': {
    title: 'Visit Site',
    summary: 'Open your live website.',
    details: `Opens your published website in a new tab.

This is what your visitors see when they go to your site URL.

**Tip:** Use this to preview changes after publishing.`,
  },

  'dashboard.site.delete': {
    title: 'Delete Site',
    summary: 'Permanently remove this site.',
    details: `**Warning:** This action cannot be undone!

Deleting a site will:
- Remove all pages and content
- Release the subdomain for others to use
- Cancel any custom domain connections
- Delete all associated data

Consider exporting your content first if you might need it later.`,
  },

  // Billing Extended
  'dashboard.billing.manage': {
    title: 'Manage Subscription',
    summary: 'Open Stripe customer portal.',
    details: `Opens the Stripe billing portal where you can:

- Change your subscription plan
- Update payment methods
- View and download invoices
- Cancel your subscription

**Security:** Billing is handled securely through Stripe.`,
  },

  'dashboard.billing.usage': {
    title: 'Usage Overview',
    summary: 'Track your plan limits.',
    details: `Shows how much of your plan limits you're using:

- **Subdomains:** Sites created vs allowed
- **Custom Domains:** Connected domains vs limit

When you approach your limits, consider upgrading your plan.`,
  },

  'dashboard.billing.plans': {
    title: 'Available Plans',
    summary: 'Compare subscription options.',
    details: `Compare features across plans:

- **Free:** Get started with basic features
- **Pro:** More sites and custom domains
- **Enterprise:** Unlimited everything + priority support

Click "Upgrade" to change your plan through Stripe.`,
  },

  // Analytics & Deployments
  'dashboard.analytics.deployments': {
    title: 'Deployment Dashboard',
    summary: 'Monitor your site deployments.',
    details: `Track all deployment activity:

- Total deployments across all sites
- Active and failed deployments
- Recent deployment history
- Deployment trends over time

Use this to ensure your sites are deploying successfully.`,
  },

  'dashboard.analytics.stats': {
    title: 'Deployment Statistics',
    summary: 'Quick metrics at a glance.',
    details: `Key deployment metrics:

- **Total Deployments:** All-time deployment count
- **Active Sites:** Currently running deployments
- **Failed Deployments:** Deployments needing attention
- **Total Subdomains:** Your site count

Click any card to see more details.`,
  },

  'dashboard.analytics.recent': {
    title: 'Recent Deployments',
    summary: 'Latest deployment activity.',
    details: `Shows your most recent deployments with:

- Site name and repository
- Deployment status (success/building/error)
- Timestamp
- Quick links to view or debug

Click "View Logs" to see detailed deployment information.`,
  },

  'dashboard.analytics.status': {
    title: 'Deployment Status',
    summary: 'Distribution of deployment states.',
    details: `Overview of all deployment states:

- **Deployed:** Successfully live
- **Building:** Currently deploying
- **Error:** Failed deployments
- **Not Configured:** Sites without deployments

Focus on resolving any error states.`,
  },

  'dashboard.analytics.trends': {
    title: 'Deployment Trends',
    summary: 'Daily deployment activity.',
    details: `Shows deployment activity over the last 7 days:

- Number of successful deployments
- Number of failed deployments
- Daily patterns

Use this to identify if deployment issues are recurring.`,
  },

  'dashboard.analytics.site': {
    title: 'Site Analytics',
    summary: 'Visitor traffic and engagement.',
    details: `Track your site's visitor metrics:

- Total visitors and page views
- Traffic sources
- Popular pages
- Conversion tracking

**Note:** Analytics data will appear once tracking is enabled.`,
  },

  'dashboard.analytics.visitor-stats': {
    title: 'Visitor Statistics',
    summary: 'Key traffic metrics.',
    details: `Monitor visitor activity:

- **Total Visitors:** Unique visitors to your sites
- **Page Views:** Total pages viewed
- **Active Sites:** Sites receiving traffic
- **Conversion Rate:** Goal completions

Analytics tracking will be available soon.`,
  },

  'dashboard.analytics.traffic': {
    title: 'Traffic Overview',
    summary: 'Visitor trends over time.',
    details: `Visualize your traffic patterns:

- Daily/weekly/monthly views
- Peak traffic times
- Traffic growth trends
- Visitor retention

Charts will display once analytics tracking is enabled.`,
  },

  // Domain Management Extended
  'dashboard.domains.default': {
    title: 'Default Subdomain',
    summary: 'Your built-in site address.',
    details: `Every site gets a free subdomain that's always available:

- Format: \`yoursite.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}\`
- SSL/HTTPS is automatic
- Can't be removed (it's your backup)

You can add custom domains for a professional appearance.`,
  },

  'dashboard.domains.input': {
    title: 'Domain Input',
    summary: 'Enter your domain name.',
    details: `Enter the domain you want to connect:

- Root domain: \`yourdomain.com\`
- Subdomain: \`www.yourdomain.com\` or \`blog.yourdomain.com\`

Make sure you have access to your domain's DNS settings before adding.`,
  },

  'dashboard.domains.add-btn': {
    title: 'Add Domain Button',
    summary: 'Register the domain.',
    details: `Clicking this will:

1. Validate the domain format
2. Check if it's available to connect
3. Generate DNS records for you to add
4. Begin monitoring for verification

You'll then need to update your DNS at your registrar.`,
  },

  'dashboard.domains.list': {
    title: 'Custom Domains List',
    summary: 'Your connected domains.',
    details: `Shows all domains connected to this site:

- Domain name and status
- SSL certificate status
- Primary domain badge
- Action buttons (verify, remove, set primary)

Verified domains show a green checkmark.`,
  },

  'dashboard.domains.dns-guide': {
    title: 'DNS Configuration Guide',
    summary: 'How to set up your DNS.',
    details: `Step-by-step DNS configuration:

**For root domains (yourdomain.com):**
- Add an A record pointing to our IP

**For subdomains (www.yourdomain.com):**
- Add a CNAME record pointing to our server

DNS propagation can take 1-48 hours. Be patient!`,
  },

  // Site Visibility
  'dashboard.visibility.status': {
    title: 'Current Visibility',
    summary: 'Your site\'s current access state.',
    details: `Shows the current visibility setting:

- **Live** (green): Everyone can access your site
- **Private** (gray): Only you can see it
- **Maintenance** (yellow): Shows maintenance page

Changes take effect immediately when saved.`,
  },

  'dashboard.visibility.options': {
    title: 'Visibility Options',
    summary: 'Choose who can see your site.',
    details: `Available visibility settings:

- **Live:** Public access for everyone
- **Private:** Only you can access (great for development)
- **Maintenance:** Shows a "coming soon" page to visitors

**Tip:** Use Private mode when making major changes.`,
  },

  // Site Settings
  'dashboard.settings.general': {
    title: 'General Settings',
    summary: 'Basic site configuration.',
    details: `Configure your site's core settings:

- Site title and description
- Tagline
- Visibility settings

These settings affect how your site appears to visitors and search engines.`,
  },

  'dashboard.settings.basic-info': {
    title: 'Basic Information',
    summary: 'Site name and description.',
    details: `Essential site identity:

- **Site Title:** Appears in browser tabs and search results
- **Tagline:** Short description of your site
- **Description:** Longer description for SEO

Keep these clear and keyword-rich for better search visibility.`,
  },

  'dashboard.settings.appearance': {
    title: 'Appearance Settings',
    summary: 'Visual customization.',
    details: `Control your site's look and feel:

- Brand colors (primary, secondary, accent)
- Typography (font families)
- Theme presets for quick styling

Changes preview in real-time before saving.`,
  },

  'dashboard.settings.colors': {
    title: 'Brand Colors',
    summary: 'Define your color palette.',
    details: `Set your brand colors:

- **Primary:** Main brand color (buttons, links)
- **Secondary:** Supporting color (backgrounds)
- **Accent:** Highlight color (CTAs, badges)

Use your company colors for brand consistency.`,
  },

  'dashboard.settings.typography': {
    title: 'Typography',
    summary: 'Font settings.',
    details: `Choose your fonts:

- Select from curated font options
- Applied to headings and body text
- Affects the entire site

Good typography improves readability and brand perception.`,
  },

  'dashboard.settings.themes': {
    title: 'Theme Presets',
    summary: 'Quick style options.',
    details: `Apply pre-designed color schemes:

- **Modern:** Professional blue/purple
- **Nature:** Fresh green/teal
- **Warm:** Energetic orange/red

Presets automatically set all brand colors at once.`,
  },

  'dashboard.settings.seo': {
    title: 'SEO Settings',
    summary: 'Search engine optimization.',
    details: `Improve your search rankings:

- Meta title and description
- Social sharing images
- Sitemap settings

Good SEO helps people find your site on Google.`,
  },

  'dashboard.settings.meta': {
    title: 'Meta Information',
    summary: 'Search engine content.',
    details: `Control what appears in search results:

- **Meta Title:** Page title in search (60 chars max)
- **Meta Description:** Summary snippet (160 chars max)

Write compelling descriptions to improve click-through rates.`,
  },

  'dashboard.settings.social': {
    title: 'Social Sharing',
    summary: 'Control social media previews.',
    details: `When your site is shared on social media:

- **OG Image:** The preview image shown
- **Favicon:** Small icon in browser tabs

Recommended OG image size: 1200x630 pixels.`,
  },

  'dashboard.settings.security': {
    title: 'Security Settings',
    summary: 'Protect your site.',
    details: `Security configuration options:

- Password protection for the entire site
- SSL certificate status
- Security headers

Keep your site and visitors safe from threats.`,
  },

  'dashboard.settings.password': {
    title: 'Password Protection',
    summary: 'Restrict site access.',
    details: `Add a password gate to your site:

- All visitors must enter the password
- Useful for client previews
- Works on top of visibility settings

**Note:** Password-protected sites are still indexed by search engines unless also set to Private.`,
  },

  'dashboard.settings.ssl': {
    title: 'SSL Certificate',
    summary: 'HTTPS encryption status.',
    details: `SSL (HTTPS) encrypts all traffic to your site:

- **Active:** Your site is secure
- Automatically provisioned via Vercel
- Free and auto-renewing

SSL is required for custom domains and builds visitor trust.`,
  },

  'dashboard.settings.headers': {
    title: 'Security Headers',
    summary: 'HTTP security headers.',
    details: `Security headers protect against common attacks:

- **X-Frame-Options:** Prevents clickjacking
- **X-Content-Type-Options:** Prevents MIME sniffing
- **Referrer-Policy:** Controls referrer information

Recommended to keep enabled for all production sites.`,
  },

  // Frontend Deployment
  'dashboard.frontend.status': {
    title: 'Application Status',
    summary: 'Frontend deployment state.',
    details: `Monitor your frontend application:

- Current running status
- Application name and project
- Quick status indicator

Select an application to manage its deployment.`,
  },

  'dashboard.frontend.controls': {
    title: 'Deployment Controls',
    summary: 'Manage your application.',
    details: `Control your frontend deployment:

- **Deploy:** Start a new deployment
- **Redeploy:** Rebuild from source
- **Start/Stop:** Control the running state
- **Restart:** Quick restart without rebuild

Use these to manage your application lifecycle.`,
  },

  'dashboard.frontend.deploy': {
    title: 'Deploy',
    summary: 'Start a new deployment.',
    details: `Initiates a fresh deployment:

- Pulls latest code from repository
- Runs build process
- Deploys to production

Use when you have new code changes to deploy.`,
  },

  'dashboard.frontend.redeploy': {
    title: 'Redeploy',
    summary: 'Rebuild and deploy.',
    details: `Triggers a complete rebuild:

- Clears build cache
- Reinstalls dependencies
- Rebuilds from scratch

Use if you're experiencing build issues or stale caches.`,
  },

  'dashboard.frontend.start': {
    title: 'Start Application',
    summary: 'Start the application.',
    details: `Starts a stopped application:

- Resumes from last deployment
- No rebuild required
- Fast startup

Use to bring a stopped site back online.`,
  },

  'dashboard.frontend.stop': {
    title: 'Stop Application',
    summary: 'Stop the running application.',
    details: `Stops your application:

- Site becomes unavailable
- Resources are freed
- Can be restarted later

Use for maintenance or to save resources.`,
  },

  'dashboard.frontend.restart': {
    title: 'Restart Application',
    summary: 'Quick restart.',
    details: `Restarts without rebuilding:

- Fast operation
- Clears application memory
- Useful for config changes

Try this first if your site is behaving unexpectedly.`,
  },

  'dashboard.frontend.domains': {
    title: 'Frontend Domains',
    summary: 'Custom domains for frontend.',
    details: `Connect custom domains to your frontend:

- Add production domains
- Configure SSL certificates
- Set up DNS records

Similar to CMS domains but for your frontend application.`,
  },
}

/**
 * Get default content for an element key
 */
export function getDefaultContent(key: string): HelpContent | null {
  const content = defaultHelpContent[key]
  if (!content) return null

  return {
    ...content,
    elementKey: key,
    createdBy: 'SYSTEM',
  }
}
