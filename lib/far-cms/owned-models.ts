// GENERATED from prisma/far-cms/schema.prisma (regenerate when it changes):
// every model with a tenantId column (siteOwnedModels), and each model's per-site unique keys (siteUniqueKeys).
import type { SiteUniques } from "@far-cms/db"

export const OWNED_MODELS: ReadonlySet<string> = new Set(["Address", "AdeChangeComment", "AdeChangeSet", "AdeChangeSetItem", "AdeCoverage", "AdeEditLock", "AdeHandoff", "AdeRecord", "AdeRevision", "AdeTask", "AdeUserPref", "AdeWait", "AdminUser", "AgentRun", "AgentSpan", "AiConversation", "AiDocument", "AiMessage", "AiStream", "AiSuggestion", "AiVote", "AnalyticsDashboard", "AnalyticsEvent", "AnalyticsWidgetTemplate", "ApiKeyClassUsage", "AuditLog", "BackInStockSubscription", "BlogCategory", "BlogComment", "BlogPost", "BlogPostCategory", "BlogPostTag", "BlogSeries", "BlogTag", "BundleAsset", "CanvaConnection", "Cart", "CartItem", "Category", "ClientFeedback", "CmsModule", "ConnectorAccount", "CustomAnimation", "CustomComponent", "CustomField", "Customer", "CustomerAddress", "DigitalAsset", "DigitalDownload", "DiscountCode", "DiscountUsage", "EmailABTest", "EmailAutomation", "EmailAutomationEnrollment", "EmailAutomationEnrollmentStep", "EmailAutomationStep", "EmailCampaign", "EmailLink", "EmailLinkClick", "EmailQueueItem", "EmailRecipient", "EmailSegment", "EmailSegmentMember", "EmailSubscriber", "EmailSuppression", "EmailTemplate", "Event", "EventRegistration", "EventScheduleItem", "EventSpeaker", "EventTicketType", "Feedback", "FeedbackDelivery", "FeedbackDigest", "FeedbackScreenshot", "Form", "FormBulkJob", "FormRateLimit", "FormRuleRun", "FormSubmission", "GiftCard", "GiftCardTransaction", "HelpContent", "HelpTour", "LicenseKey", "LoyaltyActivity", "McpServer", "Media", "MediaFolder", "MediaTag", "MediaTagOnMedia", "MediaUsage", "Notification", "Order", "OrderItem", "OrderProgress", "OrderWorkflow", "OrderWorkflowStage", "Page", "PageBundle", "PageRevision", "PageVersion", "Partial", "Payment", "PlatformActivityLog", "Plugin", "Primitive", "PrimitiveExecution", "Product", "ProductCategory", "ProductCustomField", "ProductImage", "ProductOption", "ProductOptionValue", "ProductReview", "ProductVariant", "ProductVariantOptionValue", "PuckTemplate", "ReviewVote", "Role", "RoleAssignment", "RouteConfig", "Setting", "Shipment", "SiteSettings", "StockReservation", "Subscription", "SubscriptionTier", "SuperAdmin", "Team", "TeamInvitation", "TeamMember", "TeamSubdomain", "TenantPage", "TenantPost", "TenantSetting", "Tour", "TourRun", "UsageCounter", "UserPermission", "VariantCustomFieldValue", "Wishlist", "WishlistItem", "Workflow", "WorkflowExecution", "WorkflowLog", "WorkflowNode", "WorkflowStep", "WorkflowTemplate"])

export const SITE_UNIQUES: SiteUniques = new Map(Object.entries({
 "Customer": [
  {
   "name": "tenantId_email",
   "fields": [
    "email"
   ]
  }
 ],
 "Role": [
  {
   "name": "tenantId_name",
   "fields": [
    "name"
   ]
  }
 ],
 "Setting": [
  {
   "name": "tenantId_key",
   "fields": [
    "key"
   ]
  }
 ],
 "McpServer": [
  {
   "name": "tenantId_name",
   "fields": [
    "name"
   ]
  }
 ],
 "Product": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "CustomField": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "Category": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "LicenseKey": [
  {
   "name": "tenantId_key",
   "fields": [
    "key"
   ]
  }
 ],
 "OrderWorkflow": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "OrderWorkflowStage": [
  {
   "name": "tenantId_workflowId_slug",
   "fields": [
    "workflowId",
    "slug"
   ]
  }
 ],
 "Page": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  },
  {
   "name": "tenantId_systemKey",
   "fields": [
    "systemKey"
   ]
  }
 ],
 "Partial": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "RouteConfig": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "Media": [
  {
   "name": "tenantId_key",
   "fields": [
    "key"
   ]
  }
 ],
 "MediaFolder": [
  {
   "name": "tenantId_parentId_slug",
   "fields": [
    "parentId",
    "slug"
   ]
  }
 ],
 "MediaTag": [
  {
   "name": "tenantId_name",
   "fields": [
    "name"
   ]
  },
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "Primitive": [
  {
   "name": "tenantId_name",
   "fields": [
    "name"
   ]
  }
 ],
 "Plugin": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  },
  {
   "name": "tenantId_name",
   "fields": [
    "name"
   ]
  }
 ],
 "Workflow": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "WorkflowTemplate": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "EmailRecipient": [
  {
   "name": "tenantId_campaignId_email",
   "fields": [
    "campaignId",
    "email"
   ]
  }
 ],
 "EmailSubscriber": [
  {
   "name": "tenantId_email",
   "fields": [
    "email"
   ]
  }
 ],
 "EmailTemplate": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "PuckTemplate": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "Form": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "BlogPost": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "BlogCategory": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "BlogTag": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "Cart": [
  {
   "name": "tenantId_sessionId",
   "fields": [
    "sessionId"
   ]
  }
 ],
 "DiscountCode": [
  {
   "name": "tenantId_code",
   "fields": [
    "code"
   ]
  }
 ],
 "GiftCard": [
  {
   "name": "tenantId_code",
   "fields": [
    "code"
   ]
  }
 ],
 "BackInStockSubscription": [
  {
   "name": "tenantId_email_productId_variantId",
   "fields": [
    "email",
    "productId",
    "variantId"
   ]
  }
 ],
 "ReviewVote": [
  {
   "name": "tenantId_reviewId_email",
   "fields": [
    "reviewId",
    "email"
   ]
  }
 ],
 "CustomComponent": [
  {
   "name": "tenantId_name",
   "fields": [
    "name"
   ]
  }
 ],
 "HelpTour": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "SubscriptionTier": [
  {
   "name": "tenantId_name",
   "fields": [
    "name"
   ]
  }
 ],
 "TenantPost": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "TenantPage": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "Team": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "TeamInvitation": [
  {
   "name": "tenantId_teamId_email",
   "fields": [
    "teamId",
    "email"
   ]
  }
 ],
 "Event": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "Tour": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "CmsModule": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "AdeRecord": [
  {
   "name": "tenantId_workspaceId_type_slug",
   "fields": [
    "workspaceId",
    "type",
    "slug"
   ]
  }
 ],
 "AnalyticsDashboard": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ],
 "BlogSeries": [
  {
   "name": "tenantId_slug",
   "fields": [
    "slug"
   ]
  }
 ]
}))
