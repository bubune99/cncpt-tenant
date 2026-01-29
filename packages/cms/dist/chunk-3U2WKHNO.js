"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }




var _chunkMT3LB7M4js = require('./chunk-MT3LB7M4.js');



var _chunkI5PINI5Tjs = require('./chunk-I5PINI5T.js');





var _chunkHY7GTCJMjs = require('./chunk-HY7GTCJM.js');

// src/lib/analytics/types.ts
var DEFAULT_ANALYTICS_SETTINGS = {
  enabled: false,
  googleEnabled: false,
  googleDebugMode: false,
  matomoEnabled: false,
  plausibleEnabled: false,
  respectDoNotTrack: true,
  anonymizeIp: true,
  cookieConsent: true
};
var DEFAULT_CONSENT = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "granted",
  personalization_storage: "denied",
  security_storage: "granted"
};

// src/lib/analytics/index.ts
var settingsCache = null;
var settingsCacheTime = 0;
var SETTINGS_CACHE_TTL = 60 * 1e3;
async function getAnalyticsSettings() {
  const now = Date.now();
  if (settingsCache && now - settingsCacheTime < SETTINGS_CACHE_TTL) {
    return settingsCache;
  }
  const records = await _chunkI5PINI5Tjs.prisma.setting.findMany({
    where: { key: { startsWith: "analytics." } }
  });
  const settings = _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, DEFAULT_ANALYTICS_SETTINGS);
  for (const record of records) {
    const key = record.key.replace("analytics.", "");
    switch (key) {
      case "enabled":
        settings.enabled = record.value === "true";
        break;
      case "googleEnabled":
        settings.googleEnabled = record.value === "true";
        break;
      case "googleMeasurementId":
        settings.googleMeasurementId = record.value;
        break;
      case "googleDebugMode":
        settings.googleDebugMode = record.value === "true";
        break;
      case "matomoEnabled":
        settings.matomoEnabled = record.value === "true";
        break;
      case "matomoUrl":
        settings.matomoUrl = record.value;
        break;
      case "matomoSiteId":
        settings.matomoSiteId = record.value;
        break;
      case "plausibleEnabled":
        settings.plausibleEnabled = record.value === "true";
        break;
      case "plausibleDomain":
        settings.plausibleDomain = record.value;
        break;
      case "respectDoNotTrack":
        settings.respectDoNotTrack = record.value === "true";
        break;
      case "anonymizeIp":
        settings.anonymizeIp = record.value === "true";
        break;
      case "cookieConsent":
        settings.cookieConsent = record.value === "true";
        break;
    }
  }
  if (!settings.googleMeasurementId) {
    settings.googleMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  }
  if (!settings.matomoUrl) {
    settings.matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL;
  }
  if (!settings.matomoSiteId) {
    settings.matomoSiteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;
  }
  settingsCache = settings;
  settingsCacheTime = now;
  return settings;
}
function clearAnalyticsSettingsCache() {
  settingsCache = null;
  settingsCacheTime = 0;
}
async function trackServerEvent(eventName, eventData, context) {
  try {
    await _chunkI5PINI5Tjs.prisma.analyticsEvent.create({
      data: {
        eventName,
        eventData: eventData || void 0,
        sessionId: context == null ? void 0 : context.sessionId,
        userId: context == null ? void 0 : context.userId,
        pageUrl: context == null ? void 0 : context.pageUrl,
        pageTitle: context == null ? void 0 : context.pageTitle,
        referrer: context == null ? void 0 : context.referrer,
        userAgent: context == null ? void 0 : context.userAgent,
        ipAddress: context == null ? void 0 : context.ipAddress
      }
    });
  } catch (error) {
    console.error("Failed to track server event:", error);
  }
}
async function trackPurchase(data, context) {
  await trackServerEvent("purchase", data, context);
}
async function getAnalyticsSummary(startDate, endDate) {
  const pageViews = await _chunkI5PINI5Tjs.prisma.analyticsEvent.count({
    where: {
      eventName: "page_view",
      createdAt: { gte: startDate, lte: endDate }
    }
  });
  const uniqueVisitors = await _chunkI5PINI5Tjs.prisma.analyticsEvent.groupBy({
    by: ["sessionId"],
    where: {
      sessionId: { not: null },
      createdAt: { gte: startDate, lte: endDate }
    }
  });
  const purchases = await _chunkI5PINI5Tjs.prisma.analyticsEvent.findMany({
    where: {
      eventName: "purchase",
      createdAt: { gte: startDate, lte: endDate }
    },
    select: { eventData: true }
  });
  const revenue = purchases.reduce((sum, p) => {
    const data = p.eventData;
    const value = typeof (data == null ? void 0 : data.value) === "number" ? data.value : 0;
    return sum + value;
  }, 0);
  const topPagesRaw = await _chunkI5PINI5Tjs.prisma.analyticsEvent.groupBy({
    by: ["pageUrl"],
    where: {
      eventName: "page_view",
      pageUrl: { not: null },
      createdAt: { gte: startDate, lte: endDate }
    },
    _count: { pageUrl: true },
    orderBy: { _count: { pageUrl: "desc" } },
    take: 10
  });
  const topPages = topPagesRaw.map((p) => ({
    url: p.pageUrl,
    views: p._count.pageUrl
  }));
  const topReferrersRaw = await _chunkI5PINI5Tjs.prisma.analyticsEvent.groupBy({
    by: ["referrer"],
    where: {
      referrer: { not: null },
      createdAt: { gte: startDate, lte: endDate }
    },
    _count: { referrer: true },
    orderBy: { _count: { referrer: "desc" } },
    take: 10
  });
  const topReferrers = topReferrersRaw.map((r) => ({
    referrer: r.referrer,
    count: r._count.referrer
  }));
  const eventBreakdownRaw = await _chunkI5PINI5Tjs.prisma.analyticsEvent.groupBy({
    by: ["eventName"],
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    _count: { eventName: true },
    orderBy: { _count: { eventName: "desc" } },
    take: 20
  });
  const eventBreakdown = eventBreakdownRaw.map((e) => ({
    event: e.eventName,
    count: e._count.eventName
  }));
  return {
    pageViews,
    uniqueVisitors: uniqueVisitors.length,
    purchases: purchases.length,
    revenue,
    topPages,
    topReferrers,
    eventBreakdown
  };
}
function generateGtagScript(measurementId, debugMode = false) {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}'${debugMode ? ", { 'debug_mode': true }" : ""});
  `;
}
function generateMatomoScript(matomoUrl, siteId) {
  const url = matomoUrl.endsWith("/") ? matomoUrl : `${matomoUrl}/`;
  return `
    var _paq = window._paq = window._paq || [];
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
      var u="${url}";
      _paq.push(['setTrackerUrl', u+'matomo.php']);
      _paq.push(['setSiteId', '${siteId}']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
    })();
  `;
}

// src/lib/blog/index.ts
function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
async function ensureUniqueSlug(slug, type, excludeId) {
  let uniqueSlug = slug;
  let counter = 1;
  while (true) {
    const existing = await (type === "post" ? _chunkI5PINI5Tjs.prisma.blogPost.findUnique({ where: { slug: uniqueSlug } }) : type === "category" ? _chunkI5PINI5Tjs.prisma.blogCategory.findUnique({ where: { slug: uniqueSlug } }) : _chunkI5PINI5Tjs.prisma.blogTag.findUnique({ where: { slug: uniqueSlug } }));
    if (!existing || existing.id === excludeId) {
      return uniqueSlug;
    }
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
}
async function createPost(input) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const slug = input.slug || generateSlug(input.title);
  const uniqueSlug = await ensureUniqueSlug(slug, "post");
  const wordCount = input.contentHtml ? input.contentHtml.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(wordCount / 200);
  const post = await _chunkI5PINI5Tjs.prisma.blogPost.create({
    data: {
      title: input.title,
      slug: uniqueSlug,
      excerpt: input.excerpt,
      content: input.content,
      contentHtml: input.contentHtml,
      authorId: input.authorId,
      featuredImageId: input.featuredImageId,
      status: (_a = input.status) != null ? _a : "DRAFT",
      visibility: (_b = input.visibility) != null ? _b : "PUBLIC",
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      noIndex: (_c = input.noIndex) != null ? _c : false,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      ogImageId: input.ogImageId,
      publishedAt: input.status === "PUBLISHED" ? (_d = input.publishedAt) != null ? _d : /* @__PURE__ */ new Date() : input.publishedAt,
      scheduledAt: input.scheduledAt,
      wordCount,
      readingTime,
      allowComments: (_e = input.allowComments) != null ? _e : true,
      featured: (_f = input.featured) != null ? _f : false,
      pinned: (_g = input.pinned) != null ? _g : false,
      categories: ((_h = input.categoryIds) == null ? void 0 : _h.length) ? {
        create: input.categoryIds.map((categoryId) => ({
          category: { connect: { id: categoryId } }
        }))
      } : void 0,
      tags: ((_i = input.tagIds) == null ? void 0 : _i.length) ? {
        create: input.tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } }
        }))
      } : void 0
    },
    include: {
      author: {
        select: { id: true, name: true, email: true }
      },
      featuredImage: true,
      categories: {
        include: { category: true }
      },
      tags: {
        include: { tag: true }
      }
    }
  });
  return post;
}
async function getPost(id) {
  return _chunkI5PINI5Tjs.prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true }
      },
      featuredImage: true,
      ogImage: true,
      categories: {
        include: { category: true }
      },
      tags: {
        include: { tag: true }
      },
      _count: {
        select: { comments: true }
      }
    }
  });
}
async function getPostBySlug(slug) {
  return _chunkI5PINI5Tjs.prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, email: true }
      },
      featuredImage: true,
      ogImage: true,
      categories: {
        include: { category: true }
      },
      tags: {
        include: { tag: true }
      },
      _count: {
        select: { comments: true }
      }
    }
  });
}
async function listPosts(options = {}) {
  const {
    status,
    visibility,
    authorId,
    categoryId,
    tagId,
    featured,
    search,
    limit = 20,
    offset = 0,
    orderBy = "createdAt",
    orderDir = "desc"
  } = options;
  const where = {};
  if (status) {
    where.status = status;
  }
  if (visibility) {
    where.visibility = visibility;
  }
  if (authorId) {
    where.authorId = authorId;
  }
  if (featured !== void 0) {
    where.featured = featured;
  }
  if (categoryId) {
    where.categories = {
      some: { categoryId }
    };
  }
  if (tagId) {
    where.tags = {
      some: { tagId }
    };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } }
    ];
  }
  const [posts, total] = await Promise.all([
    _chunkI5PINI5Tjs.prisma.blogPost.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [orderBy]: orderDir },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        featuredImage: {
          select: { id: true, url: true, alt: true }
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    }),
    _chunkI5PINI5Tjs.prisma.blogPost.count({ where })
  ]);
  return { posts, total, limit, offset };
}
async function updatePost(id, input) {
  var _a, _b;
  const existing = await _chunkI5PINI5Tjs.prisma.blogPost.findUnique({
    where: { id },
    include: {
      categories: true,
      tags: true
    }
  });
  if (!existing) {
    throw new Error("Post not found");
  }
  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, "post", id);
  }
  let wordCount = existing.wordCount;
  let readingTime = existing.readingTime;
  if (input.contentHtml !== void 0) {
    wordCount = input.contentHtml ? input.contentHtml.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length : 0;
    readingTime = Math.ceil(wordCount / 200);
  }
  if (input.categoryIds !== void 0) {
    await _chunkI5PINI5Tjs.prisma.blogPostCategory.deleteMany({
      where: { postId: id }
    });
  }
  if (input.tagIds !== void 0) {
    await _chunkI5PINI5Tjs.prisma.blogPostTag.deleteMany({
      where: { postId: id }
    });
  }
  const post = await _chunkI5PINI5Tjs.prisma.blogPost.update({
    where: { id },
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      contentHtml: input.contentHtml,
      authorId: input.authorId,
      featuredImageId: input.featuredImageId,
      status: input.status,
      visibility: input.visibility,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      noIndex: input.noIndex,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      ogImageId: input.ogImageId,
      publishedAt: input.status === "PUBLISHED" && !existing.publishedAt ? /* @__PURE__ */ new Date() : input.publishedAt,
      scheduledAt: input.scheduledAt,
      wordCount,
      readingTime,
      allowComments: input.allowComments,
      featured: input.featured,
      pinned: input.pinned,
      categories: ((_a = input.categoryIds) == null ? void 0 : _a.length) ? {
        create: input.categoryIds.map((categoryId) => ({
          category: { connect: { id: categoryId } }
        }))
      } : void 0,
      tags: ((_b = input.tagIds) == null ? void 0 : _b.length) ? {
        create: input.tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } }
        }))
      } : void 0
    },
    include: {
      author: {
        select: { id: true, name: true, email: true }
      },
      featuredImage: true,
      categories: {
        include: { category: true }
      },
      tags: {
        include: { tag: true }
      }
    }
  });
  return post;
}
async function deletePost(id) {
  await _chunkI5PINI5Tjs.prisma.blogPostCategory.deleteMany({ where: { postId: id } });
  await _chunkI5PINI5Tjs.prisma.blogPostTag.deleteMany({ where: { postId: id } });
  await _chunkI5PINI5Tjs.prisma.blogComment.deleteMany({ where: { postId: id } });
  return _chunkI5PINI5Tjs.prisma.blogPost.delete({ where: { id } });
}
async function incrementPostViews(id) {
  return _chunkI5PINI5Tjs.prisma.blogPost.update({
    where: { id },
    data: { viewCount: { increment: 1 } }
  });
}
async function createCategory(input) {
  const slug = input.slug || generateSlug(input.name);
  const uniqueSlug = await ensureUniqueSlug(slug, "category");
  return _chunkI5PINI5Tjs.prisma.blogCategory.create({
    data: {
      name: input.name,
      slug: uniqueSlug,
      description: input.description,
      parentId: input.parentId,
      imageId: input.imageId,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription
    },
    include: {
      parent: true,
      children: true,
      _count: {
        select: { posts: true }
      }
    }
  });
}
async function getCategory(id) {
  return _chunkI5PINI5Tjs.prisma.blogCategory.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
      image: true,
      _count: {
        select: { posts: true }
      }
    }
  });
}
async function getCategoryBySlug(slug) {
  return _chunkI5PINI5Tjs.prisma.blogCategory.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: true,
      image: true,
      _count: {
        select: { posts: true }
      }
    }
  });
}
async function listCategories(options = {}) {
  const { parentId, search, limit = 100, offset = 0 } = options;
  const where = {};
  if (parentId !== void 0) {
    where.parentId = parentId;
  }
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  const [categories, total] = await Promise.all([
    _chunkI5PINI5Tjs.prisma.blogCategory.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: "asc" },
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { posts: true }
        }
      }
    }),
    _chunkI5PINI5Tjs.prisma.blogCategory.count({ where })
  ]);
  return { categories, total, limit, offset };
}
async function updateCategory(id, input) {
  const existing = await _chunkI5PINI5Tjs.prisma.blogCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Category not found");
  }
  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, "category", id);
  }
  return _chunkI5PINI5Tjs.prisma.blogCategory.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description,
      parentId: input.parentId,
      imageId: input.imageId,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription
    },
    include: {
      parent: true,
      children: true,
      _count: {
        select: { posts: true }
      }
    }
  });
}
async function deleteCategory(id) {
  const children = await _chunkI5PINI5Tjs.prisma.blogCategory.count({ where: { parentId: id } });
  if (children > 0) {
    throw new Error("Cannot delete category with child categories");
  }
  await _chunkI5PINI5Tjs.prisma.blogPostCategory.deleteMany({ where: { categoryId: id } });
  return _chunkI5PINI5Tjs.prisma.blogCategory.delete({ where: { id } });
}
async function createTag(input) {
  const slug = input.slug || generateSlug(input.name);
  const uniqueSlug = await ensureUniqueSlug(slug, "tag");
  return _chunkI5PINI5Tjs.prisma.blogTag.create({
    data: {
      name: input.name,
      slug: uniqueSlug,
      description: input.description
    },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  });
}
async function getTag(id) {
  return _chunkI5PINI5Tjs.prisma.blogTag.findUnique({
    where: { id },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  });
}
async function getTagBySlug(slug) {
  return _chunkI5PINI5Tjs.prisma.blogTag.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  });
}
async function listTags(options = {}) {
  const { search, limit = 100, offset = 0 } = options;
  const where = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  const [tags, total] = await Promise.all([
    _chunkI5PINI5Tjs.prisma.blogTag.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    }),
    _chunkI5PINI5Tjs.prisma.blogTag.count({ where })
  ]);
  return { tags, total, limit, offset };
}
async function updateTag(id, input) {
  const existing = await _chunkI5PINI5Tjs.prisma.blogTag.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Tag not found");
  }
  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, "tag", id);
  }
  return _chunkI5PINI5Tjs.prisma.blogTag.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description
    },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  });
}
async function deleteTag(id) {
  await _chunkI5PINI5Tjs.prisma.blogPostTag.deleteMany({ where: { tagId: id } });
  return _chunkI5PINI5Tjs.prisma.blogTag.delete({ where: { id } });
}

// src/lib/cart/index.ts
var import_client = _chunkHY7GTCJMjs.__toESM.call(void 0, _chunkI5PINI5Tjs.require_default.call(void 0, ));
async function getOrCreateCart(identifier) {
  const { sessionId, userId, cartId } = identifier;
  if (cartId) {
    const cart2 = await _chunkI5PINI5Tjs.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          orderBy: { createdAt: "asc" }
        },
        discountCode: {
          select: { id: true, code: true, type: true, value: true }
        }
      }
    });
    if (cart2 && cart2.status === import_client.CartStatus.ACTIVE) {
      return cart2;
    }
  }
  let cart = await findExistingCart(identifier);
  if (!cart) {
    cart = await _chunkI5PINI5Tjs.prisma.cart.create({
      data: {
        sessionId: sessionId || null,
        userId: userId || null,
        status: import_client.CartStatus.ACTIVE
      },
      include: {
        items: true,
        discountCode: {
          select: { id: true, code: true, type: true, value: true }
        }
      }
    });
  }
  return cart;
}
async function findExistingCart(identifier) {
  const { sessionId, userId } = identifier;
  if (userId) {
    const cart = await _chunkI5PINI5Tjs.prisma.cart.findFirst({
      where: {
        userId,
        status: import_client.CartStatus.ACTIVE
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" }
        },
        discountCode: {
          select: { id: true, code: true, type: true, value: true }
        }
      }
    });
    if (cart) return cart;
  }
  if (sessionId) {
    const cart = await _chunkI5PINI5Tjs.prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          orderBy: { createdAt: "asc" }
        },
        discountCode: {
          select: { id: true, code: true, type: true, value: true }
        }
      }
    });
    if (cart && cart.status === import_client.CartStatus.ACTIVE) {
      return cart;
    }
  }
  return null;
}
async function addToCart(cartId, item) {
  var _a, _b, _c, _d;
  const { productId, variantId, quantity } = item;
  const product = await _chunkI5PINI5Tjs.prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: variantId ? { where: { id: variantId } } : false,
      images: { take: 1, orderBy: { position: "asc" }, include: { media: true } }
    }
  });
  if (!product) {
    throw new Error("Product not found");
  }
  const variant = variantId ? await _chunkI5PINI5Tjs.prisma.productVariant.findUnique({ where: { id: variantId } }) : null;
  const price = (_b = (_a = variant == null ? void 0 : variant.price) != null ? _a : product.basePrice) != null ? _b : 0;
  const title = product.title;
  const variantTitle = (variant == null ? void 0 : variant.sku) || null;
  const imageUrl = ((_d = (_c = product.images[0]) == null ? void 0 : _c.media) == null ? void 0 : _d.url) || null;
  const existingItem = await _chunkI5PINI5Tjs.prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId: {
        cartId,
        productId,
        variantId: variantId || ""
      }
    }
  });
  if (existingItem) {
    await _chunkI5PINI5Tjs.prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity }
    });
  } else {
    await _chunkI5PINI5Tjs.prisma.cartItem.create({
      data: {
        cartId,
        productId,
        variantId,
        quantity,
        title,
        variantTitle,
        price,
        imageUrl
      }
    });
  }
  return recalculateCart(cartId);
}
async function updateCartItem(cartId, itemId, quantity) {
  if (quantity <= 0) {
    return removeFromCart(cartId, itemId);
  }
  await _chunkI5PINI5Tjs.prisma.cartItem.update({
    where: { id: itemId, cartId },
    data: { quantity }
  });
  return recalculateCart(cartId);
}
async function removeFromCart(cartId, itemId) {
  await _chunkI5PINI5Tjs.prisma.cartItem.delete({
    where: { id: itemId, cartId }
  });
  return recalculateCart(cartId);
}
async function clearCart(cartId) {
  await _chunkI5PINI5Tjs.prisma.cartItem.deleteMany({
    where: { cartId }
  });
  return recalculateCart(cartId);
}
async function applyDiscount(cartId, code) {
  const discount = await _chunkI5PINI5Tjs.prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() }
  });
  if (!discount) {
    return {
      cart: await getCartById(cartId),
      error: "Invalid discount code"
    };
  }
  if (!discount.enabled) {
    return {
      cart: await getCartById(cartId),
      error: "This discount code is no longer active"
    };
  }
  const now = /* @__PURE__ */ new Date();
  if (discount.startsAt && discount.startsAt > now) {
    return {
      cart: await getCartById(cartId),
      error: "This discount code is not yet active"
    };
  }
  if (discount.expiresAt && discount.expiresAt < now) {
    return {
      cart: await getCartById(cartId),
      error: "This discount code has expired"
    };
  }
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return {
      cart: await getCartById(cartId),
      error: "This discount code has reached its usage limit"
    };
  }
  await _chunkI5PINI5Tjs.prisma.cart.update({
    where: { id: cartId },
    data: { discountCodeId: discount.id }
  });
  const cart = await recalculateCart(cartId);
  if (discount.minOrderValue && cart.subtotal < discount.minOrderValue) {
    await _chunkI5PINI5Tjs.prisma.cart.update({
      where: { id: cartId },
      data: { discountCodeId: null }
    });
    return {
      cart: await recalculateCart(cartId),
      error: `Minimum order value of $${(discount.minOrderValue / 100).toFixed(2)} required`
    };
  }
  return { cart };
}
async function removeDiscount(cartId) {
  await _chunkI5PINI5Tjs.prisma.cart.update({
    where: { id: cartId },
    data: { discountCodeId: null }
  });
  return recalculateCart(cartId);
}
async function updateCartEmail(cartId, email) {
  await _chunkI5PINI5Tjs.prisma.cart.update({
    where: { id: cartId },
    data: { email }
  });
  return getCartById(cartId);
}
async function mergeCartsOnLogin(sessionId, userId) {
  const guestCart = await _chunkI5PINI5Tjs.prisma.cart.findUnique({
    where: { sessionId },
    include: { items: true }
  });
  if (!guestCart || guestCart.status !== import_client.CartStatus.ACTIVE) {
    return findExistingCart({ userId });
  }
  let userCart = await _chunkI5PINI5Tjs.prisma.cart.findFirst({
    where: { userId, status: import_client.CartStatus.ACTIVE },
    include: { items: true }
  });
  if (!userCart) {
    await _chunkI5PINI5Tjs.prisma.cart.update({
      where: { id: guestCart.id },
      data: {
        userId,
        sessionId: null
        // Clear session ID
      }
    });
    return getCartById(guestCart.id);
  }
  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find(
      (item) => item.productId === guestItem.productId && item.variantId === guestItem.variantId
    );
    if (existingItem) {
      await _chunkI5PINI5Tjs.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + guestItem.quantity }
      });
    } else {
      await _chunkI5PINI5Tjs.prisma.cartItem.update({
        where: { id: guestItem.id },
        data: { cartId: userCart.id }
      });
    }
  }
  await _chunkI5PINI5Tjs.prisma.cart.update({
    where: { id: guestCart.id },
    data: { status: import_client.CartStatus.EXPIRED }
  });
  return recalculateCart(userCart.id);
}
async function convertCart(cartId, orderId) {
  await _chunkI5PINI5Tjs.prisma.cart.update({
    where: { id: cartId },
    data: {
      status: import_client.CartStatus.CONVERTED,
      convertedToOrderId: orderId
    }
  });
}
async function getCartById(cartId) {
  const cart = await _chunkI5PINI5Tjs.prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { createdAt: "asc" }
      },
      discountCode: {
        select: { id: true, code: true, type: true, value: true }
      }
    }
  });
  if (!cart) {
    throw new Error("Cart not found");
  }
  return cart;
}
async function recalculateCart(cartId) {
  const cart = await _chunkI5PINI5Tjs.prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: true,
      discountCode: true
    }
  });
  if (!cart) {
    throw new Error("Cart not found");
  }
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  let discountTotal = 0;
  if (cart.discountCode) {
    const discount = cart.discountCode;
    if (discount.type === "PERCENTAGE") {
      discountTotal = Math.round(subtotal * (discount.value / 100));
      if (discount.maxDiscount && discountTotal > discount.maxDiscount) {
        discountTotal = discount.maxDiscount;
      }
    } else if (discount.type === "FIXED") {
      discountTotal = Math.min(discount.value, subtotal);
    }
  }
  const total = Math.max(0, subtotal - discountTotal);
  await _chunkI5PINI5Tjs.prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotal,
      discountTotal,
      total,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  return getCartById(cartId);
}
async function markAbandonedCarts(timeoutMinutes = 60) {
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1e3);
  const result = await _chunkI5PINI5Tjs.prisma.cart.updateMany({
    where: {
      status: import_client.CartStatus.ACTIVE,
      updatedAt: { lt: cutoffTime },
      abandonedAt: null,
      items: { some: {} }
      // Has at least one item
    },
    data: {
      status: import_client.CartStatus.ABANDONED,
      abandonedAt: /* @__PURE__ */ new Date()
    }
  });
  return result.count;
}
async function getAbandonedCartsForRecovery(minAgeMinutes = 60, maxAgeHours = 72) {
  const minAge = new Date(Date.now() - minAgeMinutes * 60 * 1e3);
  const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1e3);
  const carts = await _chunkI5PINI5Tjs.prisma.cart.findMany({
    where: {
      status: import_client.CartStatus.ABANDONED,
      abandonedAt: {
        gte: maxAge,
        lte: minAge
      },
      recoveryEmailAt: null,
      email: { not: null }
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" }
      },
      discountCode: {
        select: { id: true, code: true, type: true, value: true }
      }
    }
  });
  return carts.filter((cart) => cart.email !== null);
}
async function markRecoveryEmailSent(cartId) {
  await _chunkI5PINI5Tjs.prisma.cart.update({
    where: { id: cartId },
    data: { recoveryEmailAt: /* @__PURE__ */ new Date() }
  });
}
async function markCartRecovered(cartId) {
  await _chunkI5PINI5Tjs.prisma.cart.update({
    where: { id: cartId },
    data: {
      status: import_client.CartStatus.ACTIVE,
      recoveredAt: /* @__PURE__ */ new Date()
    }
  });
  return getCartById(cartId);
}
async function cleanupExpiredCarts(expiryDays = 30) {
  const cutoffTime = new Date(Date.now() - expiryDays * 24 * 60 * 60 * 1e3);
  await _chunkI5PINI5Tjs.prisma.cartItem.deleteMany({
    where: {
      cart: {
        OR: [
          { status: import_client.CartStatus.EXPIRED },
          {
            status: import_client.CartStatus.ABANDONED,
            abandonedAt: { lt: cutoffTime }
          }
        ]
      }
    }
  });
  const result = await _chunkI5PINI5Tjs.prisma.cart.deleteMany({
    where: {
      OR: [
        { status: import_client.CartStatus.EXPIRED },
        {
          status: import_client.CartStatus.ABANDONED,
          abandonedAt: { lt: cutoffTime }
        }
      ]
    }
  });
  return result.count;
}
async function getCartStats() {
  const [active, abandoned, recovered, converted, avgValue] = await Promise.all([
    _chunkI5PINI5Tjs.prisma.cart.count({ where: { status: import_client.CartStatus.ACTIVE } }),
    _chunkI5PINI5Tjs.prisma.cart.count({ where: { status: import_client.CartStatus.ABANDONED } }),
    _chunkI5PINI5Tjs.prisma.cart.count({ where: { recoveredAt: { not: null } } }),
    _chunkI5PINI5Tjs.prisma.cart.count({ where: { status: import_client.CartStatus.CONVERTED } }),
    _chunkI5PINI5Tjs.prisma.cart.aggregate({
      where: { status: import_client.CartStatus.ACTIVE, total: { gt: 0 } },
      _avg: { total: true }
    })
  ]);
  const totalWithItems = abandoned + converted + recovered;
  const conversionRate = totalWithItems > 0 ? converted / totalWithItems * 100 : 0;
  return {
    activeCarts: active,
    abandonedCarts: abandoned,
    recoveredCarts: recovered,
    conversionRate: Math.round(conversionRate * 100) / 100,
    averageCartValue: avgValue._avg.total || 0
  };
}

// src/lib/discounts/validator.ts
async function validateDiscountCode(context) {
  const { code, subtotal, userId, email, isFirstOrder, items } = context;
  const discount = await _chunkI5PINI5Tjs.prisma.discountCode.findUnique({
    where: { code: code.toUpperCase().trim() }
  });
  if (!discount) {
    return {
      valid: false,
      discount: null,
      error: "Invalid discount code",
      errorCode: "NOT_FOUND"
    };
  }
  if (!discount.enabled) {
    return {
      valid: false,
      discount: null,
      error: "This discount code is no longer active",
      errorCode: "DISABLED"
    };
  }
  const now = /* @__PURE__ */ new Date();
  if (discount.startsAt > now) {
    return {
      valid: false,
      discount: null,
      error: "This discount code is not yet active",
      errorCode: "NOT_STARTED"
    };
  }
  if (discount.expiresAt && discount.expiresAt < now) {
    return {
      valid: false,
      discount: null,
      error: "This discount code has expired",
      errorCode: "EXPIRED"
    };
  }
  if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
    return {
      valid: false,
      discount: null,
      error: "This discount code has reached its usage limit",
      errorCode: "USAGE_LIMIT_REACHED"
    };
  }
  if (discount.perCustomer !== null && (userId || email)) {
    const customerUsageCount = await _chunkI5PINI5Tjs.prisma.discountUsage.count({
      where: {
        discountCodeId: discount.id,
        OR: [
          ...userId ? [{ userId }] : [],
          ...email ? [{ email }] : []
        ]
      }
    });
    if (customerUsageCount >= discount.perCustomer) {
      return {
        valid: false,
        discount: null,
        error: "You have already used this discount code the maximum number of times",
        errorCode: "CUSTOMER_LIMIT_REACHED"
      };
    }
  }
  if (discount.minOrderValue !== null && subtotal < discount.minOrderValue) {
    const minAmount = (discount.minOrderValue / 100).toFixed(2);
    return {
      valid: false,
      discount: null,
      error: `Minimum order of $${minAmount} required for this discount`,
      errorCode: "MIN_ORDER_NOT_MET"
    };
  }
  if (discount.firstOrderOnly && !isFirstOrder) {
    return {
      valid: false,
      discount: null,
      error: "This discount code is only valid for first orders",
      errorCode: "FIRST_ORDER_ONLY"
    };
  }
  if (items && items.length > 0 && discount.applyTo !== "ORDER" && discount.applyTo !== "SHIPPING") {
    const applicableItems = getApplicableItems(discount, items);
    if (applicableItems.length === 0) {
      return {
        valid: false,
        discount: null,
        error: "This discount code does not apply to any items in your cart",
        errorCode: "NO_APPLICABLE_ITEMS"
      };
    }
  }
  return {
    valid: true,
    discount
  };
}
function getApplicableItems(discount, items) {
  return items.filter((item) => {
    if (discount.excludeProductIds.includes(item.productId)) {
      return false;
    }
    if (discount.excludeSaleItems && item.isOnSale) {
      return false;
    }
    if (discount.applyTo === "ORDER") {
      return true;
    }
    if (discount.applyTo === "PRODUCT") {
      return discount.productIds.length === 0 || discount.productIds.includes(item.productId);
    }
    if (discount.applyTo === "CATEGORY") {
      if (discount.categoryIds.length === 0) return true;
      return item.categoryIds.some((catId) => discount.categoryIds.includes(catId));
    }
    if (discount.applyTo === "SHIPPING") {
      return false;
    }
    return false;
  });
}
async function isFirstOrderForUser(userId, email) {
  if (!userId && !email) {
    return true;
  }
  const existingOrders = await _chunkI5PINI5Tjs.prisma.order.count({
    where: {
      OR: [
        ...userId ? [{ customerId: userId }] : [],
        ...email ? [{ email }] : []
      ],
      paymentStatus: "PAID"
    }
  });
  return existingOrders === 0;
}
async function recordDiscountUsage(discountCodeId, orderId, userId, email, discountAmount) {
  const [usage] = await _chunkI5PINI5Tjs.prisma.$transaction([
    _chunkI5PINI5Tjs.prisma.discountUsage.create({
      data: {
        discountCodeId,
        orderId,
        userId,
        email,
        discountAmount
      }
    }),
    _chunkI5PINI5Tjs.prisma.discountCode.update({
      where: { id: discountCodeId },
      data: {
        usageCount: { increment: 1 },
        ordersCount: { increment: 1 },
        revenue: { increment: discountAmount }
      }
    })
  ]);
  return usage;
}

// src/lib/discounts/calculator.ts
function calculateDiscount(discount, items, totals) {
  const { subtotal, shippingTotal } = totals;
  if (discount.type === "FREE_SHIPPING") {
    return {
      discountAmount: shippingTotal,
      discountedSubtotal: subtotal,
      discountedShipping: 0,
      appliedTo: "shipping",
      itemDiscounts: [],
      description: "Free Shipping"
    };
  }
  const applicableItems = discount.applyTo === "SHIPPING" ? [] : getApplicableItems(discount, items);
  const applicableSubtotal = discount.applyTo === "ORDER" ? subtotal : applicableItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (applicableSubtotal === 0) {
    return {
      discountAmount: 0,
      discountedSubtotal: subtotal,
      discountedShipping: shippingTotal,
      appliedTo: mapApplyTo(discount.applyTo),
      itemDiscounts: [],
      description: "No applicable items"
    };
  }
  let rawDiscount = 0;
  let description = "";
  switch (discount.type) {
    case "PERCENTAGE":
      rawDiscount = Math.floor(applicableSubtotal * discount.value / 100);
      description = `${discount.value}% off`;
      break;
    case "FIXED":
      rawDiscount = discount.value;
      description = `$${(discount.value / 100).toFixed(2)} off`;
      break;
    case "BUY_X_GET_Y":
      rawDiscount = calculateBuyXGetYDiscount(discount, applicableItems);
      description = "Buy X Get Y promotion";
      break;
    default:
      rawDiscount = 0;
      description = "Unknown discount type";
  }
  let discountAmount = rawDiscount;
  if (discount.maxDiscount !== null && discountAmount > discount.maxDiscount) {
    discountAmount = discount.maxDiscount;
    description += ` (max $${(discount.maxDiscount / 100).toFixed(2)})`;
  }
  discountAmount = Math.min(discountAmount, applicableSubtotal);
  const itemDiscounts = calculateItemDiscounts(
    discount,
    applicableItems,
    discountAmount,
    applicableSubtotal
  );
  return {
    discountAmount,
    discountedSubtotal: subtotal - discountAmount,
    discountedShipping: shippingTotal,
    appliedTo: mapApplyTo(discount.applyTo),
    itemDiscounts,
    description
  };
}
function calculateBuyXGetYDiscount(discount, items) {
  let totalDiscount = 0;
  for (const item of items) {
    const freeItems = Math.floor(item.quantity / 3);
    const itemDiscount = Math.floor(item.price * freeItems * discount.value / 100);
    totalDiscount += itemDiscount;
  }
  return totalDiscount;
}
function calculateItemDiscounts(discount, applicableItems, totalDiscount, applicableSubtotal) {
  if (applicableSubtotal === 0) return [];
  return applicableItems.map((item) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = Math.floor(itemTotal / applicableSubtotal * totalDiscount);
    return {
      productId: item.productId,
      variantId: item.variantId,
      originalPrice: itemTotal,
      discountAmount: itemDiscount,
      finalPrice: itemTotal - itemDiscount
    };
  });
}
function mapApplyTo(applyTo) {
  switch (applyTo) {
    case "ORDER":
      return "order";
    case "PRODUCT":
      return "products";
    case "CATEGORY":
      return "categories";
    case "SHIPPING":
      return "shipping";
    default:
      return "order";
  }
}
function formatDiscount(discount) {
  switch (discount.type) {
    case "PERCENTAGE":
      return `${discount.value}% off`;
    case "FIXED":
      return `$${(discount.value / 100).toFixed(2)} off`;
    case "FREE_SHIPPING":
      return "Free Shipping";
    case "BUY_X_GET_Y":
      return "Special Promotion";
    default:
      return discount.code;
  }
}
function getDiscountSummary(discount) {
  const conditions = [];
  if (discount.minOrderValue) {
    conditions.push(`Min order: $${(discount.minOrderValue / 100).toFixed(2)}`);
  }
  if (discount.maxDiscount) {
    conditions.push(`Max discount: $${(discount.maxDiscount / 100).toFixed(2)}`);
  }
  if (discount.usageLimit) {
    conditions.push(`${discount.usageLimit - discount.usageCount} uses remaining`);
  }
  if (discount.firstOrderOnly) {
    conditions.push("First order only");
  }
  if (discount.expiresAt) {
    const expires = new Date(discount.expiresAt);
    conditions.push(`Expires: ${expires.toLocaleDateString()}`);
  }
  if (discount.applyTo === "PRODUCT" && discount.productIds.length > 0) {
    conditions.push("Specific products only");
  }
  if (discount.applyTo === "CATEGORY" && discount.categoryIds.length > 0) {
    conditions.push("Specific categories only");
  }
  if (discount.excludeSaleItems) {
    conditions.push("Excludes sale items");
  }
  return {
    type: discount.type,
    value: formatDiscount(discount),
    conditions
  };
}
function calculateCartTotals(items, shippingTotal, taxRate, discount) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discountTotal = 0;
  let discountedSubtotal = subtotal;
  let discountedShipping = shippingTotal;
  let discountDescription = null;
  if (discount) {
    const calculation = calculateDiscount(discount, items, { subtotal, shippingTotal });
    discountTotal = calculation.discountAmount;
    discountedSubtotal = calculation.discountedSubtotal;
    discountedShipping = calculation.discountedShipping;
    discountDescription = calculation.description;
  }
  const taxTotal = Math.floor(discountedSubtotal * taxRate / 100);
  const total = discountedSubtotal + discountedShipping + taxTotal;
  return {
    subtotal,
    discountTotal,
    discountedSubtotal,
    shippingTotal: discountedShipping,
    taxTotal,
    total,
    discountDescription
  };
}

// src/lib/discounts/stripe-sync.ts
var _stripe = require('stripe'); var _stripe2 = _interopRequireDefault(_stripe);

// src/lib/stripe/index.ts


// src/lib/stripe/types.ts
var DEFAULT_STRIPE_SETTINGS = {
  enabled: false,
  testMode: true,
  currency: "usd",
  supportedPaymentMethods: ["card"],
  automaticTax: false,
  billingAddressCollection: "auto"
};

// src/lib/stripe/index.ts
var settingsCache2 = null;
var settingsCacheTime2 = 0;
var SETTINGS_CACHE_TTL2 = 60 * 1e3;
var stripeClient = null;
async function getStripeClient() {
  const settings = await getStripeSettings();
  if (!settings.secretKey) {
    const envKey = process.env.STRIPE_SECRET_KEY;
    if (!envKey) {
      throw new Error("Stripe secret key not configured");
    }
    if (!stripeClient) {
      stripeClient = new (0, _stripe2.default)(envKey, { apiVersion: "2025-02-24.acacia" });
    }
    return stripeClient;
  }
  stripeClient = new (0, _stripe2.default)(settings.secretKey, { apiVersion: "2025-02-24.acacia" });
  return stripeClient;
}
async function getStripeSettings() {
  const now = Date.now();
  if (settingsCache2 && now - settingsCacheTime2 < SETTINGS_CACHE_TTL2) {
    return settingsCache2;
  }
  const settingRecords = await _chunkI5PINI5Tjs.prisma.setting.findMany({
    where: {
      key: { startsWith: "stripe." }
    }
  });
  const settings = _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, DEFAULT_STRIPE_SETTINGS);
  for (const record of settingRecords) {
    const key = record.key.replace("stripe.", "");
    switch (key) {
      case "enabled":
        settings.enabled = record.value === "true";
        break;
      case "testMode":
        settings.testMode = record.value === "true";
        break;
      case "secretKey":
        settings.secretKey = record.value;
        break;
      case "publishableKey":
        settings.publishableKey = record.value;
        break;
      case "webhookSecret":
        settings.webhookSecret = record.value;
        break;
      case "currency":
        settings.currency = record.value;
        break;
      case "statementDescriptor":
        settings.statementDescriptor = record.value;
        break;
      case "supportedPaymentMethods":
        settings.supportedPaymentMethods = JSON.parse(record.value);
        break;
      case "automaticTax":
        settings.automaticTax = record.value === "true";
        break;
      case "billingAddressCollection":
        settings.billingAddressCollection = record.value;
        break;
    }
  }
  if (!settings.secretKey) {
    settings.secretKey = process.env.STRIPE_SECRET_KEY;
  }
  if (!settings.publishableKey) {
    settings.publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  }
  if (!settings.webhookSecret) {
    settings.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }
  settingsCache2 = settings;
  settingsCacheTime2 = now;
  return settings;
}
function clearStripeSettingsCache() {
  settingsCache2 = null;
  settingsCacheTime2 = 0;
  stripeClient = null;
}
async function createCheckoutSession(request) {
  const stripe = await getStripeClient();
  const settings = await getStripeSettings();
  const lineItems = request.items.map((item) => {
    if (item.stripePriceId) {
      return {
        price: item.stripePriceId,
        quantity: item.quantity
      };
    }
    return {
      price_data: {
        currency: settings.currency,
        product_data: {
          name: item.name,
          description: item.description,
          images: item.images,
          metadata: item.productId ? { productId: item.productId } : void 0
        },
        unit_amount: item.price
      },
      quantity: item.quantity
    };
  });
  const sessionParams = {
    mode: request.mode || "payment",
    line_items: lineItems,
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
    customer_email: request.customerEmail,
    allow_promotion_codes: request.allowPromotionCodes,
    billing_address_collection: settings.billingAddressCollection,
    metadata: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, request.metadata), {
      orderId: request.orderId || ""
    })
  };
  if (request.customerId) {
    sessionParams.customer = request.customerId;
    delete sessionParams.customer_email;
  }
  if (request.shippingAddressCollection) {
    sessionParams.shipping_address_collection = {
      allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR"]
    };
  }
  if (request.shippingOptions && request.shippingOptions.length > 0) {
    sessionParams.shipping_options = request.shippingOptions.map((option) => ({
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: {
          amount: option.amount,
          currency: settings.currency
        },
        display_name: option.displayName,
        delivery_estimate: option.deliveryEstimate
      }
    }));
  }
  if (settings.automaticTax) {
    sessionParams.automatic_tax = { enabled: true };
  }
  if (settings.supportedPaymentMethods.length > 0) {
    sessionParams.payment_method_types = settings.supportedPaymentMethods;
  }
  const session = await stripe.checkout.sessions.create(sessionParams);
  return {
    sessionId: session.id,
    url: session.url
  };
}
async function createPaymentIntent(request) {
  const stripe = await getStripeClient();
  const settings = await getStripeSettings();
  const params = {
    amount: request.amount,
    currency: request.currency || settings.currency,
    capture_method: request.captureMethod || "automatic",
    metadata: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, request.metadata), {
      orderId: request.orderId || ""
    })
  };
  if (request.customerId) {
    params.customer = request.customerId;
  }
  if (request.paymentMethodTypes && request.paymentMethodTypes.length > 0) {
    params.payment_method_types = request.paymentMethodTypes;
  } else {
    params.automatic_payment_methods = { enabled: true };
  }
  if (settings.statementDescriptor) {
    params.statement_descriptor = settings.statementDescriptor.substring(0, 22);
  }
  const paymentIntent = await stripe.paymentIntents.create(params);
  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    status: paymentIntent.status
  };
}
async function capturePaymentIntent(paymentIntentId, amount) {
  const stripe = await getStripeClient();
  const params = {};
  if (amount) {
    params.amount_to_capture = amount;
  }
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, params);
  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    status: paymentIntent.status
  };
}
async function cancelPaymentIntent(paymentIntentId) {
  const stripe = await getStripeClient();
  await stripe.paymentIntents.cancel(paymentIntentId);
}
async function createCustomer(request) {
  const stripe = await getStripeClient();
  const params = {
    email: request.email,
    name: request.name,
    phone: request.phone,
    metadata: request.metadata
  };
  if (request.address) {
    params.address = {
      line1: request.address.line1,
      line2: request.address.line2,
      city: request.address.city,
      state: request.address.state,
      postal_code: request.address.postalCode,
      country: request.address.country
    };
  }
  const customer = await stripe.customers.create(params);
  return customer.id;
}
async function getOrCreateCustomer(email, name) {
  const stripe = await getStripeClient();
  const customers = await stripe.customers.list({
    email,
    limit: 1
  });
  if (customers.data.length > 0) {
    return customers.data[0].id;
  }
  const customer = await stripe.customers.create({
    email,
    name
  });
  return customer.id;
}
async function createSubscription(request) {
  const stripe = await getStripeClient();
  const params = {
    customer: request.customerId,
    items: [{ price: request.priceId }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
    metadata: request.metadata
  };
  if (request.trialPeriodDays) {
    params.trial_period_days = request.trialPeriodDays;
  }
  if (request.cancelAtPeriodEnd) {
    params.cancel_at_period_end = true;
  }
  const subscription = await stripe.subscriptions.create(params);
  const invoice = subscription.latest_invoice;
  const paymentIntent = invoice == null ? void 0 : invoice.payment_intent;
  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    clientSecret: (paymentIntent == null ? void 0 : paymentIntent.client_secret) || void 0
  };
}
async function cancelSubscription(subscriptionId, immediately = false) {
  const stripe = await getStripeClient();
  if (immediately) {
    await stripe.subscriptions.cancel(subscriptionId);
  } else {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  }
}
async function createRefund(request) {
  const stripe = await getStripeClient();
  const params = {
    payment_intent: request.paymentIntentId,
    reason: request.reason,
    metadata: request.metadata
  };
  if (request.amount) {
    params.amount = request.amount;
  }
  const refund = await stripe.refunds.create(params);
  return {
    refundId: refund.id,
    status: refund.status,
    amount: refund.amount
  };
}
async function getCheckoutSession(sessionId) {
  const stripe = await getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "customer", "payment_intent"]
  });
}
async function getPaymentIntent(paymentIntentId) {
  const stripe = await getStripeClient();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}
async function constructWebhookEvent(payload, signature) {
  const stripe = await getStripeClient();
  const settings = await getStripeSettings();
  const webhookSecret = settings.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
async function createBillingPortalSession(customerId, returnUrl) {
  const stripe = await getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });
  return session.url;
}
async function listPaymentMethods(customerId, type = "card") {
  const stripe = await getStripeClient();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type
  });
  return paymentMethods.data;
}
async function listInvoices(customerId, limit = 10) {
  const stripe = await getStripeClient();
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit
  });
  return invoices.data;
}
async function getProduct(productId) {
  const stripe = await getStripeClient();
  return stripe.products.retrieve(productId);
}
async function createProduct(name, description, images, metadata) {
  const stripe = await getStripeClient();
  return stripe.products.create({
    name,
    description,
    images,
    metadata
  });
}
async function createPrice(productId, unitAmount, currency, recurring) {
  const stripe = await getStripeClient();
  const settings = await getStripeSettings();
  const params = {
    product: productId,
    unit_amount: unitAmount,
    currency: currency || settings.currency
  };
  if (recurring) {
    params.recurring = recurring;
  }
  return stripe.prices.create(params);
}

// src/lib/discounts/stripe-sync.ts
var stripeClient2 = null;
async function getStripeClient2() {
  const settings = await getStripeSettings();
  const secretKey = settings.secretKey || process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe secret key not configured");
  }
  if (!stripeClient2) {
    stripeClient2 = new (0, _stripe2.default)(secretKey, { apiVersion: "2025-02-24.acacia" });
  }
  return stripeClient2;
}
function mapDiscountToStripeCoupon(discount) {
  const metadata = {
    discountCodeId: discount.id,
    source: "nextjs-cms"
  };
  const params = {
    name: discount.code,
    metadata
  };
  switch (discount.type) {
    case "PERCENTAGE":
      params.percent_off = discount.value;
      break;
    case "FIXED":
      params.amount_off = discount.value;
      params.currency = "usd";
      break;
    case "FREE_SHIPPING":
      params.percent_off = 0;
      metadata.freeShipping = "true";
      break;
    case "BUY_X_GET_Y":
      params.percent_off = discount.value;
      metadata.buyXGetY = "true";
      break;
  }
  if (discount.expiresAt) {
    params.redeem_by = Math.floor(discount.expiresAt.getTime() / 1e3);
  }
  if (discount.usageLimit) {
    params.max_redemptions = discount.usageLimit;
  }
  return params;
}
async function createStripeCoupon(discountId) {
  const stripe = await getStripeClient2();
  const discount = await _chunkI5PINI5Tjs.prisma.discountCode.findUnique({
    where: { id: discountId }
  });
  if (!discount) {
    throw new Error("Discount code not found");
  }
  const couponParams = mapDiscountToStripeCoupon(discount);
  const coupon = await stripe.coupons.create(couponParams);
  await _chunkI5PINI5Tjs.prisma.discountCode.update({
    where: { id: discountId },
    data: {
      stripeCouponId: coupon.id,
      stripeSyncedAt: /* @__PURE__ */ new Date()
    }
  });
  return coupon.id;
}
async function createStripePromotionCode(discountId) {
  const stripe = await getStripeClient2();
  const discount = await _chunkI5PINI5Tjs.prisma.discountCode.findUnique({
    where: { id: discountId }
  });
  if (!discount) {
    throw new Error("Discount code not found");
  }
  let stripeCouponId = discount.stripeCouponId;
  if (!stripeCouponId) {
    stripeCouponId = await createStripeCoupon(discountId);
  }
  const promoParams = {
    coupon: stripeCouponId,
    code: discount.code,
    active: discount.enabled,
    metadata: {
      discountCodeId: discount.id,
      source: "nextjs-cms"
    }
  };
  const restrictions = {};
  if (discount.minOrderValue) {
    restrictions.minimum_amount = discount.minOrderValue;
    restrictions.minimum_amount_currency = "usd";
  }
  if (discount.firstOrderOnly) {
    restrictions.first_time_transaction = true;
  }
  if (Object.keys(restrictions).length > 0) {
    promoParams.restrictions = restrictions;
  }
  if (discount.usageLimit) {
    promoParams.max_redemptions = discount.usageLimit;
  }
  if (discount.expiresAt) {
    promoParams.expires_at = Math.floor(discount.expiresAt.getTime() / 1e3);
  }
  const promotionCode = await stripe.promotionCodes.create(promoParams);
  await _chunkI5PINI5Tjs.prisma.discountCode.update({
    where: { id: discountId },
    data: {
      stripePromotionCodeId: promotionCode.id,
      stripeSyncedAt: /* @__PURE__ */ new Date()
    }
  });
  return promotionCode.id;
}
async function syncDiscountToStripe(discountId) {
  const stripe = await getStripeClient2();
  const discount = await _chunkI5PINI5Tjs.prisma.discountCode.findUnique({
    where: { id: discountId }
  });
  if (!discount) {
    throw new Error("Discount code not found");
  }
  if (!discount.stripeSyncEnabled) {
    throw new Error("Stripe sync is disabled for this discount");
  }
  let couponId = discount.stripeCouponId;
  let promotionCodeId = discount.stripePromotionCodeId;
  if (couponId) {
    try {
      await stripe.coupons.update(couponId, {
        name: discount.code,
        metadata: {
          discountCodeId: discount.id,
          source: "nextjs-cms",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (error) {
      console.log("Stripe coupon not found, creating new one");
      couponId = await createStripeCoupon(discountId);
    }
  } else {
    couponId = await createStripeCoupon(discountId);
  }
  if (promotionCodeId) {
    try {
      await stripe.promotionCodes.update(promotionCodeId, {
        active: discount.enabled,
        metadata: {
          discountCodeId: discount.id,
          source: "nextjs-cms",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (error) {
      console.log("Stripe promotion code not found, creating new one");
      promotionCodeId = await createStripePromotionCode(discountId);
    }
  } else {
    promotionCodeId = await createStripePromotionCode(discountId);
  }
  await _chunkI5PINI5Tjs.prisma.discountCode.update({
    where: { id: discountId },
    data: { stripeSyncedAt: /* @__PURE__ */ new Date() }
  });
  return { couponId, promotionCodeId };
}
async function deleteStripeDiscount(discountId) {
  const stripe = await getStripeClient2();
  const discount = await _chunkI5PINI5Tjs.prisma.discountCode.findUnique({
    where: { id: discountId }
  });
  if (!discount) {
    return;
  }
  if (discount.stripePromotionCodeId) {
    try {
      await stripe.promotionCodes.update(discount.stripePromotionCodeId, {
        active: false
      });
    } catch (error) {
      console.error("Failed to deactivate Stripe promotion code:", error);
    }
  }
  if (discount.stripeCouponId) {
    try {
      await stripe.coupons.del(discount.stripeCouponId);
    } catch (error) {
      console.error("Failed to delete Stripe coupon:", error);
    }
  }
  await _chunkI5PINI5Tjs.prisma.discountCode.update({
    where: { id: discountId },
    data: {
      stripeCouponId: null,
      stripePromotionCodeId: null,
      stripeSyncedAt: null
    }
  });
}
async function toggleStripePromotionCode(discountId, active) {
  const stripe = await getStripeClient2();
  const discount = await _chunkI5PINI5Tjs.prisma.discountCode.findUnique({
    where: { id: discountId }
  });
  if (!(discount == null ? void 0 : discount.stripePromotionCodeId)) {
    return;
  }
  await stripe.promotionCodes.update(discount.stripePromotionCodeId, {
    active
  });
}
async function importFromStripe(promotionCodeId) {
  var _a, _b, _c;
  const stripe = await getStripeClient2();
  const promotionCode = await stripe.promotionCodes.retrieve(promotionCodeId, {
    expand: ["coupon"]
  });
  const coupon = promotionCode.coupon;
  const existing = await _chunkI5PINI5Tjs.prisma.discountCode.findFirst({
    where: {
      OR: [
        { stripePromotionCodeId: promotionCodeId },
        { stripeCouponId: coupon.id },
        { code: promotionCode.code }
      ]
    }
  });
  if (existing) {
    throw new Error(`Discount code already exists: ${existing.code}`);
  }
  let type = "PERCENTAGE";
  let value = 0;
  if (coupon.percent_off) {
    type = "PERCENTAGE";
    value = coupon.percent_off;
  } else if (coupon.amount_off) {
    type = "FIXED";
    value = coupon.amount_off;
  }
  if (((_a = coupon.metadata) == null ? void 0 : _a.freeShipping) === "true") {
    type = "FREE_SHIPPING";
  }
  const discount = await _chunkI5PINI5Tjs.prisma.discountCode.create({
    data: {
      code: promotionCode.code,
      description: coupon.name || `Imported from Stripe: ${promotionCode.code}`,
      type,
      value,
      minOrderValue: ((_b = promotionCode.restrictions) == null ? void 0 : _b.minimum_amount) || null,
      usageLimit: promotionCode.max_redemptions || null,
      usageCount: promotionCode.times_redeemed || 0,
      firstOrderOnly: ((_c = promotionCode.restrictions) == null ? void 0 : _c.first_time_transaction) || false,
      startsAt: /* @__PURE__ */ new Date(),
      expiresAt: promotionCode.expires_at ? new Date(promotionCode.expires_at * 1e3) : null,
      enabled: promotionCode.active,
      stripeCouponId: coupon.id,
      stripePromotionCodeId: promotionCodeId,
      stripeSyncEnabled: true,
      stripeSyncedAt: /* @__PURE__ */ new Date()
    }
  });
  return discount.id;
}
async function listUnimportedStripeCoupons() {
  const stripe = await getStripeClient2();
  const coupons = await stripe.coupons.list({ limit: 100 });
  const importedCoupons = await _chunkI5PINI5Tjs.prisma.discountCode.findMany({
    where: { stripeCouponId: { not: null } },
    select: { stripeCouponId: true }
  });
  const importedIds = new Set(importedCoupons.map((d) => d.stripeCouponId));
  return coupons.data.filter((c) => !importedIds.has(c.id)).map((c) => ({
    id: c.id,
    name: c.name,
    percentOff: c.percent_off,
    amountOff: c.amount_off,
    currency: c.currency,
    valid: c.valid
  }));
}
async function validateStripePromotionCode(code) {
  const stripe = await getStripeClient2();
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1
    });
    if (promotionCodes.data.length === 0) {
      return { valid: false, error: "Promotion code not found" };
    }
    const promoCode = promotionCodes.data[0];
    const coupon = promoCode.coupon;
    if (!coupon.valid) {
      return { valid: false, error: "Coupon is no longer valid" };
    }
    return {
      valid: true,
      promotionCodeId: promoCode.id,
      couponId: coupon.id,
      percentOff: coupon.percent_off || void 0,
      amountOff: coupon.amount_off || void 0
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
}

// src/lib/forms/types.ts
var FIELD_TEMPLATES = {
  name: {
    type: "text",
    label: "Name",
    placeholder: "Enter your name",
    validation: [{ type: "required", message: "Name is required" }]
  },
  email: {
    type: "email",
    label: "Email",
    placeholder: "Enter your email",
    validation: [
      { type: "required", message: "Email is required" },
      { type: "email", message: "Please enter a valid email" }
    ]
  },
  phone: {
    type: "phone",
    label: "Phone",
    placeholder: "Enter your phone number"
  },
  message: {
    type: "textarea",
    label: "Message",
    placeholder: "Enter your message",
    rows: 4,
    validation: [{ type: "required", message: "Message is required" }]
  },
  company: {
    type: "text",
    label: "Company",
    placeholder: "Enter your company name"
  },
  website: {
    type: "url",
    label: "Website",
    placeholder: "https://example.com",
    validation: [{ type: "url", message: "Please enter a valid URL" }]
  },
  subscribe: {
    type: "checkbox",
    label: "Subscribe to newsletter",
    defaultValue: false
  }
};
var DEFAULT_FORM_SETTINGS = {
  submitButtonText: "Submit",
  successMessage: "Thank you for your submission!",
  notifyEmails: [],
  captchaEnabled: false,
  storeSubmissions: true
};

// src/lib/forms/index.ts
async function createForm(name, fields, settings) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const form = await _chunkI5PINI5Tjs.prisma.form.create({
    data: {
      name,
      slug,
      fields,
      submitButtonText: (settings == null ? void 0 : settings.submitButtonText) || DEFAULT_FORM_SETTINGS.submitButtonText,
      successMessage: (settings == null ? void 0 : settings.successMessage) || DEFAULT_FORM_SETTINGS.successMessage,
      redirectUrl: settings == null ? void 0 : settings.redirectUrl,
      notifyEmails: (settings == null ? void 0 : settings.notifyEmails) || [],
      status: "ACTIVE"
    }
  });
  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    description: form.description || void 0,
    fields: form.fields,
    settings: {
      submitButtonText: form.submitButtonText,
      successMessage: form.successMessage || DEFAULT_FORM_SETTINGS.successMessage,
      redirectUrl: form.redirectUrl || void 0,
      notifyEmails: form.notifyEmails,
      captchaEnabled: false,
      storeSubmissions: true
    },
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString()
  };
}
async function getForm(idOrSlug) {
  const form = await _chunkI5PINI5Tjs.prisma.form.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }]
    }
  });
  if (!form) return null;
  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    description: form.description || void 0,
    fields: form.fields,
    settings: {
      submitButtonText: form.submitButtonText,
      successMessage: form.successMessage || DEFAULT_FORM_SETTINGS.successMessage,
      redirectUrl: form.redirectUrl || void 0,
      notifyEmails: form.notifyEmails,
      captchaEnabled: false,
      storeSubmissions: true
    },
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString()
  };
}
async function updateForm(id, data) {
  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== void 0) updateData.description = data.description;
  if (data.fields) updateData.fields = data.fields;
  if (data.status) updateData.status = data.status;
  if (data.settings) {
    if (data.settings.submitButtonText) updateData.submitButtonText = data.settings.submitButtonText;
    if (data.settings.successMessage) updateData.successMessage = data.settings.successMessage;
    if (data.settings.redirectUrl !== void 0) updateData.redirectUrl = data.settings.redirectUrl;
    if (data.settings.notifyEmails) updateData.notifyEmails = data.settings.notifyEmails;
  }
  const form = await _chunkI5PINI5Tjs.prisma.form.update({
    where: { id },
    data: updateData
  });
  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    description: form.description || void 0,
    fields: form.fields,
    settings: {
      submitButtonText: form.submitButtonText,
      successMessage: form.successMessage || DEFAULT_FORM_SETTINGS.successMessage,
      redirectUrl: form.redirectUrl || void 0,
      notifyEmails: form.notifyEmails,
      captchaEnabled: false,
      storeSubmissions: true
    },
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString()
  };
}
async function deleteForm(id) {
  await _chunkI5PINI5Tjs.prisma.form.delete({ where: { id } });
}
function validateFormData(fields, data) {
  const errors = {};
  for (const field of fields) {
    const value = data[field.name];
    if (field.conditions && field.conditions.length > 0) {
      const shouldShow = field.conditions.every(
        (condition) => evaluateCondition(condition, data)
      );
      if (!shouldShow) continue;
    }
    if (field.validation) {
      for (const rule of field.validation) {
        const error = validateRule(rule, value, field);
        if (error) {
          errors[field.name] = error;
          break;
        }
      }
    }
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
function evaluateCondition(condition, data) {
  const value = data[condition.field];
  switch (condition.operator) {
    case "equals":
      return value === condition.value;
    case "notEquals":
      return value !== condition.value;
    case "contains":
      return String(value || "").includes(String(condition.value));
    case "notContains":
      return !String(value || "").includes(String(condition.value));
    case "isEmpty":
      return value === void 0 || value === null || value === "";
    case "isNotEmpty":
      return value !== void 0 && value !== null && value !== "";
    default:
      return true;
  }
}
function validateRule(rule, value, field) {
  switch (rule.type) {
    case "required":
      if (value === void 0 || value === null || value === "" || Array.isArray(value) && value.length === 0) {
        return rule.message;
      }
      break;
    case "minLength":
      if (typeof value === "string" && value.length < rule.value) {
        return rule.message;
      }
      break;
    case "maxLength":
      if (typeof value === "string" && value.length > rule.value) {
        return rule.message;
      }
      break;
    case "min":
      if (typeof value === "number" && value < rule.value) {
        return rule.message;
      }
      break;
    case "max":
      if (typeof value === "number" && value > rule.value) {
        return rule.message;
      }
      break;
    case "pattern":
      if (value && !new RegExp(rule.value).test(String(value))) {
        return rule.message;
      }
      break;
    case "email":
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return rule.message;
      }
      break;
    case "url":
      if (value) {
        try {
          new URL(String(value));
        } catch (e) {
          return rule.message;
        }
      }
      break;
  }
  return null;
}
async function submitForm(submission) {
  var _a, _b, _c;
  const form = await getForm(submission.formId);
  if (!form) {
    return {
      success: false,
      message: "Form not found"
    };
  }
  const validation = validateFormData(form.fields, submission.data);
  if (!validation.valid) {
    return {
      success: false,
      message: "Validation failed",
      errors: validation.errors
    };
  }
  const formSubmission = await _chunkI5PINI5Tjs.prisma.formSubmission.create({
    data: {
      formId: form.id,
      data: submission.data,
      ipAddress: (_a = submission.metadata) == null ? void 0 : _a.ipAddress,
      userAgent: (_b = submission.metadata) == null ? void 0 : _b.userAgent,
      referrer: (_c = submission.metadata) == null ? void 0 : _c.referrer
    }
  });
  await _chunkI5PINI5Tjs.prisma.form.update({
    where: { id: form.id },
    data: { submissionCount: { increment: 1 } }
  });
  return {
    success: true,
    message: form.settings.successMessage,
    submissionId: formSubmission.id,
    redirectUrl: form.settings.redirectUrl
  };
}
async function getFormSubmissions(formId, options) {
  const where = { formId };
  if ((options == null ? void 0 : options.starred) !== void 0) {
    where.starred = options.starred;
  }
  if ((options == null ? void 0 : options.read) !== void 0) {
    where.read = options.read;
  }
  const [submissions, total] = await Promise.all([
    _chunkI5PINI5Tjs.prisma.formSubmission.findMany({
      where,
      take: (options == null ? void 0 : options.limit) || 50,
      skip: (options == null ? void 0 : options.offset) || 0,
      orderBy: { createdAt: "desc" }
    }),
    _chunkI5PINI5Tjs.prisma.formSubmission.count({ where })
  ]);
  return {
    submissions: submissions.map((s) => ({
      id: s.id,
      data: s.data,
      createdAt: s.createdAt.toISOString(),
      read: s.read,
      starred: s.starred
    })),
    total
  };
}
async function markSubmissionRead(submissionId, read = true) {
  await _chunkI5PINI5Tjs.prisma.formSubmission.update({
    where: { id: submissionId },
    data: { read }
  });
}
async function starSubmission(submissionId, starred = true) {
  await _chunkI5PINI5Tjs.prisma.formSubmission.update({
    where: { id: submissionId },
    data: { starred }
  });
}
async function deleteSubmission(submissionId) {
  await _chunkI5PINI5Tjs.prisma.formSubmission.delete({
    where: { id: submissionId }
  });
}

// src/lib/inventory/index.ts
async function getLowStockItems() {
  const lowStockItems = [];
  const lowStockProducts = await _chunkI5PINI5Tjs.prisma.product.findMany({
    where: {
      status: "ACTIVE",
      trackInventory: true,
      type: "SIMPLE",
      stock: {
        lte: _chunkI5PINI5Tjs.prisma.product.fields.lowStockThreshold
      }
    },
    select: {
      id: true,
      title: true,
      sku: true,
      stock: true,
      lowStockThreshold: true
    }
  });
  for (const product of lowStockProducts) {
    if (product.stock <= product.lowStockThreshold) {
      lowStockItems.push({
        id: product.id,
        title: product.title,
        sku: product.sku,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold
      });
    }
  }
  const lowStockVariants = await _chunkI5PINI5Tjs.prisma.productVariant.findMany({
    where: {
      enabled: true,
      product: {
        status: "ACTIVE",
        trackInventory: true
      }
    },
    include: {
      product: {
        select: {
          id: true,
          title: true
        }
      },
      optionValues: {
        include: {
          optionValue: true
        }
      }
    }
  });
  for (const variant of lowStockVariants) {
    if (variant.stock <= variant.lowStockThreshold) {
      const variantTitle = variant.optionValues.map((ov) => ov.optionValue.value).join(" / ") || void 0;
      lowStockItems.push({
        id: variant.product.id,
        title: variant.product.title,
        sku: variant.sku,
        stock: variant.stock,
        lowStockThreshold: variant.lowStockThreshold,
        variantId: variant.id,
        variantTitle
      });
    }
  }
  return lowStockItems;
}
async function sendLowStockAlert(items) {
  if (items.length === 0) {
    return { success: true };
  }
  const emailSettings = await _chunkMT3LB7M4js.getEmailSettings.call(void 0, );
  const adminEmail = emailSettings.replyTo || emailSettings.fromEmail;
  if (!adminEmail) {
    return { success: false, error: "No admin email configured" };
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const itemRows = items.map((item) => {
    const name = item.variantTitle ? `${item.title} - ${item.variantTitle}` : item.title;
    const sku = item.sku ? ` (SKU: ${item.sku})` : "";
    return `\u2022 ${name}${sku}: ${item.stock} remaining (threshold: ${item.lowStockThreshold})`;
  }).join("\n");
  const html = `
    <h2>Low Stock Alert</h2>
    <p>The following products are at or below their low stock threshold:</p>
    <ul>
      ${items.map((item) => {
    const name = item.variantTitle ? `${item.title} - ${item.variantTitle}` : item.title;
    const sku = item.sku ? ` (SKU: ${item.sku})` : "";
    return `<li><strong>${name}</strong>${sku}: ${item.stock} remaining (threshold: ${item.lowStockThreshold})</li>`;
  }).join("")}
    </ul>
    <p><a href="${appUrl}/admin/products">View Products in Admin</a></p>
  `;
  const text = `Low Stock Alert

The following products are at or below their low stock threshold:

${itemRows}

View products: ${appUrl}/admin/products`;
  try {
    const result = await _chunkMT3LB7M4js.sendEmail.call(void 0, {
      to: { email: adminEmail, name: "Store Admin" },
      subject: `Low Stock Alert: ${items.length} product${items.length > 1 ? "s" : ""} need attention`,
      html,
      text,
      metadata: {
        type: "low_stock_alert",
        itemCount: String(items.length)
      }
    });
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error("Error sending low stock alert:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function subscribeToBackInStock(email, productId, variantId) {
  try {
    const product = await _chunkI5PINI5Tjs.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true }
    });
    if (!product) {
      return { success: false, error: "Product not found" };
    }
    if (variantId) {
      const variant = await _chunkI5PINI5Tjs.prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true }
      });
      if (!variant) {
        return { success: false, error: "Variant not found" };
      }
    }
    const existing = await _chunkI5PINI5Tjs.prisma.backInStockSubscription.findFirst({
      where: {
        email,
        productId,
        variantId: variantId != null ? variantId : null
      }
    });
    if (existing) {
      await _chunkI5PINI5Tjs.prisma.backInStockSubscription.update({
        where: { id: existing.id },
        data: {
          notified: false,
          notifiedAt: null
        }
      });
    } else {
      await _chunkI5PINI5Tjs.prisma.backInStockSubscription.create({
        data: {
          email,
          productId,
          variantId: variantId != null ? variantId : null
        }
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Error subscribing to back-in-stock:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function unsubscribeFromBackInStock(email, productId, variantId) {
  try {
    await _chunkI5PINI5Tjs.prisma.backInStockSubscription.deleteMany({
      where: {
        email,
        productId,
        variantId: variantId || null
      }
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
async function sendBackInStockNotifications(productId, variantId) {
  var _a, _b, _c, _d;
  const subscriptions = await _chunkI5PINI5Tjs.prisma.backInStockSubscription.findMany({
    where: {
      productId,
      variantId: variantId || null,
      notified: false
    },
    include: {
      product: {
        select: {
          title: true,
          slug: true,
          images: {
            select: {
              media: {
                select: {
                  url: true
                }
              }
            },
            take: 1,
            orderBy: { position: "asc" }
          }
        }
      },
      variant: {
        include: {
          optionValues: {
            include: {
              optionValue: true
            }
          }
        }
      }
    }
  });
  if (subscriptions.length === 0) {
    return { sent: 0, errors: 0 };
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let sent = 0;
  let errors = 0;
  for (const sub of subscriptions) {
    const variantTitle = (_a = sub.variant) == null ? void 0 : _a.optionValues.map((ov) => ov.optionValue.value).join(" / ");
    const productName = variantTitle ? `${sub.product.title} - ${variantTitle}` : sub.product.title;
    const productUrl = `${appUrl}/products/${sub.product.slug}`;
    const imageUrl = ((_d = (_c = (_b = sub.product.images) == null ? void 0 : _b[0]) == null ? void 0 : _c.media) == null ? void 0 : _d.url) || "";
    const html = `
      <h2>Good News! ${productName} is Back in Stock</h2>
      ${imageUrl ? `<img src="${imageUrl}" alt="${productName}" style="max-width: 200px; margin: 20px 0;" />` : ""}
      <p>The product you were waiting for is now available.</p>
      <p><a href="${productUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Shop Now</a></p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        You received this email because you signed up for a back-in-stock notification.
      </p>
    `;
    const text = `Good News! ${productName} is Back in Stock

The product you were waiting for is now available.

Shop now: ${productUrl}

You received this email because you signed up for a back-in-stock notification.`;
    try {
      const result = await _chunkMT3LB7M4js.sendEmail.call(void 0, {
        to: { email: sub.email },
        subject: `${productName} is Back in Stock!`,
        html,
        text,
        metadata: _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
          type: "back_in_stock",
          productId: sub.productId
        }, sub.variantId ? { variantId: sub.variantId } : {})
      });
      if (result.success) {
        await _chunkI5PINI5Tjs.prisma.backInStockSubscription.update({
          where: { id: sub.id },
          data: {
            notified: true,
            notifiedAt: /* @__PURE__ */ new Date()
          }
        });
        sent++;
      } else {
        errors++;
      }
    } catch (e) {
      errors++;
    }
  }
  return { sent, errors };
}
async function checkAndNotifyBackInStock(productId, variantId, newStock) {
  if (newStock <= 0) return;
  const subCount = await _chunkI5PINI5Tjs.prisma.backInStockSubscription.count({
    where: {
      productId,
      variantId: variantId || null,
      notified: false
    }
  });
  if (subCount > 0) {
    sendBackInStockNotifications(productId, variantId).catch((err) => {
      console.error("Error sending back-in-stock notifications:", err);
    });
  }
}
var DEFAULT_RESERVATION_MINUTES = 15;
async function reserveStock(productId, quantity, sessionId, variantId, reservationMinutes = DEFAULT_RESERVATION_MINUTES) {
  try {
    let currentStock;
    let trackInventory;
    if (variantId) {
      const variant = await _chunkI5PINI5Tjs.prisma.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: {
            select: { trackInventory: true }
          }
        }
      });
      if (!variant) {
        return { success: false, error: "Variant not found" };
      }
      currentStock = variant.stock;
      trackInventory = variant.product.trackInventory;
    } else {
      const product = await _chunkI5PINI5Tjs.prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, trackInventory: true }
      });
      if (!product) {
        return { success: false, error: "Product not found" };
      }
      currentStock = product.stock;
      trackInventory = product.trackInventory;
    }
    if (!trackInventory) {
      return { success: true };
    }
    const reservedStock = await _chunkI5PINI5Tjs.prisma.stockReservation.aggregate({
      where: {
        productId,
        variantId: variantId || null,
        released: false,
        expiresAt: { gt: /* @__PURE__ */ new Date() }
      },
      _sum: { quantity: true }
    });
    const availableStock = currentStock - (reservedStock._sum.quantity || 0);
    if (availableStock < quantity) {
      return { success: false, error: "Insufficient stock" };
    }
    const expiresAt = new Date(Date.now() + reservationMinutes * 60 * 1e3);
    const reservation = await _chunkI5PINI5Tjs.prisma.stockReservation.create({
      data: {
        productId,
        variantId: variantId || null,
        quantity,
        sessionId,
        expiresAt
      }
    });
    return { success: true, reservationId: reservation.id };
  } catch (error) {
    console.error("Error reserving stock:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function releaseReservation(reservationId) {
  try {
    await _chunkI5PINI5Tjs.prisma.stockReservation.update({
      where: { id: reservationId },
      data: { released: true }
    });
    return true;
  } catch (e) {
    return false;
  }
}
async function releaseSessionReservations(sessionId) {
  const result = await _chunkI5PINI5Tjs.prisma.stockReservation.updateMany({
    where: {
      sessionId,
      released: false
    },
    data: { released: true }
  });
  return result.count;
}
async function convertReservationsToOrder(sessionId, orderId) {
  const result = await _chunkI5PINI5Tjs.prisma.stockReservation.updateMany({
    where: {
      sessionId,
      released: false,
      expiresAt: { gt: /* @__PURE__ */ new Date() }
    },
    data: {
      orderId,
      // Extend expiration significantly - these are now order reservations
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
      // 30 days
    }
  });
  return result.count;
}
async function deductStockForOrder(orderId) {
  try {
    const reservations = await _chunkI5PINI5Tjs.prisma.stockReservation.findMany({
      where: {
        orderId,
        released: false
      }
    });
    for (const reservation of reservations) {
      if (reservation.variantId) {
        await _chunkI5PINI5Tjs.prisma.productVariant.update({
          where: { id: reservation.variantId },
          data: {
            stock: { decrement: reservation.quantity }
          }
        });
      } else {
        await _chunkI5PINI5Tjs.prisma.product.update({
          where: { id: reservation.productId },
          data: {
            stock: { decrement: reservation.quantity }
          }
        });
      }
      await _chunkI5PINI5Tjs.prisma.stockReservation.update({
        where: { id: reservation.id },
        data: { released: true }
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Error deducting stock for order:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function cleanupExpiredReservations() {
  const result = await _chunkI5PINI5Tjs.prisma.stockReservation.updateMany({
    where: {
      released: false,
      expiresAt: { lte: /* @__PURE__ */ new Date() },
      orderId: null
      // Only cleanup session reservations, not order reservations
    },
    data: { released: true }
  });
  return result.count;
}
async function getAvailableStock(productId, variantId) {
  let currentStock;
  let trackInventory;
  if (variantId) {
    const variant = await _chunkI5PINI5Tjs.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: { select: { trackInventory: true } }
      }
    });
    if (!variant) return 0;
    currentStock = variant.stock;
    trackInventory = variant.product.trackInventory;
  } else {
    const product = await _chunkI5PINI5Tjs.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, trackInventory: true }
    });
    if (!product) return 0;
    currentStock = product.stock;
    trackInventory = product.trackInventory;
  }
  if (!trackInventory) {
    return Number.MAX_SAFE_INTEGER;
  }
  const reserved = await _chunkI5PINI5Tjs.prisma.stockReservation.aggregate({
    where: {
      productId,
      variantId: variantId || null,
      released: false,
      expiresAt: { gt: /* @__PURE__ */ new Date() }
    },
    _sum: { quantity: true }
  });
  return Math.max(0, currentStock - (reserved._sum.quantity || 0));
}

// src/lib/media/index.ts
var db = _chunkI5PINI5Tjs.prisma;
async function listMedia(filters = {}) {
  const {
    folderId,
    type,
    search,
    tagIds,
    includeDeleted = false,
    page = 1,
    limit = 50,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = filters;
  const where = {};
  if (!includeDeleted) {
    where.deletedAt = null;
  }
  if (folderId !== void 0) {
    where.folderId = folderId;
  }
  if (type) {
    switch (type) {
      case "image":
        where.mimeType = { startsWith: "image/" };
        break;
      case "video":
        where.mimeType = { startsWith: "video/" };
        break;
      case "audio":
        where.mimeType = { startsWith: "audio/" };
        break;
      case "document":
        where.OR = [
          { mimeType: "application/pdf" },
          { mimeType: { contains: "document" } },
          { mimeType: { contains: "spreadsheet" } },
          { mimeType: { contains: "presentation" } },
          { mimeType: { contains: "word" } },
          { mimeType: { contains: "excel" } },
          { mimeType: { contains: "powerpoint" } },
          { mimeType: "text/plain" },
          { mimeType: "text/csv" }
        ];
        break;
    }
  }
  if (search) {
    const searchLower = search.toLowerCase();
    where.OR = [
      { filename: { contains: searchLower, mode: "insensitive" } },
      { originalName: { contains: searchLower, mode: "insensitive" } },
      { title: { contains: searchLower, mode: "insensitive" } },
      { alt: { contains: searchLower, mode: "insensitive" } },
      { caption: { contains: searchLower, mode: "insensitive" } }
    ];
  }
  if (tagIds && tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: { in: tagIds }
      }
    };
  }
  const orderBy = {};
  switch (sortBy) {
    case "name":
      orderBy.originalName = sortOrder;
      break;
    case "size":
      orderBy.size = sortOrder;
      break;
    case "type":
      orderBy.mimeType = sortOrder;
      break;
    case "createdAt":
    default:
      orderBy.createdAt = sortOrder;
      break;
  }
  const skip = (page - 1) * limit;
  const [media, total] = await Promise.all([
    db.media.findMany({
      where,
      include: {
        folder: true,
        tags: {
          include: {
            tag: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            usages: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    db.media.count({ where })
  ]);
  return {
    media,
    total,
    page,
    limit,
    hasMore: skip + media.length < total
  };
}
async function getMedia(id, includeUsage = true) {
  const media = await db.media.findUnique({
    where: { id },
    include: {
      folder: true,
      tags: {
        include: {
          tag: true
        }
      },
      usages: includeUsage,
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  return media;
}
async function createMedia(input) {
  const _a = input, { tagIds } = _a, data = _chunkHY7GTCJMjs.__objRest.call(void 0, _a, ["tagIds"]);
  const media = await db.media.create({
    data: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, data), {
      tags: (tagIds == null ? void 0 : tagIds.length) ? {
        create: tagIds.map((tagId) => ({ tagId }))
      } : void 0
    }),
    include: {
      folder: true,
      tags: {
        include: {
          tag: true
        }
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  return media;
}
async function updateMedia(id, input) {
  const _a = input, { tagIds } = _a, data = _chunkHY7GTCJMjs.__objRest.call(void 0, _a, ["tagIds"]);
  if (tagIds !== void 0) {
    await db.mediaTagOnMedia.deleteMany({
      where: { mediaId: id }
    });
    if (tagIds.length > 0) {
      await db.mediaTagOnMedia.createMany({
        data: tagIds.map((tagId) => ({ mediaId: id, tagId }))
      });
    }
  }
  const media = await db.media.update({
    where: { id },
    data,
    include: {
      folder: true,
      tags: {
        include: {
          tag: true
        }
      },
      usages: true,
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  return media;
}
async function deleteMedia(id, hard = false) {
  if (hard) {
    await db.media.delete({
      where: { id }
    });
  } else {
    await db.media.update({
      where: { id },
      data: { deletedAt: /* @__PURE__ */ new Date() }
    });
  }
}
async function restoreMedia(id) {
  const media = await db.media.update({
    where: { id },
    data: { deletedAt: null },
    include: {
      folder: true,
      tags: {
        include: {
          tag: true
        }
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  return media;
}
async function bulkDeleteMedia(ids, hard = false) {
  if (hard) {
    const result = await db.media.deleteMany({
      where: { id: { in: ids } }
    });
    return result.count;
  } else {
    const result = await db.media.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: /* @__PURE__ */ new Date() }
    });
    return result.count;
  }
}
async function bulkMoveMedia(ids, folderId) {
  const result = await db.media.updateMany({
    where: { id: { in: ids } },
    data: { folderId }
  });
  return result.count;
}
async function bulkTagMedia(ids, tagIds) {
  const data = ids.flatMap(
    (mediaId) => tagIds.map((tagId) => ({ mediaId, tagId }))
  );
  await db.mediaTagOnMedia.createMany({
    data,
    skipDuplicates: true
  });
  return ids.length;
}
async function bulkUntagMedia(ids, tagIds) {
  const result = await db.mediaTagOnMedia.deleteMany({
    where: {
      mediaId: { in: ids },
      tagId: { in: tagIds }
    }
  });
  return result.count;
}
async function bulkRestoreMedia(ids) {
  const result = await db.media.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: null }
  });
  return result.count;
}
async function getMediaStats() {
  const [total, byType, totalSize, recentCount] = await Promise.all([
    db.media.count({ where: { deletedAt: null } }),
    db.media.groupBy({
      by: ["mimeType"],
      where: { deletedAt: null },
      _count: { id: true }
    }),
    db.media.aggregate({
      where: { deletedAt: null },
      _sum: { size: true }
    }),
    db.media.count({
      where: {
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3) }
      }
    })
  ]);
  const typeStats = {
    image: 0,
    video: 0,
    audio: 0,
    document: 0,
    other: 0
  };
  for (const item of byType) {
    if (item.mimeType.startsWith("image/")) {
      typeStats.image += item._count.id;
    } else if (item.mimeType.startsWith("video/")) {
      typeStats.video += item._count.id;
    } else if (item.mimeType.startsWith("audio/")) {
      typeStats.audio += item._count.id;
    } else if (item.mimeType === "application/pdf" || item.mimeType.includes("document") || item.mimeType.includes("word")) {
      typeStats.document += item._count.id;
    } else {
      typeStats.other += item._count.id;
    }
  }
  return {
    total,
    totalSize: totalSize._sum.size || 0,
    recentCount,
    byType: typeStats
  };
}

// src/lib/email/templates/base.ts
function baseTemplate(options) {
  const {
    title,
    preheader = "",
    content,
    footerContent = "",
    brandColor = "#4F46E5",
    logoUrl,
    storeName = "{{store.name}}",
    storeUrl = "{{store.url}}",
    supportEmail = "{{store.supportEmail}}",
    unsubscribeUrl,
    socialLinks = {}
  } = options;
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
  </style>
  <![endif]-->
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light dark;
    }

    /* Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      border-collapse: collapse !important;
    }

    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f4f4f5;
    }

    /* Dark mode styles */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #18181b !important;
      }
      .email-container {
        background-color: #27272a !important;
      }
      .email-content {
        color: #e4e4e7 !important;
      }
      .email-footer {
        background-color: #18181b !important;
        color: #a1a1aa !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #fafafa !important;
      }
      p, td {
        color: #e4e4e7 !important;
      }
      .text-muted {
        color: #a1a1aa !important;
      }
    }

    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .stack-column-center {
        text-align: center !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .mobile-hide {
        display: none !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <!-- Preheader text (hidden) -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
    ${"&zwnj;&nbsp;".repeat(50)}
  </div>

  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 10px;">

        <!-- Email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              ${logoUrl ? `
              <a href="${storeUrl}" style="text-decoration: none;">
                <img src="${logoUrl}" alt="${storeName}" width="150" style="max-width: 150px; height: auto;">
              </a>
              ` : `
              <a href="${storeUrl}" style="text-decoration: none; font-size: 24px; font-weight: bold; color: ${brandColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                ${storeName}
              </a>
              `}
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content mobile-padding" style="padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #3f3f46;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7; border-radius: 0 0 8px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${footerContent ? `
                <tr>
                  <td style="padding-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #71717a;">
                    ${footerContent}
                  </td>
                </tr>
                ` : ""}

                <!-- Social links -->
                ${Object.keys(socialLinks).length > 0 ? `
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" width="24" height="24" alt="Facebook" style="opacity: 0.6;"></a>` : ""}
                    ${socialLinks.twitter ? `<a href="${socialLinks.twitter}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg" width="24" height="24" alt="Twitter" style="opacity: 0.6;"></a>` : ""}
                    ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" width="24" height="24" alt="Instagram" style="opacity: 0.6;"></a>` : ""}
                  </td>
                </tr>
                ` : ""}

                <tr>
                  <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #a1a1aa;">
                    <p style="margin: 0 0 8px 0;">
                      Questions? Contact us at <a href="mailto:${supportEmail}" style="color: ${brandColor}; text-decoration: none;">${supportEmail}</a>
                    </p>
                    <p style="margin: 0 0 8px 0;">
                      &copy; {{currentYear}} ${storeName}. All rights reserved.
                    </p>
                    ${unsubscribeUrl ? `
                    <p style="margin: 0;">
                      <a href="${unsubscribeUrl}" style="color: #a1a1aa; text-decoration: underline;">Unsubscribe</a>
                    </p>
                    ` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}
var emailComponents = {
  /**
   * Primary call-to-action button
   */
  button: (text, url, color = "#4F46E5") => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 6px; background-color: ${color};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `,
  /**
   * Secondary/outline button
   */
  buttonOutline: (text, url, color = "#4F46E5") => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 6px; border: 2px solid ${color};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 26px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: ${color}; text-decoration: none; border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `,
  /**
   * Divider line
   */
  divider: () => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="border-top: 1px solid #e4e4e7;"></td>
      </tr>
    </table>
  `,
  /**
   * Info box/callout
   */
  infoBox: (content, bgColor = "#eff6ff", borderColor = "#3b82f6") => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 16px 20px; background-color: ${bgColor}; border-left: 4px solid ${borderColor}; border-radius: 4px;">
          ${content}
        </td>
      </tr>
    </table>
  `,
  /**
   * Success box
   */
  successBox: (content) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 16px 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
          ${content}
        </td>
      </tr>
    </table>
  `,
  /**
   * Warning box
   */
  warningBox: (content) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 16px 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          ${content}
        </td>
      </tr>
    </table>
  `,
  /**
   * Two-column layout row
   */
  twoColumn: (leftContent, rightContent) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td class="stack-column" width="50%" valign="top" style="padding-right: 10px;">
          ${leftContent}
        </td>
        <td class="stack-column" width="50%" valign="top" style="padding-left: 10px;">
          ${rightContent}
        </td>
      </tr>
    </table>
  `,
  /**
   * Image with optional caption
   */
  image: (src, alt, width = 520, caption) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td align="center">
          <img src="${src}" alt="${alt}" width="${width}" style="max-width: 100%; height: auto; border-radius: 6px;">
          ${caption ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">${caption}</p>` : ""}
        </td>
      </tr>
    </table>
  `,
  /**
   * Heading styles
   */
  heading: {
    h1: (text) => `<h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #18181b; line-height: 1.3;">${text}</h1>`,
    h2: (text) => `<h2 style="margin: 24px 0 16px 0; font-size: 22px; font-weight: 600; color: #18181b; line-height: 1.3;">${text}</h2>`,
    h3: (text) => `<h3 style="margin: 20px 0 12px 0; font-size: 18px; font-weight: 600; color: #18181b; line-height: 1.3;">${text}</h3>`
  },
  /**
   * Paragraph
   */
  paragraph: (text) => `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">${text}</p>`,
  /**
   * Muted/secondary text
   */
  mutedText: (text) => `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #71717a;">${text}</p>`
};

// src/lib/email/templates/renderer.ts
var defaultStoreConfig = {
  name: "Our Store",
  url: "https://example.com",
  supportEmail: "support@example.com"
};
function sanitizeData(data) {
  if (data === null || data === void 0) {
    return {};
  }
  if (data instanceof Date) {
    return data.toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (typeof data === "object") {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        result[key] = value.map(sanitizeData);
      } else if (typeof value === "object" && value !== null) {
        result[key] = sanitizeData(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return data;
}
function renderTemplate(template, data, options = {}) {
  const { store = {} } = options;
  const dataStore = typeof data.store === "object" && data.store !== null ? data.store : {};
  const mergedData = _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, data), {
    store: _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, defaultStoreConfig), store), dataStore),
    currentYear: (/* @__PURE__ */ new Date()).getFullYear().toString()
  });
  const sanitizedData = sanitizeData(mergedData);
  return _chunkMT3LB7M4js.parseMergeTags.call(void 0, template, sanitizedData);
}
function wrapInBaseTemplate(content, options) {
  const store = options.store || {};
  return baseTemplate({
    title: options.title || "Email from " + (store.name || defaultStoreConfig.name),
    preheader: options.preheader,
    content,
    footerContent: options.footerContent,
    brandColor: store.brandColor || options.brandColor,
    logoUrl: store.logoUrl || options.logoUrl,
    storeName: store.name || defaultStoreConfig.name,
    storeUrl: store.url || defaultStoreConfig.url,
    supportEmail: store.supportEmail || defaultStoreConfig.supportEmail,
    unsubscribeUrl: options.unsubscribeUrl,
    socialLinks: store.socialLinks || options.socialLinks
  });
}
function renderEmail(content, templateOptions, data, renderOptions = {}) {
  const store = renderOptions.store || {};
  const wrappedHtml = wrapInBaseTemplate(content, _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, templateOptions), {
    store
  }));
  return renderTemplate(wrappedHtml, data, renderOptions);
}
function htmlToPlainText(html) {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)").replace(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi, "\n\n$1\n").replace(/<\/p>/gi, "\n\n").replace(/<\/div>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<li[^>]*>/gi, "\n- ").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&zwnj;/g, "").replace(/\n\s*\n\s*\n/g, "\n\n").replace(/^\s+|\s+$/g, "").trim();
}

// src/lib/email/templates/order-confirmation.ts
function generateItemsTable(items, currency = "USD") {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(amount / 100);
  };
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            ${item.imageUrl ? `
            <td width="80" valign="top" style="padding-right: 16px;">
              <img src="${item.imageUrl}" alt="${item.name}" width="80" height="80" style="border-radius: 6px; object-fit: cover;">
            </td>
            ` : ""}
            <td valign="top">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #18181b;">${item.name}</p>
              ${item.variant ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #71717a;">${item.variant}</p>` : ""}
              <p style="margin: 0; font-size: 14px; color: #71717a;">Qty: ${item.quantity}</p>
            </td>
            <td width="100" valign="top" align="right">
              <p style="margin: 0; font-weight: 600; color: #18181b;">${formatPrice(item.price * item.quantity)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      ${itemRows}
    </table>
  `;
}
function generateTotals(order) {
  const currency = order.currency || "USD";
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(amount / 100);
  };
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; color: #71717a;">Subtotal</td>
        <td align="right" style="padding: 8px 0; color: #3f3f46;">${formatPrice(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #71717a;">Shipping</td>
        <td align="right" style="padding: 8px 0; color: #3f3f46;">${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #71717a;">Tax</td>
        <td align="right" style="padding: 8px 0; color: #3f3f46;">${formatPrice(order.tax)}</td>
      </tr>
      ${order.discount ? `
      <tr>
        <td style="padding: 8px 0; color: #22c55e;">Discount</td>
        <td align="right" style="padding: 8px 0; color: #22c55e;">-${formatPrice(order.discount)}</td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding: 16px 0 8px 0; border-top: 2px solid #e4e4e7; font-weight: 700; font-size: 18px; color: #18181b;">Total</td>
        <td align="right" style="padding: 16px 0 8px 0; border-top: 2px solid #e4e4e7; font-weight: 700; font-size: 18px; color: #18181b;">${formatPrice(order.total)}</td>
      </tr>
    </table>
  `;
}
function generateAddressBlock(title, address) {
  return `
    <div style="padding: 16px; background-color: #fafafa; border-radius: 6px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #18181b;">${title}</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #3f3f46;">
        ${address.name}<br>
        ${address.line1}<br>
        ${address.line2 ? address.line2 + "<br>" : ""}
        ${address.city}, ${address.state} ${address.postalCode}<br>
        ${address.country}
      </p>
    </div>
  `;
}
function generateOrderConfirmationContent(data) {
  const { order, customer } = data;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return `
    ${emailComponents.heading.h1("Thank you for your order!")}

    ${emailComponents.paragraph(`Hi ${customer.name},`)}

    ${emailComponents.paragraph(`We've received your order and it's being processed. You'll receive another email when your order ships.`)}

    ${emailComponents.successBox(`
      <p style="margin: 0; font-weight: 600;">Order #${order.orderNumber}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #71717a;">Placed on ${orderDate}</p>
    `)}

    ${emailComponents.button("View Order", `{{store.url}}/account/orders/${order.id}`)}

    ${emailComponents.heading.h2("Order Details")}

    ${generateItemsTable(order.items, order.currency)}

    ${generateTotals(order)}

    ${emailComponents.divider()}

    ${emailComponents.heading.h2("Shipping Information")}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td class="stack-column" width="50%" valign="top" style="padding-right: 10px; padding-bottom: 16px;">
          ${generateAddressBlock("Shipping Address", order.shippingAddress)}
        </td>
        ${order.billingAddress ? `
        <td class="stack-column" width="50%" valign="top" style="padding-left: 10px; padding-bottom: 16px;">
          ${generateAddressBlock("Billing Address", order.billingAddress)}
        </td>
        ` : ""}
      </tr>
    </table>

    ${order.shippingMethod ? `
    ${emailComponents.infoBox(`
      <p style="margin: 0;"><strong>Shipping Method:</strong> ${order.shippingMethod}</p>
      ${order.estimatedDelivery ? `<p style="margin: 4px 0 0 0;"><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}</p>` : ""}
    `)}
    ` : ""}

    ${order.paymentMethod ? `
    ${emailComponents.mutedText(`<strong>Payment Method:</strong> ${order.paymentMethod}`)}
    ` : ""}

    ${order.notes ? `
    ${emailComponents.divider()}
    ${emailComponents.heading.h3("Order Notes")}
    ${emailComponents.paragraph(order.notes)}
    ` : ""}

    ${emailComponents.divider()}

    ${emailComponents.mutedText("If you have any questions about your order, please don't hesitate to contact our support team.")}
  `;
}
function renderOrderConfirmationEmail(data, store) {
  const content = generateOrderConfirmationContent(data);
  const mergeData = {
    order: data.order,
    customer: data.customer
  };
  const html = renderEmail(
    content,
    {
      title: `Order Confirmation #${data.order.orderNumber}`,
      preheader: `Thank you for your order! Your order #${data.order.orderNumber} has been confirmed.`
    },
    mergeData,
    { store }
  );
  const text = `
Thank you for your order!

Hi ${data.customer.name},

We've received your order and it's being processed. You'll receive another email when your order ships.

Order #${data.order.orderNumber}
Placed on ${new Date(data.order.createdAt).toLocaleDateString()}

ORDER DETAILS:
${data.order.items.map((item) => `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity}`).join("\n")}

Subtotal: ${(data.order.subtotal / 100).toFixed(2)}
Shipping: ${data.order.shipping === 0 ? "Free" : (data.order.shipping / 100).toFixed(2)}
Tax: ${(data.order.tax / 100).toFixed(2)}
${data.order.discount ? `Discount: -${(data.order.discount / 100).toFixed(2)}` : ""}
Total: ${(data.order.total / 100).toFixed(2)}

SHIPPING ADDRESS:
${data.order.shippingAddress.name}
${data.order.shippingAddress.line1}
${data.order.shippingAddress.line2 ? data.order.shippingAddress.line2 + "\n" : ""}${data.order.shippingAddress.city}, ${data.order.shippingAddress.state} ${data.order.shippingAddress.postalCode}
${data.order.shippingAddress.country}

If you have any questions, please contact our support team.
  `.trim();
  return {
    html,
    text,
    subject: `Order Confirmation #${data.order.orderNumber}`
  };
}

// src/lib/email/templates/shipping-notification.ts
function generateTrackingBox(shipment) {
  const carrierDisplay = shipment.carrierName || shipment.carrier;
  const shippedDate = new Date(shipment.shippedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #eff6ff; border-radius: 8px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  \u{1F4E6} Shipment Details
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="50%" style="padding-bottom: 12px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Carrier</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #18181b;">${carrierDisplay}</p>
                    </td>
                    <td width="50%" style="padding-bottom: 12px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Shipped On</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #18181b;">${shippedDate}</p>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 12px; border-top: 1px solid #bfdbfe;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Tracking Number</p>
                      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #18181b; font-family: monospace;">${shipment.trackingNumber}</p>
                    </td>
                  </tr>
                  ${shipment.estimatedDelivery ? `
                  <tr>
                    <td colspan="2" style="padding-top: 12px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Estimated Delivery</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #22c55e;">${shipment.estimatedDelivery}</p>
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}
function generateShippedItems(items) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      ${items.map((item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                ${item.imageUrl ? `
                <td width="60" valign="top" style="padding-right: 12px;">
                  <img src="${item.imageUrl}" alt="${item.name}" width="60" height="60" style="border-radius: 4px; object-fit: cover;">
                </td>
                ` : ""}
                <td valign="middle">
                  <p style="margin: 0 0 2px 0; font-weight: 500; color: #18181b;">${item.name}</p>
                  ${item.variant ? `<p style="margin: 0; font-size: 13px; color: #71717a;">${item.variant}</p>` : ""}
                </td>
                <td width="50" valign="middle" align="right">
                  <p style="margin: 0; font-size: 14px; color: #71717a;">x${item.quantity}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}
function generateShippingNotificationContent(data) {
  const { order, shipment, customer, isPartialShipment } = data;
  const itemsToShow = shipment.items || order.items;
  return `
    ${emailComponents.heading.h1("Your order is on its way! \u{1F69A}")}

    ${emailComponents.paragraph(`Hi ${customer.name},`)}

    ${emailComponents.paragraph(
    isPartialShipment ? `Part of your order #${order.orderNumber} has shipped! Here are the tracking details for this shipment.` : `Great news! Your order #${order.orderNumber} has shipped and is on its way to you.`
  )}

    ${generateTrackingBox(shipment)}

    ${shipment.trackingUrl ? emailComponents.button("Track Your Package", shipment.trackingUrl) : ""}

    ${emailComponents.divider()}

    ${emailComponents.heading.h2(isPartialShipment ? "Items in This Shipment" : "Items Shipped")}

    ${generateShippedItems(itemsToShow)}

    ${emailComponents.divider()}

    ${emailComponents.heading.h2("Shipping To")}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 16px; background-color: #fafafa; border-radius: 6px;">
          <p style="margin: 0; line-height: 1.6; color: #3f3f46;">
            <strong>${shipment.shippingAddress.name}</strong><br>
            ${shipment.shippingAddress.line1}<br>
            ${shipment.shippingAddress.line2 ? shipment.shippingAddress.line2 + "<br>" : ""}
            ${shipment.shippingAddress.city}, ${shipment.shippingAddress.state} ${shipment.shippingAddress.postalCode}<br>
            ${shipment.shippingAddress.country}
          </p>
        </td>
      </tr>
    </table>

    ${emailComponents.infoBox(`
      <p style="margin: 0; font-size: 14px;">
        <strong>Tip:</strong> You can also track your package by visiting your
        <a href="{{store.url}}/account/orders/${order.id}" style="color: #3b82f6; text-decoration: none;">order details page</a>.
      </p>
    `)}

    ${emailComponents.mutedText("If you have any questions about your shipment, please contact our support team.")}
  `;
}
function renderShippingNotificationEmail(data, store) {
  const content = generateShippingNotificationContent(data);
  const mergeData = {
    order: data.order,
    shipment: data.shipment,
    customer: data.customer
  };
  const html = renderEmail(
    content,
    {
      title: `Your Order #${data.order.orderNumber} Has Shipped`,
      preheader: `Your order is on its way! Track your package with ${data.shipment.carrierName || data.shipment.carrier}.`
    },
    mergeData,
    { store }
  );
  const itemsToShow = data.shipment.items || data.order.items;
  const text = `
Your order is on its way!

Hi ${data.customer.name},

${data.isPartialShipment ? `Part of your order #${data.order.orderNumber} has shipped!` : `Great news! Your order #${data.order.orderNumber} has shipped and is on its way to you.`}

SHIPMENT DETAILS:
Carrier: ${data.shipment.carrierName || data.shipment.carrier}
Tracking Number: ${data.shipment.trackingNumber}
${data.shipment.trackingUrl ? `Track your package: ${data.shipment.trackingUrl}` : ""}
${data.shipment.estimatedDelivery ? `Estimated Delivery: ${data.shipment.estimatedDelivery}` : ""}

ITEMS SHIPPED:
${itemsToShow.map((item) => `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity}`).join("\n")}

SHIPPING TO:
${data.shipment.shippingAddress.name}
${data.shipment.shippingAddress.line1}
${data.shipment.shippingAddress.line2 ? data.shipment.shippingAddress.line2 + "\n" : ""}${data.shipment.shippingAddress.city}, ${data.shipment.shippingAddress.state} ${data.shipment.shippingAddress.postalCode}
${data.shipment.shippingAddress.country}

If you have any questions, please contact our support team.
  `.trim();
  return {
    html,
    text,
    subject: `Your Order #${data.order.orderNumber} Has Shipped`
  };
}

// src/lib/email/templates/delivery-confirmation.ts
function generateDeliveryBox(delivery) {
  const deliveredDate = new Date(delivery.deliveredAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const deliveredTime = new Date(delivery.deliveredAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #f0fdf4; border-radius: 8px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding-bottom: 16px;">
                <div style="width: 64px; height: 64px; background-color: #22c55e; border-radius: 50%; display: inline-block; text-align: center; line-height: 64px;">
                  <span style="font-size: 32px;">\u2713</span>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #166534;">Delivered!</p>
                <p style="margin: 0 0 4px 0; font-size: 16px; color: #3f3f46;">${deliveredDate}</p>
                <p style="margin: 0; font-size: 14px; color: #71717a;">at ${deliveredTime}</p>
              </td>
            </tr>
            ${delivery.signedBy ? `
            <tr>
              <td align="center" style="padding-top: 16px; border-top: 1px solid #bbf7d0; margin-top: 16px;">
                <p style="margin: 0; font-size: 14px; color: #71717a;">Signed by: <strong style="color: #3f3f46;">${delivery.signedBy}</strong></p>
              </td>
            </tr>
            ` : ""}
            ${delivery.deliveredTo ? `
            <tr>
              <td align="center" style="padding-top: 8px;">
                <p style="margin: 0; font-size: 14px; color: #71717a;">Delivered to: <strong style="color: #3f3f46;">${delivery.deliveredTo}</strong></p>
              </td>
            </tr>
            ` : ""}
          </table>
        </td>
      </tr>
    </table>
  `;
}
function generateDeliveredItems(items) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      ${items.map((item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                ${item.imageUrl ? `
                <td width="50" valign="middle" style="padding-right: 12px;">
                  <img src="${item.imageUrl}" alt="${item.name}" width="50" height="50" style="border-radius: 4px; object-fit: cover;">
                </td>
                ` : ""}
                <td valign="middle">
                  <p style="margin: 0; font-size: 15px; color: #18181b;">${item.name}</p>
                  ${item.variant ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #71717a;">${item.variant}</p>` : ""}
                </td>
                <td width="40" valign="middle" align="right">
                  <p style="margin: 0; font-size: 14px; color: #71717a;">x${item.quantity}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}
function generateReviewPrompt(orderId) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td align="center">
                <p style="margin: 0 0 8px 0; font-size: 24px;">\u2B50</p>
                <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #854d0e;">How was your experience?</p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #713f12;">We'd love to hear your feedback! Your review helps other shoppers and helps us improve.</p>
              </td>
            </tr>
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius: 6px; background-color: #eab308;">
                      <a href="{{store.url}}/account/orders/${orderId}/review" style="display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                        Write a Review
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}
function generateDeliveryConfirmationContent(data) {
  const { order, delivery, customer } = data;
  return `
    ${emailComponents.heading.h1("Your order has been delivered!")}

    ${emailComponents.paragraph(`Hi ${customer.name},`)}

    ${emailComponents.paragraph(`Great news! Your order #${order.orderNumber} has been delivered. We hope you love your purchase!`)}

    ${generateDeliveryBox(delivery)}

    ${delivery.proofImageUrl ? `
    ${emailComponents.heading.h3("Delivery Photo")}
    ${emailComponents.image(delivery.proofImageUrl, "Delivery proof photo", 400)}
    ` : ""}

    ${emailComponents.divider()}

    ${emailComponents.heading.h2("Items Delivered")}

    ${generateDeliveredItems(order.items)}

    ${emailComponents.heading.h3("Delivered To")}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 16px; background-color: #fafafa; border-radius: 6px;">
          <p style="margin: 0; line-height: 1.6; color: #3f3f46;">
            ${delivery.shippingAddress.name}<br>
            ${delivery.shippingAddress.line1}<br>
            ${delivery.shippingAddress.line2 ? delivery.shippingAddress.line2 + "<br>" : ""}
            ${delivery.shippingAddress.city}, ${delivery.shippingAddress.state} ${delivery.shippingAddress.postalCode}<br>
            ${delivery.shippingAddress.country}
          </p>
        </td>
      </tr>
    </table>

    ${generateReviewPrompt(order.id)}

    ${emailComponents.infoBox(`
      <p style="margin: 0; font-size: 14px;">
        <strong>Didn't receive your package?</strong> If something doesn't look right,
        please <a href="{{store.url}}/support" style="color: #3b82f6; text-decoration: none;">contact our support team</a>
        and we'll help resolve the issue.
      </p>
    `)}

    ${emailComponents.mutedText("Thank you for shopping with us! We appreciate your business.")}
  `;
}
function renderDeliveryConfirmationEmail(data, store) {
  const content = generateDeliveryConfirmationContent(data);
  const mergeData = {
    order: data.order,
    delivery: data.delivery,
    customer: data.customer
  };
  const html = renderEmail(
    content,
    {
      title: `Your Order #${data.order.orderNumber} Has Been Delivered`,
      preheader: `Your order has been delivered! We hope you love your purchase.`
    },
    mergeData,
    { store }
  );
  const deliveredDate = new Date(data.delivery.deliveredAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const text = `
Your order has been delivered!

Hi ${data.customer.name},

Great news! Your order #${data.order.orderNumber} has been delivered. We hope you love your purchase!

DELIVERY DETAILS:
Delivered on: ${deliveredDate}
${data.delivery.signedBy ? `Signed by: ${data.delivery.signedBy}` : ""}
${data.delivery.deliveredTo ? `Delivered to: ${data.delivery.deliveredTo}` : ""}

ITEMS DELIVERED:
${data.order.items.map((item) => `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity}`).join("\n")}

DELIVERED TO:
${data.delivery.shippingAddress.name}
${data.delivery.shippingAddress.line1}
${data.delivery.shippingAddress.line2 ? data.delivery.shippingAddress.line2 + "\n" : ""}${data.delivery.shippingAddress.city}, ${data.delivery.shippingAddress.state} ${data.delivery.shippingAddress.postalCode}
${data.delivery.shippingAddress.country}

HOW WAS YOUR EXPERIENCE?
We'd love to hear your feedback! Write a review at:
{{store.url}}/account/orders/${data.order.id}/review

If something doesn't look right, please contact our support team.

Thank you for shopping with us!
  `.trim();
  return {
    html,
    text,
    subject: `Your Order #${data.order.orderNumber} Has Been Delivered`
  };
}

// src/lib/email/templates/refund-notification.ts
function generateRefundBox(refund, currency = "USD") {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(amount / 100);
  };
  const processedDate = new Date(refund.processedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding-bottom: 16px;">
                <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  \u2713 Refund Processed
                </p>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #166534;">${formatPrice(refund.amount)}</p>
                <p style="margin: 0; font-size: 14px; color: #71717a;">${refund.type === "full" ? "Full Refund" : "Partial Refund"}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="50%" style="padding: 8px 0;">
                      <p style="margin: 0 0 2px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Processed</p>
                      <p style="margin: 0; font-size: 14px; font-weight: 500; color: #3f3f46;">${processedDate}</p>
                    </td>
                    <td width="50%" style="padding: 8px 0;">
                      <p style="margin: 0 0 2px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Refund To</p>
                      <p style="margin: 0; font-size: 14px; font-weight: 500; color: #3f3f46;">
                        ${refund.paymentMethod || "Original payment method"}
                        ${refund.lastFourDigits ? ` \u2022\u2022\u2022\u2022 ${refund.lastFourDigits}` : ""}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${refund.estimatedArrival ? `
            <tr>
              <td style="padding-top: 16px; border-top: 1px solid #bbf7d0; margin-top: 16px;">
                <p style="margin: 0; font-size: 14px; color: #71717a;">
                  <strong>Estimated arrival:</strong> ${refund.estimatedArrival}
                </p>
              </td>
            </tr>
            ` : ""}
          </table>
        </td>
      </tr>
    </table>
  `;
}
function generateRefundedItems(items, currency = "USD") {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(amount / 100);
  };
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      ${items.map((item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                ${item.imageUrl ? `
                <td width="50" valign="middle" style="padding-right: 12px;">
                  <img src="${item.imageUrl}" alt="${item.name}" width="50" height="50" style="border-radius: 4px; object-fit: cover;">
                </td>
                ` : ""}
                <td valign="middle">
                  <p style="margin: 0; font-size: 15px; color: #18181b;">${item.name}</p>
                  ${item.variant ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #71717a;">${item.variant}</p>` : ""}
                </td>
                <td width="40" valign="middle" align="center">
                  <p style="margin: 0; font-size: 14px; color: #71717a;">x${item.quantity}</p>
                </td>
                <td width="80" valign="middle" align="right">
                  <p style="margin: 0; font-size: 14px; font-weight: 500; color: #166534;">${formatPrice(item.price * item.quantity)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}
function generateRefundTimeline() {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 20px; background-color: #fafafa; border-radius: 8px;">
          <p style="margin: 0 0 16px 0; font-weight: 600; color: #18181b;">When will I receive my refund?</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="24" valign="top">
                      <div style="width: 20px; height: 20px; background-color: #22c55e; border-radius: 50%; text-align: center; line-height: 20px; color: white; font-size: 12px;">\u2713</div>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0; font-size: 14px; color: #3f3f46;"><strong>Refund initiated</strong> - We've started processing your refund</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="24" valign="top">
                      <div style="width: 20px; height: 20px; background-color: #d4d4d8; border-radius: 50%; text-align: center; line-height: 20px; color: white; font-size: 12px;">2</div>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0; font-size: 14px; color: #71717a;"><strong>Bank processing</strong> - Your bank will process the refund (1-3 business days)</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="24" valign="top">
                      <div style="width: 20px; height: 20px; background-color: #d4d4d8; border-radius: 50%; text-align: center; line-height: 20px; color: white; font-size: 12px;">3</div>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0; font-size: 14px; color: #71717a;"><strong>Funds returned</strong> - The refund will appear on your statement (3-10 business days)</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}
function generateRefundNotificationContent(data) {
  const { order, refund, customer } = data;
  const currency = order.currency || "USD";
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(amount / 100);
  };
  return `
    ${emailComponents.heading.h1("Your refund has been processed")}

    ${emailComponents.paragraph(`Hi ${customer.name},`)}

    ${emailComponents.paragraph(
    refund.type === "full" ? `We've processed a full refund of ${formatPrice(refund.amount)} for your order #${order.orderNumber}.` : `We've processed a partial refund of ${formatPrice(refund.amount)} for your order #${order.orderNumber}.`
  )}

    ${generateRefundBox(refund, currency)}

    ${refund.reason ? `
    ${emailComponents.infoBox(`
      <p style="margin: 0;"><strong>Refund reason:</strong> ${refund.reason}</p>
    `)}
    ` : ""}

    ${refund.refundedItems && refund.refundedItems.length > 0 ? `
    ${emailComponents.divider()}

    ${emailComponents.heading.h2("Refunded Items")}

    ${generateRefundedItems(refund.refundedItems, currency)}
    ` : ""}

    ${generateRefundTimeline()}

    ${emailComponents.button("View Order Details", `{{store.url}}/account/orders/${order.id}`)}

    ${emailComponents.divider()}

    ${emailComponents.warningBox(`
      <p style="margin: 0; font-size: 14px;">
        <strong>Note:</strong> Refund processing times vary by payment method and bank.
        If you don't see the refund after 10 business days, please
        <a href="{{store.url}}/support" style="color: #d97706; text-decoration: none;">contact our support team</a>.
      </p>
    `)}

    ${emailComponents.mutedText("We're sorry to see this order returned. If there's anything we could have done better, please let us know.")}
  `;
}
function renderRefundNotificationEmail(data, store) {
  const content = generateRefundNotificationContent(data);
  const currency = data.order.currency || "USD";
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(amount / 100);
  };
  const mergeData = {
    order: data.order,
    refund: data.refund,
    customer: data.customer
  };
  const html = renderEmail(
    content,
    {
      title: `Refund Processed for Order #${data.order.orderNumber}`,
      preheader: `Your ${formatPrice(data.refund.amount)} refund has been processed and is on its way back to you.`
    },
    mergeData,
    { store }
  );
  const processedDate = new Date(data.refund.processedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const text = `
Your refund has been processed

Hi ${data.customer.name},

${data.refund.type === "full" ? `We've processed a full refund of ${formatPrice(data.refund.amount)} for your order #${data.order.orderNumber}.` : `We've processed a partial refund of ${formatPrice(data.refund.amount)} for your order #${data.order.orderNumber}.`}

REFUND DETAILS:
Amount: ${formatPrice(data.refund.amount)}
Type: ${data.refund.type === "full" ? "Full Refund" : "Partial Refund"}
Processed: ${processedDate}
Refund to: ${data.refund.paymentMethod || "Original payment method"}${data.refund.lastFourDigits ? ` \u2022\u2022\u2022\u2022 ${data.refund.lastFourDigits}` : ""}
${data.refund.estimatedArrival ? `Estimated arrival: ${data.refund.estimatedArrival}` : ""}

${data.refund.reason ? `Reason: ${data.refund.reason}` : ""}

${data.refund.refundedItems && data.refund.refundedItems.length > 0 ? `
REFUNDED ITEMS:
${data.refund.refundedItems.map((item) => `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`).join("\n")}
` : ""}

WHEN WILL I RECEIVE MY REFUND?
1. Refund initiated - We've started processing your refund
2. Bank processing - Your bank will process the refund (1-3 business days)
3. Funds returned - The refund will appear on your statement (3-10 business days)

If you don't see the refund after 10 business days, please contact our support team.

View your order: {{store.url}}/account/orders/${data.order.id}
  `.trim();
  return {
    html,
    text,
    subject: `Refund Processed for Order #${data.order.orderNumber}`
  };
}

// src/lib/email/templates/render.ts
async function renderEmailTemplateBySlug(slug, data) {
  const template = await _chunkI5PINI5Tjs.prisma.emailTemplate.findUnique({
    where: { slug }
  });
  if (!template) {
    return null;
  }
  return renderEmailTemplateData(template, data);
}
async function renderEmailTemplateData(template, data) {
  const emailSettings = await _chunkMT3LB7M4js.getEmailSettings.call(void 0, );
  const mergeData = _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, flattenData(data)), {
    store: {
      name: emailSettings.fromName || "Our Store",
      email: emailSettings.fromEmail || "noreply@example.com",
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    },
    currentYear: (/* @__PURE__ */ new Date()).getFullYear().toString()
  });
  let html;
  let subject = template.subject || template.name;
  subject = _chunkMT3LB7M4js.parseMergeTags.call(void 0, subject, mergeData);
  if (template.content && typeof template.content === "object") {
    html = renderPuckContent(template.content, mergeData);
  } else if (template.html) {
    html = template.html;
  } else {
    html = "<p>No content</p>";
  }
  html = _chunkMT3LB7M4js.parseMergeTags.call(void 0, html, mergeData);
  html = wrapInBaseTemplate(html, {
    title: subject,
    preheader: template.preheader ? _chunkMT3LB7M4js.parseMergeTags.call(void 0, template.preheader, mergeData) : void 0,
    store: {
      name: emailSettings.fromName || "Our Store",
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      supportEmail: emailSettings.replyTo || emailSettings.fromEmail || "support@example.com"
    }
  });
  const text = htmlToPlainText(html);
  return { html, text, subject };
}
function renderPuckContent(content, mergeData) {
  if (!content.content || !Array.isArray(content.content)) {
    return "";
  }
  return content.content.map((component) => renderPuckComponent(component, mergeData)).join("\n");
}
function renderPuckComponent(component, mergeData) {
  const props = component.props || {};
  switch (component.type) {
    case "Heading":
      const level = props.level || "h1";
      const headingText = _chunkMT3LB7M4js.parseMergeTags.call(void 0, String(props.text || ""), mergeData);
      return `<${level} style="color: #333; margin: 0 0 16px 0;">${headingText}</${level}>`;
    case "Text":
    case "Paragraph":
      const text = _chunkMT3LB7M4js.parseMergeTags.call(void 0, String(props.text || props.content || ""), mergeData);
      return `<p style="color: #333; line-height: 1.6; margin: 0 0 16px 0;">${text}</p>`;
    case "Button":
      const buttonText = _chunkMT3LB7M4js.parseMergeTags.call(void 0, String(props.label || props.text || "Click Here"), mergeData);
      const buttonUrl = _chunkMT3LB7M4js.parseMergeTags.call(void 0, String(props.url || props.href || "#"), mergeData);
      const buttonColor = props.color || "#000";
      return `
        <table border="0" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
          <tr>
            <td style="background-color: ${buttonColor}; border-radius: 6px; padding: 12px 24px;">
              <a href="${buttonUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600;">${buttonText}</a>
            </td>
          </tr>
        </table>
      `;
    case "Image":
      const src = _chunkMT3LB7M4js.parseMergeTags.call(void 0, String(props.src || props.url || ""), mergeData);
      const alt = _chunkMT3LB7M4js.parseMergeTags.call(void 0, String(props.alt || ""), mergeData);
      const width = props.width || "100%";
      return `<img src="${src}" alt="${alt}" width="${width}" style="max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px;" />`;
    case "Divider":
      return '<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />';
    case "Spacer":
      const height = props.height || 24;
      return `<div style="height: ${height}px;"></div>`;
    case "Card":
    case "Box":
      const cardContent = props.content ? renderPuckContent(props.content, mergeData) : "";
      return `<div style="background: #f9f9f9; border-radius: 8px; padding: 24px; margin: 16px 0;">${cardContent}</div>`;
    case "Table":
      const rows = props.rows || props.data || [];
      if (rows.length === 0) return "";
      const tableRows = rows.map((row) => {
        const cells = Object.entries(row).map(([key, value]) => `<td style="padding: 8px; border-bottom: 1px solid #eee;">${_chunkMT3LB7M4js.parseMergeTags.call(void 0, String(value), mergeData)}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tbody>${tableRows}</tbody></table>`;
    case "OrderSummary":
    case "SubmissionData":
      const dataKey = typeof props.dataKey === "string" ? props.dataKey : "submission.fields";
      const fields = getNestedValue(mergeData, dataKey) || [];
      if (!Array.isArray(fields) || fields.length === 0) return "";
      const summaryRows = fields.map((field) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 500;">${field.label}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${field.value}</td>
          </tr>
        `).join("");
      return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tbody>${summaryRows}</tbody></table>`;
    default:
      if (props.children && typeof props.children === "string") {
        return `<div>${_chunkMT3LB7M4js.parseMergeTags.call(void 0, props.children, mergeData)}</div>`;
      }
      return "";
  }
}
function flattenData(data, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === void 0) {
      result[fullKey] = "";
    } else if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenData(value, fullKey));
      result[fullKey] = value;
    } else if (Array.isArray(value)) {
      result[fullKey] = value;
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object") {
      return current[key];
    }
    return void 0;
  }, obj);
}

// src/lib/notifications/index.ts
async function getStoreConfig() {
  const settings = await _chunkMT3LB7M4js.getEmailSettings.call(void 0, );
  return {
    name: settings.fromName || "Our Store",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    supportEmail: settings.replyTo || settings.fromEmail,
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL
  };
}
function formatAddress(address) {
  if (!address) {
    return {
      name: "",
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US"
    };
  }
  return {
    name: `${address.firstName} ${address.lastName}`.trim(),
    line1: address.street1,
    line2: address.street2 || void 0,
    city: address.city,
    state: address.state,
    postalCode: address.zip,
    country: address.country
  };
}
function getCustomerName(address, customer) {
  if (address) {
    return `${address.firstName} ${address.lastName}`.trim() || "Customer";
  }
  if (customer) {
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
    return name || "Customer";
  }
  return "Customer";
}
async function sendOrderConfirmation(orderId) {
  var _a;
  try {
    const order = await _chunkI5PINI5Tjs.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  include: {
                    media: true
                  },
                  orderBy: { position: "asc" },
                  take: 1
                }
              }
            }
          }
        },
        customer: true,
        shippingAddress: true,
        billingAddress: true
      }
    });
    if (!order) {
      return { success: false, error: "Order not found" };
    }
    const customerEmail = order.email || ((_a = order.customer) == null ? void 0 : _a.email);
    if (!customerEmail) {
      return { success: false, error: "No customer email" };
    }
    const data = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        items: order.items.map((item) => {
          var _a2, _b, _c, _d, _e;
          return {
            id: item.id,
            name: ((_a2 = item.product) == null ? void 0 : _a2.title) || item.title || "Product",
            variant: item.variantTitle || void 0,
            quantity: item.quantity,
            price: item.price,
            // Already in cents
            imageUrl: ((_e = (_d = (_c = (_b = item.product) == null ? void 0 : _b.images) == null ? void 0 : _c[0]) == null ? void 0 : _d.media) == null ? void 0 : _e.url) || void 0
          };
        }),
        subtotal: order.subtotal,
        shipping: order.shippingTotal,
        tax: order.taxTotal,
        discount: order.discountTotal > 0 ? order.discountTotal : void 0,
        total: order.total,
        currency: "USD",
        // Default currency
        paymentMethod: "Credit Card",
        shippingAddress: formatAddress(order.shippingAddress),
        billingAddress: order.billingAddress ? formatAddress(order.billingAddress) : void 0,
        shippingMethod: void 0,
        notes: order.customerNotes || void 0
      },
      customer: {
        name: getCustomerName(order.shippingAddress, order.customer),
        email: customerEmail
      }
    };
    const store = await getStoreConfig();
    let html;
    let text;
    let subject;
    const puckResult = await renderEmailTemplateBySlug("order-confirmation", {
      order: data.order,
      customer: data.customer
    });
    if (puckResult) {
      html = puckResult.html;
      text = puckResult.text;
      subject = puckResult.subject || `Order Confirmation #${data.order.orderNumber}`;
    } else {
      const fallback = renderOrderConfirmationEmail(data, store);
      html = fallback.html;
      text = fallback.text;
      subject = fallback.subject;
    }
    const result = await _chunkMT3LB7M4js.sendEmail.call(void 0, {
      to: { email: customerEmail, name: data.customer.name },
      subject,
      html,
      text,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        type: "order_confirmation"
      }
    });
    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error("Error sending order confirmation:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function sendShippingNotification(orderId, shipmentId) {
  var _a;
  try {
    const order = await _chunkI5PINI5Tjs.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  include: {
                    media: true
                  },
                  orderBy: { position: "asc" },
                  take: 1
                }
              }
            }
          }
        },
        customer: true,
        shippingAddress: true
      }
    });
    if (!order) {
      return { success: false, error: "Order not found" };
    }
    const shipment = await _chunkI5PINI5Tjs.prisma.shipment.findUnique({
      where: { id: shipmentId }
    });
    if (!shipment) {
      return { success: false, error: "Shipment not found" };
    }
    const customerEmail = order.email || ((_a = order.customer) == null ? void 0 : _a.email);
    if (!customerEmail) {
      return { success: false, error: "No customer email" };
    }
    const data = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        items: order.items.map((item) => {
          var _a2, _b, _c, _d, _e;
          return {
            id: item.id,
            name: ((_a2 = item.product) == null ? void 0 : _a2.title) || item.title || "Product",
            variant: item.variantTitle || void 0,
            quantity: item.quantity,
            price: item.price,
            // Already in cents
            imageUrl: ((_e = (_d = (_c = (_b = item.product) == null ? void 0 : _b.images) == null ? void 0 : _c[0]) == null ? void 0 : _d.media) == null ? void 0 : _e.url) || void 0
          };
        })
      },
      shipment: {
        id: shipment.id,
        carrier: shipment.carrier || "Unknown",
        carrierName: getCarrierName(shipment.carrier || ""),
        trackingNumber: shipment.trackingNumber || "",
        trackingUrl: shipment.trackingUrl || void 0,
        shippedAt: shipment.shippedAt || /* @__PURE__ */ new Date(),
        estimatedDelivery: void 0,
        // Not available in schema
        shippingAddress: formatAddress(order.shippingAddress)
      },
      customer: {
        name: getCustomerName(order.shippingAddress, order.customer),
        email: customerEmail
      }
    };
    const store = await getStoreConfig();
    let html;
    let text;
    let subject;
    const puckResult = await renderEmailTemplateBySlug("shipping-notification", {
      order: data.order,
      shipment: data.shipment,
      customer: data.customer
    });
    if (puckResult) {
      html = puckResult.html;
      text = puckResult.text;
      subject = puckResult.subject || `Your order #${data.order.orderNumber} has shipped!`;
    } else {
      const fallback = renderShippingNotificationEmail(data, store);
      html = fallback.html;
      text = fallback.text;
      subject = fallback.subject;
    }
    const result = await _chunkMT3LB7M4js.sendEmail.call(void 0, {
      to: { email: customerEmail, name: data.customer.name },
      subject,
      html,
      text,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        shipmentId: shipment.id,
        type: "shipping_notification"
      }
    });
    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error("Error sending shipping notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function sendDeliveryConfirmation(orderId, shipmentId) {
  var _a;
  try {
    const order = await _chunkI5PINI5Tjs.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  include: {
                    media: true
                  },
                  orderBy: { position: "asc" },
                  take: 1
                }
              }
            }
          }
        },
        customer: true,
        shippingAddress: true
      }
    });
    if (!order) {
      return { success: false, error: "Order not found" };
    }
    const shipment = await _chunkI5PINI5Tjs.prisma.shipment.findUnique({
      where: { id: shipmentId }
    });
    if (!shipment) {
      return { success: false, error: "Shipment not found" };
    }
    const customerEmail = order.email || ((_a = order.customer) == null ? void 0 : _a.email);
    if (!customerEmail) {
      return { success: false, error: "No customer email" };
    }
    const data = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        items: order.items.map((item) => {
          var _a2, _b, _c, _d, _e;
          return {
            id: item.id,
            name: ((_a2 = item.product) == null ? void 0 : _a2.title) || item.title || "Product",
            variant: item.variantTitle || void 0,
            quantity: item.quantity,
            price: item.price,
            // Already in cents
            imageUrl: ((_e = (_d = (_c = (_b = item.product) == null ? void 0 : _b.images) == null ? void 0 : _c[0]) == null ? void 0 : _d.media) == null ? void 0 : _e.url) || void 0
          };
        })
      },
      delivery: {
        deliveredAt: shipment.deliveredAt || /* @__PURE__ */ new Date(),
        signedBy: void 0,
        // Not tracked in schema
        shippingAddress: formatAddress(order.shippingAddress)
      },
      customer: {
        name: getCustomerName(order.shippingAddress, order.customer),
        email: customerEmail
      }
    };
    const store = await getStoreConfig();
    let html;
    let text;
    let subject;
    const puckResult = await renderEmailTemplateBySlug("delivery-confirmation", {
      order: data.order,
      delivery: data.delivery,
      customer: data.customer
    });
    if (puckResult) {
      html = puckResult.html;
      text = puckResult.text;
      subject = puckResult.subject || `Your order #${data.order.orderNumber} has been delivered!`;
    } else {
      const fallback = renderDeliveryConfirmationEmail(data, store);
      html = fallback.html;
      text = fallback.text;
      subject = fallback.subject;
    }
    const result = await _chunkMT3LB7M4js.sendEmail.call(void 0, {
      to: { email: customerEmail, name: data.customer.name },
      subject,
      html,
      text,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        shipmentId: shipment.id,
        type: "delivery_confirmation"
      }
    });
    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error("Error sending delivery confirmation:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function sendRefundNotification(orderId, refundAmount, refundReason, isFullRefund = true) {
  var _a;
  try {
    const order = await _chunkI5PINI5Tjs.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  include: {
                    media: true
                  },
                  orderBy: { position: "asc" },
                  take: 1
                }
              }
            }
          }
        },
        customer: true
      }
    });
    if (!order) {
      return { success: false, error: "Order not found" };
    }
    const customerEmail = order.email || ((_a = order.customer) == null ? void 0 : _a.email);
    if (!customerEmail) {
      return { success: false, error: "No customer email" };
    }
    const data = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        // Already in cents
        currency: "USD",
        items: order.items.map((item) => {
          var _a2, _b, _c, _d, _e;
          return {
            id: item.id,
            name: ((_a2 = item.product) == null ? void 0 : _a2.title) || item.title || "Product",
            variant: item.variantTitle || void 0,
            quantity: item.quantity,
            price: item.price,
            // Already in cents
            imageUrl: ((_e = (_d = (_c = (_b = item.product) == null ? void 0 : _b.images) == null ? void 0 : _c[0]) == null ? void 0 : _d.media) == null ? void 0 : _e.url) || void 0
          };
        })
      },
      refund: {
        id: `refund_${Date.now()}`,
        amount: refundAmount,
        // Already in cents
        reason: refundReason,
        type: isFullRefund ? "full" : "partial",
        processedAt: /* @__PURE__ */ new Date(),
        paymentMethod: "Original payment method",
        estimatedArrival: "5-10 business days"
      },
      customer: {
        name: order.customer ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(" ") || "Customer" : "Customer",
        email: customerEmail
      }
    };
    const store = await getStoreConfig();
    let html;
    let text;
    let subject;
    const puckResult = await renderEmailTemplateBySlug("refund-notification", {
      order: data.order,
      refund: data.refund,
      customer: data.customer
    });
    if (puckResult) {
      html = puckResult.html;
      text = puckResult.text;
      subject = puckResult.subject || `Refund processed for order #${data.order.orderNumber}`;
    } else {
      const fallback = renderRefundNotificationEmail(data, store);
      html = fallback.html;
      text = fallback.text;
      subject = fallback.subject;
    }
    const result = await _chunkMT3LB7M4js.sendEmail.call(void 0, {
      to: { email: customerEmail, name: data.customer.name },
      subject,
      html,
      text,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        type: "refund_notification"
      }
    });
    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error("Error sending refund notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
function getCarrierName(carrier) {
  const names = {
    usps: "USPS",
    ups: "UPS",
    fedex: "FedEx",
    dhl: "DHL",
    fedex_ground: "FedEx Ground",
    fedex_express: "FedEx Express",
    ups_ground: "UPS Ground",
    usps_priority: "USPS Priority Mail",
    usps_express: "USPS Express"
  };
  return names[carrier.toLowerCase()] || carrier;
}

// src/lib/permissions/constants.ts
var PERMISSIONS = {
  // Products
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_EDIT: "products.edit",
  PRODUCTS_DELETE: "products.delete",
  PRODUCTS_PUBLISH: "products.publish",
  PRODUCTS_ALL: "products.*",
  // Product Variants
  VARIANTS_VIEW: "variants.view",
  VARIANTS_CREATE: "variants.create",
  VARIANTS_EDIT: "variants.edit",
  VARIANTS_DELETE: "variants.delete",
  VARIANTS_ALL: "variants.*",
  // Orders
  ORDERS_VIEW: "orders.view",
  ORDERS_CREATE: "orders.create",
  ORDERS_EDIT: "orders.edit",
  ORDERS_DELETE: "orders.delete",
  ORDERS_FULFILL: "orders.fulfill",
  ORDERS_REFUND: "orders.refund",
  ORDERS_CANCEL: "orders.cancel",
  ORDERS_ALL: "orders.*",
  // Inventory
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_EDIT: "inventory.edit",
  INVENTORY_ALL: "inventory.*",
  // Customers
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_EDIT: "customers.edit",
  CUSTOMERS_DELETE: "customers.delete",
  CUSTOMERS_EXPORT: "customers.export",
  CUSTOMERS_ALL: "customers.*",
  // Content - Pages
  PAGES_VIEW: "pages.view",
  PAGES_CREATE: "pages.create",
  PAGES_EDIT: "pages.edit",
  PAGES_DELETE: "pages.delete",
  PAGES_PUBLISH: "pages.publish",
  PAGES_ALL: "pages.*",
  // Puck Templates
  PUCK_TEMPLATES_VIEW: "puck_templates.view",
  PUCK_TEMPLATES_CREATE: "puck_templates.create",
  PUCK_TEMPLATES_EDIT: "puck_templates.edit",
  PUCK_TEMPLATES_DELETE: "puck_templates.delete",
  PUCK_TEMPLATES_ALL: "puck_templates.*",
  // Routes Configuration
  ROUTES_VIEW: "routes.view",
  ROUTES_CREATE: "routes.create",
  ROUTES_EDIT: "routes.edit",
  ROUTES_DELETE: "routes.delete",
  ROUTES_ALL: "routes.*",
  // Content - Blog
  BLOG_VIEW: "blog.view",
  BLOG_CREATE: "blog.create",
  BLOG_EDIT: "blog.edit",
  BLOG_DELETE: "blog.delete",
  BLOG_PUBLISH: "blog.publish",
  BLOG_ALL: "blog.*",
  // Media
  MEDIA_VIEW: "media.view",
  MEDIA_UPLOAD: "media.upload",
  MEDIA_EDIT: "media.edit",
  MEDIA_DELETE: "media.delete",
  MEDIA_ALL: "media.*",
  // Categories
  CATEGORIES_VIEW: "categories.view",
  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_EDIT: "categories.edit",
  CATEGORIES_DELETE: "categories.delete",
  CATEGORIES_ALL: "categories.*",
  // Custom Fields
  CUSTOM_FIELDS_VIEW: "custom_fields.view",
  CUSTOM_FIELDS_CREATE: "custom_fields.create",
  CUSTOM_FIELDS_EDIT: "custom_fields.edit",
  CUSTOM_FIELDS_DELETE: "custom_fields.delete",
  CUSTOM_FIELDS_ALL: "custom_fields.*",
  // Settings
  SETTINGS_VIEW: "settings.view",
  SETTINGS_GENERAL: "settings.general",
  SETTINGS_PAYMENTS: "settings.payments",
  SETTINGS_SHIPPING: "settings.shipping",
  SETTINGS_TAXES: "settings.taxes",
  SETTINGS_EMAIL: "settings.email",
  SETTINGS_STORAGE: "settings.storage",
  SETTINGS_AI: "settings.ai",
  SETTINGS_ALL: "settings.*",
  // Users & Roles
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",
  USERS_ROLES: "users.roles",
  // Manage role assignments
  USERS_PERMISSIONS: "users.permissions",
  // Manage permission overrides
  USERS_ALL: "users.*",
  // Roles Management
  ROLES_VIEW: "roles.view",
  ROLES_CREATE: "roles.create",
  ROLES_EDIT: "roles.edit",
  ROLES_DELETE: "roles.delete",
  ROLES_ALL: "roles.*",
  // Analytics
  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_EXPORT: "analytics.export",
  ANALYTICS_ALL: "analytics.*",
  // Plugins & Workflows
  PLUGINS_VIEW: "plugins.view",
  PLUGINS_INSTALL: "plugins.install",
  PLUGINS_CONFIGURE: "plugins.configure",
  PLUGINS_DELETE: "plugins.delete",
  PLUGINS_ALL: "plugins.*",
  WORKFLOWS_VIEW: "workflows.view",
  WORKFLOWS_CREATE: "workflows.create",
  WORKFLOWS_EDIT: "workflows.edit",
  WORKFLOWS_DELETE: "workflows.delete",
  WORKFLOWS_EXECUTE: "workflows.execute",
  WORKFLOWS_ALL: "workflows.*",
  // Forms
  FORMS_VIEW: "forms.view",
  FORMS_CREATE: "forms.create",
  FORMS_EDIT: "forms.edit",
  FORMS_DELETE: "forms.delete",
  FORMS_SUBMISSIONS: "forms.submissions",
  FORMS_ALL: "forms.*",
  // Email Campaigns
  EMAIL_VIEW: "email.view",
  EMAIL_CREATE: "email.create",
  EMAIL_EDIT: "email.edit",
  EMAIL_DELETE: "email.delete",
  EMAIL_SEND: "email.send",
  EMAIL_ALL: "email.*",
  // Audit Log
  AUDIT_VIEW: "audit.view",
  // Super Admin (all permissions)
  SUPER_ADMIN: "*"
};
var PERMISSION_GROUPS = {
  products: {
    label: "Products",
    permissions: [
      { key: PERMISSIONS.PRODUCTS_VIEW, label: "View products" },
      { key: PERMISSIONS.PRODUCTS_CREATE, label: "Create products" },
      { key: PERMISSIONS.PRODUCTS_EDIT, label: "Edit products" },
      { key: PERMISSIONS.PRODUCTS_DELETE, label: "Delete products" },
      { key: PERMISSIONS.PRODUCTS_PUBLISH, label: "Publish/unpublish products" }
    ]
  },
  variants: {
    label: "Product Variants",
    permissions: [
      { key: PERMISSIONS.VARIANTS_VIEW, label: "View variants" },
      { key: PERMISSIONS.VARIANTS_CREATE, label: "Create variants" },
      { key: PERMISSIONS.VARIANTS_EDIT, label: "Edit variants" },
      { key: PERMISSIONS.VARIANTS_DELETE, label: "Delete variants" }
    ]
  },
  orders: {
    label: "Orders",
    permissions: [
      { key: PERMISSIONS.ORDERS_VIEW, label: "View orders" },
      { key: PERMISSIONS.ORDERS_CREATE, label: "Create orders" },
      { key: PERMISSIONS.ORDERS_EDIT, label: "Edit orders" },
      { key: PERMISSIONS.ORDERS_DELETE, label: "Delete orders" },
      { key: PERMISSIONS.ORDERS_FULFILL, label: "Fulfill orders" },
      { key: PERMISSIONS.ORDERS_REFUND, label: "Process refunds" },
      { key: PERMISSIONS.ORDERS_CANCEL, label: "Cancel orders" }
    ]
  },
  inventory: {
    label: "Inventory",
    permissions: [
      { key: PERMISSIONS.INVENTORY_VIEW, label: "View inventory" },
      { key: PERMISSIONS.INVENTORY_EDIT, label: "Edit inventory" }
    ]
  },
  customers: {
    label: "Customers",
    permissions: [
      { key: PERMISSIONS.CUSTOMERS_VIEW, label: "View customers" },
      { key: PERMISSIONS.CUSTOMERS_CREATE, label: "Create customers" },
      { key: PERMISSIONS.CUSTOMERS_EDIT, label: "Edit customers" },
      { key: PERMISSIONS.CUSTOMERS_DELETE, label: "Delete customers" },
      { key: PERMISSIONS.CUSTOMERS_EXPORT, label: "Export customer data" }
    ]
  },
  pages: {
    label: "Pages",
    permissions: [
      { key: PERMISSIONS.PAGES_VIEW, label: "View pages" },
      { key: PERMISSIONS.PAGES_CREATE, label: "Create pages" },
      { key: PERMISSIONS.PAGES_EDIT, label: "Edit pages" },
      { key: PERMISSIONS.PAGES_DELETE, label: "Delete pages" },
      { key: PERMISSIONS.PAGES_PUBLISH, label: "Publish pages" }
    ]
  },
  puck_templates: {
    label: "Page Templates",
    permissions: [
      { key: PERMISSIONS.PUCK_TEMPLATES_VIEW, label: "View templates" },
      { key: PERMISSIONS.PUCK_TEMPLATES_CREATE, label: "Create templates" },
      { key: PERMISSIONS.PUCK_TEMPLATES_EDIT, label: "Edit templates" },
      { key: PERMISSIONS.PUCK_TEMPLATES_DELETE, label: "Delete templates" }
    ]
  },
  routes: {
    label: "Route Configuration",
    permissions: [
      { key: PERMISSIONS.ROUTES_VIEW, label: "View routes" },
      { key: PERMISSIONS.ROUTES_CREATE, label: "Create routes" },
      { key: PERMISSIONS.ROUTES_EDIT, label: "Edit routes" },
      { key: PERMISSIONS.ROUTES_DELETE, label: "Delete routes" }
    ]
  },
  blog: {
    label: "Blog",
    permissions: [
      { key: PERMISSIONS.BLOG_VIEW, label: "View blog posts" },
      { key: PERMISSIONS.BLOG_CREATE, label: "Create blog posts" },
      { key: PERMISSIONS.BLOG_EDIT, label: "Edit blog posts" },
      { key: PERMISSIONS.BLOG_DELETE, label: "Delete blog posts" },
      { key: PERMISSIONS.BLOG_PUBLISH, label: "Publish blog posts" }
    ]
  },
  media: {
    label: "Media",
    permissions: [
      { key: PERMISSIONS.MEDIA_VIEW, label: "View media" },
      { key: PERMISSIONS.MEDIA_UPLOAD, label: "Upload media" },
      { key: PERMISSIONS.MEDIA_EDIT, label: "Edit media" },
      { key: PERMISSIONS.MEDIA_DELETE, label: "Delete media" }
    ]
  },
  categories: {
    label: "Categories",
    permissions: [
      { key: PERMISSIONS.CATEGORIES_VIEW, label: "View categories" },
      { key: PERMISSIONS.CATEGORIES_CREATE, label: "Create categories" },
      { key: PERMISSIONS.CATEGORIES_EDIT, label: "Edit categories" },
      { key: PERMISSIONS.CATEGORIES_DELETE, label: "Delete categories" }
    ]
  },
  settings: {
    label: "Settings",
    permissions: [
      { key: PERMISSIONS.SETTINGS_VIEW, label: "View settings" },
      { key: PERMISSIONS.SETTINGS_GENERAL, label: "General settings" },
      { key: PERMISSIONS.SETTINGS_PAYMENTS, label: "Payment settings" },
      { key: PERMISSIONS.SETTINGS_SHIPPING, label: "Shipping settings" },
      { key: PERMISSIONS.SETTINGS_TAXES, label: "Tax settings" },
      { key: PERMISSIONS.SETTINGS_EMAIL, label: "Email settings" },
      { key: PERMISSIONS.SETTINGS_STORAGE, label: "Storage settings" },
      { key: PERMISSIONS.SETTINGS_AI, label: "AI settings" }
    ]
  },
  users: {
    label: "User Management",
    permissions: [
      { key: PERMISSIONS.USERS_VIEW, label: "View users" },
      { key: PERMISSIONS.USERS_CREATE, label: "Create users" },
      { key: PERMISSIONS.USERS_EDIT, label: "Edit users" },
      { key: PERMISSIONS.USERS_DELETE, label: "Delete users" },
      { key: PERMISSIONS.USERS_ROLES, label: "Manage user roles" },
      { key: PERMISSIONS.USERS_PERMISSIONS, label: "Manage user permissions" }
    ]
  },
  roles: {
    label: "Role Management",
    permissions: [
      { key: PERMISSIONS.ROLES_VIEW, label: "View roles" },
      { key: PERMISSIONS.ROLES_CREATE, label: "Create roles" },
      { key: PERMISSIONS.ROLES_EDIT, label: "Edit roles" },
      { key: PERMISSIONS.ROLES_DELETE, label: "Delete roles" }
    ]
  },
  analytics: {
    label: "Analytics",
    permissions: [
      { key: PERMISSIONS.ANALYTICS_VIEW, label: "View analytics" },
      { key: PERMISSIONS.ANALYTICS_EXPORT, label: "Export analytics" }
    ]
  },
  plugins: {
    label: "Plugins",
    permissions: [
      { key: PERMISSIONS.PLUGINS_VIEW, label: "View plugins" },
      { key: PERMISSIONS.PLUGINS_INSTALL, label: "Install plugins" },
      { key: PERMISSIONS.PLUGINS_CONFIGURE, label: "Configure plugins" },
      { key: PERMISSIONS.PLUGINS_DELETE, label: "Delete plugins" }
    ]
  },
  workflows: {
    label: "Workflows",
    permissions: [
      { key: PERMISSIONS.WORKFLOWS_VIEW, label: "View workflows" },
      { key: PERMISSIONS.WORKFLOWS_CREATE, label: "Create workflows" },
      { key: PERMISSIONS.WORKFLOWS_EDIT, label: "Edit workflows" },
      { key: PERMISSIONS.WORKFLOWS_DELETE, label: "Delete workflows" },
      { key: PERMISSIONS.WORKFLOWS_EXECUTE, label: "Execute workflows" }
    ]
  },
  forms: {
    label: "Forms",
    permissions: [
      { key: PERMISSIONS.FORMS_VIEW, label: "View forms" },
      { key: PERMISSIONS.FORMS_CREATE, label: "Create forms" },
      { key: PERMISSIONS.FORMS_EDIT, label: "Edit forms" },
      { key: PERMISSIONS.FORMS_DELETE, label: "Delete forms" },
      { key: PERMISSIONS.FORMS_SUBMISSIONS, label: "View submissions" }
    ]
  },
  email: {
    label: "Email Campaigns",
    permissions: [
      { key: PERMISSIONS.EMAIL_VIEW, label: "View campaigns" },
      { key: PERMISSIONS.EMAIL_CREATE, label: "Create campaigns" },
      { key: PERMISSIONS.EMAIL_EDIT, label: "Edit campaigns" },
      { key: PERMISSIONS.EMAIL_DELETE, label: "Delete campaigns" },
      { key: PERMISSIONS.EMAIL_SEND, label: "Send campaigns" }
    ]
  },
  audit: {
    label: "Audit Log",
    permissions: [
      { key: PERMISSIONS.AUDIT_VIEW, label: "View audit log" }
    ]
  }
};
var BUILT_IN_ROLES = {
  super_admin: {
    name: "super_admin",
    displayName: "Super Admin",
    description: "Full access to all features and settings",
    permissions: [PERMISSIONS.SUPER_ADMIN],
    isSystem: true,
    position: 0
  },
  store_manager: {
    name: "store_manager",
    displayName: "Store Manager",
    description: "Manage products, orders, inventory, and customers",
    permissions: [
      PERMISSIONS.PRODUCTS_ALL,
      PERMISSIONS.VARIANTS_ALL,
      PERMISSIONS.ORDERS_ALL,
      PERMISSIONS.INVENTORY_ALL,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_EDIT,
      PERMISSIONS.CATEGORIES_ALL,
      PERMISSIONS.MEDIA_VIEW,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.ANALYTICS_VIEW
    ],
    isSystem: true,
    position: 1
  },
  content_editor: {
    name: "content_editor",
    displayName: "Content Editor",
    description: "Manage pages, blog posts, and media",
    permissions: [
      PERMISSIONS.PAGES_ALL,
      PERMISSIONS.BLOG_ALL,
      PERMISSIONS.MEDIA_ALL,
      PERMISSIONS.CATEGORIES_VIEW,
      PERMISSIONS.CATEGORIES_EDIT
    ],
    isSystem: true,
    position: 2
  },
  order_fulfiller: {
    name: "order_fulfiller",
    displayName: "Order Fulfiller",
    description: "View and fulfill orders",
    permissions: [
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_FULFILL,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW
    ],
    isSystem: true,
    position: 3
  },
  support_staff: {
    name: "support_staff",
    displayName: "Support Staff",
    description: "View orders and manage customer inquiries",
    permissions: [
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_EDIT
    ],
    isSystem: true,
    position: 4
  }
};

// src/lib/permissions/index.ts
async function getUserPermissions(userId) {
  const user = await _chunkI5PINI5Tjs.prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleAssignments: {
        include: {
          role: true
        }
      },
      permissions: {
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: /* @__PURE__ */ new Date() } }
          ]
        }
      }
    }
  });
  if (!user) return null;
  const roles = user.roleAssignments.map((ra) => ({
    id: ra.role.id,
    name: ra.role.name,
    displayName: ra.role.displayName,
    description: ra.role.description,
    permissions: ra.role.permissions,
    isSystem: ra.role.isSystem
  }));
  const overrides = user.permissions.map((p) => ({
    id: p.id,
    permission: p.permission,
    type: p.type,
    expiresAt: p.expiresAt,
    reason: p.reason
  }));
  const permissions = computeEffectivePermissions(roles, overrides);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    permissions,
    roles,
    overrides
  };
}
function computeEffectivePermissions(roles, overrides) {
  const permissions = /* @__PURE__ */ new Set();
  for (const role of roles) {
    for (const perm of role.permissions) {
      permissions.add(perm);
    }
  }
  for (const override of overrides) {
    if (override.type === "DENY") {
      permissions.delete(override.permission);
    }
  }
  for (const override of overrides) {
    if (override.type === "GRANT") {
      permissions.add(override.permission);
    }
  }
  return permissions;
}
function permissionMatches(userPermission, requiredPermission) {
  if (userPermission === requiredPermission) return true;
  if (userPermission === "*") return true;
  if (userPermission.endsWith(".*")) {
    const resource = userPermission.slice(0, -2);
    return requiredPermission.startsWith(resource + ".");
  }
  return false;
}
async function hasPermission(userId, permission) {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) {
    return { allowed: false, reason: "User not found" };
  }
  return checkPermission(userPerms, permission);
}
function checkPermission(userPerms, requiredPermission) {
  if (userPerms.permissions.has("*")) {
    return {
      allowed: true,
      source: { type: "super_admin" }
    };
  }
  for (const userPerm of userPerms.permissions) {
    if (permissionMatches(userPerm, requiredPermission)) {
      const grantOverride = userPerms.overrides.find(
        (o) => o.type === "GRANT" && o.permission === userPerm
      );
      if (grantOverride) {
        return {
          allowed: true,
          source: {
            type: "override",
            id: grantOverride.id
          }
        };
      }
      for (const role of userPerms.roles) {
        if (role.permissions.some((p) => permissionMatches(p, requiredPermission))) {
          return {
            allowed: true,
            source: {
              type: "role",
              id: role.id,
              name: role.displayName
            }
          };
        }
      }
      return { allowed: true };
    }
  }
  const denyOverride = userPerms.overrides.find(
    (o) => o.type === "DENY" && o.permission === requiredPermission
  );
  if (denyOverride) {
    return {
      allowed: false,
      reason: denyOverride.reason || "Permission explicitly denied",
      source: {
        type: "override",
        id: denyOverride.id
      }
    };
  }
  return {
    allowed: false,
    reason: "Permission not granted by any role"
  };
}
async function hasAllPermissions(userId, permissions) {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;
  return permissions.every((p) => checkPermission(userPerms, p).allowed);
}
async function hasAnyPermission(userId, permissions) {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;
  return permissions.some((p) => checkPermission(userPerms, p).allowed);
}
async function isSuperAdmin(userId) {
  var _a;
  const userPerms = await getUserPermissions(userId);
  return (_a = userPerms == null ? void 0 : userPerms.permissions.has("*")) != null ? _a : false;
}
async function logAuditEvent(params) {
  await _chunkI5PINI5Tjs.prisma.auditLog.create({
    data: {
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    }
  });
}
async function seedBuiltInRoles() {
  for (const [, roleData] of Object.entries(BUILT_IN_ROLES)) {
    await _chunkI5PINI5Tjs.prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        displayName: roleData.displayName,
        description: roleData.description,
        permissions: roleData.permissions,
        position: roleData.position
      },
      create: {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        permissions: roleData.permissions,
        isSystem: roleData.isSystem,
        position: roleData.position
      }
    });
  }
}
async function assignRole(params) {
  await _chunkI5PINI5Tjs.prisma.roleAssignment.create({
    data: {
      userId: params.userId,
      roleId: params.roleId,
      assignedBy: params.assignedBy
    }
  });
  if (params.assignedBy) {
    const assigner = await _chunkI5PINI5Tjs.prisma.user.findUnique({
      where: { id: params.assignedBy },
      select: { email: true }
    });
    const role = await _chunkI5PINI5Tjs.prisma.role.findUnique({
      where: { id: params.roleId },
      select: { name: true }
    });
    await logAuditEvent({
      userId: params.assignedBy,
      userEmail: assigner == null ? void 0 : assigner.email,
      action: "role.assign",
      targetType: "user",
      targetId: params.userId,
      details: {
        roleId: params.roleId,
        roleName: role == null ? void 0 : role.name
      }
    });
  }
}
async function removeRole(params) {
  await _chunkI5PINI5Tjs.prisma.roleAssignment.delete({
    where: {
      userId_roleId: {
        userId: params.userId,
        roleId: params.roleId
      }
    }
  });
  if (params.removedBy) {
    const remover = await _chunkI5PINI5Tjs.prisma.user.findUnique({
      where: { id: params.removedBy },
      select: { email: true }
    });
    const role = await _chunkI5PINI5Tjs.prisma.role.findUnique({
      where: { id: params.roleId },
      select: { name: true }
    });
    await logAuditEvent({
      userId: params.removedBy,
      userEmail: remover == null ? void 0 : remover.email,
      action: "role.remove",
      targetType: "user",
      targetId: params.userId,
      details: {
        roleId: params.roleId,
        roleName: role == null ? void 0 : role.name
      }
    });
  }
}
async function grantPermission(params) {
  var _a;
  await _chunkI5PINI5Tjs.prisma.userPermission.upsert({
    where: {
      userId_permission: {
        userId: params.userId,
        permission: params.permission
      }
    },
    update: {
      type: "GRANT",
      expiresAt: params.expiresAt,
      reason: params.reason,
      grantedBy: params.grantedBy
    },
    create: {
      userId: params.userId,
      permission: params.permission,
      type: "GRANT",
      expiresAt: params.expiresAt,
      reason: params.reason,
      grantedBy: params.grantedBy
    }
  });
  if (params.grantedBy) {
    const granter = await _chunkI5PINI5Tjs.prisma.user.findUnique({
      where: { id: params.grantedBy },
      select: { email: true }
    });
    await logAuditEvent({
      userId: params.grantedBy,
      userEmail: granter == null ? void 0 : granter.email,
      action: "permission.grant",
      targetType: "user",
      targetId: params.userId,
      details: {
        permission: params.permission,
        expiresAt: (_a = params.expiresAt) == null ? void 0 : _a.toISOString(),
        reason: params.reason
      }
    });
  }
}
async function denyPermission(params) {
  var _a;
  await _chunkI5PINI5Tjs.prisma.userPermission.upsert({
    where: {
      userId_permission: {
        userId: params.userId,
        permission: params.permission
      }
    },
    update: {
      type: "DENY",
      expiresAt: params.expiresAt,
      reason: params.reason,
      grantedBy: params.deniedBy
    },
    create: {
      userId: params.userId,
      permission: params.permission,
      type: "DENY",
      expiresAt: params.expiresAt,
      reason: params.reason,
      grantedBy: params.deniedBy
    }
  });
  if (params.deniedBy) {
    const denier = await _chunkI5PINI5Tjs.prisma.user.findUnique({
      where: { id: params.deniedBy },
      select: { email: true }
    });
    await logAuditEvent({
      userId: params.deniedBy,
      userEmail: denier == null ? void 0 : denier.email,
      action: "permission.deny",
      targetType: "user",
      targetId: params.userId,
      details: {
        permission: params.permission,
        expiresAt: (_a = params.expiresAt) == null ? void 0 : _a.toISOString(),
        reason: params.reason
      }
    });
  }
}
async function removePermissionOverride(params) {
  const existing = await _chunkI5PINI5Tjs.prisma.userPermission.findUnique({
    where: {
      userId_permission: {
        userId: params.userId,
        permission: params.permission
      }
    }
  });
  if (!existing) return;
  await _chunkI5PINI5Tjs.prisma.userPermission.delete({
    where: {
      userId_permission: {
        userId: params.userId,
        permission: params.permission
      }
    }
  });
  if (params.removedBy) {
    const remover = await _chunkI5PINI5Tjs.prisma.user.findUnique({
      where: { id: params.removedBy },
      select: { email: true }
    });
    await logAuditEvent({
      userId: params.removedBy,
      userEmail: remover == null ? void 0 : remover.email,
      action: "permission.remove",
      targetType: "user",
      targetId: params.userId,
      details: {
        permission: params.permission,
        previousType: existing.type
      }
    });
  }
}

// src/lib/order-workflows/types.ts
var DEFAULT_WORKFLOW_TEMPLATES = [
  {
    name: "Standard Shipping",
    slug: "standard-shipping",
    description: "Default workflow for physical products requiring shipping",
    enableShippoSync: true,
    stages: [
      {
        name: "order_received",
        slug: "order-received",
        displayName: "Order Received",
        customerMessage: "We've received your order and are preparing it for processing.",
        icon: "inbox",
        color: "#3B82F6",
        position: 0,
        notifyCustomer: true,
        estimatedDuration: 24,
        shippoEventTrigger: null
      },
      {
        name: "processing",
        slug: "processing",
        displayName: "Processing",
        customerMessage: "Your order is being prepared and will be shipped soon.",
        icon: "package",
        color: "#F59E0B",
        position: 1,
        notifyCustomer: true,
        estimatedDuration: 48,
        shippoEventTrigger: "PRE_TRANSIT"
      },
      {
        name: "shipped",
        slug: "shipped",
        displayName: "Shipped",
        customerMessage: "Great news! Your order is on its way.",
        icon: "truck",
        color: "#8B5CF6",
        position: 2,
        notifyCustomer: true,
        estimatedDuration: 72,
        shippoEventTrigger: "TRANSIT"
      },
      {
        name: "delivered",
        slug: "delivered",
        displayName: "Delivered",
        customerMessage: "Your order has been delivered. Thank you for shopping with us!",
        icon: "check-circle",
        color: "#10B981",
        position: 3,
        isTerminal: true,
        notifyCustomer: true,
        shippoEventTrigger: "DELIVERED"
      }
    ]
  },
  {
    name: "Digital Download",
    slug: "digital-download",
    description: "Workflow for digital products with instant delivery",
    enableShippoSync: false,
    stages: [
      {
        name: "order_received",
        slug: "order-received",
        displayName: "Order Received",
        customerMessage: "We've received your order.",
        icon: "inbox",
        color: "#3B82F6",
        position: 0,
        notifyCustomer: true,
        estimatedDuration: 1
      },
      {
        name: "ready",
        slug: "ready",
        displayName: "Ready for Download",
        customerMessage: "Your files are ready! Check your email for download links.",
        icon: "download",
        color: "#10B981",
        position: 1,
        isTerminal: true,
        notifyCustomer: true
      }
    ]
  },
  {
    name: "Custom Order",
    slug: "custom-order",
    description: "Workflow for made-to-order or customized products",
    enableShippoSync: true,
    stages: [
      {
        name: "order_received",
        slug: "order-received",
        displayName: "Order Received",
        customerMessage: "We've received your custom order request.",
        icon: "inbox",
        color: "#3B82F6",
        position: 0,
        notifyCustomer: true,
        estimatedDuration: 24
      },
      {
        name: "design_review",
        slug: "design-review",
        displayName: "Design Review",
        customerMessage: "Our team is reviewing your customization details.",
        icon: "eye",
        color: "#6366F1",
        position: 1,
        notifyCustomer: true,
        estimatedDuration: 48
      },
      {
        name: "in_production",
        slug: "in-production",
        displayName: "In Production",
        customerMessage: "Your custom item is being crafted with care.",
        icon: "hammer",
        color: "#F59E0B",
        position: 2,
        notifyCustomer: true,
        estimatedDuration: 120,
        shippoEventTrigger: "PRE_TRANSIT"
      },
      {
        name: "quality_check",
        slug: "quality-check",
        displayName: "Quality Check",
        customerMessage: "Your item is undergoing final quality inspection.",
        icon: "shield-check",
        color: "#8B5CF6",
        position: 3,
        notifyCustomer: true,
        estimatedDuration: 24
      },
      {
        name: "shipped",
        slug: "shipped",
        displayName: "Shipped",
        customerMessage: "Your custom order is on its way!",
        icon: "truck",
        color: "#EC4899",
        position: 4,
        notifyCustomer: true,
        estimatedDuration: 72,
        shippoEventTrigger: "TRANSIT"
      },
      {
        name: "delivered",
        slug: "delivered",
        displayName: "Delivered",
        customerMessage: "Your custom order has been delivered. Enjoy!",
        icon: "check-circle",
        color: "#10B981",
        position: 5,
        isTerminal: true,
        notifyCustomer: true,
        shippoEventTrigger: "DELIVERED"
      }
    ]
  },
  {
    name: "Local Pickup",
    slug: "local-pickup",
    description: "Workflow for in-store or local pickup orders",
    enableShippoSync: false,
    stages: [
      {
        name: "order_received",
        slug: "order-received",
        displayName: "Order Received",
        customerMessage: "We've received your order.",
        icon: "inbox",
        color: "#3B82F6",
        position: 0,
        notifyCustomer: true,
        estimatedDuration: 24
      },
      {
        name: "preparing",
        slug: "preparing",
        displayName: "Preparing",
        customerMessage: "We're preparing your order for pickup.",
        icon: "package",
        color: "#F59E0B",
        position: 1,
        notifyCustomer: true,
        estimatedDuration: 24
      },
      {
        name: "ready_for_pickup",
        slug: "ready-for-pickup",
        displayName: "Ready for Pickup",
        customerMessage: "Your order is ready! Come pick it up at your convenience.",
        icon: "map-pin",
        color: "#10B981",
        position: 2,
        notifyCustomer: true,
        estimatedDuration: 168
        // 7 days
      },
      {
        name: "picked_up",
        slug: "picked-up",
        displayName: "Picked Up",
        customerMessage: "Thank you for picking up your order!",
        icon: "check-circle",
        color: "#10B981",
        position: 3,
        isTerminal: true,
        notifyCustomer: true
      }
    ]
  }
];

// src/lib/order-workflows/index.ts
async function listWorkflows(includeInactive = false) {
  const workflows = await _chunkI5PINI5Tjs.prisma.orderWorkflow.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      stages: {
        orderBy: { position: "asc" }
      }
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }]
  });
  return workflows;
}
async function getWorkflow(idOrSlug) {
  const workflow = await _chunkI5PINI5Tjs.prisma.orderWorkflow.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }]
    },
    include: {
      stages: {
        orderBy: { position: "asc" }
      }
    }
  });
  return workflow;
}
async function getDefaultWorkflow() {
  const workflow = await _chunkI5PINI5Tjs.prisma.orderWorkflow.findFirst({
    where: { isDefault: true, isActive: true },
    include: {
      stages: {
        orderBy: { position: "asc" }
      }
    }
  });
  return workflow;
}
async function createWorkflow(input) {
  const _a = input, { stages } = _a, workflowData = _chunkHY7GTCJMjs.__objRest.call(void 0, _a, ["stages"]);
  if (workflowData.isDefault) {
    await _chunkI5PINI5Tjs.prisma.orderWorkflow.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    });
  }
  const workflow = await _chunkI5PINI5Tjs.prisma.orderWorkflow.create({
    data: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, workflowData), {
      stages: stages ? {
        create: stages.map((stage, index) => {
          var _a2;
          return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, stage), {
            position: (_a2 = stage.position) != null ? _a2 : index
          });
        })
      } : void 0
    }),
    include: {
      stages: {
        orderBy: { position: "asc" }
      }
    }
  });
  return workflow;
}
async function updateWorkflow(id, input) {
  if (input.isDefault) {
    await _chunkI5PINI5Tjs.prisma.orderWorkflow.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false }
    });
  }
  const workflow = await _chunkI5PINI5Tjs.prisma.orderWorkflow.update({
    where: { id },
    data: input,
    include: {
      stages: {
        orderBy: { position: "asc" }
      }
    }
  });
  return workflow;
}
async function deleteWorkflow(id) {
  const orderCount = await _chunkI5PINI5Tjs.prisma.order.count({
    where: { workflowId: id }
  });
  if (orderCount > 0) {
    throw new Error(`Cannot delete workflow: ${orderCount} orders are using it`);
  }
  await _chunkI5PINI5Tjs.prisma.orderWorkflow.delete({
    where: { id }
  });
}
async function duplicateWorkflow(id, newName, newSlug) {
  const original = await getWorkflow(id);
  if (!original) {
    throw new Error("Workflow not found");
  }
  return createWorkflow({
    name: newName,
    slug: newSlug,
    description: original.description || void 0,
    isDefault: false,
    isActive: true,
    enableShippoSync: original.enableShippoSync,
    stages: original.stages.map((stage) => ({
      name: stage.name,
      slug: stage.slug,
      displayName: stage.displayName,
      customerMessage: stage.customerMessage || void 0,
      icon: stage.icon || void 0,
      color: stage.color || void 0,
      position: stage.position,
      isTerminal: stage.isTerminal,
      notifyCustomer: stage.notifyCustomer,
      estimatedDuration: stage.estimatedDuration || void 0,
      shippoEventTrigger: stage.shippoEventTrigger || null
    }))
  });
}
async function determineOrderWorkflow(orderId) {
  const orderItems = await _chunkI5PINI5Tjs.prisma.orderItem.findMany({
    where: { orderId },
    include: {
      product: {
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      }
    }
  });
  for (const item of orderItems) {
    if (item.product.orderWorkflowId) {
      return item.product.orderWorkflowId;
    }
  }
  for (const item of orderItems) {
    for (const pc of item.product.categories) {
      if (pc.category.orderWorkflowId) {
        return pc.category.orderWorkflowId;
      }
    }
  }
  const defaultWorkflow = await getDefaultWorkflow();
  return (defaultWorkflow == null ? void 0 : defaultWorkflow.id) || null;
}
async function assignWorkflowToOrder(orderId, workflowId) {
  let firstStageId = null;
  if (workflowId) {
    const workflow = await getWorkflow(workflowId);
    if (workflow && workflow.stages.length > 0) {
      firstStageId = workflow.stages[0].id;
    }
  }
  await _chunkI5PINI5Tjs.prisma.order.update({
    where: { id: orderId },
    data: {
      workflowId,
      currentStageId: firstStageId
    }
  });
}
async function initializeOrderWorkflow(orderId) {
  const workflowId = await determineOrderWorkflow(orderId);
  if (workflowId) {
    await assignWorkflowToOrder(orderId, workflowId);
    const order = await _chunkI5PINI5Tjs.prisma.order.findUnique({
      where: { id: orderId },
      select: { currentStageId: true }
    });
    if (order == null ? void 0 : order.currentStageId) {
      await _chunkI5PINI5Tjs.prisma.orderProgress.create({
        data: {
          orderId,
          stageId: order.currentStageId,
          source: "system",
          notes: "Order created - workflow initialized"
        }
      });
    }
  }
}

// src/lib/plugins/types.ts
function generateId(prefix = "id") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
}
function incrementVersion(version) {
  const parts = version.split(".").map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join(".");
}
function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

// src/lib/plugins/sandbox.ts
var DEFAULT_CONFIG = {
  timeout: 3e4,
  allowAsync: true,
  maxOutputSize: 1024 * 1024
  // 1MB
};
var SANDBOX_GLOBALS = {
  // Core JavaScript
  Object,
  Array,
  String,
  Number,
  Boolean,
  Date,
  RegExp,
  Error,
  TypeError,
  RangeError,
  SyntaxError,
  // JSON operations
  JSON,
  // Math operations
  Math,
  // Data structures
  Map,
  Set,
  WeakMap,
  WeakSet,
  // Utilities
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  encodeURIComponent,
  decodeURIComponent,
  encodeURI,
  decodeURI,
  // Promises (if async allowed)
  Promise,
  // Console (captured, not actual logging)
  console: {
    log: (..._args) => {
    },
    warn: (..._args) => {
    },
    error: (..._args) => {
    },
    info: (..._args) => {
    }
  },
  // URL parsing
  URL,
  URLSearchParams,
  // Typed arrays
  Uint8Array,
  Int8Array,
  Uint16Array,
  Int16Array,
  Uint32Array,
  Int32Array,
  Float32Array,
  Float64Array,
  ArrayBuffer,
  DataView,
  // Text encoding
  TextEncoder,
  TextDecoder,
  // Explicit undefined values
  undefined: void 0,
  NaN: NaN,
  Infinity: Infinity
};
var BLOCKED_PATTERNS = [
  { pattern: /\bprocess\b/, message: "Access to process object" },
  { pattern: /\brequire\s*\(/, message: "CommonJS require" },
  { pattern: /\bimport\s*\(/, message: "Dynamic import" },
  { pattern: /\bglobal\b/, message: "Access to global object" },
  { pattern: /\bglobalThis\b/, message: "Access to globalThis" },
  { pattern: /\beval\s*\(/, message: "Use of eval()" },
  { pattern: /\bFunction\s*\(/, message: "Function constructor" },
  { pattern: /\bchild_process\b/, message: "child_process module" },
  { pattern: /\b__proto__\b/, message: "Prototype manipulation" },
  { pattern: /\.constructor\s*\(/, message: "Constructor access" },
  { pattern: /\bProxy\b/, message: "Proxy object" },
  { pattern: /\bReflect\b/, message: "Reflect object" },
  { pattern: /\bfetch\b/, message: "fetch API (use HTTP primitive instead)" },
  { pattern: /\bXMLHttpRequest\b/, message: "XMLHttpRequest (use HTTP primitive instead)" }
];
var WARNING_PATTERNS = [
  { pattern: /\bwhile\s*\(\s*true\s*\)/, message: "Potential infinite loop" },
  { pattern: /\bfor\s*\(\s*;\s*;\s*\)/, message: "Potential infinite loop" },
  { pattern: /\bsetTimeout\b/, message: "Use of setTimeout" },
  { pattern: /\bsetInterval\b/, message: "Use of setInterval" },
  { pattern: /\.prototype\b/, message: "Prototype access" }
];
function validateHandlerSecurity(code) {
  const warnings = [];
  const blocked = [];
  for (const { pattern, message } of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      blocked.push(message);
    }
  }
  for (const { pattern, message } of WARNING_PATTERNS) {
    if (pattern.test(code)) {
      warnings.push(message);
    }
  }
  return {
    safe: blocked.length === 0,
    warnings,
    blocked
  };
}
function createSandboxFunction(code, config = {}) {
  const { allowAsync: _allowAsync } = _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, DEFAULT_CONFIG), config);
  const wrappedCode = `
    "use strict";
    ${code}
  `;
  const globalNames = Object.keys(SANDBOX_GLOBALS);
  const globalValues = Object.values(SANDBOX_GLOBALS);
  try {
    const sandboxFn = new Function(
      "args",
      "context",
      ...globalNames,
      // Add dummy parameters for blocked globals (shadowing)
      "__blocked_process__",
      "__blocked_require__",
      "__blocked_global__",
      "__blocked_globalThis__",
      "__blocked_eval__",
      "__blocked_Function__",
      // The actual code
      wrappedCode
    );
    return (args, context) => {
      return sandboxFn(
        args,
        context,
        ...globalValues,
        // Pass undefined for blocked globals
        void 0,
        // process
        void 0,
        // require
        void 0,
        // global
        void 0,
        // globalThis
        void 0,
        // eval
        void 0
        // Function
      );
    };
  } catch (e) {
    throw new Error(`Failed to compile handler: ${e instanceof Error ? e.message : String(e)}`);
  }
}
async function executeWithTimeout(fn, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Execution timeout after ${timeout}ms`));
    }, timeout);
    try {
      const result = fn();
      if (result instanceof Promise) {
        result.then((value) => {
          clearTimeout(timeoutId);
          resolve(value);
        }).catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
      } else {
        clearTimeout(timeoutId);
        resolve(result);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}
function getOutputSize(output) {
  try {
    return new TextEncoder().encode(JSON.stringify(output)).length;
  } catch (e) {
    return 0;
  }
}
async function executeSandbox(code, args, context, config = {}) {
  const fullConfig = _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, DEFAULT_CONFIG), config);
  const startTime = Date.now();
  try {
    const securityCheck = validateHandlerSecurity(code);
    if (!securityCheck.safe) {
      return {
        success: false,
        error: `Security validation failed: ${securityCheck.blocked.join(", ")}`,
        executionTime: Date.now() - startTime
      };
    }
    const sandboxFn = createSandboxFunction(code, fullConfig);
    const result = await executeWithTimeout(
      () => sandboxFn(args, context),
      fullConfig.timeout
    );
    const outputSize = getOutputSize(result);
    if (outputSize > fullConfig.maxOutputSize) {
      return {
        success: false,
        error: `Output too large: ${outputSize} bytes (max: ${fullConfig.maxOutputSize})`,
        executionTime: Date.now() - startTime,
        outputSize
      };
    }
    return {
      success: true,
      result,
      executionTime: Date.now() - startTime,
      outputSize
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      executionTime: Date.now() - startTime
    };
  }
}
var handlerCache = /* @__PURE__ */ new Map();
function getOrCompileHandler(primitiveId, code, config = {}) {
  const cacheKey = `${primitiveId}:${hashCode(code)}`;
  let handler = handlerCache.get(cacheKey);
  if (!handler) {
    handler = createSandboxFunction(code, config);
    handlerCache.set(cacheKey, handler);
  }
  return handler;
}
function invalidateHandler(primitiveId) {
  for (const key of handlerCache.keys()) {
    if (key.startsWith(`${primitiveId}:`)) {
      handlerCache.delete(key);
    }
  }
}
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// src/lib/plugins/registry.ts
var PluginRegistry = class {
  constructor() {
    // Tier 1: In-memory mounted primitives
    this.mountedPrimitives = /* @__PURE__ */ new Map();
    // In-memory primitive definitions cache
    this.primitiveCache = /* @__PURE__ */ new Map();
    // Compiled handlers cache
    this.handlerCache = /* @__PURE__ */ new Map();
    // Initialization flag
    this.initialized = false;
  }
  /**
   * Initialize the registry - load primitives from DB into memory
   */
  async initialize() {
    if (this.initialized) {
      return { loaded: 0, mounted: 0, errors: [] };
    }
    const errors = [];
    let loaded = 0;
    let mounted = 0;
    try {
      const primitives = await _chunkI5PINI5Tjs.prisma.primitive.findMany({
        where: { enabled: true }
      });
      for (const dbPrimitive of primitives) {
        try {
          const definition = this.dbToPrimitiveDefinition(dbPrimitive);
          this.primitiveCache.set(definition.id, definition);
          loaded++;
          const mountResult = this.mountPrimitive(definition.id);
          if (mountResult.success) {
            mounted++;
          } else {
            errors.push(`Failed to mount ${definition.name}: ${mountResult.error}`);
          }
        } catch (e) {
          errors.push(`Failed to load primitive ${dbPrimitive.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      this.initialized = true;
    } catch (e) {
      errors.push(`Failed to initialize registry: ${e instanceof Error ? e.message : String(e)}`);
    }
    return { loaded, mounted, errors };
  }
  // ============================================================================
  // PRIMITIVE MANAGEMENT
  // ============================================================================
  /**
   * Create a new primitive
   */
  async createPrimitive(request) {
    const securityCheck = validateHandlerSecurity(request.handler);
    if (!securityCheck.safe) {
      return { success: false, error: `Handler security failed: ${securityCheck.blocked.join(", ")}` };
    }
    const existing = await _chunkI5PINI5Tjs.prisma.primitive.findUnique({ where: { name: request.name } });
    if (existing) {
      return { success: false, error: `Primitive with name "${request.name}" already exists` };
    }
    try {
      createSandboxFunction(request.handler);
    } catch (e) {
      return { success: false, error: `Handler compilation failed: ${e instanceof Error ? e.message : String(e)}` };
    }
    const id = generateId("prim");
    try {
      const dbPrimitive = await _chunkI5PINI5Tjs.prisma.primitive.create({
        data: {
          id,
          name: request.name,
          description: request.description,
          inputSchema: request.inputSchema,
          handler: request.handler,
          category: request.category,
          tags: request.tags || [],
          icon: request.icon,
          timeout: request.timeout || 3e4,
          enabled: true,
          pluginId: request.pluginId
        }
      });
      const definition = this.dbToPrimitiveDefinition(dbPrimitive);
      this.primitiveCache.set(id, definition);
      if (request.autoMount !== false) {
        const mountResult = this.mountPrimitive(id);
        if (!mountResult.success) {
          return { success: true, primitiveId: id, error: `Created but mount failed: ${mountResult.error}` };
        }
      }
      return { success: true, primitiveId: id };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  /**
   * Update an existing primitive
   */
  async updatePrimitive(id, request) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const existing = this.primitiveCache.get(id) || await this.getPrimitiveFromDb(id);
    if (!existing) {
      return { success: false, error: `Primitive not found: ${id}` };
    }
    if (request.handler) {
      const securityCheck = validateHandlerSecurity(request.handler);
      if (!securityCheck.safe) {
        return { success: false, error: `Handler security failed: ${securityCheck.blocked.join(", ")}` };
      }
      try {
        createSandboxFunction(request.handler);
      } catch (e) {
        return { success: false, error: `Handler compilation failed: ${e instanceof Error ? e.message : String(e)}` };
      }
    }
    try {
      const updated = await _chunkI5PINI5Tjs.prisma.primitive.update({
        where: { id },
        data: {
          description: (_a = request.description) != null ? _a : existing.description,
          inputSchema: (_b = request.inputSchema) != null ? _b : existing.inputSchema,
          handler: (_c = request.handler) != null ? _c : existing.handler,
          category: (_d = request.category) != null ? _d : existing.category,
          tags: (_e = request.tags) != null ? _e : existing.tags,
          icon: (_f = request.icon) != null ? _f : existing.icon,
          timeout: (_g = request.timeout) != null ? _g : existing.timeout,
          enabled: (_h = request.enabled) != null ? _h : existing.enabled,
          version: incrementVersion(existing.version)
        }
      });
      const definition = this.dbToPrimitiveDefinition(updated);
      this.primitiveCache.set(id, definition);
      invalidateHandler(id);
      this.handlerCache.delete(id);
      if (this.mountedPrimitives.has(id)) {
        this.dismountPrimitive(id);
        this.mountPrimitive(id);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  /**
   * Delete a primitive
   */
  async deletePrimitive(id, force = false) {
    if (this.mountedPrimitives.has(id) && !force) {
      return { success: false, error: "Primitive is mounted. Use force=true to dismount and delete." };
    }
    if (this.mountedPrimitives.has(id)) {
      this.dismountPrimitive(id);
    }
    try {
      await _chunkI5PINI5Tjs.prisma.primitive.delete({ where: { id } });
      this.primitiveCache.delete(id);
      invalidateHandler(id);
      this.handlerCache.delete(id);
      return { success: true };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  /**
   * Mount a primitive to make it active
   */
  mountPrimitive(id, config) {
    const definition = this.primitiveCache.get(id);
    if (!definition) {
      return { success: false, error: `Primitive not found in cache: ${id}` };
    }
    if (this.mountedPrimitives.has(id)) {
      return { success: false, error: `Primitive already mounted: ${id}` };
    }
    let compiledHandler;
    try {
      compiledHandler = createSandboxFunction(definition.handler);
      this.handlerCache.set(id, compiledHandler);
    } catch (e) {
      return { success: false, error: `Handler compilation failed: ${e instanceof Error ? e.message : String(e)}` };
    }
    const mounted = {
      definition,
      mountedAt: Date.now(),
      config,
      invocationCount: 0,
      compiledHandler
    };
    this.mountedPrimitives.set(id, mounted);
    return { success: true };
  }
  /**
   * Dismount a primitive
   */
  dismountPrimitive(id) {
    if (!this.mountedPrimitives.has(id)) {
      return { success: false, error: `Primitive not mounted: ${id}` };
    }
    this.mountedPrimitives.delete(id);
    this.handlerCache.delete(id);
    invalidateHandler(id);
    return { success: true };
  }
  /**
   * Get a mounted primitive by ID or name
   */
  getMountedPrimitive(idOrName) {
    let primitive = this.mountedPrimitives.get(idOrName);
    if (primitive) return primitive;
    for (const mounted of this.mountedPrimitives.values()) {
      if (mounted.definition.name === idOrName) {
        return mounted;
      }
    }
    return void 0;
  }
  /**
   * Get all mounted primitives
   */
  getMountedPrimitives() {
    return Array.from(this.mountedPrimitives.values());
  }
  /**
   * Get compiled handler for a primitive
   */
  getCompiledHandler(id) {
    return this.handlerCache.get(id);
  }
  /**
   * Record a primitive invocation
   */
  recordInvocation(id) {
    const mounted = this.mountedPrimitives.get(id);
    if (mounted) {
      mounted.invocationCount++;
      mounted.lastInvoked = Date.now();
    }
  }
  /**
   * List primitives with filtering
   */
  async listPrimitives(options = {}) {
    const { filter = "all", category, tags, pluginId, search } = options;
    let primitives = [];
    if (filter === "mounted") {
      for (const mounted of this.mountedPrimitives.values()) {
        primitives.push(this.toPrimitiveInfo(mounted.definition, true));
      }
    } else {
      const where = {};
      if (category) where.category = category;
      if (pluginId) where.pluginId = pluginId;
      if (tags == null ? void 0 : tags.length) where.tags = { hasSome: tags };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ];
      }
      const dbPrimitives = await _chunkI5PINI5Tjs.prisma.primitive.findMany({ where });
      for (const dbPrim of dbPrimitives) {
        const isMounted = this.mountedPrimitives.has(dbPrim.id);
        if (filter === "available" && isMounted) continue;
        primitives.push({
          id: dbPrim.id,
          name: dbPrim.name,
          description: dbPrim.description,
          version: dbPrim.version,
          tags: dbPrim.tags,
          category: dbPrim.category || void 0,
          icon: dbPrim.icon || void 0,
          mounted: isMounted,
          enabled: dbPrim.enabled,
          author: dbPrim.author || void 0,
          createdAt: dbPrim.createdAt,
          updatedAt: dbPrim.updatedAt
        });
      }
    }
    return primitives;
  }
  // ============================================================================
  // PLUGIN MANAGEMENT
  // ============================================================================
  /**
   * Create a new plugin
   */
  async createPlugin(request) {
    const slug = request.slug || slugify(request.name);
    const existing = await _chunkI5PINI5Tjs.prisma.plugin.findFirst({
      where: { OR: [{ name: request.name }, { slug }] }
    });
    if (existing) {
      return { success: false, error: `Plugin with name or slug already exists` };
    }
    const id = generateId("plug");
    try {
      await _chunkI5PINI5Tjs.prisma.plugin.create({
        data: {
          id,
          name: request.name,
          slug,
          description: request.description,
          icon: request.icon,
          color: request.color,
          config: request.config,
          configSchema: request.configSchema,
          author: request.author,
          enabled: false
          // Disabled by default
        }
      });
      return { success: true, pluginId: id };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  /**
   * Enable/disable a plugin
   */
  async setPluginEnabled(id, enabled) {
    try {
      const plugin = await _chunkI5PINI5Tjs.prisma.plugin.findUnique({ where: { id } });
      if (!plugin) {
        return { success: false, error: `Plugin not found: ${id}` };
      }
      await _chunkI5PINI5Tjs.prisma.plugin.update({
        where: { id },
        data: { enabled }
      });
      const primitives = await _chunkI5PINI5Tjs.prisma.primitive.findMany({
        where: { pluginId: id, enabled: true }
      });
      for (const prim of primitives) {
        if (enabled) {
          const def = this.dbToPrimitiveDefinition(prim);
          this.primitiveCache.set(prim.id, def);
          this.mountPrimitive(prim.id);
        } else {
          this.dismountPrimitive(prim.id);
        }
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  /**
   * Delete a plugin and its primitives
   */
  async deletePlugin(id) {
    try {
      const primitives = await _chunkI5PINI5Tjs.prisma.primitive.findMany({ where: { pluginId: id } });
      for (const prim of primitives) {
        this.dismountPrimitive(prim.id);
        this.primitiveCache.delete(prim.id);
      }
      await _chunkI5PINI5Tjs.prisma.plugin.delete({ where: { id } });
      return { success: true };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  /**
   * List plugins
   */
  async listPlugins(options = {}) {
    const { enabled, search } = options;
    const where = {};
    if (enabled !== void 0) where.enabled = enabled;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    const plugins = await _chunkI5PINI5Tjs.prisma.plugin.findMany({
      where,
      include: { _count: { select: { primitives: true } } }
    });
    return plugins.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || void 0,
      version: p.version,
      icon: p.icon || void 0,
      color: p.color || void 0,
      enabled: p.enabled,
      installed: p.installed,
      builtIn: p.builtIn,
      primitiveCount: p._count.primitives,
      author: p.author || void 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }
  // ============================================================================
  // WORKFLOW MANAGEMENT
  // ============================================================================
  /**
   * Get workflow by ID
   */
  async getWorkflow(id) {
    const workflow = await _chunkI5PINI5Tjs.prisma.workflow.findUnique({ where: { id } });
    if (!workflow) return null;
    return {
      id: workflow.id,
      name: workflow.name,
      slug: workflow.slug,
      description: workflow.description || void 0,
      nodes: workflow.nodes,
      edges: workflow.edges,
      viewport: workflow.viewport,
      config: workflow.config,
      variables: workflow.variables,
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig,
      enabled: workflow.enabled,
      pluginId: workflow.pluginId,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      lastRunAt: workflow.lastRunAt || void 0
    };
  }
  /**
   * List workflows
   */
  async listWorkflows(options = {}) {
    const where = {};
    if (options.enabled !== void 0) where.enabled = options.enabled;
    if (options.pluginId) where.pluginId = options.pluginId;
    if (options.triggerType) where.triggerType = options.triggerType;
    const workflows = await _chunkI5PINI5Tjs.prisma.workflow.findMany({ where });
    return workflows.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      description: w.description || void 0,
      nodes: w.nodes,
      edges: w.edges,
      viewport: w.viewport,
      config: w.config,
      variables: w.variables,
      triggerType: w.triggerType,
      triggerConfig: w.triggerConfig,
      enabled: w.enabled,
      pluginId: w.pluginId,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      lastRunAt: w.lastRunAt || void 0
    }));
  }
  // ============================================================================
  // STATISTICS
  // ============================================================================
  /**
   * Get registry statistics
   */
  async getStats() {
    const [primitiveCount, pluginStats, workflowCount, executionCount] = await Promise.all([
      _chunkI5PINI5Tjs.prisma.primitive.count(),
      _chunkI5PINI5Tjs.prisma.plugin.aggregate({
        _count: true,
        where: { enabled: true }
      }),
      _chunkI5PINI5Tjs.prisma.workflow.count(),
      _chunkI5PINI5Tjs.prisma.primitiveExecution.count()
    ]);
    return {
      primitiveCount,
      mountedCount: this.mountedPrimitives.size,
      pluginCount: await _chunkI5PINI5Tjs.prisma.plugin.count(),
      enabledPluginCount: pluginStats._count,
      workflowCount,
      totalExecutions: executionCount
    };
  }
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  dbToPrimitiveDefinition(db2) {
    return {
      id: db2.id,
      name: db2.name,
      version: db2.version,
      description: db2.description,
      inputSchema: db2.inputSchema,
      handler: db2.handler,
      dependencies: db2.dependencies,
      author: db2.author || void 0,
      tags: db2.tags,
      tier: db2.tier,
      category: db2.category || void 0,
      icon: db2.icon || void 0,
      timeout: db2.timeout,
      memory: db2.memory,
      sandbox: db2.sandbox,
      enabled: db2.enabled,
      builtIn: db2.builtIn,
      pluginId: db2.pluginId,
      createdAt: db2.createdAt,
      updatedAt: db2.updatedAt
    };
  }
  async getPrimitiveFromDb(id) {
    const db2 = await _chunkI5PINI5Tjs.prisma.primitive.findUnique({ where: { id } });
    if (!db2) return null;
    return this.dbToPrimitiveDefinition(db2);
  }
  toPrimitiveInfo(def, mounted) {
    var _a, _b, _c;
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      version: def.version,
      tags: def.tags || [],
      category: def.category,
      icon: def.icon,
      mounted,
      enabled: (_a = def.enabled) != null ? _a : true,
      author: def.author,
      createdAt: (_b = def.createdAt) != null ? _b : /* @__PURE__ */ new Date(),
      updatedAt: (_c = def.updatedAt) != null ? _c : /* @__PURE__ */ new Date()
    };
  }
  /**
   * Check if registry is initialized
   */
  isInitialized() {
    return this.initialized;
  }
};
var registryInstance = null;
function getPluginRegistry() {
  if (!registryInstance) {
    registryInstance = new PluginRegistry();
  }
  return registryInstance;
}
function resetPluginRegistry() {
  registryInstance = new PluginRegistry();
}

// src/lib/plugins/executor.ts
function validateInput(input, schema) {
  const errors = [];
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in input)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (key in input) {
      const value = input[key];
      const expectedType = prop.type;
      if (expectedType === "array" && !Array.isArray(value)) {
        errors.push(`Field "${key}" should be an array`);
      } else if (expectedType === "object" && (typeof value !== "object" || value === null || Array.isArray(value))) {
        errors.push(`Field "${key}" should be an object`);
      } else if (expectedType === "string" && typeof value !== "string") {
        errors.push(`Field "${key}" should be a string`);
      } else if (expectedType === "number" && typeof value !== "number") {
        errors.push(`Field "${key}" should be a number`);
      } else if (expectedType === "boolean" && typeof value !== "boolean") {
        errors.push(`Field "${key}" should be a boolean`);
      }
      if (prop.enum && !prop.enum.includes(value)) {
        errors.push(`Field "${key}" must be one of: ${prop.enum.join(", ")}`);
      }
      if (typeof value === "string") {
        if (prop.minLength && value.length < prop.minLength) {
          errors.push(`Field "${key}" must be at least ${prop.minLength} characters`);
        }
        if (prop.maxLength && value.length > prop.maxLength) {
          errors.push(`Field "${key}" must be at most ${prop.maxLength} characters`);
        }
        if (prop.pattern && !new RegExp(prop.pattern).test(value)) {
          errors.push(`Field "${key}" must match pattern: ${prop.pattern}`);
        }
      }
      if (typeof value === "number") {
        if (prop.minimum !== void 0 && value < prop.minimum) {
          errors.push(`Field "${key}" must be at least ${prop.minimum}`);
        }
        if (prop.maximum !== void 0 && value > prop.maximum) {
          errors.push(`Field "${key}" must be at most ${prop.maximum}`);
        }
      }
    }
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(input)) {
      if (!(key in schema.properties)) {
        errors.push(`Unknown field: ${key}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
async function executePrimitive(primitive, args, context = {}, options = {}) {
  const startTime = Date.now();
  const invocationId = generateId("exec");
  const {
    timeout = primitive.timeout || 3e4,
    skipValidation = false,
    skipSandbox = false,
    recordMetrics = true,
    debug = false
  } = options;
  const execContext = _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
    primitiveId: primitive.id,
    primitiveName: primitive.name,
    invocationId,
    startTime,
    timeout,
    debug
  }, context);
  try {
    if (!skipValidation) {
      const validation = validateInput(args, primitive.inputSchema);
      if (!validation.valid) {
        return createErrorResult(
          `Input validation failed:
- ${validation.errors.join("\n- ")}`,
          startTime,
          invocationId
        );
      }
    }
    const securityCheck = validateHandlerSecurity(primitive.handler);
    if (!securityCheck.safe) {
      return createErrorResult(
        `Handler security validation failed:
- ${securityCheck.blocked.join("\n- ")}`,
        startTime,
        invocationId
      );
    }
    if (debug && securityCheck.warnings.length > 0) {
      console.warn(`[${primitive.name}] Security warnings:
- ${securityCheck.warnings.join("\n- ")}`);
    }
    let result;
    if (skipSandbox) {
      result = await executeDirectly(primitive, args, execContext, timeout);
    } else {
      const sandboxConfig = {
        timeout,
        allowAsync: true,
        maxOutputSize: 1024 * 1024
        // 1MB
      };
      const sandboxResult = await executeSandbox(
        primitive.handler,
        args,
        execContext,
        sandboxConfig
      );
      if (!sandboxResult.success) {
        const errorResult = createErrorResult(
          sandboxResult.error || "Unknown execution error",
          startTime,
          invocationId
        );
        if (recordMetrics) {
          await recordExecution(
            primitive.id,
            args,
            null,
            false,
            sandboxResult.error,
            startTime,
            Date.now(),
            execContext
          );
        }
        return errorResult;
      }
      result = sandboxResult.result;
    }
    const endTime = Date.now();
    const executionResult = {
      success: true,
      result,
      executionTime: endTime - startTime,
      invocationId
    };
    if (recordMetrics) {
      await recordExecution(
        primitive.id,
        args,
        result,
        true,
        void 0,
        startTime,
        endTime,
        execContext
      );
    }
    const registry = getPluginRegistry();
    registry.recordInvocation(primitive.id);
    return executionResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResult = createErrorResult(errorMessage, startTime, invocationId);
    if (recordMetrics) {
      await recordExecution(
        primitive.id,
        args,
        null,
        false,
        errorMessage,
        startTime,
        Date.now(),
        execContext
      );
    }
    return errorResult;
  }
}
async function executeDirectly(primitive, args, context, timeout) {
  const handler = getOrCompileHandler(primitive.id, primitive.handler);
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Execution timeout after ${timeout}ms`));
    }, timeout);
    try {
      const result = handler(args, context);
      if (result instanceof Promise) {
        result.then((value) => {
          clearTimeout(timeoutId);
          resolve(value);
        }).catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
      } else {
        clearTimeout(timeoutId);
        resolve(result);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}
function createErrorResult(error, startTime, invocationId) {
  return {
    success: false,
    error,
    executionTime: Date.now() - startTime,
    invocationId
  };
}
async function recordExecution(primitiveId, input, output, success, error, startedAt, completedAt, context) {
  try {
    await _chunkI5PINI5Tjs.prisma.primitiveExecution.create({
      data: {
        primitiveId,
        workflowExecutionId: context.workflowExecutionId,
        userId: context.userId,
        agentId: context.agentId,
        input,
        output,
        success,
        error,
        startedAt: new Date(startedAt),
        completedAt: new Date(completedAt),
        executionTime: completedAt - startedAt
      }
    });
  } catch (e) {
    console.error("Failed to record execution:", e);
  }
}
async function testPrimitive(primitive, testInput, context) {
  const startTime = Date.now();
  const inputValidation = validateInput(testInput, primitive.inputSchema);
  const securityCheck = validateHandlerSecurity(primitive.handler);
  if (!inputValidation.valid) {
    return {
      success: false,
      error: "Input validation failed",
      validationErrors: inputValidation.errors,
      securityWarnings: securityCheck.warnings,
      executionTime: Date.now() - startTime
    };
  }
  if (!securityCheck.safe) {
    return {
      success: false,
      error: "Handler security check failed",
      validationErrors: securityCheck.blocked,
      securityWarnings: securityCheck.warnings,
      executionTime: Date.now() - startTime
    };
  }
  const result = await executePrimitive(primitive, testInput, context, {
    recordMetrics: false,
    debug: true
  });
  return {
    success: result.success,
    result: result.result,
    error: result.error,
    securityWarnings: securityCheck.warnings,
    executionTime: result.executionTime
  };
}
async function executeByIdOrName(idOrName, args, context, options) {
  const registry = getPluginRegistry();
  const mounted = registry.getMountedPrimitive(idOrName);
  if (!mounted) {
    return {
      success: false,
      error: `Primitive not found or not mounted: ${idOrName}`,
      executionTime: 0
    };
  }
  return executePrimitive(mounted.definition, args, context, options);
}
async function getExecutionStats(primitiveId) {
  const stats = await _chunkI5PINI5Tjs.prisma.primitiveExecution.aggregate({
    where: { primitiveId },
    _count: true,
    _avg: { executionTime: true }
  });
  const successCount = await _chunkI5PINI5Tjs.prisma.primitiveExecution.count({
    where: { primitiveId, success: true }
  });
  const lastExecution = await _chunkI5PINI5Tjs.prisma.primitiveExecution.findFirst({
    where: { primitiveId },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true }
  });
  return {
    totalExecutions: stats._count,
    successCount,
    errorCount: stats._count - successCount,
    averageExecutionTime: stats._avg.executionTime || 0,
    lastExecution: lastExecution == null ? void 0 : lastExecution.startedAt
  };
}
async function getRecentExecutions(primitiveId, limit = 10) {
  const executions = await _chunkI5PINI5Tjs.prisma.primitiveExecution.findMany({
    where: { primitiveId },
    orderBy: { startedAt: "desc" },
    take: limit,
    select: {
      id: true,
      success: true,
      error: true,
      executionTime: true,
      startedAt: true,
      userId: true,
      agentId: true
    }
  });
  return executions.map((e) => ({
    id: e.id,
    success: e.success,
    error: e.error || void 0,
    executionTime: e.executionTime,
    startedAt: e.startedAt,
    userId: e.userId || void 0,
    agentId: e.agentId || void 0
  }));
}

// src/lib/plugins/primitives/ai.ts
var AI_PRIMITIVES = [
  // ============================================================================
  // SEND MESSAGE
  // ============================================================================
  {
    name: "ai.chat",
    description: "Send a message to the AI assistant and get a response",
    category: "ai",
    tags: ["ai", "chat", "assistant", "conversation"],
    icon: "MessageSquare",
    timeout: 6e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "User message",
          minLength: 1
        },
        conversationId: {
          type: "string",
          description: "Existing conversation ID to continue"
        },
        systemPrompt: {
          type: "string",
          description: "Custom system prompt (for new conversations)"
        },
        userId: {
          type: "string",
          description: "User ID"
        },
        context: {
          type: "object",
          description: "Additional context (product info, order details, etc.)"
        }
      },
      required: ["message"]
    },
    handler: `
      const { message, conversationId, systemPrompt, userId, context } = input;

      let conversation;

      if (conversationId) {
        conversation = await prisma.aIConversation.findFirst({
          where: { id: conversationId, deletedAt: null },
          include: {
            messages: { orderBy: { createdAt: 'asc' }, take: 20 },
          },
        });

        if (!conversation) {
          throw new Error('Conversation not found');
        }
      } else {
        // Create new conversation
        conversation = await prisma.aIConversation.create({
          data: {
            userId: userId || null,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            systemPrompt: systemPrompt || 'You are a helpful e-commerce assistant.',
            context: context || {},
          },
          include: { messages: true },
        });
      }

      // Save user message
      await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: message,
        },
      });

      // Note: Actual AI response would be generated via API route using AI SDK
      // This primitive sets up the conversation structure
      return {
        conversationId: conversation.id,
        message,
        context: conversation.context,
        previousMessages: conversation.messages.map(m => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
        systemPrompt: conversation.systemPrompt,
        note: 'Use /api/ai/chat endpoint for actual AI responses with streaming',
      };
    `
  },
  // ============================================================================
  // GET CONVERSATIONS
  // ============================================================================
  {
    name: "ai.getConversations",
    description: "Get list of AI chat conversations for a user",
    category: "ai",
    tags: ["ai", "chat", "history", "conversations"],
    icon: "MessageCircle",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        page: {
          type: "number",
          description: "Page number",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 20
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId, page = 1, limit = 20 } = input;

      const where = { userId, deletedAt: null };

      const [conversations, total] = await Promise.all([
        prisma.aIConversation.findMany({
          where,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: { select: { messages: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.aIConversation.count({ where }),
      ]);

      return {
        conversations: conversations.map(c => ({
          id: c.id,
          title: c.title,
          lastMessage: c.messages[0]?.content?.substring(0, 100),
          messageCount: c._count.messages,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  },
  // ============================================================================
  // GET CONVERSATION
  // ============================================================================
  {
    name: "ai.getConversation",
    description: "Get a single conversation with all messages",
    category: "ai",
    tags: ["ai", "chat", "conversation", "messages"],
    icon: "MessagesSquare",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        conversationId: {
          type: "string",
          description: "Conversation ID"
        },
        limit: {
          type: "number",
          description: "Max messages to return",
          default: 50
        },
        before: {
          type: "string",
          description: "Get messages before this message ID (for pagination)"
        }
      },
      required: ["conversationId"]
    },
    handler: `
      const { conversationId, limit = 50, before } = input;

      const conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, deletedAt: null },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messageWhere = { conversationId };
      if (before) {
        const beforeMsg = await prisma.aIMessage.findUnique({ where: { id: before } });
        if (beforeMsg) {
          messageWhere.createdAt = { lt: beforeMsg.createdAt };
        }
      }

      const messages = await prisma.aIMessage.findMany({
        where: messageWhere,
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      return {
        id: conversation.id,
        title: conversation.title,
        systemPrompt: conversation.systemPrompt,
        context: conversation.context,
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolCalls: m.toolCalls,
          createdAt: m.createdAt,
        })),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    `
  },
  // ============================================================================
  // DELETE CONVERSATION
  // ============================================================================
  {
    name: "ai.deleteConversation",
    description: "Delete an AI chat conversation",
    category: "ai",
    tags: ["ai", "chat", "delete", "conversation"],
    icon: "Trash2",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        conversationId: {
          type: "string",
          description: "Conversation ID"
        },
        userId: {
          type: "string",
          description: "User ID (for authorization)"
        }
      },
      required: ["conversationId"]
    },
    handler: `
      const { conversationId, userId } = input;

      const conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, deletedAt: null },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check ownership if userId provided
      if (userId && conversation.userId !== userId) {
        throw new Error('Not authorized to delete this conversation');
      }

      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { deletedAt: new Date() },
      });

      return {
        deleted: true,
        conversationId,
      };
    `
  },
  // ============================================================================
  // UPDATE CONVERSATION
  // ============================================================================
  {
    name: "ai.updateConversation",
    description: "Update conversation title or context",
    category: "ai",
    tags: ["ai", "chat", "update", "conversation"],
    icon: "Edit",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        conversationId: {
          type: "string",
          description: "Conversation ID"
        },
        title: {
          type: "string",
          description: "New conversation title"
        },
        context: {
          type: "object",
          description: "Updated context object"
        }
      },
      required: ["conversationId"]
    },
    handler: `
      const { conversationId, title, context } = input;

      const conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, deletedAt: null },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (context !== undefined) updateData.context = context;

      const updated = await prisma.aIConversation.update({
        where: { id: conversationId },
        data: updateData,
      });

      return {
        id: updated.id,
        title: updated.title,
        context: updated.context,
        updatedAt: updated.updatedAt,
      };
    `
  }
];

// src/lib/plugins/primitives/analytics.ts
var ANALYTICS_PRIMITIVES = [
  // ============================================================================
  // TRACK EVENT
  // ============================================================================
  {
    name: "analytics.trackEvent",
    description: "Track a custom analytics event",
    category: "analytics",
    tags: ["analytics", "tracking", "events"],
    icon: "Activity",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        event: {
          type: "string",
          description: "Event name (e.g., button_click, form_submit)",
          minLength: 1,
          maxLength: 100
        },
        category: {
          type: "string",
          description: "Event category (e.g., engagement, conversion)"
        },
        properties: {
          type: "object",
          description: "Additional event properties"
        },
        userId: {
          type: "string",
          description: "User ID (if authenticated)"
        },
        sessionId: {
          type: "string",
          description: "Session ID"
        }
      },
      required: ["event"]
    },
    handler: `
      const { event, category, properties = {}, userId, sessionId } = input;

      const analyticsEvent = await prisma.analyticsEvent.create({
        data: {
          event,
          category: category || 'custom',
          properties,
          userId: userId || null,
          sessionId: sessionId || null,
          timestamp: new Date(),
          url: properties.url || null,
          referrer: properties.referrer || null,
          userAgent: properties.userAgent || null,
        },
      });

      return {
        tracked: true,
        eventId: analyticsEvent.id,
        event,
        category: category || 'custom',
        timestamp: analyticsEvent.timestamp,
      };
    `
  },
  // ============================================================================
  // TRACK PAGE VIEW
  // ============================================================================
  {
    name: "analytics.trackPageView",
    description: "Track a page view event",
    category: "analytics",
    tags: ["analytics", "tracking", "pageview"],
    icon: "Eye",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Page URL"
        },
        title: {
          type: "string",
          description: "Page title"
        },
        referrer: {
          type: "string",
          description: "Referrer URL"
        },
        userId: {
          type: "string",
          description: "User ID (if authenticated)"
        },
        sessionId: {
          type: "string",
          description: "Session ID"
        },
        userAgent: {
          type: "string",
          description: "User agent string"
        }
      },
      required: ["url"]
    },
    handler: `
      const { url, title, referrer, userId, sessionId, userAgent } = input;

      const event = await prisma.analyticsEvent.create({
        data: {
          event: 'page_view',
          category: 'navigation',
          properties: { title },
          url,
          referrer: referrer || null,
          userId: userId || null,
          sessionId: sessionId || null,
          userAgent: userAgent || null,
          timestamp: new Date(),
        },
      });

      return {
        tracked: true,
        eventId: event.id,
        url,
        title,
        timestamp: event.timestamp,
      };
    `
  },
  // ============================================================================
  // TRACK PURCHASE
  // ============================================================================
  {
    name: "analytics.trackPurchase",
    description: "Track an e-commerce purchase event",
    category: "analytics",
    tags: ["analytics", "tracking", "ecommerce", "purchase"],
    icon: "ShoppingCart",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Order ID"
        },
        total: {
          type: "number",
          description: "Order total"
        },
        currency: {
          type: "string",
          description: "Currency code",
          default: "USD"
        },
        items: {
          type: "array",
          description: "Purchased items",
          items: {
            type: "object",
            properties: {
              productId: { type: "string" },
              name: { type: "string" },
              price: { type: "number" },
              quantity: { type: "number" }
            }
          }
        },
        userId: {
          type: "string",
          description: "User ID"
        },
        sessionId: {
          type: "string",
          description: "Session ID"
        }
      },
      required: ["orderId", "total"]
    },
    handler: `
      const { orderId, total, currency = 'USD', items = [], userId, sessionId } = input;

      const event = await prisma.analyticsEvent.create({
        data: {
          event: 'purchase',
          category: 'ecommerce',
          properties: {
            orderId,
            total,
            currency,
            items,
            itemCount: items.length,
          },
          userId: userId || null,
          sessionId: sessionId || null,
          timestamp: new Date(),
        },
      });

      return {
        tracked: true,
        eventId: event.id,
        orderId,
        total,
        currency,
        itemCount: items.length,
        timestamp: event.timestamp,
      };
    `
  },
  // ============================================================================
  // GET EVENTS
  // ============================================================================
  {
    name: "analytics.getEvents",
    description: "Query analytics events with filtering",
    category: "analytics",
    tags: ["analytics", "reporting", "events"],
    icon: "BarChart",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        event: {
          type: "string",
          description: "Filter by event name"
        },
        category: {
          type: "string",
          description: "Filter by category"
        },
        userId: {
          type: "string",
          description: "Filter by user ID"
        },
        startDate: {
          type: "string",
          description: "Start date (ISO 8601)"
        },
        endDate: {
          type: "string",
          description: "End date (ISO 8601)"
        },
        page: {
          type: "number",
          description: "Page number",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 50,
          maximum: 200
        }
      },
      required: []
    },
    handler: `
      const { event, category, userId, startDate, endDate, page = 1, limit = 50 } = input;

      const where = {};
      if (event) where.event = event;
      if (category) where.category = category;
      if (userId) where.userId = userId;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const [events, total] = await Promise.all([
        prisma.analyticsEvent.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.analyticsEvent.count({ where }),
      ]);

      return {
        events: events.map(e => ({
          id: e.id,
          event: e.event,
          category: e.category,
          properties: e.properties,
          url: e.url,
          userId: e.userId,
          sessionId: e.sessionId,
          timestamp: e.timestamp,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  },
  // ============================================================================
  // GET AGGREGATED STATS
  // ============================================================================
  {
    name: "analytics.getStats",
    description: "Get aggregated analytics statistics",
    category: "analytics",
    tags: ["analytics", "reporting", "statistics"],
    icon: "TrendingUp",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Time period",
          enum: ["today", "yesterday", "7d", "30d", "90d", "custom"],
          default: "7d"
        },
        startDate: {
          type: "string",
          description: "Custom start date (ISO 8601)"
        },
        endDate: {
          type: "string",
          description: "Custom end date (ISO 8601)"
        },
        metrics: {
          type: "array",
          description: "Metrics to include",
          items: {
            type: "string",
            enum: ["pageViews", "uniqueVisitors", "purchases", "revenue", "topPages", "topEvents"]
          }
        }
      },
      required: []
    },
    handler: `
      const { period = '7d', startDate, endDate, metrics = ['pageViews', 'uniqueVisitors', 'purchases', 'revenue'] } = input;

      // Calculate date range
      let start, end = new Date();
      if (period === 'custom' && startDate) {
        start = new Date(startDate);
        if (endDate) end = new Date(endDate);
      } else {
        const days = { today: 0, yesterday: 1, '7d': 7, '30d': 30, '90d': 90 }[period] || 7;
        start = new Date();
        start.setDate(start.getDate() - days);
        if (period === 'yesterday') {
          end = new Date(start);
          end.setDate(end.getDate() + 1);
        }
      }

      const where = {
        timestamp: { gte: start, lte: end },
      };

      const stats = {};

      if (metrics.includes('pageViews')) {
        stats.pageViews = await prisma.analyticsEvent.count({
          where: { ...where, event: 'page_view' },
        });
      }

      if (metrics.includes('uniqueVisitors')) {
        const visitors = await prisma.analyticsEvent.findMany({
          where: { ...where, event: 'page_view', sessionId: { not: null } },
          select: { sessionId: true },
          distinct: ['sessionId'],
        });
        stats.uniqueVisitors = visitors.length;
      }

      if (metrics.includes('purchases')) {
        stats.purchases = await prisma.analyticsEvent.count({
          where: { ...where, event: 'purchase' },
        });
      }

      if (metrics.includes('revenue')) {
        const purchases = await prisma.analyticsEvent.findMany({
          where: { ...where, event: 'purchase' },
          select: { properties: true },
        });
        stats.revenue = purchases.reduce((sum, p) => sum + (p.properties?.total || 0), 0);
      }

      if (metrics.includes('topPages')) {
        const pages = await prisma.analyticsEvent.groupBy({
          by: ['url'],
          where: { ...where, event: 'page_view', url: { not: null } },
          _count: { url: true },
          orderBy: { _count: { url: 'desc' } },
          take: 10,
        });
        stats.topPages = pages.map(p => ({ url: p.url, views: p._count.url }));
      }

      if (metrics.includes('topEvents')) {
        const events = await prisma.analyticsEvent.groupBy({
          by: ['event'],
          where,
          _count: { event: true },
          orderBy: { _count: { event: 'desc' } },
          take: 10,
        });
        stats.topEvents = events.map(e => ({ event: e.event, count: e._count.event }));
      }

      return {
        period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ...stats,
      };
    `
  },
  // ============================================================================
  // TRACK ADD TO CART
  // ============================================================================
  {
    name: "analytics.trackAddToCart",
    description: "Track add to cart event for e-commerce analytics",
    category: "analytics",
    tags: ["analytics", "tracking", "ecommerce", "cart"],
    icon: "ShoppingBag",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product ID"
        },
        variantId: {
          type: "string",
          description: "Variant ID"
        },
        productName: {
          type: "string",
          description: "Product name"
        },
        price: {
          type: "number",
          description: "Product price"
        },
        quantity: {
          type: "number",
          description: "Quantity added",
          default: 1
        },
        currency: {
          type: "string",
          description: "Currency code",
          default: "USD"
        },
        userId: {
          type: "string",
          description: "User ID"
        },
        sessionId: {
          type: "string",
          description: "Session ID"
        }
      },
      required: ["productId"]
    },
    handler: `
      const { productId, variantId, productName, price, quantity = 1, currency = 'USD', userId, sessionId } = input;

      const event = await prisma.analyticsEvent.create({
        data: {
          event: 'add_to_cart',
          category: 'ecommerce',
          properties: {
            productId,
            variantId,
            productName,
            price,
            quantity,
            currency,
            value: (price || 0) * quantity,
          },
          userId: userId || null,
          sessionId: sessionId || null,
          timestamp: new Date(),
        },
      });

      return {
        tracked: true,
        eventId: event.id,
        productId,
        quantity,
        timestamp: event.timestamp,
      };
    `
  }
];

// src/lib/plugins/primitives/blog.ts
var BLOG_PRIMITIVES = [
  // ============================================================================
  // GET POSTS
  // ============================================================================
  {
    name: "blog.getPosts",
    description: "Get blog posts with pagination, filtering, and sorting",
    category: "blog",
    tags: ["blog", "cms", "content", "posts"],
    icon: "FileText",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number (1-based)",
          default: 1,
          minimum: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 10,
          minimum: 1,
          maximum: 50
        },
        categoryId: {
          type: "string",
          description: "Filter by category ID"
        },
        categorySlug: {
          type: "string",
          description: "Filter by category slug"
        },
        tagId: {
          type: "string",
          description: "Filter by tag ID"
        },
        tagSlug: {
          type: "string",
          description: "Filter by tag slug"
        },
        authorId: {
          type: "string",
          description: "Filter by author ID"
        },
        featured: {
          type: "boolean",
          description: "Filter to featured posts only"
        },
        status: {
          type: "string",
          description: "Filter by status (admin only)",
          enum: ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]
        },
        sortBy: {
          type: "string",
          description: "Sort field",
          enum: ["publishedAt", "createdAt", "title", "views"],
          default: "publishedAt"
        },
        sortOrder: {
          type: "string",
          description: "Sort direction",
          enum: ["asc", "desc"],
          default: "desc"
        }
      },
      required: []
    },
    handler: `
      const { page = 1, limit = 10, categoryId, categorySlug, tagId, tagSlug, authorId, featured, status, sortBy = 'publishedAt', sortOrder = 'desc' } = input;

      const where = { deletedAt: null };

      // Default to published only unless admin
      where.status = status || 'PUBLISHED';
      if (!status) {
        where.publishedAt = { lte: new Date() };
      }

      if (categoryId) where.categoryId = categoryId;
      if (categorySlug) {
        const cat = await prisma.blogCategory.findFirst({ where: { slug: categorySlug } });
        if (cat) where.categoryId = cat.id;
      }
      if (tagId || tagSlug) {
        where.tags = {
          some: tagId ? { id: tagId } : { slug: tagSlug },
        };
      }
      if (authorId) where.authorId = authorId;
      if (featured !== undefined) where.featured = featured;

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          include: {
            author: { select: { id: true, name: true, email: true } },
            category: { select: { id: true, name: true, slug: true } },
            tags: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.blogPost.count({ where }),
      ]);

      return {
        posts: posts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          featuredImage: p.featuredImage,
          author: p.author,
          category: p.category,
          tags: p.tags,
          featured: p.featured,
          publishedAt: p.publishedAt,
          readingTime: p.readingTime,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    `
  },
  // ============================================================================
  // GET SINGLE POST
  // ============================================================================
  {
    name: "blog.getPost",
    description: "Get a single blog post by ID or slug with full content",
    category: "blog",
    tags: ["blog", "cms", "content", "post"],
    icon: "FileText",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        postId: {
          type: "string",
          description: "Post ID"
        },
        slug: {
          type: "string",
          description: "Post slug (alternative to ID)"
        },
        incrementViews: {
          type: "boolean",
          description: "Increment view count",
          default: true
        }
      },
      required: []
    },
    handler: `
      const { postId, slug, incrementViews = true } = input;

      if (!postId && !slug) {
        throw new Error('Either postId or slug is required');
      }

      const where = postId ? { id: postId } : { slug };
      where.deletedAt = null;

      const post = await prisma.blogPost.findFirst({
        where,
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
          category: true,
          tags: true,
        },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Only show published posts to public
      if (post.status !== 'PUBLISHED' || post.publishedAt > new Date()) {
        throw new Error('Post not found');
      }

      // Increment view count
      if (incrementViews) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { views: { increment: 1 } },
        });
      }

      // Get related posts
      const related = await prisma.blogPost.findMany({
        where: {
          categoryId: post.categoryId,
          id: { not: post.id },
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          publishedAt: true,
        },
        take: 3,
        orderBy: { publishedAt: 'desc' },
      });

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        author: post.author,
        category: post.category,
        tags: post.tags,
        featured: post.featured,
        views: post.views + (incrementViews ? 1 : 0),
        publishedAt: post.publishedAt,
        readingTime: post.readingTime,
        seo: {
          title: post.seoTitle || post.title,
          description: post.seoDescription || post.excerpt,
          keywords: post.seoKeywords,
        },
        related,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    `
  },
  // ============================================================================
  // GET CATEGORIES
  // ============================================================================
  {
    name: "blog.getCategories",
    description: "Get all blog categories with post counts",
    category: "blog",
    tags: ["blog", "cms", "categories"],
    icon: "FolderOpen",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        includePostCount: {
          type: "boolean",
          description: "Include post count per category",
          default: true
        },
        activeOnly: {
          type: "boolean",
          description: "Only return categories with published posts",
          default: false
        }
      },
      required: []
    },
    handler: `
      const { includePostCount = true, activeOnly = false } = input;

      const categories = await prisma.blogCategory.findMany({
        include: {
          _count: includePostCount ? {
            select: {
              posts: {
                where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, deletedAt: null },
              },
            },
          } : false,
        },
        orderBy: { name: 'asc' },
      });

      let result = categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        postCount: c._count?.posts || 0,
      }));

      if (activeOnly) {
        result = result.filter(c => c.postCount > 0);
      }

      return {
        categories: result,
        total: result.length,
      };
    `
  },
  // ============================================================================
  // GET TAGS
  // ============================================================================
  {
    name: "blog.getTags",
    description: "Get all blog tags with post counts",
    category: "blog",
    tags: ["blog", "cms", "tags"],
    icon: "Tag",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        includePostCount: {
          type: "boolean",
          description: "Include post count per tag",
          default: true
        },
        limit: {
          type: "number",
          description: "Max tags to return (for tag clouds)",
          minimum: 1,
          maximum: 100
        },
        sortBy: {
          type: "string",
          description: "Sort field",
          enum: ["name", "postCount"],
          default: "name"
        }
      },
      required: []
    },
    handler: `
      const { includePostCount = true, limit, sortBy = 'name' } = input;

      const tags = await prisma.blogTag.findMany({
        include: {
          _count: includePostCount ? {
            select: {
              posts: {
                where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, deletedAt: null },
              },
            },
          } : false,
        },
      });

      let result = tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        postCount: t._count?.posts || 0,
      }));

      // Sort
      if (sortBy === 'postCount') {
        result.sort((a, b) => b.postCount - a.postCount);
      } else {
        result.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Limit
      if (limit) {
        result = result.slice(0, limit);
      }

      return {
        tags: result,
        total: result.length,
      };
    `
  },
  // ============================================================================
  // SEARCH POSTS
  // ============================================================================
  {
    name: "blog.search",
    description: "Search blog posts by keyword",
    category: "blog",
    tags: ["blog", "cms", "search"],
    icon: "Search",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
          minLength: 2
        },
        page: {
          type: "number",
          description: "Page number",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 10
        }
      },
      required: ["query"]
    },
    handler: `
      const { query, page = 1, limit = 10 } = input;

      const where = {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
        ],
      };

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          include: {
            author: { select: { id: true, name: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { publishedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.blogPost.count({ where }),
      ]);

      return {
        query,
        results: posts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          featuredImage: p.featuredImage,
          author: p.author,
          category: p.category,
          publishedAt: p.publishedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  },
  // ============================================================================
  // GET PAGES
  // ============================================================================
  {
    name: "blog.getPages",
    description: "Get CMS pages (about, contact, etc.)",
    category: "blog",
    tags: ["cms", "pages", "content"],
    icon: "Layout",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by status",
          enum: ["DRAFT", "PUBLISHED"]
        },
        includeContent: {
          type: "boolean",
          description: "Include full page content",
          default: false
        }
      },
      required: []
    },
    handler: `
      const { status = 'PUBLISHED', includeContent = false } = input;

      const pages = await prisma.page.findMany({
        where: { status, deletedAt: null },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          template: true,
          content: includeContent,
          puckContent: includeContent,
          order: true,
          showInNav: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { order: 'asc' },
      });

      return {
        pages,
        total: pages.length,
      };
    `
  },
  // ============================================================================
  // GET SINGLE PAGE
  // ============================================================================
  {
    name: "blog.getPage",
    description: "Get a single CMS page by slug",
    category: "blog",
    tags: ["cms", "pages", "content"],
    icon: "Layout",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Page slug"
        },
        pageId: {
          type: "string",
          description: "Page ID (alternative to slug)"
        }
      },
      required: []
    },
    handler: `
      const { slug, pageId } = input;

      if (!slug && !pageId) {
        throw new Error('Either slug or pageId is required');
      }

      const where = pageId ? { id: pageId } : { slug };
      where.status = 'PUBLISHED';
      where.deletedAt = null;

      const page = await prisma.page.findFirst({ where });

      if (!page) {
        throw new Error('Page not found');
      }

      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        description: page.description,
        content: page.content,
        puckContent: page.puckContent,
        template: page.template,
        seo: {
          title: page.seoTitle || page.title,
          description: page.seoDescription || page.description,
        },
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      };
    `
  }
];

// src/lib/plugins/primitives/cart.ts
var CART_PRIMITIVES = [
  // ============================================================================
  // CART RETRIEVAL
  // ============================================================================
  {
    name: "cart.get",
    description: "Get a cart by ID, session ID, or user ID. Returns cart with items and totals.",
    category: "cart",
    tags: ["cart", "ecommerce", "get"],
    icon: "ShoppingCart",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        cartId: {
          type: "string",
          description: "Cart ID to retrieve"
        },
        sessionId: {
          type: "string",
          description: "Session ID (for guest carts)"
        },
        userId: {
          type: "string",
          description: "User ID (for logged-in users)"
        },
        includeItems: {
          type: "boolean",
          description: "Include cart items in response (default: true)",
          default: true
        }
      }
    },
    handler: `
      const { prisma } = await import('../../db');

      let cart = null;
      const include = args.includeItems !== false ? {
        items: {
          include: {
            product: { select: { id: true, slug: true, status: true } },
            variant: { select: { id: true, sku: true, inventory: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      } : undefined;

      if (args.cartId) {
        cart = await prisma.cart.findUnique({
          where: { id: args.cartId },
          include,
        });
      } else if (args.sessionId) {
        cart = await prisma.cart.findFirst({
          where: { sessionId: args.sessionId, status: 'ACTIVE' },
          include,
        });
      } else if (args.userId) {
        cart = await prisma.cart.findFirst({
          where: { userId: args.userId, status: 'ACTIVE' },
          include,
        });
      } else {
        throw new Error('Must provide cartId, sessionId, or userId');
      }

      return cart;
    `
  },
  // ============================================================================
  // CART CREATION
  // ============================================================================
  {
    name: "cart.create",
    description: "Create a new shopping cart for a session or user.",
    category: "cart",
    tags: ["cart", "ecommerce", "create"],
    icon: "ShoppingCart",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session ID for guest cart"
        },
        userId: {
          type: "string",
          description: "User ID for logged-in user cart"
        },
        email: {
          type: "string",
          description: "Email for cart recovery"
        }
      }
    },
    handler: `
      const { prisma } = await import('../../db');

      if (!args.sessionId && !args.userId) {
        throw new Error('Must provide sessionId or userId');
      }

      // Check for existing active cart
      const existing = await prisma.cart.findFirst({
        where: {
          OR: [
            args.sessionId ? { sessionId: args.sessionId, status: 'ACTIVE' } : {},
            args.userId ? { userId: args.userId, status: 'ACTIVE' } : {},
          ].filter(c => Object.keys(c).length > 0),
        },
      });

      if (existing) {
        return existing;
      }

      // Create new cart
      const cart = await prisma.cart.create({
        data: {
          sessionId: args.sessionId,
          userId: args.userId,
          email: args.email,
          status: 'ACTIVE',
          subtotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          shippingTotal: 0,
          total: 0,
        },
      });

      return cart;
    `
  },
  // ============================================================================
  // CART ITEM MANAGEMENT
  // ============================================================================
  {
    name: "cart.addItem",
    description: "Add a product to the cart. Creates cart item or increments quantity if exists.",
    category: "cart",
    tags: ["cart", "ecommerce", "add", "item"],
    icon: "Plus",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        cartId: {
          type: "string",
          description: "Cart ID"
        },
        productId: {
          type: "string",
          description: "Product ID to add"
        },
        variantId: {
          type: "string",
          description: "Product variant ID (optional)"
        },
        quantity: {
          type: "number",
          description: "Quantity to add (default: 1)",
          default: 1
        }
      },
      required: ["cartId", "productId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const quantity = args.quantity || 1;

      // Get product and variant info
      const product = await prisma.product.findUnique({
        where: { id: args.productId },
        include: {
          images: { take: 1, orderBy: { position: 'asc' } },
          variants: args.variantId ? { where: { id: args.variantId } } : undefined,
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.status !== 'ACTIVE') {
        throw new Error('Product is not available');
      }

      const variant = args.variantId ? product.variants?.[0] : null;
      const price = variant?.price ?? product.price;
      const imageUrl = product.images[0]?.url || null;

      // Check for existing item
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: args.cartId,
          productId: args.productId,
          variantId: args.variantId || null,
        },
      });

      let item;
      if (existingItem) {
        // Update quantity
        item = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        // Create new item
        item = await prisma.cartItem.create({
          data: {
            cartId: args.cartId,
            productId: args.productId,
            variantId: args.variantId || null,
            quantity,
            title: product.title,
            variantTitle: variant?.title || null,
            price,
            imageUrl,
          },
        });
      }

      // Recalculate cart totals
      const items = await prisma.cartItem.findMany({
        where: { cartId: args.cartId },
      });

      const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

      await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          subtotal,
          total: subtotal, // Will be adjusted when discount/shipping applied
        },
      });

      return item;
    `
  },
  {
    name: "cart.updateItem",
    description: "Update quantity of a cart item.",
    category: "cart",
    tags: ["cart", "ecommerce", "update", "item"],
    icon: "Edit",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        cartId: {
          type: "string",
          description: "Cart ID"
        },
        itemId: {
          type: "string",
          description: "Cart item ID"
        },
        quantity: {
          type: "number",
          description: "New quantity (0 removes item)"
        }
      },
      required: ["cartId", "itemId", "quantity"]
    },
    handler: `
      const { prisma } = await import('../../db');

      if (args.quantity <= 0) {
        // Remove item
        await prisma.cartItem.delete({
          where: { id: args.itemId },
        });
      } else {
        // Update quantity
        await prisma.cartItem.update({
          where: { id: args.itemId },
          data: { quantity: args.quantity },
        });
      }

      // Recalculate cart totals
      const items = await prisma.cartItem.findMany({
        where: { cartId: args.cartId },
      });

      const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

      const cart = await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          subtotal,
          total: subtotal - (await prisma.cart.findUnique({ where: { id: args.cartId } }))?.discountTotal || 0,
        },
        include: { items: true },
      });

      return cart;
    `
  },
  {
    name: "cart.removeItem",
    description: "Remove an item from the cart.",
    category: "cart",
    tags: ["cart", "ecommerce", "remove", "item"],
    icon: "Trash",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        cartId: {
          type: "string",
          description: "Cart ID"
        },
        itemId: {
          type: "string",
          description: "Cart item ID to remove"
        }
      },
      required: ["cartId", "itemId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      await prisma.cartItem.delete({
        where: { id: args.itemId },
      });

      // Recalculate cart totals
      const items = await prisma.cartItem.findMany({
        where: { cartId: args.cartId },
      });

      const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const cart = await prisma.cart.findUnique({ where: { id: args.cartId } });

      const updated = await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          subtotal,
          total: subtotal - (cart?.discountTotal || 0) + (cart?.shippingTotal || 0) + (cart?.taxTotal || 0),
        },
        include: { items: true },
      });

      return updated;
    `
  },
  {
    name: "cart.clear",
    description: "Remove all items from a cart.",
    category: "cart",
    tags: ["cart", "ecommerce", "clear"],
    icon: "Trash2",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        cartId: {
          type: "string",
          description: "Cart ID to clear"
        }
      },
      required: ["cartId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      // Delete all items
      await prisma.cartItem.deleteMany({
        where: { cartId: args.cartId },
      });

      // Reset cart totals
      const cart = await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          subtotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          shippingTotal: 0,
          total: 0,
          discountCodeId: null,
        },
        include: { items: true },
      });

      return cart;
    `
  },
  // ============================================================================
  // COUPON/DISCOUNT MANAGEMENT
  // ============================================================================
  {
    name: "cart.applyCoupon",
    description: "Apply a discount code to the cart.",
    category: "cart",
    tags: ["cart", "ecommerce", "coupon", "discount"],
    icon: "Tag",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        cartId: {
          type: "string",
          description: "Cart ID"
        },
        code: {
          type: "string",
          description: "Discount code to apply"
        },
        email: {
          type: "string",
          description: "Customer email (for usage validation)"
        }
      },
      required: ["cartId", "code"]
    },
    handler: `
      const { prisma } = await import('../../db');

      // Find the discount code
      const discount = await prisma.discountCode.findUnique({
        where: { code: args.code.toUpperCase() },
      });

      if (!discount) {
        throw new Error('Invalid discount code');
      }

      // Check if active
      if (!discount.isActive) {
        throw new Error('Discount code is not active');
      }

      // Check dates
      const now = new Date();
      if (discount.startDate && discount.startDate > now) {
        throw new Error('Discount code is not yet valid');
      }
      if (discount.endDate && discount.endDate < now) {
        throw new Error('Discount code has expired');
      }

      // Check usage limit
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        throw new Error('Discount code usage limit reached');
      }

      // Check per-customer limit
      if (discount.perCustomerLimit && args.email) {
        const customerUsage = await prisma.discountUsage.count({
          where: {
            discountCodeId: discount.id,
            email: args.email,
          },
        });
        if (customerUsage >= discount.perCustomerLimit) {
          throw new Error('You have already used this discount code');
        }
      }

      // Get cart
      const cart = await prisma.cart.findUnique({
        where: { id: args.cartId },
        include: { items: true },
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Check minimum order value
      if (discount.minOrderValue && cart.subtotal < discount.minOrderValue) {
        throw new Error('Order does not meet minimum value for this discount');
      }

      // Calculate discount amount
      let discountAmount = 0;

      if (discount.type === 'PERCENTAGE') {
        discountAmount = Math.floor(cart.subtotal * (discount.value / 100));
        if (discount.maxDiscount) {
          discountAmount = Math.min(discountAmount, discount.maxDiscount);
        }
      } else if (discount.type === 'FIXED') {
        discountAmount = discount.value;
      } else if (discount.type === 'FREE_SHIPPING') {
        discountAmount = cart.shippingTotal;
      }

      // Don't discount more than the subtotal
      discountAmount = Math.min(discountAmount, cart.subtotal);

      // Update cart
      const updated = await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          discountCodeId: discount.id,
          discountTotal: discountAmount,
          total: cart.subtotal - discountAmount + cart.shippingTotal + cart.taxTotal,
        },
        include: { items: true },
      });

      return {
        cart: updated,
        discount: {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          discountAmount,
        },
      };
    `
  },
  {
    name: "cart.removeCoupon",
    description: "Remove applied discount code from the cart.",
    category: "cart",
    tags: ["cart", "ecommerce", "coupon", "remove"],
    icon: "X",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        cartId: {
          type: "string",
          description: "Cart ID"
        }
      },
      required: ["cartId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const cart = await prisma.cart.findUnique({
        where: { id: args.cartId },
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      const updated = await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          discountCodeId: null,
          discountTotal: 0,
          total: cart.subtotal + cart.shippingTotal + cart.taxTotal,
        },
        include: { items: true },
      });

      return updated;
    `
  },
  // ============================================================================
  // SHIPPING
  // ============================================================================
  {
    name: "cart.getShippingRates",
    description: "Get available shipping rates for the cart based on address.",
    category: "cart",
    tags: ["cart", "ecommerce", "shipping", "rates"],
    icon: "Truck",
    timeout: 3e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        cartId: {
          type: "string",
          description: "Cart ID"
        },
        address: {
          type: "object",
          description: "Shipping address",
          properties: {
            street1: { type: "string" },
            street2: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            postalCode: { type: "string" },
            country: { type: "string" }
          },
          required: ["city", "state", "postalCode", "country"]
        }
      },
      required: ["cartId", "address"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const cart = await prisma.cart.findUnique({
        where: { id: args.cartId },
        include: { items: { include: { product: true, variant: true } } },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate total weight
      let totalWeightGrams = 0;
      for (const item of cart.items) {
        const weight = item.variant?.weight ?? item.product?.weight ?? 100; // Default 100g
        totalWeightGrams += weight * item.quantity;
      }

      // Try to get rates from Shippo if configured
      try {
        const { getShippingRates } = await import('../../shippo');
        const rates = await getShippingRates({
          addressTo: {
            street1: args.address.street1,
            street2: args.address.street2,
            city: args.address.city,
            state: args.address.state,
            zip: args.address.postalCode,
            country: args.address.country,
          },
          parcels: [{
            length: 10,
            width: 10,
            height: 10,
            weight: totalWeightGrams / 1000, // Convert to kg
            massUnit: 'kg',
            distanceUnit: 'cm',
          }],
        });

        return {
          rates: rates.map(r => ({
            id: r.objectId,
            carrier: r.provider,
            service: r.servicelevel?.name || 'Standard',
            price: Math.round(parseFloat(r.amount) * 100), // Convert to cents
            currency: r.currency,
            estimatedDays: r.estimatedDays,
          })),
        };
      } catch (e) {
        // Fallback to flat rate shipping
        return {
          rates: [
            {
              id: 'flat_standard',
              carrier: 'Flat Rate',
              service: 'Standard Shipping',
              price: 999, // $9.99
              currency: 'USD',
              estimatedDays: 5,
            },
            {
              id: 'flat_express',
              carrier: 'Flat Rate',
              service: 'Express Shipping',
              price: 1999, // $19.99
              currency: 'USD',
              estimatedDays: 2,
            },
          ],
        };
      }
    `
  }
];

// src/lib/plugins/primitives/customer.ts
var CUSTOMER_PRIMITIVES = [
  // ============================================================================
  // PROFILE PRIMITIVES
  // ============================================================================
  {
    name: "customer.getProfile",
    description: "Get the current authenticated customer's profile information including name, email, and account details.",
    category: "customer",
    tags: ["customer", "profile", "account"],
    icon: "User",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The user ID to fetch profile for"
        },
        include: {
          type: "array",
          description: "Related data to include: addresses, orders, subscriptions"
        }
      },
      required: ["userId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const includeOptions = {};
      if (args.include?.includes('addresses')) includeOptions.addresses = true;
      if (args.include?.includes('orders')) includeOptions.orders = { take: 5, orderBy: { createdAt: 'desc' } };
      if (args.include?.includes('subscriptions')) includeOptions.subscriptions = true;

      const user = await prisma.user.findUnique({
        where: { id: args.userId },
        include: includeOptions,
      });

      if (!user) {
        throw new Error('Customer not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
        ...user,
      };
    `
  },
  {
    name: "customer.updateProfile",
    description: "Update the customer's profile information such as name, email, or avatar.",
    category: "customer",
    tags: ["customer", "profile", "update"],
    icon: "UserCog",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The user ID to update"
        },
        name: {
          type: "string",
          description: "New display name"
        },
        avatar: {
          type: "string",
          description: "New avatar URL"
        }
      },
      required: ["userId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const updateData = {};
      if (args.name !== undefined) updateData.name = args.name;
      if (args.avatar !== undefined) updateData.avatar = args.avatar;

      const user = await prisma.user.update({
        where: { id: args.userId },
        data: updateData,
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      };
    `
  },
  // ============================================================================
  // ORDER PRIMITIVES
  // ============================================================================
  {
    name: "customer.getOrders",
    description: "Get a paginated list of orders for the customer with filtering options.",
    category: "customer",
    tags: ["customer", "orders", "history"],
    icon: "ShoppingBag",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The customer user ID"
        },
        status: {
          type: "string",
          description: "Filter by order status",
          enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]
        },
        page: {
          type: "number",
          description: "Page number (1-indexed)",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 10
        }
      },
      required: ["userId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const page = args.page || 1;
      const limit = Math.min(args.limit || 10, 50);
      const skip = (page - 1) * limit;

      const where = { customerId: args.userId };
      if (args.status) where.status = args.status;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: { select: { title: true, slug: true } },
              },
            },
            shipments: { select: { trackingNumber: true, carrier: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);

      return {
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentStatus: o.paymentStatus,
          total: o.total,
          itemCount: o.items.length,
          items: o.items,
          shipments: o.shipments,
          createdAt: o.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  },
  {
    name: "customer.getOrder",
    description: "Get detailed information about a specific order including items, shipping, and payment details.",
    category: "customer",
    tags: ["customer", "order", "detail"],
    icon: "Receipt",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The customer user ID (for authorization)"
        },
        orderId: {
          type: "string",
          description: "The order ID or order number"
        }
      },
      required: ["userId", "orderId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: args.orderId },
            { orderNumber: args.orderId },
          ],
          customerId: args.userId,
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, title: true, slug: true } },
              variant: { select: { id: true, sku: true } },
            },
          },
          shipments: true,
          payments: true,
          shippingAddress: true,
          billingAddress: true,
          progress: {
            include: { stage: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    `
  },
  // ============================================================================
  // ADDRESS PRIMITIVES
  // ============================================================================
  {
    name: "customer.getAddresses",
    description: "Get all saved addresses for the customer.",
    category: "customer",
    tags: ["customer", "addresses", "shipping"],
    icon: "MapPin",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The customer user ID"
        },
        type: {
          type: "string",
          description: "Filter by address type",
          enum: ["SHIPPING", "BILLING"]
        }
      },
      required: ["userId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const where = { userId: args.userId };
      if (args.type) where.type = args.type;

      const addresses = await prisma.address.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return { addresses };
    `
  },
  {
    name: "customer.saveAddress",
    description: "Create or update a customer address.",
    category: "customer",
    tags: ["customer", "address", "save"],
    icon: "MapPinPlus",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The customer user ID"
        },
        addressId: {
          type: "string",
          description: "Address ID to update (omit to create new)"
        },
        type: {
          type: "string",
          description: "Address type",
          enum: ["SHIPPING", "BILLING"]
        },
        firstName: {
          type: "string",
          description: "First name"
        },
        lastName: {
          type: "string",
          description: "Last name"
        },
        company: {
          type: "string",
          description: "Company name"
        },
        street1: {
          type: "string",
          description: "Street address line 1"
        },
        street2: {
          type: "string",
          description: "Street address line 2"
        },
        city: {
          type: "string",
          description: "City"
        },
        state: {
          type: "string",
          description: "State/Province"
        },
        zip: {
          type: "string",
          description: "ZIP/Postal code"
        },
        country: {
          type: "string",
          description: "Country code",
          default: "US"
        },
        phone: {
          type: "string",
          description: "Phone number"
        },
        isDefault: {
          type: "boolean",
          description: "Set as default address"
        }
      },
      required: ["userId", "firstName", "lastName", "street1", "city", "state", "zip"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const addressData = {
        type: args.type || 'SHIPPING',
        firstName: args.firstName,
        lastName: args.lastName,
        company: args.company,
        street1: args.street1,
        street2: args.street2,
        city: args.city,
        state: args.state,
        zip: args.zip,
        country: args.country || 'US',
        phone: args.phone,
        isDefault: args.isDefault || false,
      };

      // If setting as default, unset other defaults first
      if (args.isDefault) {
        await prisma.address.updateMany({
          where: { userId: args.userId, type: addressData.type },
          data: { isDefault: false },
        });
      }

      let address;
      if (args.addressId) {
        // Update existing
        address = await prisma.address.update({
          where: { id: args.addressId, userId: args.userId },
          data: addressData,
        });
      } else {
        // Create new
        address = await prisma.address.create({
          data: {
            ...addressData,
            userId: args.userId,
          },
        });
      }

      return { success: true, address };
    `
  },
  {
    name: "customer.deleteAddress",
    description: "Delete a saved address.",
    category: "customer",
    tags: ["customer", "address", "delete"],
    icon: "MapPinOff",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The customer user ID"
        },
        addressId: {
          type: "string",
          description: "The address ID to delete"
        }
      },
      required: ["userId", "addressId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      await prisma.address.delete({
        where: {
          id: args.addressId,
          userId: args.userId,
        },
      });

      return { success: true };
    `
  },
  // ============================================================================
  // SUBSCRIPTION PRIMITIVES
  // ============================================================================
  {
    name: "customer.getSubscriptions",
    description: "Get all active and past subscriptions for the customer.",
    category: "customer",
    tags: ["customer", "subscriptions", "recurring"],
    icon: "RefreshCw",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The customer user ID"
        },
        status: {
          type: "string",
          description: "Filter by status",
          enum: ["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED"]
        }
      },
      required: ["userId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const where = { userId: args.userId };
      if (args.status) where.status = args.status;

      const subscriptions = await prisma.subscription.findMany({
        where,
        include: {
          product: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { subscriptions };
    `
  },
  {
    name: "customer.cancelSubscription",
    description: "Cancel an active subscription.",
    category: "customer",
    tags: ["customer", "subscription", "cancel"],
    icon: "XCircle",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The customer user ID"
        },
        subscriptionId: {
          type: "string",
          description: "The subscription ID to cancel"
        },
        reason: {
          type: "string",
          description: "Cancellation reason"
        },
        cancelImmediately: {
          type: "boolean",
          description: "Cancel immediately vs at period end",
          default: false
        }
      },
      required: ["userId", "subscriptionId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      // Verify ownership
      const subscription = await prisma.subscription.findFirst({
        where: {
          id: args.subscriptionId,
          userId: args.userId,
          status: 'ACTIVE',
        },
      });

      if (!subscription) {
        throw new Error('Active subscription not found');
      }

      // Cancel in Stripe if applicable
      if (subscription.stripeSubscriptionId) {
        const { stripe } = await import('../../stripe');
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: !args.cancelImmediately,
        });

        if (args.cancelImmediately) {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        }
      }

      // Update local record
      const updated = await prisma.subscription.update({
        where: { id: args.subscriptionId },
        data: {
          status: args.cancelImmediately ? 'CANCELLED' : 'ACTIVE',
          cancelledAt: args.cancelImmediately ? new Date() : null,
          cancelReason: args.reason,
        },
      });

      return {
        success: true,
        subscription: updated,
        cancelledImmediately: args.cancelImmediately,
      };
    `
  },
  // ============================================================================
  // DIGITAL DOWNLOADS PRIMITIVES
  // ============================================================================
  {
    name: "customer.getDownloads",
    description: "Get all digital products/downloads available to the customer.",
    category: "customer",
    tags: ["customer", "downloads", "digital"],
    icon: "Download",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The customer user ID"
        }
      },
      required: ["userId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      // Get all orders with digital products
      const downloads = await prisma.digitalDownload.findMany({
        where: { userId: args.userId },
        include: {
          asset: true,
          order: {
            select: { id: true, orderNumber: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        downloads: downloads.map(d => ({
          id: d.id,
          fileName: d.asset.fileName,
          fileSize: d.asset.fileSize,
          downloadCount: d.downloadCount,
          maxDownloads: d.maxDownloads,
          expiresAt: d.expiresAt,
          canDownload: d.downloadCount < (d.maxDownloads || Infinity) &&
                       (!d.expiresAt || new Date(d.expiresAt) > new Date()),
          order: d.order,
          createdAt: d.createdAt,
        })),
      };
    `
  },
  {
    name: "customer.downloadAsset",
    description: "Generate a secure download link for a digital asset.",
    category: "customer",
    tags: ["customer", "download", "asset"],
    icon: "FileDown",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The customer user ID"
        },
        downloadId: {
          type: "string",
          description: "The digital download ID"
        }
      },
      required: ["userId", "downloadId"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const download = await prisma.digitalDownload.findFirst({
        where: {
          id: args.downloadId,
          userId: args.userId,
        },
        include: { asset: true },
      });

      if (!download) {
        throw new Error('Download not found');
      }

      // Check limits
      if (download.maxDownloads && download.downloadCount >= download.maxDownloads) {
        throw new Error('Download limit reached');
      }

      if (download.expiresAt && new Date(download.expiresAt) < new Date()) {
        throw new Error('Download has expired');
      }

      // Increment download count
      await prisma.digitalDownload.update({
        where: { id: args.downloadId },
        data: { downloadCount: { increment: 1 } },
      });

      // Generate signed URL (implementation depends on storage provider)
      // This is a placeholder - actual implementation would use S3/R2/etc.
      const downloadUrl = download.asset.url;

      return {
        success: true,
        downloadUrl,
        fileName: download.asset.fileName,
        remainingDownloads: download.maxDownloads
          ? download.maxDownloads - download.downloadCount - 1
          : null,
      };
    `
  }
];

// src/lib/plugins/primitives/discount.ts
var DISCOUNT_PRIMITIVES = [
  // ============================================================================
  // DISCOUNT PRIMITIVES
  // ============================================================================
  {
    name: "discount.validate",
    description: "Validate a discount code and check eligibility for an order.",
    category: "discount",
    tags: ["discount", "coupon", "validate", "e-commerce"],
    icon: "Percent",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Discount code to validate"
        },
        orderTotal: {
          type: "number",
          description: "Order subtotal in cents (for minimum order validation)"
        },
        productIds: {
          type: "array",
          description: "Product IDs in the order (for product-specific discounts)",
          items: { type: "string" }
        },
        categoryIds: {
          type: "array",
          description: "Category IDs of products (for category-specific discounts)",
          items: { type: "string" }
        },
        customerId: {
          type: "string",
          description: "Customer ID (for per-customer limits and first-order discounts)"
        },
        email: {
          type: "string",
          description: "Customer email (for tracking usage)"
        }
      },
      required: ["code"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const discount = await prisma.discountCode.findUnique({
        where: { code: args.code.toUpperCase() },
        include: {
          _count: {
            select: { usages: true },
          },
        },
      });

      if (!discount) {
        return { valid: false, error: 'Invalid discount code' };
      }

      // Check if enabled
      if (!discount.enabled) {
        return { valid: false, error: 'This discount code is no longer active' };
      }

      // Check date validity
      const now = new Date();
      if (discount.startsAt > now) {
        return { valid: false, error: 'This discount code is not yet active' };
      }
      if (discount.expiresAt && discount.expiresAt < now) {
        return { valid: false, error: 'This discount code has expired' };
      }

      // Check usage limits
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        return { valid: false, error: 'This discount code has reached its usage limit' };
      }

      // Check per-customer limit
      if (discount.perCustomer && (args.customerId || args.email)) {
        const customerUsages = await prisma.discountUsage.count({
          where: {
            discountCodeId: discount.id,
            OR: [
              args.customerId ? { userId: args.customerId } : {},
              args.email ? { email: args.email } : {},
            ].filter(o => Object.keys(o).length > 0),
          },
        });

        if (customerUsages >= discount.perCustomer) {
          return { valid: false, error: 'You have already used this discount code the maximum number of times' };
        }
      }

      // Check first order only
      if (discount.firstOrderOnly && (args.customerId || args.email)) {
        const previousOrders = await prisma.order.count({
          where: {
            OR: [
              args.customerId ? { customerId: args.customerId } : {},
              args.email ? { email: args.email } : {},
            ].filter(o => Object.keys(o).length > 0),
            status: { notIn: ['CANCELLED'] },
          },
        });

        if (previousOrders > 0) {
          return { valid: false, error: 'This discount code is only valid for first orders' };
        }
      }

      // Check minimum order value
      if (discount.minOrderValue && args.orderTotal && args.orderTotal < discount.minOrderValue) {
        return {
          valid: false,
          error: 'Minimum order of $' + (discount.minOrderValue / 100).toFixed(2) + ' required',
        };
      }

      // Check product/category applicability
      if (discount.applyTo === 'PRODUCT' && discount.productIds.length > 0) {
        const hasApplicableProduct = args.productIds?.some(id => discount.productIds.includes(id));
        if (!hasApplicableProduct) {
          return { valid: false, error: 'This discount does not apply to items in your cart' };
        }
      }

      if (discount.applyTo === 'CATEGORY' && discount.categoryIds.length > 0) {
        const hasApplicableCategory = args.categoryIds?.some(id => discount.categoryIds.includes(id));
        if (!hasApplicableCategory) {
          return { valid: false, error: 'This discount does not apply to items in your cart' };
        }
      }

      // Calculate discount amount if order total provided
      let discountAmount = 0;
      if (args.orderTotal) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount = Math.floor(args.orderTotal * discount.value / 100);
          if (discount.maxDiscount) {
            discountAmount = Math.min(discountAmount, discount.maxDiscount);
          }
        } else {
          discountAmount = Math.min(discount.value, args.orderTotal);
        }
      }

      return {
        valid: true,
        discount: {
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          description: discount.description,
          minOrderValue: discount.minOrderValue,
          maxDiscount: discount.maxDiscount,
          expiresAt: discount.expiresAt?.toISOString(),
        },
        discountAmount,
        savings: discountAmount > 0 ? '$' + (discountAmount / 100).toFixed(2) : null,
      };
    `
  },
  {
    name: "discount.apply",
    description: "Apply a validated discount code to an order or cart.",
    category: "discount",
    tags: ["discount", "coupon", "apply", "e-commerce"],
    icon: "Tag",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Discount code to apply"
        },
        orderId: {
          type: "string",
          description: "Order ID to apply discount to"
        },
        cartId: {
          type: "string",
          description: "Cart ID to apply discount to (alternative to orderId)"
        }
      },
      required: ["code"]
    },
    handler: `
      const { prisma } = await import('../../db');

      if (!args.orderId && !args.cartId) {
        throw new Error('Either orderId or cartId is required');
      }

      const discount = await prisma.discountCode.findUnique({
        where: { code: args.code.toUpperCase(), enabled: true },
      });

      if (!discount) {
        throw new Error('Invalid discount code');
      }

      if (args.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: args.orderId },
        });

        if (!order) {
          throw new Error('Order not found');
        }

        // Calculate discount
        let discountAmount = 0;
        if (discount.type === 'PERCENTAGE') {
          discountAmount = Math.floor(order.subtotal * discount.value / 100);
          if (discount.maxDiscount) {
            discountAmount = Math.min(discountAmount, discount.maxDiscount);
          }
        } else {
          discountAmount = Math.min(discount.value, order.subtotal);
        }

        // Update order
        const updated = await prisma.order.update({
          where: { id: args.orderId },
          data: {
            discountCodeId: discount.id,
            discountTotal: discountAmount,
            total: order.subtotal + order.shippingTotal + order.taxTotal - discountAmount,
          },
        });

        return {
          success: true,
          applied: 'order',
          orderId: updated.id,
          discountAmount,
          newTotal: updated.total,
        };
      }

      if (args.cartId) {
        const cart = await prisma.cart.findUnique({
          where: { id: args.cartId },
        });

        if (!cart) {
          throw new Error('Cart not found');
        }

        // Calculate discount
        let discountAmount = 0;
        if (discount.type === 'PERCENTAGE') {
          discountAmount = Math.floor(cart.subtotal * discount.value / 100);
          if (discount.maxDiscount) {
            discountAmount = Math.min(discountAmount, discount.maxDiscount);
          }
        } else {
          discountAmount = Math.min(discount.value, cart.subtotal);
        }

        // Update cart
        const updated = await prisma.cart.update({
          where: { id: args.cartId },
          data: {
            discountCodeId: discount.id,
            discountTotal: discountAmount,
            total: cart.subtotal + cart.shippingTotal + cart.taxTotal - discountAmount,
          },
        });

        return {
          success: true,
          applied: 'cart',
          cartId: updated.id,
          discountAmount,
          newTotal: updated.total,
        };
      }
    `
  },
  {
    name: "discount.remove",
    description: "Remove a discount code from an order or cart.",
    category: "discount",
    tags: ["discount", "coupon", "remove", "e-commerce"],
    icon: "X",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Order ID to remove discount from"
        },
        cartId: {
          type: "string",
          description: "Cart ID to remove discount from"
        }
      }
    },
    handler: `
      const { prisma } = await import('../../db');

      if (!args.orderId && !args.cartId) {
        throw new Error('Either orderId or cartId is required');
      }

      if (args.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: args.orderId },
        });

        if (!order) {
          throw new Error('Order not found');
        }

        const updated = await prisma.order.update({
          where: { id: args.orderId },
          data: {
            discountCodeId: null,
            discountTotal: 0,
            total: order.subtotal + order.shippingTotal + order.taxTotal,
          },
        });

        return {
          success: true,
          removed: 'order',
          orderId: updated.id,
          newTotal: updated.total,
        };
      }

      if (args.cartId) {
        const cart = await prisma.cart.findUnique({
          where: { id: args.cartId },
        });

        if (!cart) {
          throw new Error('Cart not found');
        }

        const updated = await prisma.cart.update({
          where: { id: args.cartId },
          data: {
            discountCodeId: null,
            discountTotal: 0,
            total: cart.subtotal + cart.shippingTotal + cart.taxTotal,
          },
        });

        return {
          success: true,
          removed: 'cart',
          cartId: updated.id,
          newTotal: updated.total,
        };
      }
    `
  },
  {
    name: "discount.list",
    description: "List discount codes with filtering and pagination.",
    category: "discount",
    tags: ["discount", "coupon", "list", "e-commerce"],
    icon: "List",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Filter by enabled status"
        },
        type: {
          type: "string",
          description: "Filter by discount type",
          enum: ["PERCENTAGE", "FIXED"]
        },
        active: {
          type: "boolean",
          description: "Filter active discounts (enabled, within date range, not exhausted)"
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page (default: 20)",
          default: 20
        }
      }
    },
    handler: `
      const { prisma } = await import('../../db');

      const page = Math.max(1, args.page || 1);
      const limit = Math.min(100, Math.max(1, args.limit || 20));
      const skip = (page - 1) * limit;

      const where = {};
      const now = new Date();

      if (typeof args.enabled === 'boolean') {
        where.enabled = args.enabled;
      }

      if (args.type) {
        where.type = args.type;
      }

      if (args.active) {
        where.enabled = true;
        where.startsAt = { lte: now };
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ];
      }

      const [discounts, total] = await Promise.all([
        prisma.discountCode.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { usages: true } },
          },
        }),
        prisma.discountCode.count({ where }),
      ]);

      return {
        success: true,
        discounts: discounts.map(d => ({
          id: d.id,
          code: d.code,
          description: d.description,
          type: d.type,
          value: d.value,
          minOrderValue: d.minOrderValue,
          maxDiscount: d.maxDiscount,
          enabled: d.enabled,
          usageCount: d.usageCount,
          usageLimit: d.usageLimit,
          startsAt: d.startsAt.toISOString(),
          expiresAt: d.expiresAt?.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  },
  {
    name: "discount.get",
    description: "Get details of a specific discount code by ID or code.",
    category: "discount",
    tags: ["discount", "coupon", "get", "e-commerce"],
    icon: "Info",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Discount ID"
        },
        code: {
          type: "string",
          description: "Discount code (alternative to id)"
        },
        includeUsages: {
          type: "boolean",
          description: "Include usage history",
          default: false
        }
      }
    },
    handler: `
      const { prisma } = await import('../../db');

      if (!args.id && !args.code) {
        throw new Error('Either id or code is required');
      }

      const where = args.id
        ? { id: args.id }
        : { code: args.code.toUpperCase() };

      const discount = await prisma.discountCode.findUnique({
        where,
        include: {
          usages: args.includeUsages ? {
            take: 50,
            orderBy: { createdAt: 'desc' },
          } : false,
          _count: { select: { usages: true } },
        },
      });

      if (!discount) {
        return { success: false, error: 'Discount not found' };
      }

      const now = new Date();
      const isActive = discount.enabled &&
        discount.startsAt <= now &&
        (!discount.expiresAt || discount.expiresAt > now) &&
        (!discount.usageLimit || discount.usageCount < discount.usageLimit);

      return {
        success: true,
        discount: {
          id: discount.id,
          code: discount.code,
          description: discount.description,
          type: discount.type,
          value: discount.value,
          applyTo: discount.applyTo,
          productIds: discount.productIds,
          categoryIds: discount.categoryIds,
          excludeProductIds: discount.excludeProductIds,
          excludeSaleItems: discount.excludeSaleItems,
          minOrderValue: discount.minOrderValue,
          maxDiscount: discount.maxDiscount,
          usageLimit: discount.usageLimit,
          usageCount: discount.usageCount,
          perCustomer: discount.perCustomer,
          firstOrderOnly: discount.firstOrderOnly,
          enabled: discount.enabled,
          startsAt: discount.startsAt.toISOString(),
          expiresAt: discount.expiresAt?.toISOString(),
          isActive,
          usages: args.includeUsages ? discount.usages.map(u => ({
            orderId: u.orderId,
            email: u.email,
            discountAmount: u.discountAmount,
            createdAt: u.createdAt.toISOString(),
          })) : undefined,
        },
      };
    `
  },
  {
    name: "discount.create",
    description: "Create a new discount code.",
    category: "discount",
    tags: ["discount", "coupon", "create", "e-commerce"],
    icon: "Plus",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Unique discount code"
        },
        description: {
          type: "string",
          description: "Description of the discount"
        },
        type: {
          type: "string",
          description: "Discount type",
          enum: ["PERCENTAGE", "FIXED"]
        },
        value: {
          type: "number",
          description: "Discount value (percentage or cents)"
        },
        minOrderValue: {
          type: "number",
          description: "Minimum order value in cents"
        },
        maxDiscount: {
          type: "number",
          description: "Maximum discount amount in cents (for percentage)"
        },
        usageLimit: {
          type: "number",
          description: "Total usage limit"
        },
        perCustomer: {
          type: "number",
          description: "Uses per customer"
        },
        firstOrderOnly: {
          type: "boolean",
          description: "Only valid for first orders"
        },
        startsAt: {
          type: "string",
          description: "Start date (ISO string)"
        },
        expiresAt: {
          type: "string",
          description: "Expiry date (ISO string)"
        },
        enabled: {
          type: "boolean",
          description: "Enable immediately",
          default: true
        }
      },
      required: ["code", "type", "value"]
    },
    handler: `
      const { prisma } = await import('../../db');

      // Check for existing code
      const existing = await prisma.discountCode.findUnique({
        where: { code: args.code.toUpperCase() },
      });

      if (existing) {
        throw new Error('Discount code already exists');
      }

      const discount = await prisma.discountCode.create({
        data: {
          code: args.code.toUpperCase(),
          description: args.description,
          type: args.type,
          value: args.value,
          minOrderValue: args.minOrderValue,
          maxDiscount: args.maxDiscount,
          usageLimit: args.usageLimit,
          perCustomer: args.perCustomer,
          firstOrderOnly: args.firstOrderOnly || false,
          startsAt: args.startsAt ? new Date(args.startsAt) : new Date(),
          expiresAt: args.expiresAt ? new Date(args.expiresAt) : null,
          enabled: args.enabled !== false,
        },
      });

      return {
        success: true,
        discount: {
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          enabled: discount.enabled,
        },
      };
    `
  }
];

// src/lib/plugins/primitives/email.ts
var EMAIL_PRIMITIVES = [
  // ============================================================================
  // EMAIL SENDING
  // ============================================================================
  {
    name: "email.send",
    description: "Send an email to one or more recipients.",
    category: "email",
    tags: ["email", "send", "notification"],
    icon: "Mail",
    timeout: 3e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "array",
          description: "Recipient email addresses",
          items: {
            type: "object",
            properties: {
              email: { type: "string" },
              name: { type: "string" }
            },
            required: ["email"]
          }
        },
        subject: {
          type: "string",
          description: "Email subject line"
        },
        html: {
          type: "string",
          description: "HTML email body"
        },
        text: {
          type: "string",
          description: "Plain text email body"
        },
        from: {
          type: "object",
          description: "Sender (optional, uses default if not provided)",
          properties: {
            email: { type: "string" },
            name: { type: "string" }
          }
        },
        replyTo: {
          type: "object",
          description: "Reply-to address",
          properties: {
            email: { type: "string" },
            name: { type: "string" }
          }
        }
      },
      required: ["to", "subject"]
    },
    handler: `
      const { sendEmail } = await import('../../email');

      const toArray = Array.isArray(args.to) ? args.to : [args.to];

      const results = [];
      for (const recipient of toArray) {
        const result = await sendEmail({
          to: recipient,
          subject: args.subject,
          html: args.html,
          text: args.text,
          from: args.from,
          replyTo: args.replyTo,
        });
        results.push({
          email: recipient.email,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        });
      }

      return {
        success: results.every(r => r.success),
        results,
      };
    `
  },
  {
    name: "email.sendTemplate",
    description: "Send an email using a saved template with merge tags.",
    category: "email",
    tags: ["email", "template", "merge-tags"],
    icon: "FileText",
    timeout: 3e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          description: "Email template ID"
        },
        to: {
          type: "object",
          description: "Recipient",
          properties: {
            email: { type: "string" },
            name: { type: "string" }
          },
          required: ["email"]
        },
        data: {
          type: "object",
          description: 'Merge tag data (e.g., { firstName: "John", orderNumber: "12345" })'
        },
        from: {
          type: "object",
          description: "Sender (optional)",
          properties: {
            email: { type: "string" },
            name: { type: "string" }
          }
        }
      },
      required: ["templateId", "to"]
    },
    handler: `
      const { prisma } = await import('../../db');
      const { sendEmailWithMergeTags } = await import('../../email');

      // Get template
      const template = await prisma.emailTemplate.findUnique({
        where: { id: args.templateId },
      });

      if (!template) {
        throw new Error('Email template not found');
      }

      if (!template.isActive) {
        throw new Error('Email template is not active');
      }

      const result = await sendEmailWithMergeTags(
        {
          to: args.to,
          subjectTemplate: template.subject,
          htmlTemplate: template.htmlContent || undefined,
          textTemplate: template.textContent || undefined,
          from: args.from,
        },
        args.data || {}
      );

      return {
        success: result.success,
        messageId: result.messageId,
        template: template.name,
      };
    `
  },
  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================
  {
    name: "email.subscribe",
    description: "Subscribe an email address to the mailing list.",
    category: "email",
    tags: ["email", "subscribe", "newsletter"],
    icon: "UserPlus",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Email address to subscribe"
        },
        firstName: {
          type: "string",
          description: "Subscriber first name"
        },
        lastName: {
          type: "string",
          description: "Subscriber last name"
        },
        lists: {
          type: "array",
          description: "List IDs to subscribe to (default: newsletter)",
          items: { type: "string" }
        },
        source: {
          type: "string",
          description: 'Subscription source (e.g., "checkout", "popup", "footer")'
        },
        requireDoubleOptIn: {
          type: "boolean",
          description: "Require double opt-in confirmation (default: true)",
          default: true
        }
      },
      required: ["email"]
    },
    handler: `
      const { prisma } = await import('../../db');
      const { createSubscription, sendConfirmationEmail } = await import('../../email/subscriptions');

      const lists = args.lists || ['newsletter'];
      const requireDoubleOptIn = args.requireDoubleOptIn !== false;

      // Check for existing subscriber
      let subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      if (subscriber) {
        if (subscriber.status === 'UNSUBSCRIBED') {
          // Resubscribe
          subscriber = await prisma.emailSubscriber.update({
            where: { id: subscriber.id },
            data: {
              status: requireDoubleOptIn ? 'PENDING' : 'SUBSCRIBED',
              firstName: args.firstName || subscriber.firstName,
              lastName: args.lastName || subscriber.lastName,
              unsubscribedAt: null,
            },
          });
        } else if (subscriber.status === 'SUBSCRIBED') {
          return { success: true, message: 'Already subscribed', subscriber };
        }
      } else {
        // Create new subscriber
        subscriber = await prisma.emailSubscriber.create({
          data: {
            email: args.email.toLowerCase(),
            firstName: args.firstName,
            lastName: args.lastName,
            status: requireDoubleOptIn ? 'PENDING' : 'SUBSCRIBED',
            source: args.source || 'api',
            lists,
          },
        });
      }

      // Send confirmation email if double opt-in
      if (requireDoubleOptIn) {
        await sendConfirmationEmail(subscriber.id);
        return {
          success: true,
          message: 'Confirmation email sent',
          requiresConfirmation: true,
          subscriber
        };
      }

      return { success: true, message: 'Subscribed successfully', subscriber };
    `
  },
  {
    name: "email.unsubscribe",
    description: "Unsubscribe an email address from the mailing list.",
    category: "email",
    tags: ["email", "unsubscribe"],
    icon: "UserMinus",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Email address to unsubscribe"
        },
        reason: {
          type: "string",
          description: "Unsubscribe reason"
        },
        lists: {
          type: "array",
          description: "Specific list IDs to unsubscribe from (empty = all)",
          items: { type: "string" }
        }
      },
      required: ["email"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      if (!subscriber) {
        return { success: true, message: 'Email not found in list' };
      }

      if (args.lists && args.lists.length > 0) {
        // Unsubscribe from specific lists
        const remainingLists = (subscriber.lists || []).filter(
          l => !args.lists.includes(l)
        );

        if (remainingLists.length === 0) {
          // No lists left, fully unsubscribe
          await prisma.emailSubscriber.update({
            where: { id: subscriber.id },
            data: {
              status: 'UNSUBSCRIBED',
              unsubscribedAt: new Date(),
              unsubscribeReason: args.reason,
              lists: [],
            },
          });
        } else {
          await prisma.emailSubscriber.update({
            where: { id: subscriber.id },
            data: { lists: remainingLists },
          });
        }
      } else {
        // Unsubscribe from all
        await prisma.emailSubscriber.update({
          where: { id: subscriber.id },
          data: {
            status: 'UNSUBSCRIBED',
            unsubscribedAt: new Date(),
            unsubscribeReason: args.reason,
            lists: [],
          },
        });
      }

      return { success: true, message: 'Unsubscribed successfully' };
    `
  },
  {
    name: "email.updatePreferences",
    description: "Update email subscription preferences for a subscriber.",
    category: "email",
    tags: ["email", "preferences", "settings"],
    icon: "Settings",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Subscriber email address"
        },
        lists: {
          type: "array",
          description: "List IDs to subscribe to",
          items: { type: "string" }
        },
        frequency: {
          type: "string",
          description: "Email frequency preference",
          enum: ["instant", "daily", "weekly", "monthly"]
        },
        firstName: {
          type: "string",
          description: "Update first name"
        },
        lastName: {
          type: "string",
          description: "Update last name"
        }
      },
      required: ["email"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      if (!subscriber) {
        throw new Error('Subscriber not found');
      }

      const updateData = {};

      if (args.lists !== undefined) {
        updateData.lists = args.lists;
      }
      if (args.frequency !== undefined) {
        updateData.preferences = {
          ...(subscriber.preferences || {}),
          frequency: args.frequency,
        };
      }
      if (args.firstName !== undefined) {
        updateData.firstName = args.firstName;
      }
      if (args.lastName !== undefined) {
        updateData.lastName = args.lastName;
      }

      const updated = await prisma.emailSubscriber.update({
        where: { id: subscriber.id },
        data: updateData,
      });

      return { success: true, subscriber: updated };
    `
  },
  {
    name: "email.getSubscriptionStatus",
    description: "Get the subscription status for an email address.",
    category: "email",
    tags: ["email", "status", "subscription"],
    icon: "Info",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Email address to check"
        }
      },
      required: ["email"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: args.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          lists: true,
          preferences: true,
          subscribedAt: true,
          unsubscribedAt: true,
          source: true,
        },
      });

      if (!subscriber) {
        return {
          subscribed: false,
          status: 'NOT_FOUND',
        };
      }

      return {
        subscribed: subscriber.status === 'SUBSCRIBED',
        status: subscriber.status,
        subscriber,
      };
    `
  }
];

// src/lib/plugins/primitives/giftcard.ts
var GIFTCARD_PRIMITIVES = [
  // ============================================================================
  // CHECK BALANCE
  // ============================================================================
  {
    name: "giftcard.check",
    description: "Check gift card balance and validity",
    category: "giftcard",
    tags: ["giftcard", "balance", "check", "storefront"],
    icon: "CreditCard",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Gift card code"
        }
      },
      required: ["code"]
    },
    handler: `
      const { code } = input;

      const giftCard = await prisma.giftCard.findFirst({
        where: { code: code.toUpperCase() },
      });

      if (!giftCard) {
        return {
          valid: false,
          error: 'Gift card not found',
        };
      }

      if (giftCard.status !== 'ACTIVE') {
        return {
          valid: false,
          error: 'Gift card is ' + giftCard.status.toLowerCase(),
          status: giftCard.status,
        };
      }

      if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
        return {
          valid: false,
          error: 'Gift card has expired',
          expiresAt: giftCard.expiresAt,
        };
      }

      if (giftCard.balance <= 0) {
        return {
          valid: false,
          error: 'Gift card has no remaining balance',
          balance: 0,
        };
      }

      return {
        valid: true,
        balance: giftCard.balance,
        originalAmount: giftCard.originalAmount,
        currency: giftCard.currency,
        expiresAt: giftCard.expiresAt,
        status: giftCard.status,
      };
    `
  },
  // ============================================================================
  // REDEEM GIFT CARD
  // ============================================================================
  {
    name: "giftcard.redeem",
    description: "Redeem gift card balance towards an order",
    category: "giftcard",
    tags: ["giftcard", "redeem", "payment", "checkout"],
    icon: "Gift",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Gift card code"
        },
        amount: {
          type: "number",
          description: "Amount to redeem",
          minimum: 0.01
        },
        orderId: {
          type: "string",
          description: "Order ID to apply to"
        },
        userId: {
          type: "string",
          description: "User ID redeeming"
        }
      },
      required: ["code", "amount", "orderId"]
    },
    handler: `
      const { code, amount, orderId, userId } = input;

      const giftCard = await prisma.giftCard.findFirst({
        where: { code: code.toUpperCase() },
      });

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      if (giftCard.status !== 'ACTIVE') {
        throw new Error('Gift card is not active');
      }

      if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
        throw new Error('Gift card has expired');
      }

      if (giftCard.balance < amount) {
        throw new Error('Insufficient gift card balance. Available: ' + giftCard.balance);
      }

      // Create transaction and update balance
      const [transaction, updatedCard] = await prisma.$transaction([
        prisma.giftCardTransaction.create({
          data: {
            giftCardId: giftCard.id,
            type: 'REDEMPTION',
            amount: -amount,
            balance: giftCard.balance - amount,
            orderId,
            userId: userId || null,
            description: 'Redeemed for order ' + orderId,
          },
        }),
        prisma.giftCard.update({
          where: { id: giftCard.id },
          data: {
            balance: { decrement: amount },
            usedAt: giftCard.usedAt || new Date(),
            status: giftCard.balance - amount <= 0 ? 'REDEEMED' : 'ACTIVE',
          },
        }),
      ]);

      return {
        redeemed: true,
        amountRedeemed: amount,
        remainingBalance: updatedCard.balance,
        transactionId: transaction.id,
        orderId,
      };
    `
  },
  // ============================================================================
  // GET BALANCE
  // ============================================================================
  {
    name: "giftcard.getBalance",
    description: "Get detailed gift card information with transaction history",
    category: "giftcard",
    tags: ["giftcard", "balance", "history"],
    icon: "Wallet",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Gift card code"
        },
        includeHistory: {
          type: "boolean",
          description: "Include transaction history",
          default: false
        }
      },
      required: ["code"]
    },
    handler: `
      const { code, includeHistory = false } = input;

      const giftCard = await prisma.giftCard.findFirst({
        where: { code: code.toUpperCase() },
        include: {
          transactions: includeHistory ? {
            orderBy: { createdAt: 'desc' },
            take: 20,
          } : false,
        },
      });

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      return {
        code: giftCard.code,
        balance: giftCard.balance,
        originalAmount: giftCard.originalAmount,
        currency: giftCard.currency,
        status: giftCard.status,
        expiresAt: giftCard.expiresAt,
        activatedAt: giftCard.activatedAt,
        usedAt: giftCard.usedAt,
        transactions: giftCard.transactions?.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balance: t.balance,
          description: t.description,
          orderId: t.orderId,
          createdAt: t.createdAt,
        })) || [],
      };
    `
  },
  // ============================================================================
  // PURCHASE GIFT CARD
  // ============================================================================
  {
    name: "giftcard.purchase",
    description: "Purchase a new gift card",
    category: "giftcard",
    tags: ["giftcard", "purchase", "buy"],
    icon: "ShoppingBag",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Gift card amount",
          minimum: 5,
          maximum: 1e3
        },
        currency: {
          type: "string",
          description: "Currency code",
          default: "USD"
        },
        purchaserId: {
          type: "string",
          description: "Purchaser user ID"
        },
        delivery: {
          type: "string",
          description: "Delivery method",
          enum: ["EMAIL", "PRINT", "PHYSICAL"],
          default: "EMAIL"
        },
        recipientEmail: {
          type: "string",
          description: "Recipient email (for EMAIL delivery)"
        },
        recipientName: {
          type: "string",
          description: "Recipient name"
        },
        senderName: {
          type: "string",
          description: "Sender name"
        },
        message: {
          type: "string",
          description: "Gift message",
          maxLength: 500
        },
        scheduledFor: {
          type: "string",
          description: "Schedule delivery date (ISO 8601)"
        }
      },
      required: ["amount", "purchaserId"]
    },
    handler: `
      const { amount, currency = 'USD', purchaserId, delivery = 'EMAIL', recipientEmail, recipientName, senderName, message, scheduledFor } = input;

      // Generate unique code
      const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
          if (i > 0 && i % 4 === 0) code += '-';
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let code;
      let attempts = 0;
      do {
        code = generateCode();
        const existing = await prisma.giftCard.findFirst({ where: { code } });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error('Failed to generate unique code');
      }

      // Set expiration (1 year from now by default)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const giftCard = await prisma.giftCard.create({
        data: {
          code,
          originalAmount: amount,
          balance: amount,
          currency,
          status: 'ACTIVE',
          purchaserId,
          recipientEmail: recipientEmail || null,
          recipientName: recipientName || null,
          senderName: senderName || null,
          message: message || null,
          delivery,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          expiresAt,
          activatedAt: new Date(),
        },
      });

      // Create initial transaction
      await prisma.giftCardTransaction.create({
        data: {
          giftCardId: giftCard.id,
          type: 'PURCHASE',
          amount: amount,
          balance: amount,
          userId: purchaserId,
          description: 'Gift card purchased',
        },
      });

      return {
        id: giftCard.id,
        code: giftCard.code,
        amount: giftCard.originalAmount,
        currency: giftCard.currency,
        delivery: giftCard.delivery,
        recipientEmail: giftCard.recipientEmail,
        expiresAt: giftCard.expiresAt,
        message: 'Gift card created successfully',
      };
    `
  },
  // ============================================================================
  // SEND GIFT CARD
  // ============================================================================
  {
    name: "giftcard.send",
    description: "Send/resend gift card to recipient",
    category: "giftcard",
    tags: ["giftcard", "send", "email"],
    icon: "Send",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        giftCardId: {
          type: "string",
          description: "Gift card ID"
        },
        code: {
          type: "string",
          description: "Gift card code (alternative to ID)"
        },
        recipientEmail: {
          type: "string",
          description: "Email to send to (override)"
        }
      },
      required: []
    },
    handler: `
      const { giftCardId, code, recipientEmail } = input;

      if (!giftCardId && !code) {
        throw new Error('Either giftCardId or code is required');
      }

      const giftCard = await prisma.giftCard.findFirst({
        where: giftCardId ? { id: giftCardId } : { code: code.toUpperCase() },
      });

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      const email = recipientEmail || giftCard.recipientEmail;
      if (!email) {
        throw new Error('No recipient email available');
      }

      // Note: Actual email sending would be done via email service
      // This just records the send attempt
      await prisma.giftCard.update({
        where: { id: giftCard.id },
        data: {
          recipientEmail: email,
          sentAt: new Date(),
        },
      });

      return {
        sent: true,
        giftCardId: giftCard.id,
        recipientEmail: email,
        code: giftCard.code.substring(0, 4) + '-****-****-' + giftCard.code.slice(-4),
        note: 'Email will be sent via configured email service',
      };
    `
  },
  // ============================================================================
  // REFUND TO GIFT CARD
  // ============================================================================
  {
    name: "giftcard.refund",
    description: "Add balance back to a gift card (for refunds)",
    category: "giftcard",
    tags: ["giftcard", "refund", "balance"],
    icon: "RefreshCw",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Gift card code"
        },
        amount: {
          type: "number",
          description: "Amount to refund",
          minimum: 0.01
        },
        orderId: {
          type: "string",
          description: "Related order ID"
        },
        reason: {
          type: "string",
          description: "Refund reason"
        }
      },
      required: ["code", "amount"]
    },
    handler: `
      const { code, amount, orderId, reason } = input;

      const giftCard = await prisma.giftCard.findFirst({
        where: { code: code.toUpperCase() },
      });

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      const newBalance = giftCard.balance + amount;

      // Cannot exceed original amount
      if (newBalance > giftCard.originalAmount) {
        throw new Error('Refund would exceed original gift card amount');
      }

      const [transaction, updatedCard] = await prisma.$transaction([
        prisma.giftCardTransaction.create({
          data: {
            giftCardId: giftCard.id,
            type: 'REFUND',
            amount: amount,
            balance: newBalance,
            orderId: orderId || null,
            description: reason || 'Refund to gift card',
          },
        }),
        prisma.giftCard.update({
          where: { id: giftCard.id },
          data: {
            balance: newBalance,
            status: 'ACTIVE',
          },
        }),
      ]);

      return {
        refunded: true,
        amountRefunded: amount,
        newBalance: updatedCard.balance,
        transactionId: transaction.id,
      };
    `
  },
  // ============================================================================
  // GET USER GIFT CARDS
  // ============================================================================
  {
    name: "giftcard.getUserCards",
    description: "Get gift cards purchased by or sent to a user",
    category: "giftcard",
    tags: ["giftcard", "user", "list"],
    icon: "CreditCard",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        type: {
          type: "string",
          description: "Filter type",
          enum: ["purchased", "received", "all"],
          default: "all"
        },
        status: {
          type: "string",
          description: "Filter by status",
          enum: ["ACTIVE", "REDEEMED", "EXPIRED", "DISABLED"]
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId, type = 'all', status } = input;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const where = {};

      if (type === 'purchased') {
        where.purchaserId = userId;
      } else if (type === 'received') {
        where.recipientEmail = user.email;
      } else {
        where.OR = [
          { purchaserId: userId },
          { recipientEmail: user.email },
        ];
      }

      if (status) where.status = status;

      const giftCards = await prisma.giftCard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        giftCards: giftCards.map(gc => ({
          id: gc.id,
          code: gc.code.substring(0, 4) + '-****-****-' + gc.code.slice(-4),
          fullCode: gc.purchaserId === userId ? gc.code : undefined,
          balance: gc.balance,
          originalAmount: gc.originalAmount,
          currency: gc.currency,
          status: gc.status,
          isPurchased: gc.purchaserId === userId,
          isReceived: gc.recipientEmail === user.email,
          recipientName: gc.recipientName,
          senderName: gc.senderName,
          expiresAt: gc.expiresAt,
          createdAt: gc.createdAt,
        })),
        total: giftCards.length,
      };
    `
  }
];

// src/lib/plugins/primitives/media.ts
var MEDIA_PRIMITIVES = [
  // ============================================================================
  // LIST MEDIA
  // ============================================================================
  {
    name: "media.list",
    description: "List media files with filtering and pagination",
    category: "media",
    tags: ["media", "files", "images", "storage"],
    icon: "Image",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number",
          default: 1,
          minimum: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 20,
          minimum: 1,
          maximum: 100
        },
        type: {
          type: "string",
          description: "Filter by file type",
          enum: ["image", "video", "audio", "document", "other"]
        },
        folderId: {
          type: "string",
          description: "Filter by folder ID"
        },
        search: {
          type: "string",
          description: "Search by filename"
        },
        sortBy: {
          type: "string",
          description: "Sort field",
          enum: ["name", "size", "createdAt"],
          default: "createdAt"
        },
        sortOrder: {
          type: "string",
          description: "Sort direction",
          enum: ["asc", "desc"],
          default: "desc"
        }
      },
      required: []
    },
    handler: `
      const { page = 1, limit = 20, type, folderId, search, sortBy = 'createdAt', sortOrder = 'desc' } = input;

      const where = { deletedAt: null };

      if (type) {
        const mimePatterns = {
          image: 'image/%',
          video: 'video/%',
          audio: 'audio/%',
          document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats%', 'text/%'],
        };
        if (type !== 'other') {
          const pattern = mimePatterns[type];
          if (Array.isArray(pattern)) {
            where.OR = pattern.map(p => ({ mimeType: { contains: p.replace('%', '') } }));
          } else {
            where.mimeType = { startsWith: pattern.replace('%', '') };
          }
        }
      }

      if (folderId) where.folderId = folderId;
      if (search) where.name = { contains: search, mode: 'insensitive' };

      const [files, total] = await Promise.all([
        prisma.media.findMany({
          where,
          include: {
            folder: { select: { id: true, name: true } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.media.count({ where }),
      ]);

      return {
        files: files.map(f => ({
          id: f.id,
          name: f.name,
          url: f.url,
          thumbnailUrl: f.thumbnailUrl,
          mimeType: f.mimeType,
          size: f.size,
          width: f.width,
          height: f.height,
          alt: f.alt,
          folder: f.folder,
          createdAt: f.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    `
  },
  // ============================================================================
  // GET MEDIA
  // ============================================================================
  {
    name: "media.get",
    description: "Get a single media file by ID",
    category: "media",
    tags: ["media", "files", "storage"],
    icon: "File",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        mediaId: {
          type: "string",
          description: "Media ID"
        }
      },
      required: ["mediaId"]
    },
    handler: `
      const { mediaId } = input;

      const media = await prisma.media.findFirst({
        where: { id: mediaId, deletedAt: null },
        include: {
          folder: { select: { id: true, name: true, path: true } },
        },
      });

      if (!media) {
        throw new Error('Media not found');
      }

      return {
        id: media.id,
        name: media.name,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        mimeType: media.mimeType,
        size: media.size,
        width: media.width,
        height: media.height,
        alt: media.alt,
        caption: media.caption,
        folder: media.folder,
        metadata: media.metadata,
        createdAt: media.createdAt,
        updatedAt: media.updatedAt,
      };
    `
  },
  // ============================================================================
  // GET FOLDERS
  // ============================================================================
  {
    name: "media.getFolders",
    description: "Get media folders for organization",
    category: "media",
    tags: ["media", "folders", "storage"],
    icon: "Folder",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        parentId: {
          type: "string",
          description: "Parent folder ID (null for root)"
        },
        includeFileCount: {
          type: "boolean",
          description: "Include file count per folder",
          default: true
        }
      },
      required: []
    },
    handler: `
      const { parentId, includeFileCount = true } = input;

      const where = {};
      if (parentId === null || parentId === undefined) {
        where.parentId = null;
      } else if (parentId) {
        where.parentId = parentId;
      }

      const folders = await prisma.mediaFolder.findMany({
        where,
        include: {
          _count: includeFileCount ? {
            select: { files: { where: { deletedAt: null } } },
          } : false,
          children: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      return {
        folders: folders.map(f => ({
          id: f.id,
          name: f.name,
          path: f.path,
          fileCount: f._count?.files || 0,
          hasChildren: f.children.length > 0,
          createdAt: f.createdAt,
        })),
        total: folders.length,
      };
    `
  },
  // ============================================================================
  // UPDATE MEDIA
  // ============================================================================
  {
    name: "media.update",
    description: "Update media file metadata (alt text, caption, folder)",
    category: "media",
    tags: ["media", "update", "storage"],
    icon: "Edit",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        mediaId: {
          type: "string",
          description: "Media ID"
        },
        name: {
          type: "string",
          description: "New filename"
        },
        alt: {
          type: "string",
          description: "Alt text for accessibility"
        },
        caption: {
          type: "string",
          description: "Caption/description"
        },
        folderId: {
          type: "string",
          description: "Move to folder"
        }
      },
      required: ["mediaId"]
    },
    handler: `
      const { mediaId, name, alt, caption, folderId } = input;

      const media = await prisma.media.findFirst({
        where: { id: mediaId, deletedAt: null },
      });

      if (!media) {
        throw new Error('Media not found');
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (alt !== undefined) updateData.alt = alt;
      if (caption !== undefined) updateData.caption = caption;
      if (folderId !== undefined) updateData.folderId = folderId || null;

      const updated = await prisma.media.update({
        where: { id: mediaId },
        data: updateData,
        include: {
          folder: { select: { id: true, name: true } },
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        url: updated.url,
        alt: updated.alt,
        caption: updated.caption,
        folder: updated.folder,
        updatedAt: updated.updatedAt,
      };
    `
  },
  // ============================================================================
  // DELETE MEDIA
  // ============================================================================
  {
    name: "media.delete",
    description: "Soft delete a media file",
    category: "media",
    tags: ["media", "delete", "storage"],
    icon: "Trash2",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        mediaId: {
          type: "string",
          description: "Media ID"
        },
        permanent: {
          type: "boolean",
          description: "Permanently delete (cannot be undone)",
          default: false
        }
      },
      required: ["mediaId"]
    },
    handler: `
      const { mediaId, permanent = false } = input;

      const media = await prisma.media.findFirst({
        where: { id: mediaId },
      });

      if (!media) {
        throw new Error('Media not found');
      }

      if (permanent) {
        // Delete from storage (would need to implement storage adapter)
        await prisma.media.delete({ where: { id: mediaId } });
        return { deleted: true, permanent: true, mediaId };
      } else {
        await prisma.media.update({
          where: { id: mediaId },
          data: { deletedAt: new Date() },
        });
        return { deleted: true, permanent: false, mediaId };
      }
    `
  },
  // ============================================================================
  // CREATE FOLDER
  // ============================================================================
  {
    name: "media.createFolder",
    description: "Create a new media folder",
    category: "media",
    tags: ["media", "folders", "storage"],
    icon: "FolderPlus",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Folder name",
          minLength: 1,
          maxLength: 100
        },
        parentId: {
          type: "string",
          description: "Parent folder ID (null for root)"
        }
      },
      required: ["name"]
    },
    handler: `
      const { name, parentId } = input;

      // Build path
      let path = '/' + name;
      if (parentId) {
        const parent = await prisma.mediaFolder.findUnique({ where: { id: parentId } });
        if (!parent) {
          throw new Error('Parent folder not found');
        }
        path = parent.path + '/' + name;
      }

      // Check for duplicate
      const existing = await prisma.mediaFolder.findFirst({
        where: { name, parentId: parentId || null },
      });

      if (existing) {
        throw new Error('Folder with this name already exists');
      }

      const folder = await prisma.mediaFolder.create({
        data: {
          name,
          path,
          parentId: parentId || null,
        },
      });

      return {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
      };
    `
  },
  // ============================================================================
  // GET UPLOAD URL
  // ============================================================================
  {
    name: "media.getUploadUrl",
    description: "Get a presigned URL for direct upload to storage",
    category: "media",
    tags: ["media", "upload", "storage"],
    icon: "Upload",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description: "Original filename"
        },
        mimeType: {
          type: "string",
          description: "File MIME type"
        },
        size: {
          type: "number",
          description: "File size in bytes"
        },
        folderId: {
          type: "string",
          description: "Target folder ID"
        }
      },
      required: ["filename", "mimeType"]
    },
    handler: `
      const { filename, mimeType, size, folderId } = input;

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.some(t => mimeType.startsWith(t.split('/')[0]) || mimeType === t)) {
        throw new Error('File type not allowed');
      }

      // Max size check (50MB default)
      const maxSize = 50 * 1024 * 1024;
      if (size && size > maxSize) {
        throw new Error('File size exceeds maximum allowed (50MB)');
      }

      // Generate unique key
      const ext = filename.split('.').pop() || '';
      const key = 'uploads/' + Date.now() + '-' + Math.random().toString(36).substring(2) + '.' + ext;

      // For now, return placeholder - actual implementation would use S3/R2/local storage
      return {
        uploadUrl: '/api/media/upload',
        method: 'POST',
        key,
        fields: {
          filename,
          mimeType,
          folderId: folderId || null,
        },
        expiresIn: 3600,
        note: 'Use multipart/form-data with file field',
      };
    `
  }
];

// src/lib/plugins/primitives/notification.ts
var NOTIFICATION_PRIMITIVES = [
  // ============================================================================
  // LIST NOTIFICATIONS
  // ============================================================================
  {
    name: "notification.list",
    description: "Get user notifications with filtering",
    category: "notification",
    tags: ["notification", "user", "alerts"],
    icon: "Bell",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        type: {
          type: "string",
          description: "Filter by notification type",
          enum: ["ORDER", "SHIPPING", "PROMOTION", "REVIEW", "SYSTEM", "PRICE_DROP", "BACK_IN_STOCK"]
        },
        unreadOnly: {
          type: "boolean",
          description: "Only unread notifications",
          default: false
        },
        page: {
          type: "number",
          description: "Page number",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 20
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId, type, unreadOnly = false, page = 1, limit = 20 } = input;

      const where = { userId };
      if (type) where.type = type;
      if (unreadOnly) where.readAt = null;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, readAt: null } }),
      ]);

      return {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data,
          actionUrl: n.actionUrl,
          imageUrl: n.imageUrl,
          read: !!n.readAt,
          readAt: n.readAt,
          createdAt: n.createdAt,
        })),
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  },
  // ============================================================================
  // MARK AS READ
  // ============================================================================
  {
    name: "notification.markRead",
    description: "Mark a notification as read",
    category: "notification",
    tags: ["notification", "read", "update"],
    icon: "CheckCircle",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        notificationId: {
          type: "string",
          description: "Notification ID"
        },
        userId: {
          type: "string",
          description: "User ID (for authorization)"
        }
      },
      required: ["notificationId", "userId"]
    },
    handler: `
      const { notificationId, userId } = input;

      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.readAt) {
        return { id: notificationId, alreadyRead: true };
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });

      return { id: notificationId, markedAsRead: true };
    `
  },
  // ============================================================================
  // MARK ALL AS READ
  // ============================================================================
  {
    name: "notification.markAllRead",
    description: "Mark all notifications as read for a user",
    category: "notification",
    tags: ["notification", "read", "bulk"],
    icon: "CheckCheck",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        type: {
          type: "string",
          description: "Only mark specific type as read",
          enum: ["ORDER", "SHIPPING", "PROMOTION", "REVIEW", "SYSTEM", "PRICE_DROP", "BACK_IN_STOCK"]
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId, type } = input;

      const where = { userId, readAt: null };
      if (type) where.type = type;

      const result = await prisma.notification.updateMany({
        where,
        data: { readAt: new Date() },
      });

      return {
        markedAsRead: result.count,
        userId,
        type: type || 'all',
      };
    `
  },
  // ============================================================================
  // DELETE NOTIFICATION
  // ============================================================================
  {
    name: "notification.delete",
    description: "Delete a notification",
    category: "notification",
    tags: ["notification", "delete"],
    icon: "Trash2",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        notificationId: {
          type: "string",
          description: "Notification ID"
        },
        userId: {
          type: "string",
          description: "User ID (for authorization)"
        }
      },
      required: ["notificationId", "userId"]
    },
    handler: `
      const { notificationId, userId } = input;

      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await prisma.notification.delete({ where: { id: notificationId } });

      return { deleted: true, notificationId };
    `
  },
  // ============================================================================
  // GET UNREAD COUNT
  // ============================================================================
  {
    name: "notification.getUnreadCount",
    description: "Get count of unread notifications",
    category: "notification",
    tags: ["notification", "count", "badge"],
    icon: "Hash",
    timeout: 2e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId } = input;

      const count = await prisma.notification.count({
        where: { userId, readAt: null },
      });

      return { userId, unreadCount: count };
    `
  },
  // ============================================================================
  // CREATE NOTIFICATION (Admin/System)
  // ============================================================================
  {
    name: "notification.create",
    description: "Create a new notification for a user",
    category: "notification",
    tags: ["notification", "create", "admin"],
    icon: "BellPlus",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "Target user ID"
        },
        type: {
          type: "string",
          description: "Notification type",
          enum: ["ORDER", "SHIPPING", "PROMOTION", "REVIEW", "SYSTEM", "PRICE_DROP", "BACK_IN_STOCK"]
        },
        title: {
          type: "string",
          description: "Notification title",
          maxLength: 200
        },
        message: {
          type: "string",
          description: "Notification message",
          maxLength: 1e3
        },
        actionUrl: {
          type: "string",
          description: "URL to navigate when clicked"
        },
        imageUrl: {
          type: "string",
          description: "Image URL to display"
        },
        data: {
          type: "object",
          description: "Additional data (orderId, productId, etc.)"
        }
      },
      required: ["userId", "type", "title", "message"]
    },
    handler: `
      const { userId, type, title, message, actionUrl, imageUrl, data } = input;

      // Verify user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          actionUrl: actionUrl || null,
          imageUrl: imageUrl || null,
          data: data || {},
        },
      });

      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        createdAt: notification.createdAt,
      };
    `
  },
  // ============================================================================
  // GET NOTIFICATION PREFERENCES
  // ============================================================================
  {
    name: "notification.getPreferences",
    description: "Get user notification preferences",
    category: "notification",
    tags: ["notification", "preferences", "settings"],
    icon: "Settings",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId } = input;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Default preferences if not set
      const defaults = {
        orderUpdates: true,
        shippingUpdates: true,
        promotions: true,
        priceDrops: true,
        backInStock: true,
        reviewReminders: true,
        emailNotifications: true,
        pushNotifications: false,
      };

      return {
        userId,
        preferences: { ...defaults, ...(user.notificationPreferences || {}) },
      };
    `
  },
  // ============================================================================
  // UPDATE NOTIFICATION PREFERENCES
  // ============================================================================
  {
    name: "notification.updatePreferences",
    description: "Update user notification preferences",
    category: "notification",
    tags: ["notification", "preferences", "settings"],
    icon: "Settings2",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        preferences: {
          type: "object",
          description: "Preference settings to update",
          properties: {
            orderUpdates: { type: "boolean" },
            shippingUpdates: { type: "boolean" },
            promotions: { type: "boolean" },
            priceDrops: { type: "boolean" },
            backInStock: { type: "boolean" },
            reviewReminders: { type: "boolean" },
            emailNotifications: { type: "boolean" },
            pushNotifications: { type: "boolean" }
          }
        }
      },
      required: ["userId", "preferences"]
    },
    handler: `
      const { userId, preferences } = input;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: {
            ...(user.notificationPreferences || {}),
            ...preferences,
          },
        },
        select: { notificationPreferences: true },
      });

      return {
        userId,
        preferences: updated.notificationPreferences,
        updated: true,
      };
    `
  }
];

// src/lib/plugins/primitives/order.ts
var ORDER_PRIMITIVES = [
  // ============================================================================
  // ORDER MANAGEMENT PRIMITIVES
  // ============================================================================
  {
    name: "order.create",
    description: "Create a new order from cart or direct product purchase. Calculates totals, applies discounts, and initializes order workflow.",
    category: "order",
    tags: ["order", "create", "checkout", "e-commerce"],
    icon: "ShoppingBag",
    timeout: 3e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Optional customer ID for logged-in users"
        },
        email: {
          type: "string",
          description: "Customer email address (required)"
        },
        items: {
          type: "array",
          description: "Array of order items with productId, variantId, quantity",
          items: {
            type: "object",
            properties: {
              productId: { type: "string" },
              variantId: { type: "string" },
              quantity: { type: "number" }
            },
            required: ["productId", "quantity"]
          }
        },
        shippingAddressId: {
          type: "string",
          description: "ID of the shipping address"
        },
        billingAddressId: {
          type: "string",
          description: "ID of the billing address"
        },
        discountCode: {
          type: "string",
          description: "Optional discount code to apply"
        },
        customerNotes: {
          type: "string",
          description: "Optional notes from customer"
        }
      },
      required: ["email", "items"]
    },
    handler: `
      const { prisma } = await import('../../db');
      const { generateOrderNumber } = await import('../../orders');

      // Validate items and get product info
      const orderItems = [];
      let subtotal = 0;

      for (const item of args.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });

        if (!product) {
          throw new Error('Product not found: ' + item.productId);
        }

        const variant = item.variantId
          ? product.variants.find(v => v.id === item.variantId)
          : null;

        const price = variant?.price ?? product.price;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product.id,
          variantId: variant?.id,
          title: product.title,
          variantTitle: variant?.title,
          sku: variant?.sku || product.sku,
          quantity: item.quantity,
          price: price,
          total: itemTotal,
        });
      }

      // Apply discount if provided
      let discountTotal = 0;
      let discountCodeId = null;

      if (args.discountCode) {
        const discount = await prisma.discountCode.findUnique({
          where: { code: args.discountCode, enabled: true },
        });

        if (discount) {
          if (discount.type === 'PERCENTAGE') {
            discountTotal = Math.floor(subtotal * discount.value / 100);
            if (discount.maxDiscount) {
              discountTotal = Math.min(discountTotal, discount.maxDiscount);
            }
          } else {
            discountTotal = discount.value;
          }
          discountCodeId = discount.id;
        }
      }

      const total = subtotal - discountTotal;

      // Create order with items
      const order = await prisma.order.create({
        data: {
          orderNumber: await generateOrderNumber(),
          customerId: args.customerId,
          email: args.email,
          status: 'PENDING',
          subtotal,
          discountTotal,
          total,
          discountCodeId,
          shippingAddressId: args.shippingAddressId,
          billingAddressId: args.billingAddressId,
          customerNotes: args.customerNotes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          itemCount: order.items.length,
        },
      };
    `
  },
  {
    name: "order.get",
    description: "Get order details by ID or order number. Includes items, shipments, and workflow progress.",
    category: "order",
    tags: ["order", "get", "details", "e-commerce"],
    icon: "FileText",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Order ID"
        },
        orderNumber: {
          type: "string",
          description: "Order number (alternative to orderId)"
        },
        includeItems: {
          type: "boolean",
          description: "Include order items (default: true)",
          default: true
        },
        includeShipments: {
          type: "boolean",
          description: "Include shipment info (default: true)",
          default: true
        },
        includeProgress: {
          type: "boolean",
          description: "Include workflow progress (default: false)",
          default: false
        }
      }
    },
    handler: `
      const { prisma } = await import('../../db');

      if (!args.orderId && !args.orderNumber) {
        throw new Error('Either orderId or orderNumber is required');
      }

      const where = args.orderId
        ? { id: args.orderId }
        : { orderNumber: args.orderNumber };

      const order = await prisma.order.findUnique({
        where,
        include: {
          items: args.includeItems !== false ? {
            include: {
              product: { select: { id: true, title: true, slug: true } },
              variant: { select: { id: true, title: true } },
            },
          } : false,
          shipments: args.includeShipments !== false,
          progress: args.includeProgress ? {
            include: { stage: true },
            orderBy: { enteredAt: 'desc' },
          } : false,
          customer: { select: { id: true, name: true, email: true } },
          shippingAddress: true,
          billingAddress: true,
          workflow: args.includeProgress ? { include: { stages: true } } : false,
        },
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      return { success: true, order };
    `
  },
  {
    name: "order.list",
    description: "List orders with filtering, pagination, and sorting options.",
    category: "order",
    tags: ["order", "list", "search", "e-commerce"],
    icon: "List",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Filter by customer ID"
        },
        email: {
          type: "string",
          description: "Filter by customer email"
        },
        status: {
          type: "string",
          description: "Filter by order status",
          enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]
        },
        paymentStatus: {
          type: "string",
          description: "Filter by payment status",
          enum: ["UNPAID", "PAID", "PARTIALLY_REFUNDED", "REFUNDED"]
        },
        dateFrom: {
          type: "string",
          description: "Filter orders from this date (ISO string)"
        },
        dateTo: {
          type: "string",
          description: "Filter orders up to this date (ISO string)"
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page (default: 20, max: 100)",
          default: 20
        },
        sortBy: {
          type: "string",
          description: "Sort field",
          enum: ["createdAt", "updatedAt", "total", "orderNumber"],
          default: "createdAt"
        },
        sortOrder: {
          type: "string",
          description: "Sort direction",
          enum: ["asc", "desc"],
          default: "desc"
        }
      }
    },
    handler: `
      const { prisma } = await import('../../db');

      const page = Math.max(1, args.page || 1);
      const limit = Math.min(100, Math.max(1, args.limit || 20));
      const skip = (page - 1) * limit;

      const where = {};

      if (args.customerId) where.customerId = args.customerId;
      if (args.email) where.email = { contains: args.email, mode: 'insensitive' };
      if (args.status) where.status = args.status;
      if (args.paymentStatus) where.paymentStatus = args.paymentStatus;

      if (args.dateFrom || args.dateTo) {
        where.createdAt = {};
        if (args.dateFrom) where.createdAt.gte = new Date(args.dateFrom);
        if (args.dateTo) where.createdAt.lte = new Date(args.dateTo);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [args.sortBy || 'createdAt']: args.sortOrder || 'desc' },
          include: {
            items: { select: { id: true, title: true, quantity: true, total: true } },
            customer: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  },
  {
    name: "order.updateStatus",
    description: "Update order status with optional notes and notification trigger.",
    category: "order",
    tags: ["order", "status", "update", "e-commerce"],
    icon: "RefreshCw",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Order ID to update"
        },
        status: {
          type: "string",
          description: "New order status",
          enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]
        },
        internalNotes: {
          type: "string",
          description: "Internal notes for this status change"
        },
        notifyCustomer: {
          type: "boolean",
          description: "Send notification to customer (default: true)",
          default: true
        },
        updatedById: {
          type: "string",
          description: "User ID who made the change"
        }
      },
      required: ["orderId", "status"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const previousStatus = order.status;

      const updated = await prisma.order.update({
        where: { id: args.orderId },
        data: {
          status: args.status,
          internalNotes: args.internalNotes
            ? (order.internalNotes ? order.internalNotes + '\\n' : '') +
              '[' + new Date().toISOString() + '] Status: ' + args.status + ' - ' + args.internalNotes
            : order.internalNotes,
        },
      });

      // TODO: Trigger notification if notifyCustomer is true

      return {
        success: true,
        order: {
          id: updated.id,
          orderNumber: updated.orderNumber,
          previousStatus,
          newStatus: updated.status,
        },
      };
    `
  },
  {
    name: "order.cancel",
    description: "Cancel an order. Restores inventory, voids payment if applicable, and updates status.",
    category: "order",
    tags: ["order", "cancel", "void", "e-commerce"],
    icon: "XCircle",
    timeout: 3e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Order ID to cancel"
        },
        reason: {
          type: "string",
          description: "Reason for cancellation"
        },
        restoreInventory: {
          type: "boolean",
          description: "Restore product inventory (default: true)",
          default: true
        },
        notifyCustomer: {
          type: "boolean",
          description: "Send cancellation notification (default: true)",
          default: true
        },
        cancelledById: {
          type: "string",
          description: "User ID who cancelled"
        }
      },
      required: ["orderId", "reason"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'CANCELLED') {
        throw new Error('Order is already cancelled');
      }

      if (order.status === 'DELIVERED') {
        throw new Error('Cannot cancel a delivered order. Use refund instead.');
      }

      // Restore inventory if requested
      if (args.restoreInventory !== false) {
        for (const item of order.items) {
          if (item.variantId) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { inventory: { increment: item.quantity } },
            });
          } else {
            await prisma.product.update({
              where: { id: item.productId },
              data: { inventory: { increment: item.quantity } },
            });
          }
        }
      }

      const updated = await prisma.order.update({
        where: { id: args.orderId },
        data: {
          status: 'CANCELLED',
          internalNotes: (order.internalNotes ? order.internalNotes + '\\n' : '') +
            '[' + new Date().toISOString() + '] CANCELLED: ' + args.reason,
        },
      });

      return {
        success: true,
        order: {
          id: updated.id,
          orderNumber: updated.orderNumber,
          status: updated.status,
          reason: args.reason,
          inventoryRestored: args.restoreInventory !== false,
        },
      };
    `
  },
  {
    name: "order.refund",
    description: "Process a refund for an order. Supports full or partial refunds with optional inventory restoration.",
    category: "order",
    tags: ["order", "refund", "payment", "e-commerce"],
    icon: "RotateCcw",
    timeout: 3e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Order ID to refund"
        },
        amount: {
          type: "number",
          description: "Refund amount in cents. If not provided, full refund."
        },
        reason: {
          type: "string",
          description: "Reason for refund"
        },
        items: {
          type: "array",
          description: "Specific items to refund (for partial refunds)",
          items: {
            type: "object",
            properties: {
              orderItemId: { type: "string" },
              quantity: { type: "number" }
            },
            required: ["orderItemId", "quantity"]
          }
        },
        restoreInventory: {
          type: "boolean",
          description: "Restore inventory for refunded items",
          default: true
        },
        processStripeRefund: {
          type: "boolean",
          description: "Process refund through Stripe (default: true)",
          default: true
        },
        refundedById: {
          type: "string",
          description: "User ID who processed refund"
        }
      },
      required: ["orderId", "reason"]
    },
    handler: `
      const { prisma } = await import('../../db');

      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'PARTIALLY_REFUNDED') {
        throw new Error('Order must be paid to process refund');
      }

      const refundAmount = args.amount || order.total;

      // Process Stripe refund if applicable
      let stripeRefundId = null;
      if (args.processStripeRefund !== false && order.stripePaymentIntentId) {
        try {
          const stripe = (await import('../../stripe')).stripe;
          const refund = await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            amount: refundAmount,
            reason: 'requested_by_customer',
          });
          stripeRefundId = refund.id;
        } catch (err) {
          throw new Error('Stripe refund failed: ' + err.message);
        }
      }

      // Update order status
      const isFullRefund = refundAmount >= order.total;
      const updated = await prisma.order.update({
        where: { id: args.orderId },
        data: {
          status: isFullRefund ? 'REFUNDED' : order.status,
          paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          internalNotes: (order.internalNotes ? order.internalNotes + '\\n' : '') +
            '[' + new Date().toISOString() + '] REFUND: $' + (refundAmount / 100).toFixed(2) +
            ' - ' + args.reason + (stripeRefundId ? ' (Stripe: ' + stripeRefundId + ')' : ''),
        },
      });

      return {
        success: true,
        refund: {
          orderId: updated.id,
          orderNumber: updated.orderNumber,
          amount: refundAmount,
          isFullRefund,
          stripeRefundId,
          newPaymentStatus: updated.paymentStatus,
        },
      };
    `
  },
  {
    name: "order.getTracking",
    description: "Get tracking information for an order including shipment status and history.",
    category: "order",
    tags: ["order", "tracking", "shipment", "e-commerce"],
    icon: "Truck",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Order ID"
        },
        orderNumber: {
          type: "string",
          description: "Order number (alternative to orderId)"
        }
      }
    },
    handler: `
      const { prisma } = await import('../../db');

      if (!args.orderId && !args.orderNumber) {
        throw new Error('Either orderId or orderNumber is required');
      }

      const where = args.orderId
        ? { id: args.orderId }
        : { orderNumber: args.orderNumber };

      const order = await prisma.order.findUnique({
        where,
        include: {
          shipments: true,
          progress: {
            include: { stage: true },
            orderBy: { enteredAt: 'desc' },
          },
          workflow: {
            include: {
              stages: { orderBy: { position: 'asc' } },
            },
          },
        },
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Get current stage from workflow
      const currentProgress = order.progress[0];
      const stages = order.workflow?.stages || [];
      const currentStageIndex = currentProgress
        ? stages.findIndex(s => s.id === currentProgress.stageId)
        : -1;

      return {
        success: true,
        tracking: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderStatus: order.status,
          shipments: order.shipments.map(s => ({
            id: s.id,
            carrier: s.carrier,
            service: s.service,
            trackingNumber: s.trackingNumber,
            trackingUrl: s.trackingUrl,
            status: s.status,
            shippedAt: s.shippedAt,
            deliveredAt: s.deliveredAt,
          })),
          workflow: order.workflow ? {
            name: order.workflow.name,
            currentStage: currentProgress?.stage ? {
              name: currentProgress.stage.displayName,
              message: currentProgress.stage.customerMessage,
              icon: currentProgress.stage.icon,
              color: currentProgress.stage.color,
              enteredAt: currentProgress.enteredAt,
            } : null,
            stages: stages.map((s, i) => ({
              name: s.displayName,
              icon: s.icon,
              color: s.color,
              isComplete: i < currentStageIndex,
              isCurrent: i === currentStageIndex,
              isPending: i > currentStageIndex,
            })),
          } : null,
          history: order.progress.map(p => ({
            stage: p.stage.displayName,
            enteredAt: p.enteredAt,
            exitedAt: p.exitedAt,
            source: p.source,
          })),
        },
      };
    `
  },
  {
    name: "order.reorder",
    description: "Create a new order based on a previous order. Validates product availability and current prices.",
    category: "order",
    tags: ["order", "reorder", "repeat", "e-commerce"],
    icon: "Copy",
    timeout: 3e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Original order ID to reorder from"
        },
        customerId: {
          type: "string",
          description: "Customer ID (uses original if not provided)"
        },
        email: {
          type: "string",
          description: "Email (uses original if not provided)"
        },
        shippingAddressId: {
          type: "string",
          description: "Shipping address (uses original if not provided)"
        },
        skipUnavailable: {
          type: "boolean",
          description: "Skip unavailable items instead of failing (default: false)",
          default: false
        }
      },
      required: ["orderId"]
    },
    handler: `
      const { prisma } = await import('../../db');
      const { generateOrderNumber } = await import('../../orders');

      const originalOrder = await prisma.order.findUnique({
        where: { id: args.orderId },
        include: { items: true },
      });

      if (!originalOrder) {
        throw new Error('Original order not found');
      }

      // Validate items are still available
      const validItems = [];
      const unavailableItems = [];
      let subtotal = 0;

      for (const item of originalOrder.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });

        if (!product || product.status !== 'ACTIVE') {
          unavailableItems.push({ title: item.title, reason: 'Product no longer available' });
          continue;
        }

        const variant = item.variantId
          ? product.variants.find(v => v.id === item.variantId)
          : null;

        if (item.variantId && !variant) {
          unavailableItems.push({ title: item.title, reason: 'Variant no longer available' });
          continue;
        }

        const currentPrice = variant?.price ?? product.price;
        const itemTotal = currentPrice * item.quantity;
        subtotal += itemTotal;

        validItems.push({
          productId: product.id,
          variantId: variant?.id,
          title: product.title,
          variantTitle: variant?.title,
          sku: variant?.sku || product.sku,
          quantity: item.quantity,
          price: currentPrice,
          total: itemTotal,
        });
      }

      if (validItems.length === 0) {
        throw new Error('No items available for reorder');
      }

      if (unavailableItems.length > 0 && !args.skipUnavailable) {
        return {
          success: false,
          error: 'Some items are unavailable',
          unavailableItems,
        };
      }

      // Create new order
      const newOrder = await prisma.order.create({
        data: {
          orderNumber: await generateOrderNumber(),
          customerId: args.customerId || originalOrder.customerId,
          email: args.email || originalOrder.email,
          status: 'PENDING',
          subtotal,
          total: subtotal,
          shippingAddressId: args.shippingAddressId || originalOrder.shippingAddressId,
          billingAddressId: originalOrder.billingAddressId,
          items: {
            create: validItems,
          },
        },
        include: { items: true },
      });

      return {
        success: true,
        order: {
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          total: newOrder.total,
          itemCount: newOrder.items.length,
        },
        originalOrderId: originalOrder.id,
        unavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined,
      };
    `
  }
];

// src/lib/plugins/primitives/payment.ts
var PAYMENT_PRIMITIVES = [
  // ============================================================================
  // PAYMENT PRIMITIVES
  // ============================================================================
  {
    name: "payment.createIntent",
    description: "Create a Stripe Payment Intent for custom payment flows. Returns client secret for frontend integration.",
    category: "payment",
    tags: ["payment", "stripe", "intent", "checkout"],
    icon: "CreditCard",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Amount in cents (e.g., 1000 = $10.00)"
        },
        currency: {
          type: "string",
          description: "Currency code (default: USD)",
          default: "USD"
        },
        orderId: {
          type: "string",
          description: "Order ID to associate with payment"
        },
        customerId: {
          type: "string",
          description: "Stripe customer ID (optional)"
        },
        captureMethod: {
          type: "string",
          description: "Capture method",
          enum: ["automatic", "manual"],
          default: "automatic"
        },
        metadata: {
          type: "object",
          description: "Additional metadata to store with payment"
        }
      },
      required: ["amount"]
    },
    handler: `
      const { createPaymentIntent } = await import('../../stripe');

      const result = await createPaymentIntent({
        amount: args.amount,
        currency: args.currency || 'USD',
        orderId: args.orderId,
        customerId: args.customerId,
        captureMethod: args.captureMethod,
        metadata: args.metadata,
      });

      return {
        success: true,
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        status: result.status,
      };
    `
  },
  {
    name: "payment.createCheckout",
    description: "Create a Stripe Checkout Session for hosted payment page. Returns URL to redirect customer.",
    category: "payment",
    tags: ["payment", "stripe", "checkout", "session"],
    icon: "ShoppingCart",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "Line items for checkout",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              price: { type: "number", description: "Price in cents" },
              quantity: { type: "number" },
              images: { type: "array", items: { type: "string" } },
              productId: { type: "string" },
              stripePriceId: { type: "string" }
            },
            required: ["name", "price", "quantity"]
          }
        },
        successUrl: {
          type: "string",
          description: "URL to redirect on success"
        },
        cancelUrl: {
          type: "string",
          description: "URL to redirect on cancel"
        },
        customerEmail: {
          type: "string",
          description: "Pre-fill customer email"
        },
        customerId: {
          type: "string",
          description: "Existing Stripe customer ID"
        },
        orderId: {
          type: "string",
          description: "Order ID to associate"
        },
        mode: {
          type: "string",
          description: "Checkout mode",
          enum: ["payment", "subscription", "setup"],
          default: "payment"
        },
        allowPromotionCodes: {
          type: "boolean",
          description: "Allow promotion codes",
          default: false
        },
        shippingAddressCollection: {
          type: "boolean",
          description: "Collect shipping address"
        },
        shippingOptions: {
          type: "array",
          description: "Shipping rate options",
          items: {
            type: "object",
            properties: {
              displayName: { type: "string" },
              amount: { type: "number" },
              deliveryEstimate: { type: "object" }
            }
          }
        },
        metadata: {
          type: "object",
          description: "Additional metadata"
        }
      },
      required: ["items", "successUrl", "cancelUrl"]
    },
    handler: `
      const { createCheckoutSession } = await import('../../stripe');

      const result = await createCheckoutSession({
        items: args.items,
        successUrl: args.successUrl,
        cancelUrl: args.cancelUrl,
        customerEmail: args.customerEmail,
        customerId: args.customerId,
        orderId: args.orderId,
        mode: args.mode,
        allowPromotionCodes: args.allowPromotionCodes,
        shippingAddressCollection: args.shippingAddressCollection,
        shippingOptions: args.shippingOptions,
        metadata: args.metadata,
      });

      return {
        success: true,
        sessionId: result.sessionId,
        url: result.url,
      };
    `
  },
  {
    name: "payment.confirm",
    description: "Confirm and capture a payment intent (for manual capture mode).",
    category: "payment",
    tags: ["payment", "stripe", "capture", "confirm"],
    icon: "CheckCircle",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        paymentIntentId: {
          type: "string",
          description: "Payment Intent ID to capture"
        },
        amount: {
          type: "number",
          description: "Amount to capture in cents (optional, captures full amount if not provided)"
        }
      },
      required: ["paymentIntentId"]
    },
    handler: `
      const { capturePaymentIntent } = await import('../../stripe');

      const result = await capturePaymentIntent(args.paymentIntentId, args.amount);

      return {
        success: true,
        paymentIntentId: result.paymentIntentId,
        status: result.status,
      };
    `
  },
  {
    name: "payment.refund",
    description: "Create a refund for a payment. Supports full or partial refunds.",
    category: "payment",
    tags: ["payment", "stripe", "refund"],
    icon: "RotateCcw",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        paymentIntentId: {
          type: "string",
          description: "Payment Intent ID to refund"
        },
        amount: {
          type: "number",
          description: "Refund amount in cents (optional, full refund if not provided)"
        },
        reason: {
          type: "string",
          description: "Reason for refund",
          enum: ["duplicate", "fraudulent", "requested_by_customer"]
        },
        metadata: {
          type: "object",
          description: "Additional metadata"
        }
      },
      required: ["paymentIntentId"]
    },
    handler: `
      const { createRefund } = await import('../../stripe');

      const result = await createRefund({
        paymentIntentId: args.paymentIntentId,
        amount: args.amount,
        reason: args.reason,
        metadata: args.metadata,
      });

      return {
        success: true,
        refundId: result.refundId,
        status: result.status,
        amount: result.amount,
        isFullRefund: !args.amount,
      };
    `
  },
  {
    name: "payment.getPaymentMethods",
    description: "List saved payment methods for a Stripe customer.",
    category: "payment",
    tags: ["payment", "stripe", "methods", "customer"],
    icon: "Wallet",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Stripe customer ID"
        },
        type: {
          type: "string",
          description: "Payment method type",
          enum: ["card", "us_bank_account"],
          default: "card"
        }
      },
      required: ["customerId"]
    },
    handler: `
      const { listPaymentMethods } = await import('../../stripe');

      const methods = await listPaymentMethods(args.customerId, args.type || 'card');

      return {
        success: true,
        paymentMethods: methods.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          } : null,
          billingDetails: {
            name: pm.billing_details?.name,
            email: pm.billing_details?.email,
          },
        })),
        count: methods.length,
      };
    `
  },
  {
    name: "payment.createCustomer",
    description: "Create or get a Stripe customer. Returns customer ID for future payments.",
    category: "payment",
    tags: ["payment", "stripe", "customer", "create"],
    icon: "UserPlus",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Customer email address"
        },
        name: {
          type: "string",
          description: "Customer name"
        },
        phone: {
          type: "string",
          description: "Customer phone number"
        },
        address: {
          type: "object",
          description: "Customer address",
          properties: {
            line1: { type: "string" },
            line2: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            postalCode: { type: "string" },
            country: { type: "string" }
          }
        },
        metadata: {
          type: "object",
          description: "Additional metadata"
        },
        getExisting: {
          type: "boolean",
          description: "Return existing customer if email matches (default: true)",
          default: true
        }
      },
      required: ["email"]
    },
    handler: `
      const { createCustomer, getOrCreateCustomer } = await import('../../stripe');

      let customerId;

      if (args.getExisting !== false) {
        customerId = await getOrCreateCustomer(args.email, args.name);
      } else {
        customerId = await createCustomer({
          email: args.email,
          name: args.name,
          phone: args.phone,
          address: args.address,
          metadata: args.metadata,
        });
      }

      return {
        success: true,
        customerId,
      };
    `
  },
  {
    name: "payment.getInvoices",
    description: "List invoices for a Stripe customer.",
    category: "payment",
    tags: ["payment", "stripe", "invoices", "billing"],
    icon: "FileText",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Stripe customer ID"
        },
        limit: {
          type: "number",
          description: "Max invoices to return (default: 10)",
          default: 10
        }
      },
      required: ["customerId"]
    },
    handler: `
      const { listInvoices } = await import('../../stripe');

      const invoices = await listInvoices(args.customerId, args.limit || 10);

      return {
        success: true,
        invoices: invoices.map(inv => ({
          id: inv.id,
          number: inv.number,
          status: inv.status,
          amountDue: inv.amount_due,
          amountPaid: inv.amount_paid,
          currency: inv.currency,
          created: new Date(inv.created * 1000).toISOString(),
          dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
          pdfUrl: inv.invoice_pdf,
          hostedUrl: inv.hosted_invoice_url,
        })),
        count: invoices.length,
      };
    `
  },
  {
    name: "payment.createBillingPortal",
    description: "Create a Stripe Billing Portal session for customer self-service.",
    category: "payment",
    tags: ["payment", "stripe", "portal", "subscription"],
    icon: "Settings",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Stripe customer ID"
        },
        returnUrl: {
          type: "string",
          description: "URL to return to after portal session"
        }
      },
      required: ["customerId", "returnUrl"]
    },
    handler: `
      const { createBillingPortalSession } = await import('../../stripe');

      const url = await createBillingPortalSession(args.customerId, args.returnUrl);

      return {
        success: true,
        url,
      };
    `
  }
];

// src/lib/plugins/primitives/product.ts
var PRODUCT_PRIMITIVES = [
  // ============================================================================
  // PRODUCT LISTING
  // ============================================================================
  {
    name: "product.list",
    description: "List products with pagination, filtering, and sorting options",
    category: "product",
    tags: ["product", "catalog", "list", "storefront"],
    icon: "Package",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number (1-based)",
          default: 1,
          minimum: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 20,
          minimum: 1,
          maximum: 100
        },
        categoryId: {
          type: "string",
          description: "Filter by category ID"
        },
        status: {
          type: "string",
          description: "Filter by status",
          enum: ["ACTIVE", "DRAFT", "ARCHIVED"]
        },
        featured: {
          type: "boolean",
          description: "Filter to featured products only"
        },
        minPrice: {
          type: "number",
          description: "Minimum price filter",
          minimum: 0
        },
        maxPrice: {
          type: "number",
          description: "Maximum price filter",
          minimum: 0
        },
        sortBy: {
          type: "string",
          description: "Sort field",
          enum: ["name", "price", "createdAt", "updatedAt"],
          default: "createdAt"
        },
        sortOrder: {
          type: "string",
          description: "Sort direction",
          enum: ["asc", "desc"],
          default: "desc"
        },
        includeVariants: {
          type: "boolean",
          description: "Include product variants in response",
          default: false
        }
      },
      required: []
    },
    handler: `
      const { page = 1, limit = 20, categoryId, status, featured, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', includeVariants = false } = input;

      const where = { deletedAt: null };
      if (categoryId) where.categoryId = categoryId;
      if (status) where.status = status;
      if (featured !== undefined) where.featured = featured;
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.basePrice = {};
        if (minPrice !== undefined) where.basePrice.gte = minPrice;
        if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            variants: includeVariants ? {
              where: { deletedAt: null },
              select: { id: true, name: true, sku: true, price: true, stock: true, options: true }
            } : false,
            images: { select: { id: true, url: true, alt: true }, orderBy: { order: 'asc' }, take: 1 },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.shortDescription || p.description?.substring(0, 200),
          price: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          featured: p.featured,
          status: p.status,
          category: p.category,
          image: p.images[0] || null,
          variants: p.variants || [],
          variantCount: includeVariants ? p.variants?.length : undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    `
  },
  // ============================================================================
  // GET SINGLE PRODUCT
  // ============================================================================
  {
    name: "product.get",
    description: "Get detailed product information by ID or slug",
    category: "product",
    tags: ["product", "catalog", "detail", "storefront"],
    icon: "PackageSearch",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product ID"
        },
        slug: {
          type: "string",
          description: "Product slug (alternative to ID)"
        },
        includeRelated: {
          type: "boolean",
          description: "Include related products",
          default: false
        }
      },
      required: []
    },
    handler: `
      const { productId, slug, includeRelated = false } = input;

      if (!productId && !slug) {
        throw new Error('Either productId or slug is required');
      }

      const where = productId ? { id: productId } : { slug };
      where.deletedAt = null;

      const product = await prisma.product.findFirst({
        where,
        include: {
          category: true,
          variants: {
            where: { deletedAt: null },
            include: {
              images: { orderBy: { order: 'asc' } },
            },
            orderBy: { order: 'asc' },
          },
          images: { orderBy: { order: 'asc' } },
          reviews: {
            where: { status: 'APPROVED' },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Calculate average rating
      const reviewStats = await prisma.productReview.aggregate({
        where: { productId: product.id, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { rating: true },
      });

      let related = [];
      if (includeRelated && product.categoryId) {
        related = await prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: product.id },
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            images: { take: 1, orderBy: { order: 'asc' } },
          },
          take: 4,
        });
      }

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        sku: product.sku,
        featured: product.featured,
        status: product.status,
        category: product.category,
        variants: product.variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          options: v.options,
          images: v.images,
        })),
        images: product.images,
        reviews: product.reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          author: r.user?.name || 'Anonymous',
          createdAt: r.createdAt,
        })),
        rating: {
          average: reviewStats._avg.rating || 0,
          count: reviewStats._count.rating || 0,
        },
        related,
        metadata: product.metadata,
        seo: {
          title: product.seoTitle || product.name,
          description: product.seoDescription || product.shortDescription,
        },
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    `
  },
  // ============================================================================
  // SEARCH PRODUCTS
  // ============================================================================
  {
    name: "product.search",
    description: "Full-text search across products",
    category: "product",
    tags: ["product", "search", "catalog", "storefront"],
    icon: "Search",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
          minLength: 2
        },
        page: {
          type: "number",
          description: "Page number",
          default: 1,
          minimum: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 20,
          minimum: 1,
          maximum: 50
        },
        categoryId: {
          type: "string",
          description: "Filter by category"
        },
        minPrice: {
          type: "number",
          description: "Minimum price"
        },
        maxPrice: {
          type: "number",
          description: "Maximum price"
        }
      },
      required: ["query"]
    },
    handler: `
      const { query, page = 1, limit = 20, categoryId, minPrice, maxPrice } = input;

      const searchTerms = query.toLowerCase().split(/\\s+/).filter(t => t.length >= 2);

      const where = {
        status: 'ACTIVE',
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: searchTerms } },
        ],
      };

      if (categoryId) where.categoryId = categoryId;
      if (minPrice !== undefined) where.basePrice = { ...where.basePrice, gte: minPrice };
      if (maxPrice !== undefined) where.basePrice = { ...where.basePrice, lte: maxPrice };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { take: 1, orderBy: { order: 'asc' } },
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        query,
        results: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.shortDescription || p.description?.substring(0, 150),
          price: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          category: p.category,
          image: p.images[0] || null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    `
  },
  // ============================================================================
  // GET BY CATEGORY
  // ============================================================================
  {
    name: "product.getByCategory",
    description: "Get products by category with optional subcategory traversal",
    category: "product",
    tags: ["product", "category", "catalog", "storefront"],
    icon: "FolderTree",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        categoryId: {
          type: "string",
          description: "Category ID"
        },
        categorySlug: {
          type: "string",
          description: "Category slug (alternative to ID)"
        },
        includeSubcategories: {
          type: "boolean",
          description: "Include products from subcategories",
          default: true
        },
        page: {
          type: "number",
          description: "Page number",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 20
        },
        sortBy: {
          type: "string",
          description: "Sort field",
          enum: ["name", "price", "createdAt", "featured"],
          default: "createdAt"
        },
        sortOrder: {
          type: "string",
          description: "Sort direction",
          enum: ["asc", "desc"],
          default: "desc"
        }
      },
      required: []
    },
    handler: `
      const { categoryId, categorySlug, includeSubcategories = true, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = input;

      if (!categoryId && !categorySlug) {
        throw new Error('Either categoryId or categorySlug is required');
      }

      // Find category
      const category = await prisma.productCategory.findFirst({
        where: categoryId ? { id: categoryId } : { slug: categorySlug },
        include: {
          children: includeSubcategories ? { select: { id: true } } : false,
        },
      });

      if (!category) {
        throw new Error('Category not found');
      }

      // Build category IDs list
      const categoryIds = [category.id];
      if (includeSubcategories && category.children) {
        categoryIds.push(...category.children.map(c => c.id));
      }

      const where = {
        categoryId: { in: categoryIds },
        status: 'ACTIVE',
        deletedAt: null,
      };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { take: 1, orderBy: { order: 'asc' } },
          },
          orderBy: sortBy === 'featured'
            ? [{ featured: 'desc' }, { createdAt: 'desc' }]
            : { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.shortDescription,
          price: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          featured: p.featured,
          category: p.category,
          image: p.images[0] || null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    `
  },
  // ============================================================================
  // GET VARIANTS
  // ============================================================================
  {
    name: "product.getVariants",
    description: "Get all variants for a product with pricing and stock info",
    category: "product",
    tags: ["product", "variants", "catalog", "storefront"],
    icon: "Layers",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product ID"
        },
        productSlug: {
          type: "string",
          description: "Product slug (alternative to ID)"
        },
        inStockOnly: {
          type: "boolean",
          description: "Only return variants in stock",
          default: false
        }
      },
      required: []
    },
    handler: `
      const { productId, productSlug, inStockOnly = false } = input;

      if (!productId && !productSlug) {
        throw new Error('Either productId or productSlug is required');
      }

      // Find product
      const product = await prisma.product.findFirst({
        where: productId
          ? { id: productId, deletedAt: null }
          : { slug: productSlug, deletedAt: null },
        select: { id: true, name: true, slug: true, basePrice: true },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const where = {
        productId: product.id,
        deletedAt: null,
      };

      if (inStockOnly) {
        where.stock = { gt: 0 };
      }

      const variants = await prisma.productVariant.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' } },
        },
        orderBy: { order: 'asc' },
      });

      // Extract unique option types
      const optionTypes = new Set();
      variants.forEach(v => {
        if (v.options && typeof v.options === 'object') {
          Object.keys(v.options).forEach(k => optionTypes.add(k));
        }
      });

      return {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
        },
        variants: variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          inStock: v.stock > 0,
          lowStock: v.stock > 0 && v.stock <= (v.lowStockThreshold || 5),
          options: v.options,
          images: v.images,
          weight: v.weight,
          dimensions: v.dimensions,
        })),
        optionTypes: Array.from(optionTypes),
        totalVariants: variants.length,
        inStockCount: variants.filter(v => v.stock > 0).length,
      };
    `
  },
  // ============================================================================
  // CHECK STOCK
  // ============================================================================
  {
    name: "product.checkStock",
    description: "Check stock availability for a product or variant",
    category: "product",
    tags: ["product", "stock", "inventory", "storefront"],
    icon: "Package2",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product ID"
        },
        variantId: {
          type: "string",
          description: "Specific variant ID (optional)"
        },
        quantity: {
          type: "number",
          description: "Quantity to check availability for",
          default: 1,
          minimum: 1
        }
      },
      required: ["productId"]
    },
    handler: `
      const { productId, variantId, quantity = 1 } = input;

      if (variantId) {
        // Check specific variant
        const variant = await prisma.productVariant.findFirst({
          where: { id: variantId, productId, deletedAt: null },
          include: {
            product: { select: { id: true, name: true, status: true } },
          },
        });

        if (!variant) {
          throw new Error('Variant not found');
        }

        if (variant.product.status !== 'ACTIVE') {
          return {
            available: false,
            reason: 'Product is not available',
            productId,
            variantId,
            requestedQuantity: quantity,
          };
        }

        const available = variant.stock >= quantity;

        return {
          available,
          reason: available ? null : 'Insufficient stock',
          productId,
          variantId,
          variantName: variant.name,
          sku: variant.sku,
          requestedQuantity: quantity,
          currentStock: variant.stock,
          lowStock: variant.stock > 0 && variant.stock <= (variant.lowStockThreshold || 5),
        };
      } else {
        // Check all variants for product
        const product = await prisma.product.findFirst({
          where: { id: productId, deletedAt: null },
          include: {
            variants: {
              where: { deletedAt: null, stock: { gte: quantity } },
              select: { id: true, name: true, sku: true, stock: true, price: true },
            },
          },
        });

        if (!product) {
          throw new Error('Product not found');
        }

        if (product.status !== 'ACTIVE') {
          return {
            available: false,
            reason: 'Product is not available',
            productId,
            requestedQuantity: quantity,
            availableVariants: [],
          };
        }

        return {
          available: product.variants.length > 0,
          reason: product.variants.length > 0 ? null : 'No variants with sufficient stock',
          productId,
          productName: product.name,
          requestedQuantity: quantity,
          availableVariants: product.variants.map(v => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            stock: v.stock,
            price: v.price,
          })),
          totalAvailableVariants: product.variants.length,
        };
      }
    `
  },
  // ============================================================================
  // GET CATEGORIES
  // ============================================================================
  {
    name: "product.getCategories",
    description: "Get product categories with optional hierarchy",
    category: "product",
    tags: ["product", "category", "catalog", "navigation"],
    icon: "FolderOpen",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        parentId: {
          type: "string",
          description: "Parent category ID (null for root categories)"
        },
        includeProductCount: {
          type: "boolean",
          description: "Include product count per category",
          default: true
        },
        includeChildren: {
          type: "boolean",
          description: "Include child categories",
          default: true
        },
        activeOnly: {
          type: "boolean",
          description: "Only return categories with active products",
          default: false
        }
      },
      required: []
    },
    handler: `
      const { parentId, includeProductCount = true, includeChildren = true, activeOnly = false } = input;

      const where = {};
      if (parentId === null || parentId === undefined) {
        where.parentId = null;
      } else if (parentId) {
        where.parentId = parentId;
      }

      const categories = await prisma.productCategory.findMany({
        where,
        include: {
          children: includeChildren ? {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              image: true,
              _count: includeProductCount ? {
                select: { products: { where: { status: 'ACTIVE', deletedAt: null } } }
              } : false,
            },
            orderBy: { order: 'asc' },
          } : false,
          _count: includeProductCount ? {
            select: { products: { where: { status: 'ACTIVE', deletedAt: null } } }
          } : false,
        },
        orderBy: { order: 'asc' },
      });

      let result = categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        productCount: c._count?.products || 0,
        children: c.children?.map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          description: child.description,
          image: child.image,
          productCount: child._count?.products || 0,
        })) || [],
      }));

      if (activeOnly) {
        result = result.filter(c => c.productCount > 0 || c.children.some(ch => ch.productCount > 0));
      }

      return {
        categories: result,
        total: result.length,
      };
    `
  },
  // ============================================================================
  // GET FEATURED PRODUCTS
  // ============================================================================
  {
    name: "product.getFeatured",
    description: "Get featured products for homepage or promotional displays",
    category: "product",
    tags: ["product", "featured", "homepage", "storefront"],
    icon: "Star",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of products to return",
          default: 8,
          minimum: 1,
          maximum: 24
        },
        categoryId: {
          type: "string",
          description: "Filter by category"
        }
      },
      required: []
    },
    handler: `
      const { limit = 8, categoryId } = input;

      const where = {
        featured: true,
        status: 'ACTIVE',
        deletedAt: null,
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { take: 1, orderBy: { order: 'asc' } },
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: limit,
      });

      return {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.shortDescription,
          price: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          category: p.category,
          image: p.images[0] || null,
        })),
        total: products.length,
      };
    `
  }
];

// src/lib/plugins/primitives/review.ts
var REVIEW_PRIMITIVES = [
  // ============================================================================
  // CREATE REVIEW
  // ============================================================================
  {
    name: "review.create",
    description: "Create a new product review",
    category: "review",
    tags: ["review", "rating", "feedback", "storefront"],
    icon: "Star",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        productId: {
          type: "string",
          description: "Product ID"
        },
        orderId: {
          type: "string",
          description: "Order ID (for verified purchases)"
        },
        rating: {
          type: "number",
          description: "Rating (1-5)",
          minimum: 1,
          maximum: 5
        },
        title: {
          type: "string",
          description: "Review title",
          maxLength: 200
        },
        content: {
          type: "string",
          description: "Review content",
          maxLength: 5e3
        },
        pros: {
          type: "array",
          description: "List of pros",
          items: { type: "string" }
        },
        cons: {
          type: "array",
          description: "List of cons",
          items: { type: "string" }
        },
        images: {
          type: "array",
          description: "Image URLs",
          items: { type: "string" }
        }
      },
      required: ["userId", "productId", "rating"]
    },
    handler: `
      const { userId, productId, orderId, rating, title, content, pros, cons, images } = input;

      // Verify product exists
      const product = await prisma.product.findFirst({
        where: { id: productId, deletedAt: null },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Check if user already reviewed this product
      const existing = await prisma.productReview.findFirst({
        where: { userId, productId },
      });

      if (existing) {
        throw new Error('You have already reviewed this product');
      }

      // Check if verified purchase
      let verifiedPurchase = false;
      if (orderId) {
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            userId,
            items: { some: { productId } },
            status: { in: ['DELIVERED', 'COMPLETED'] },
          },
        });
        verifiedPurchase = !!order;
      }

      const review = await prisma.productReview.create({
        data: {
          userId,
          productId,
          orderId: orderId || null,
          rating,
          title: title || null,
          content: content || null,
          pros: pros || [],
          cons: cons || [],
          images: images || [],
          verifiedPurchase,
          status: 'PENDING', // Requires moderation
        },
      });

      return {
        id: review.id,
        rating: review.rating,
        title: review.title,
        verifiedPurchase: review.verifiedPurchase,
        status: review.status,
        message: 'Review submitted for moderation',
      };
    `
  },
  // ============================================================================
  // GET PRODUCT REVIEWS
  // ============================================================================
  {
    name: "review.list",
    description: "Get reviews for a product",
    category: "review",
    tags: ["review", "rating", "list", "storefront"],
    icon: "MessageSquare",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product ID"
        },
        page: {
          type: "number",
          description: "Page number",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 10
        },
        sortBy: {
          type: "string",
          description: "Sort field",
          enum: ["createdAt", "rating", "helpful"],
          default: "createdAt"
        },
        sortOrder: {
          type: "string",
          description: "Sort direction",
          enum: ["asc", "desc"],
          default: "desc"
        },
        rating: {
          type: "number",
          description: "Filter by specific rating"
        },
        verifiedOnly: {
          type: "boolean",
          description: "Only verified purchases",
          default: false
        }
      },
      required: ["productId"]
    },
    handler: `
      const { productId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', rating, verifiedOnly = false } = input;

      const where = {
        productId,
        status: 'APPROVED',
      };

      if (rating) where.rating = rating;
      if (verifiedOnly) where.verifiedPurchase = true;

      const orderBy = sortBy === 'helpful'
        ? { helpfulCount: sortOrder }
        : { [sortBy]: sortOrder };

      const [reviews, total, stats] = await Promise.all([
        prisma.productReview.findMany({
          where,
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { votes: true } },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.productReview.count({ where }),
        prisma.productReview.aggregate({
          where: { productId, status: 'APPROVED' },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

      // Get rating distribution
      const distribution = await prisma.productReview.groupBy({
        by: ['rating'],
        where: { productId, status: 'APPROVED' },
        _count: { rating: true },
      });

      const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution.forEach(d => { ratingDist[d.rating] = d._count.rating; });

      return {
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          pros: r.pros,
          cons: r.cons,
          images: r.images,
          author: r.user?.name || 'Anonymous',
          verifiedPurchase: r.verifiedPurchase,
          helpfulCount: r.helpfulCount,
          response: r.response,
          createdAt: r.createdAt,
        })),
        summary: {
          averageRating: stats._avg.rating || 0,
          totalReviews: stats._count.rating || 0,
          distribution: ratingDist,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  },
  // ============================================================================
  // GET SINGLE REVIEW
  // ============================================================================
  {
    name: "review.get",
    description: "Get a single review by ID",
    category: "review",
    tags: ["review", "rating", "detail"],
    icon: "FileText",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        reviewId: {
          type: "string",
          description: "Review ID"
        }
      },
      required: ["reviewId"]
    },
    handler: `
      const { reviewId } = input;

      const review = await prisma.productReview.findFirst({
        where: { id: reviewId },
        include: {
          user: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!review) {
        throw new Error('Review not found');
      }

      return {
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        pros: review.pros,
        cons: review.cons,
        images: review.images,
        author: review.user?.name || 'Anonymous',
        authorId: review.userId,
        product: review.product,
        verifiedPurchase: review.verifiedPurchase,
        helpfulCount: review.helpfulCount,
        response: review.response,
        respondedAt: review.respondedAt,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      };
    `
  },
  // ============================================================================
  // VOTE REVIEW
  // ============================================================================
  {
    name: "review.vote",
    description: "Mark a review as helpful or not helpful",
    category: "review",
    tags: ["review", "vote", "helpful", "feedback"],
    icon: "ThumbsUp",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        reviewId: {
          type: "string",
          description: "Review ID"
        },
        userId: {
          type: "string",
          description: "Voter user ID"
        },
        helpful: {
          type: "boolean",
          description: "Is this review helpful?"
        }
      },
      required: ["reviewId", "userId", "helpful"]
    },
    handler: `
      const { reviewId, userId, helpful } = input;

      const review = await prisma.productReview.findFirst({
        where: { id: reviewId, status: 'APPROVED' },
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Upsert vote
      const existingVote = await prisma.reviewVote.findUnique({
        where: { reviewId_oderId: { reviewId, oderId: oderId } },
      });

      if (existingVote) {
        if (existingVote.helpful === helpful) {
          // Remove vote if same
          await prisma.reviewVote.delete({
            where: { id: existingVote.id },
          });

          // Update helpful count
          await prisma.productReview.update({
            where: { id: reviewId },
            data: { helpfulCount: { decrement: helpful ? 1 : 0 } },
          });

          return { voted: false, removed: true, reviewId };
        } else {
          // Change vote
          await prisma.reviewVote.update({
            where: { id: existingVote.id },
            data: { helpful },
          });

          await prisma.productReview.update({
            where: { id: reviewId },
            data: { helpfulCount: { increment: helpful ? 1 : -1 } },
          });

          return { voted: true, helpful, changed: true, reviewId };
        }
      } else {
        await prisma.reviewVote.create({
          data: { reviewId, oderId: oderId, helpful },
        });

        if (helpful) {
          await prisma.productReview.update({
            where: { id: reviewId },
            data: { helpfulCount: { increment: 1 } },
          });
        }

        return { voted: true, helpful, reviewId };
      }
    `
  },
  // ============================================================================
  // RESPOND TO REVIEW
  // ============================================================================
  {
    name: "review.respond",
    description: "Store owner response to a review",
    category: "review",
    tags: ["review", "response", "admin"],
    icon: "Reply",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        reviewId: {
          type: "string",
          description: "Review ID"
        },
        response: {
          type: "string",
          description: "Response text",
          maxLength: 2e3
        }
      },
      required: ["reviewId", "response"]
    },
    handler: `
      const { reviewId, response } = input;

      const review = await prisma.productReview.findFirst({
        where: { id: reviewId },
      });

      if (!review) {
        throw new Error('Review not found');
      }

      const updated = await prisma.productReview.update({
        where: { id: reviewId },
        data: {
          response,
          respondedAt: new Date(),
        },
      });

      return {
        id: updated.id,
        response: updated.response,
        respondedAt: updated.respondedAt,
      };
    `
  },
  // ============================================================================
  // GET PRODUCT RATING
  // ============================================================================
  {
    name: "review.getProductRating",
    description: "Get aggregate rating for a product",
    category: "review",
    tags: ["review", "rating", "aggregate", "storefront"],
    icon: "BarChart",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product ID"
        }
      },
      required: ["productId"]
    },
    handler: `
      const { productId } = input;

      const stats = await prisma.productReview.aggregate({
        where: { productId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const distribution = await prisma.productReview.groupBy({
        by: ['rating'],
        where: { productId, status: 'APPROVED' },
        _count: { rating: true },
      });

      const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution.forEach(d => { ratingDist[d.rating] = d._count.rating; });

      return {
        productId,
        averageRating: Math.round((stats._avg.rating || 0) * 10) / 10,
        totalReviews: stats._count.rating || 0,
        distribution: ratingDist,
        hasReviews: stats._count.rating > 0,
      };
    `
  },
  // ============================================================================
  // GET USER REVIEWS
  // ============================================================================
  {
    name: "review.getUserReviews",
    description: "Get all reviews by a user",
    category: "review",
    tags: ["review", "user", "history"],
    icon: "User",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        page: {
          type: "number",
          description: "Page number",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 10
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId, page = 1, limit = 10 } = input;

      const [reviews, total] = await Promise.all([
        prisma.productReview.findMany({
          where: { userId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { take: 1, orderBy: { order: 'asc' } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.productReview.count({ where: { userId } }),
      ]);

      return {
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          status: r.status,
          helpfulCount: r.helpfulCount,
          product: {
            id: r.product.id,
            name: r.product.name,
            slug: r.product.slug,
            image: r.product.images[0] || null,
          },
          createdAt: r.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  }
];

// src/lib/plugins/primitives/shipping.ts
var SHIPPING_PRIMITIVES = [
  // ============================================================================
  // SHIPPING PRIMITIVES
  // ============================================================================
  {
    name: "shipping.getRates",
    description: "Get shipping rates from multiple carriers (USPS, UPS, FedEx) for a shipment. Compares prices and delivery times.",
    category: "shipping",
    tags: ["shipping", "rates", "carriers", "shippo"],
    icon: "Truck",
    timeout: 3e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        addressFrom: {
          type: "object",
          description: "Ship-from address (optional, uses default if not provided)",
          properties: {
            name: { type: "string" },
            company: { type: "string" },
            street1: { type: "string" },
            street2: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zip: { type: "string" },
            country: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" }
          }
        },
        addressTo: {
          type: "object",
          description: "Ship-to address (required)",
          properties: {
            name: { type: "string" },
            company: { type: "string" },
            street1: { type: "string" },
            street2: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zip: { type: "string" },
            country: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" }
          },
          required: ["name", "street1", "city", "state", "zip", "country"]
        },
        parcels: {
          type: "array",
          description: "Package dimensions and weight",
          items: {
            type: "object",
            properties: {
              length: { type: "number", description: "Length in inches" },
              width: { type: "number", description: "Width in inches" },
              height: { type: "number", description: "Height in inches" },
              weight: { type: "number", description: "Weight in ounces" },
              massUnit: { type: "string", default: "oz" },
              distanceUnit: { type: "string", default: "in" }
            },
            required: ["length", "width", "height", "weight"]
          }
        },
        signature: {
          type: "boolean",
          description: "Require signature confirmation"
        },
        insurance: {
          type: "object",
          description: "Insurance options",
          properties: {
            amount: { type: "string" },
            currency: { type: "string", default: "USD" },
            content: { type: "string" }
          }
        }
      },
      required: ["addressTo", "parcels"]
    },
    handler: `
      const { createShipment, getDefaultFromAddress } = await import('../../shippo');

      // Use default from address if not provided
      const addressFrom = args.addressFrom || await getDefaultFromAddress();

      const shipment = await createShipment({
        addressFrom,
        addressTo: args.addressTo,
        parcels: args.parcels,
        extra: {
          signature: args.signature,
          insurance: args.insurance,
        },
      });

      return {
        success: true,
        shipmentId: shipment.shipmentId,
        rates: shipment.rates.map(rate => ({
          rateId: rate.rateId,
          carrier: rate.carrier,
          service: rate.servicelevel.name,
          price: parseFloat(rate.amount),
          currency: rate.currency,
          estimatedDays: rate.estimatedDays,
          deliveryTerms: rate.durationTerms,
        })),
        cheapest: shipment.rates[0] ? {
          carrier: shipment.rates[0].carrier,
          service: shipment.rates[0].servicelevel.name,
          price: parseFloat(shipment.rates[0].amount),
        } : null,
      };
    `
  },
  {
    name: "shipping.createLabel",
    description: "Purchase a shipping label for a selected rate. Returns label URL, tracking number, and tracking URL.",
    category: "shipping",
    tags: ["shipping", "label", "purchase", "shippo"],
    icon: "Tag",
    timeout: 3e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        rateId: {
          type: "string",
          description: "Rate ID from shipping.getRates"
        },
        labelFormat: {
          type: "string",
          description: "Label format",
          enum: ["PDF", "PDF_4x6", "PNG", "ZPLII"],
          default: "PDF"
        },
        orderId: {
          type: "string",
          description: "Order ID to associate with this shipment"
        }
      },
      required: ["rateId"]
    },
    handler: `
      const { purchaseLabel } = await import('../../shippo');
      const { prisma } = await import('../../db');

      const label = await purchaseLabel({
        rateId: args.rateId,
        labelFormat: args.labelFormat || 'PDF',
      });

      // Create shipment record if order ID provided
      if (args.orderId && label.status === 'SUCCESS') {
        await prisma.shipment.create({
          data: {
            orderId: args.orderId,
            carrier: label.rate.carrier,
            service: label.rate.servicelevel.name,
            trackingNumber: label.trackingNumber,
            trackingUrl: label.trackingUrl,
            labelUrl: label.labelUrl,
            status: 'LABEL_CREATED',
          },
        });
      }

      return {
        success: label.status === 'SUCCESS',
        transactionId: label.transactionId,
        trackingNumber: label.trackingNumber,
        trackingUrl: label.trackingUrl,
        labelUrl: label.labelUrl,
        carrier: label.rate.carrier,
        service: label.rate.servicelevel.name,
        eta: label.eta,
        messages: label.messages,
      };
    `
  },
  {
    name: "shipping.getTracking",
    description: "Get tracking status and history for a shipment by tracking number.",
    category: "shipping",
    tags: ["shipping", "tracking", "status", "shippo"],
    icon: "MapPin",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        carrier: {
          type: "string",
          description: "Carrier name",
          enum: ["usps", "ups", "fedex", "dhl_express"]
        },
        trackingNumber: {
          type: "string",
          description: "Tracking number"
        }
      },
      required: ["carrier", "trackingNumber"]
    },
    handler: `
      const { getTracking } = await import('../../shippo');

      const tracking = await getTracking(args.carrier, args.trackingNumber);

      return {
        success: true,
        carrier: tracking.carrier,
        trackingNumber: tracking.trackingNumber,
        eta: tracking.eta,
        currentStatus: {
          status: tracking.trackingStatus.status,
          details: tracking.trackingStatus.statusDetails,
          date: tracking.trackingStatus.statusDate,
          location: tracking.trackingStatus.location,
        },
        isDelivered: tracking.trackingStatus.status === 'DELIVERED',
        history: tracking.trackingHistory.map(event => ({
          status: event.status,
          details: event.statusDetails,
          date: event.statusDate,
          location: event.location,
        })),
      };
    `
  },
  {
    name: "shipping.validateAddress",
    description: "Validate and standardize a shipping address. Returns corrected address and validation messages.",
    category: "shipping",
    tags: ["shipping", "address", "validation", "shippo"],
    icon: "CheckCircle",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Recipient name"
        },
        company: {
          type: "string",
          description: "Company name (optional)"
        },
        street1: {
          type: "string",
          description: "Street address line 1"
        },
        street2: {
          type: "string",
          description: "Street address line 2 (optional)"
        },
        city: {
          type: "string",
          description: "City"
        },
        state: {
          type: "string",
          description: "State/Province code"
        },
        zip: {
          type: "string",
          description: "Postal/ZIP code"
        },
        country: {
          type: "string",
          description: "Country code (e.g., US, CA)",
          default: "US"
        },
        phone: {
          type: "string",
          description: "Phone number"
        },
        email: {
          type: "string",
          description: "Email address"
        }
      },
      required: ["name", "street1", "city", "state", "zip"]
    },
    handler: `
      const { validateAddress } = await import('../../shippo');

      const result = await validateAddress({
        name: args.name,
        company: args.company,
        street1: args.street1,
        street2: args.street2,
        city: args.city,
        state: args.state,
        zip: args.zip,
        country: args.country || 'US',
        phone: args.phone,
        email: args.email,
      });

      return {
        success: true,
        isValid: result.isValid,
        address: {
          name: result.name,
          company: result.company,
          street1: result.street1,
          street2: result.street2,
          city: result.city,
          state: result.state,
          zip: result.zip,
          country: result.country,
        },
        messages: result.messages,
        hasWarnings: result.messages?.some(m => m.type === 'warning') || false,
        hasErrors: result.messages?.some(m => m.type === 'error') || false,
      };
    `
  },
  {
    name: "shipping.refundLabel",
    description: "Request a refund for a purchased shipping label.",
    category: "shipping",
    tags: ["shipping", "refund", "label", "shippo"],
    icon: "RotateCcw",
    timeout: 15e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        transactionId: {
          type: "string",
          description: "Transaction ID from label purchase"
        },
        shipmentId: {
          type: "string",
          description: "Optional: Database shipment ID to update"
        }
      },
      required: ["transactionId"]
    },
    handler: `
      const { refundLabel } = await import('../../shippo');
      const { prisma } = await import('../../db');

      const refund = await refundLabel(args.transactionId);

      // Update shipment record if ID provided
      if (args.shipmentId && refund.status !== 'ERROR') {
        await prisma.shipment.update({
          where: { id: args.shipmentId },
          data: { status: 'REFUND_PENDING' },
        });
      }

      return {
        success: refund.status !== 'ERROR',
        transactionId: refund.transactionId,
        status: refund.status,
      };
    `
  }
];

// src/lib/plugins/primitives/wishlist.ts
var WISHLIST_PRIMITIVES = [
  // ============================================================================
  // GET WISHLIST
  // ============================================================================
  {
    name: "wishlist.get",
    description: "Get user wishlist with products",
    category: "wishlist",
    tags: ["wishlist", "favorites", "customer", "storefront"],
    icon: "Heart",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        wishlistId: {
          type: "string",
          description: "Specific wishlist ID (users can have multiple)"
        },
        page: {
          type: "number",
          description: "Page number",
          default: 1
        },
        limit: {
          type: "number",
          description: "Items per page",
          default: 20
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId, wishlistId, page = 1, limit = 20 } = input;

      // Get or create default wishlist
      let wishlist;
      if (wishlistId) {
        wishlist = await prisma.wishlist.findFirst({
          where: { id: wishlistId, userId },
        });
      } else {
        wishlist = await prisma.wishlist.findFirst({
          where: { userId, isDefault: true },
        });

        if (!wishlist) {
          wishlist = await prisma.wishlist.create({
            data: {
              userId,
              name: 'My Wishlist',
              isDefault: true,
            },
          });
        }
      }

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      const [items, total] = await Promise.all([
        prisma.wishlistItem.findMany({
          where: { wishlistId: wishlist.id },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
                variants: {
                  where: { deletedAt: null },
                  select: { id: true, price: true, stock: true },
                  take: 1,
                },
              },
            },
            variant: {
              select: { id: true, name: true, price: true, stock: true, options: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } }),
      ]);

      return {
        id: wishlist.id,
        name: wishlist.name,
        isDefault: wishlist.isDefault,
        isPublic: wishlist.isPublic,
        shareToken: wishlist.isPublic ? wishlist.shareToken : null,
        items: items.map(i => ({
          id: i.id,
          addedAt: i.createdAt,
          note: i.note,
          product: {
            id: i.product.id,
            name: i.product.name,
            slug: i.product.slug,
            price: i.variant?.price || i.product.basePrice,
            compareAtPrice: i.product.compareAtPrice,
            image: i.product.images[0] || null,
            inStock: i.variant ? i.variant.stock > 0 : i.product.variants[0]?.stock > 0,
            status: i.product.status,
          },
          variant: i.variant,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `
  },
  // ============================================================================
  // ADD TO WISHLIST
  // ============================================================================
  {
    name: "wishlist.add",
    description: "Add a product to wishlist",
    category: "wishlist",
    tags: ["wishlist", "favorites", "add", "storefront"],
    icon: "HeartPlus",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        productId: {
          type: "string",
          description: "Product ID"
        },
        variantId: {
          type: "string",
          description: "Specific variant ID (optional)"
        },
        wishlistId: {
          type: "string",
          description: "Target wishlist ID (uses default if not specified)"
        },
        note: {
          type: "string",
          description: "Optional note"
        }
      },
      required: ["userId", "productId"]
    },
    handler: `
      const { userId, productId, variantId, wishlistId, note } = input;

      // Verify product exists
      const product = await prisma.product.findFirst({
        where: { id: productId, deletedAt: null },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Get or create wishlist
      let wishlist;
      if (wishlistId) {
        wishlist = await prisma.wishlist.findFirst({
          where: { id: wishlistId, userId },
        });
      } else {
        wishlist = await prisma.wishlist.findFirst({
          where: { userId, isDefault: true },
        });

        if (!wishlist) {
          wishlist = await prisma.wishlist.create({
            data: { userId, name: 'My Wishlist', isDefault: true },
          });
        }
      }

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Check if already in wishlist
      const existing = await prisma.wishlistItem.findFirst({
        where: {
          wishlistId: wishlist.id,
          productId,
          variantId: variantId || null,
        },
      });

      if (existing) {
        return {
          added: false,
          alreadyExists: true,
          itemId: existing.id,
          wishlistId: wishlist.id,
        };
      }

      const item = await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
          variantId: variantId || null,
          note: note || null,
        },
      });

      return {
        added: true,
        itemId: item.id,
        wishlistId: wishlist.id,
        productId,
        variantId,
      };
    `
  },
  // ============================================================================
  // REMOVE FROM WISHLIST
  // ============================================================================
  {
    name: "wishlist.remove",
    description: "Remove a product from wishlist",
    category: "wishlist",
    tags: ["wishlist", "favorites", "remove", "storefront"],
    icon: "HeartOff",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        itemId: {
          type: "string",
          description: "Wishlist item ID"
        },
        productId: {
          type: "string",
          description: "Product ID (alternative to itemId)"
        },
        variantId: {
          type: "string",
          description: "Variant ID (when using productId)"
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId, itemId, productId, variantId } = input;

      if (!itemId && !productId) {
        throw new Error('Either itemId or productId is required');
      }

      let item;

      if (itemId) {
        item = await prisma.wishlistItem.findFirst({
          where: { id: itemId },
          include: { wishlist: true },
        });

        if (!item || item.wishlist.userId !== userId) {
          throw new Error('Item not found');
        }
      } else {
        // Find by product in user's default wishlist
        const wishlist = await prisma.wishlist.findFirst({
          where: { userId, isDefault: true },
        });

        if (wishlist) {
          item = await prisma.wishlistItem.findFirst({
            where: {
              wishlistId: wishlist.id,
              productId,
              variantId: variantId || null,
            },
          });
        }

        if (!item) {
          return { removed: false, notFound: true };
        }
      }

      await prisma.wishlistItem.delete({ where: { id: item.id } });

      return {
        removed: true,
        itemId: item.id,
        productId: item.productId,
      };
    `
  },
  // ============================================================================
  // TOGGLE WISHLIST
  // ============================================================================
  {
    name: "wishlist.toggle",
    description: "Toggle product in wishlist (add if not present, remove if present)",
    category: "wishlist",
    tags: ["wishlist", "favorites", "toggle", "storefront"],
    icon: "Heart",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        productId: {
          type: "string",
          description: "Product ID"
        },
        variantId: {
          type: "string",
          description: "Variant ID (optional)"
        }
      },
      required: ["userId", "productId"]
    },
    handler: `
      const { userId, productId, variantId } = input;

      // Get or create default wishlist
      let wishlist = await prisma.wishlist.findFirst({
        where: { userId, isDefault: true },
      });

      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: { userId, name: 'My Wishlist', isDefault: true },
        });
      }

      // Check if exists
      const existing = await prisma.wishlistItem.findFirst({
        where: {
          wishlistId: wishlist.id,
          productId,
          variantId: variantId || null,
        },
      });

      if (existing) {
        await prisma.wishlistItem.delete({ where: { id: existing.id } });
        return {
          action: 'removed',
          inWishlist: false,
          productId,
          variantId,
        };
      } else {
        const item = await prisma.wishlistItem.create({
          data: {
            wishlistId: wishlist.id,
            productId,
            variantId: variantId || null,
          },
        });
        return {
          action: 'added',
          inWishlist: true,
          itemId: item.id,
          productId,
          variantId,
        };
      }
    `
  },
  // ============================================================================
  // CHECK WISHLIST STATUS
  // ============================================================================
  {
    name: "wishlist.check",
    description: "Check if product(s) are in wishlist",
    category: "wishlist",
    tags: ["wishlist", "favorites", "check", "storefront"],
    icon: "HeartPulse",
    timeout: 3e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        productIds: {
          type: "array",
          description: "Product IDs to check",
          items: { type: "string" }
        }
      },
      required: ["userId", "productIds"]
    },
    handler: `
      const { userId, productIds } = input;

      const wishlist = await prisma.wishlist.findFirst({
        where: { userId, isDefault: true },
      });

      if (!wishlist) {
        return {
          items: productIds.map(id => ({ productId: id, inWishlist: false })),
        };
      }

      const items = await prisma.wishlistItem.findMany({
        where: {
          wishlistId: wishlist.id,
          productId: { in: productIds },
        },
        select: { productId: true, variantId: true, id: true },
      });

      const itemMap = new Map(items.map(i => [i.productId, i]));

      return {
        items: productIds.map(id => ({
          productId: id,
          inWishlist: itemMap.has(id),
          itemId: itemMap.get(id)?.id,
          variantId: itemMap.get(id)?.variantId,
        })),
      };
    `
  },
  // ============================================================================
  // SHARE WISHLIST
  // ============================================================================
  {
    name: "wishlist.share",
    description: "Generate a shareable link for wishlist",
    category: "wishlist",
    tags: ["wishlist", "share", "social"],
    icon: "Share2",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID"
        },
        wishlistId: {
          type: "string",
          description: "Wishlist ID"
        },
        makePublic: {
          type: "boolean",
          description: "Make wishlist public",
          default: true
        }
      },
      required: ["userId"]
    },
    handler: `
      const { userId, wishlistId, makePublic = true } = input;

      let wishlist;
      if (wishlistId) {
        wishlist = await prisma.wishlist.findFirst({
          where: { id: wishlistId, userId },
        });
      } else {
        wishlist = await prisma.wishlist.findFirst({
          where: { userId, isDefault: true },
        });
      }

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Generate share token if needed
      let shareToken = wishlist.shareToken;
      if (!shareToken && makePublic) {
        shareToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      }

      const updated = await prisma.wishlist.update({
        where: { id: wishlist.id },
        data: {
          isPublic: makePublic,
          shareToken: makePublic ? shareToken : null,
        },
      });

      return {
        wishlistId: updated.id,
        isPublic: updated.isPublic,
        shareToken: updated.shareToken,
        shareUrl: updated.isPublic ? '/wishlist/shared/' + updated.shareToken : null,
      };
    `
  },
  // ============================================================================
  // GET SHARED WISHLIST
  // ============================================================================
  {
    name: "wishlist.getShared",
    description: "Get a publicly shared wishlist",
    category: "wishlist",
    tags: ["wishlist", "share", "public"],
    icon: "ExternalLink",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        shareToken: {
          type: "string",
          description: "Share token from URL"
        }
      },
      required: ["shareToken"]
    },
    handler: `
      const { shareToken } = input;

      const wishlist = await prisma.wishlist.findFirst({
        where: { shareToken, isPublic: true },
        include: {
          user: { select: { name: true } },
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { order: 'asc' } },
                },
              },
              variant: { select: { name: true, price: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!wishlist) {
        throw new Error('Wishlist not found or not public');
      }

      return {
        id: wishlist.id,
        name: wishlist.name,
        ownerName: wishlist.user?.name || 'Anonymous',
        items: wishlist.items.map(i => ({
          product: {
            id: i.product.id,
            name: i.product.name,
            slug: i.product.slug,
            price: i.variant?.price || i.product.basePrice,
            image: i.product.images[0] || null,
          },
          variant: i.variant,
          note: i.note,
        })),
        itemCount: wishlist.items.length,
      };
    `
  }
];

// src/lib/plugins/primitives/index.ts
var DOMAIN_PRIMITIVES = [
  ...AI_PRIMITIVES,
  ...ANALYTICS_PRIMITIVES,
  ...BLOG_PRIMITIVES,
  ...CART_PRIMITIVES,
  ...CUSTOMER_PRIMITIVES,
  ...DISCOUNT_PRIMITIVES,
  ...EMAIL_PRIMITIVES,
  ...GIFTCARD_PRIMITIVES,
  ...MEDIA_PRIMITIVES,
  ...NOTIFICATION_PRIMITIVES,
  ...ORDER_PRIMITIVES,
  ...PAYMENT_PRIMITIVES,
  ...PRODUCT_PRIMITIVES,
  ...REVIEW_PRIMITIVES,
  ...SHIPPING_PRIMITIVES,
  ...WISHLIST_PRIMITIVES
];

// src/lib/plugins/built-in.ts
var CORE_PRIMITIVES = [
  // ============================================================================
  // DATA PRIMITIVES
  // ============================================================================
  {
    name: "transform_json",
    description: "Transform JSON data using a JavaScript expression. Useful for mapping, filtering, and reshaping data.",
    category: "data",
    tags: ["data", "transform", "json"],
    icon: "Braces",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "object",
          description: "The input data to transform"
        },
        expression: {
          type: "string",
          description: "JavaScript expression to transform the data. Use `data` to reference input."
        }
      },
      required: ["data", "expression"]
    },
    handler: `
      // Transform JSON data using expression
      const result = eval(args.expression);
      return result;
    `
  },
  {
    name: "validate_data",
    description: "Validate data against a JSON Schema and return validation results.",
    category: "data",
    tags: ["data", "validation", "schema"],
    icon: "CheckCircle",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "object",
          description: "The data to validate"
        },
        schema: {
          type: "object",
          description: "JSON Schema to validate against"
        }
      },
      required: ["data", "schema"]
    },
    handler: `
      const errors = [];
      const schema = args.schema;
      const data = args.data;

      // Check required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in data)) {
            errors.push({ field, message: 'Required field missing' });
          }
        }
      }

      // Check types
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          if (key in data) {
            const value = data[key];
            const expectedType = prop.type;
            const actualType = Array.isArray(value) ? 'array' : typeof value;

            if (expectedType !== actualType && !(expectedType === 'null' && value === null)) {
              errors.push({ field: key, message: 'Type mismatch: expected ' + expectedType + ', got ' + actualType });
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        data: errors.length === 0 ? data : undefined
      };
    `
  },
  // ============================================================================
  // TEXT PRIMITIVES
  // ============================================================================
  {
    name: "format_text",
    description: "Format text using template literals. Supports variable interpolation.",
    category: "text",
    tags: ["text", "template", "format"],
    icon: "FileText",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        template: {
          type: "string",
          description: "Template string with {{variable}} placeholders"
        },
        variables: {
          type: "object",
          description: "Variables to interpolate into the template"
        }
      },
      required: ["template", "variables"]
    },
    handler: `
      let result = args.template;
      for (const [key, value] of Object.entries(args.variables)) {
        result = result.replace(new RegExp('{{' + key + '}}', 'g'), String(value));
      }
      return result;
    `
  },
  {
    name: "parse_csv",
    description: "Parse CSV text into an array of objects.",
    category: "text",
    tags: ["text", "csv", "parse"],
    icon: "Table",
    timeout: 1e4,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        csv: {
          type: "string",
          description: "CSV text to parse"
        },
        delimiter: {
          type: "string",
          description: "Column delimiter (default: comma)",
          default: ","
        },
        hasHeader: {
          type: "boolean",
          description: "First row is header (default: true)",
          default: true
        }
      },
      required: ["csv"]
    },
    handler: `
      const delimiter = args.delimiter || ',';
      const hasHeader = args.hasHeader !== false;
      const lines = args.csv.trim().split('\\n');

      if (lines.length === 0) return [];

      const headers = hasHeader
        ? lines[0].split(delimiter).map(h => h.trim())
        : lines[0].split(delimiter).map((_, i) => 'column' + i);

      const dataLines = hasHeader ? lines.slice(1) : lines;

      return dataLines.map(line => {
        const values = line.split(delimiter);
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i]?.trim() || '';
        });
        return obj;
      });
    `
  },
  // ============================================================================
  // MATH PRIMITIVES
  // ============================================================================
  {
    name: "calculate",
    description: "Evaluate a mathematical expression safely.",
    category: "math",
    tags: ["math", "calculate", "expression"],
    icon: "Calculator",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: 'Mathematical expression to evaluate (e.g., "2 + 2 * 3")'
        },
        variables: {
          type: "object",
          description: "Variables to use in the expression"
        }
      },
      required: ["expression"]
    },
    handler: `
      // Safe math evaluation - only allows numbers and math operators
      let expr = args.expression;

      // Replace variables
      if (args.variables) {
        for (const [key, value] of Object.entries(args.variables)) {
          expr = expr.replace(new RegExp('\\\\b' + key + '\\\\b', 'g'), String(value));
        }
      }

      // Validate expression contains only safe characters
      if (!/^[\\d\\s+\\-*/().]+$/.test(expr)) {
        throw new Error('Invalid expression: only numbers and math operators allowed');
      }

      return eval(expr);
    `
  },
  {
    name: "aggregate",
    description: "Aggregate an array of numbers (sum, avg, min, max, count).",
    category: "math",
    tags: ["math", "aggregate", "statistics"],
    icon: "BarChart",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        values: {
          type: "array",
          description: "Array of numbers to aggregate"
        },
        operations: {
          type: "array",
          description: "Operations to perform: sum, avg, min, max, count",
          default: ["sum", "avg", "min", "max", "count"]
        }
      },
      required: ["values"]
    },
    handler: `
      const nums = args.values.filter(v => typeof v === 'number');
      const ops = args.operations || ['sum', 'avg', 'min', 'max', 'count'];
      const result = {};

      if (ops.includes('sum')) result.sum = nums.reduce((a, b) => a + b, 0);
      if (ops.includes('avg')) result.avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      if (ops.includes('min')) result.min = nums.length ? Math.min(...nums) : null;
      if (ops.includes('max')) result.max = nums.length ? Math.max(...nums) : null;
      if (ops.includes('count')) result.count = nums.length;

      return result;
    `
  },
  // ============================================================================
  // LOGIC PRIMITIVES
  // ============================================================================
  {
    name: "conditional",
    description: "Evaluate a condition and return different values based on result.",
    category: "logic",
    tags: ["logic", "condition", "if-else"],
    icon: "GitBranch",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        condition: {
          type: "string",
          description: "JavaScript expression that evaluates to boolean"
        },
        context: {
          type: "object",
          description: "Variables available in the condition"
        },
        thenValue: {
          description: "Value to return if condition is true"
        },
        elseValue: {
          description: "Value to return if condition is false"
        }
      },
      required: ["condition"]
    },
    handler: `
      // Build context for eval
      const ctx = args.context || {};
      const contextKeys = Object.keys(ctx);
      const contextValues = Object.values(ctx);

      // Create function with context variables
      const evalFn = new Function(...contextKeys, 'return ' + args.condition);
      const result = evalFn(...contextValues);

      return result ? args.thenValue : args.elseValue;
    `
  },
  {
    name: "switch_case",
    description: "Match a value against multiple cases and return the corresponding result.",
    category: "logic",
    tags: ["logic", "switch", "match"],
    icon: "Route",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        value: {
          description: "Value to match against cases"
        },
        cases: {
          type: "object",
          description: "Object mapping case values to results"
        },
        default: {
          description: "Default value if no case matches"
        }
      },
      required: ["value", "cases"]
    },
    handler: `
      const value = String(args.value);
      if (value in args.cases) {
        return args.cases[value];
      }
      return args.default;
    `
  },
  // ============================================================================
  // DATE/TIME PRIMITIVES
  // ============================================================================
  {
    name: "format_date",
    description: "Format a date using a format string.",
    category: "datetime",
    tags: ["date", "time", "format"],
    icon: "Calendar",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date string or timestamp to format"
        },
        format: {
          type: "string",
          description: "Format string (YYYY, MM, DD, HH, mm, ss)",
          default: "YYYY-MM-DD"
        },
        timezone: {
          type: "string",
          description: 'Timezone (e.g., "America/New_York")'
        }
      },
      required: ["date"]
    },
    handler: `
      const d = new Date(args.date);
      const format = args.format || 'YYYY-MM-DD';

      const pad = (n) => String(n).padStart(2, '0');

      return format
        .replace('YYYY', d.getFullYear())
        .replace('MM', pad(d.getMonth() + 1))
        .replace('DD', pad(d.getDate()))
        .replace('HH', pad(d.getHours()))
        .replace('mm', pad(d.getMinutes()))
        .replace('ss', pad(d.getSeconds()));
    `
  },
  {
    name: "date_diff",
    description: "Calculate the difference between two dates.",
    category: "datetime",
    tags: ["date", "time", "difference"],
    icon: "Clock",
    timeout: 5e3,
    builtIn: true,
    inputSchema: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date"
        },
        endDate: {
          type: "string",
          description: "End date"
        },
        unit: {
          type: "string",
          description: "Unit: days, hours, minutes, seconds",
          enum: ["days", "hours", "minutes", "seconds"],
          default: "days"
        }
      },
      required: ["startDate", "endDate"]
    },
    handler: `
      const start = new Date(args.startDate);
      const end = new Date(args.endDate);
      const diffMs = end - start;

      const unit = args.unit || 'days';
      const divisors = {
        days: 86400000,
        hours: 3600000,
        minutes: 60000,
        seconds: 1000,
      };

      return Math.floor(diffMs / divisors[unit]);
    `
  }
];
var BUILT_IN_PRIMITIVES = [
  ...CORE_PRIMITIVES,
  ...DOMAIN_PRIMITIVES
];
async function loadBuiltInPrimitives() {
  let loaded = 0;
  let skipped = 0;
  const errors = [];
  for (const primitive of BUILT_IN_PRIMITIVES) {
    try {
      const existing = await _chunkI5PINI5Tjs.prisma.primitive.findUnique({
        where: { name: primitive.name }
      });
      if (existing) {
        if (existing.builtIn) {
          skipped++;
          continue;
        }
      }
      await _chunkI5PINI5Tjs.prisma.primitive.upsert({
        where: { name: primitive.name },
        create: {
          name: primitive.name,
          description: primitive.description,
          inputSchema: primitive.inputSchema,
          handler: primitive.handler,
          category: primitive.category,
          tags: primitive.tags || [],
          icon: primitive.icon,
          timeout: primitive.timeout || 3e4,
          enabled: true,
          builtIn: true
        },
        update: {
          description: primitive.description,
          inputSchema: primitive.inputSchema,
          handler: primitive.handler,
          category: primitive.category,
          tags: primitive.tags || [],
          icon: primitive.icon,
          timeout: primitive.timeout || 3e4
        }
      });
      loaded++;
    } catch (e) {
      errors.push(`Failed to load ${primitive.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const registry = getPluginRegistry();
  await registry.initialize();
  return { loaded, skipped, errors };
}

// src/lib/reviews/index.ts
async function getReviewWithVotes(reviewId) {
  return _chunkI5PINI5Tjs.prisma.productReview.findUnique({
    where: { id: reviewId },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          images: {
            take: 1,
            include: {
              media: {
                select: { url: true }
              }
            }
          }
        }
      },
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
}
async function getReviews(filters = {}, sort = { field: "createdAt", direction: "desc" }, page = 1, pageSize = 10) {
  const where = {};
  if (filters.productId) {
    where.productId = filters.productId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.rating) {
    where.rating = filters.rating;
  }
  if (filters.minRating) {
    where.rating = _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, where.rating), { gte: filters.minRating });
  }
  if (filters.maxRating) {
    where.rating = _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, where.rating), { lte: filters.maxRating });
  }
  if (filters.isVerifiedPurchase !== void 0) {
    where.isVerifiedPurchase = filters.isVerifiedPurchase;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { content: { contains: filters.search, mode: "insensitive" } },
      { reviewerName: { contains: filters.search, mode: "insensitive" } }
    ];
  }
  const [reviews, total] = await Promise.all([
    _chunkI5PINI5Tjs.prisma.productReview.findMany({
      where,
      orderBy: { [sort.field]: sort.direction },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: {
              take: 1,
              include: {
                media: {
                  select: { url: true }
                }
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    _chunkI5PINI5Tjs.prisma.productReview.count({ where })
  ]);
  return {
    reviews,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}
async function getProductReviews(productId, page = 1, pageSize = 10, sort = { field: "helpfulCount", direction: "desc" }) {
  return getReviews(
    { productId, status: "APPROVED" },
    sort,
    page,
    pageSize
  );
}
async function getReviewById(reviewId) {
  return getReviewWithVotes(reviewId);
}
async function submitReview(data) {
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  const product = await _chunkI5PINI5Tjs.prisma.product.findUnique({
    where: { id: data.productId }
  });
  if (!product) {
    throw new Error("Product not found");
  }
  let isVerifiedPurchase = false;
  if (data.orderId) {
    const orderItem = await _chunkI5PINI5Tjs.prisma.orderItem.findFirst({
      where: {
        order: {
          id: data.orderId,
          paymentStatus: "PAID"
        },
        productId: data.productId
      }
    });
    isVerifiedPurchase = !!orderItem;
  } else if (data.customerId) {
    const orderItem = await _chunkI5PINI5Tjs.prisma.orderItem.findFirst({
      where: {
        order: {
          customerId: data.customerId,
          paymentStatus: "PAID"
        },
        productId: data.productId
      }
    });
    isVerifiedPurchase = !!orderItem;
  }
  const existingReview = await _chunkI5PINI5Tjs.prisma.productReview.findFirst({
    where: {
      productId: data.productId,
      OR: [
        ...data.customerId ? [{ customerId: data.customerId }] : [],
        { reviewerEmail: data.reviewerEmail }
      ]
    }
  });
  if (existingReview) {
    throw new Error("You have already reviewed this product");
  }
  const review = await _chunkI5PINI5Tjs.prisma.productReview.create({
    data: {
      productId: data.productId,
      customerId: data.customerId,
      orderId: data.orderId,
      reviewerName: data.reviewerName,
      reviewerEmail: data.reviewerEmail,
      rating: data.rating,
      title: data.title,
      content: data.content,
      pros: data.pros,
      cons: data.cons,
      images: data.images || [],
      isVerifiedPurchase,
      status: "PENDING",
      // Requires moderation
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      }
    }
  });
  return review;
}
async function updateReview(reviewId, data) {
  const updateData = {};
  if (data.status) {
    updateData.status = data.status;
    if (data.status === "APPROVED") {
      updateData.publishedAt = /* @__PURE__ */ new Date();
    }
  }
  if (data.responseContent !== void 0) {
    updateData.responseContent = data.responseContent;
    updateData.responseAt = /* @__PURE__ */ new Date();
    updateData.respondedById = data.respondedById;
  }
  return _chunkI5PINI5Tjs.prisma.productReview.update({
    where: { id: reviewId },
    data: updateData,
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      }
    }
  });
}
async function deleteReview(reviewId) {
  return _chunkI5PINI5Tjs.prisma.productReview.delete({
    where: { id: reviewId }
  });
}
async function approveReview(reviewId) {
  return updateReview(reviewId, { status: "APPROVED" });
}
async function rejectReview(reviewId) {
  return updateReview(reviewId, { status: "REJECTED" });
}
async function flagReview(reviewId) {
  return updateReview(reviewId, { status: "FLAGGED" });
}
async function respondToReview(reviewId, responseContent, respondedById) {
  return updateReview(reviewId, {
    responseContent,
    respondedById
  });
}
async function voteReview(reviewId, helpful, userId, email) {
  if (!userId && !email) {
    throw new Error("User ID or email is required to vote");
  }
  const existingVote = await _chunkI5PINI5Tjs.prisma.reviewVote.findFirst({
    where: {
      reviewId,
      OR: [
        ...userId ? [{ userId }] : [],
        ...email ? [{ email }] : []
      ]
    }
  });
  if (existingVote) {
    if (existingVote.helpful !== helpful) {
      await _chunkI5PINI5Tjs.prisma.$transaction([
        _chunkI5PINI5Tjs.prisma.reviewVote.update({
          where: { id: existingVote.id },
          data: { helpful }
        }),
        _chunkI5PINI5Tjs.prisma.productReview.update({
          where: { id: reviewId },
          data: {
            helpfulCount: helpful ? { increment: 1 } : { decrement: 1 },
            unhelpfulCount: helpful ? { decrement: 1 } : { increment: 1 }
          }
        })
      ]);
    }
    return { updated: true };
  }
  await _chunkI5PINI5Tjs.prisma.$transaction([
    _chunkI5PINI5Tjs.prisma.reviewVote.create({
      data: {
        reviewId,
        userId,
        email,
        helpful
      }
    }),
    _chunkI5PINI5Tjs.prisma.productReview.update({
      where: { id: reviewId },
      data: {
        helpfulCount: helpful ? { increment: 1 } : void 0,
        unhelpfulCount: helpful ? void 0 : { increment: 1 }
      }
    })
  ]);
  return { created: true };
}
async function getProductReviewStats(productId) {
  const reviews = await _chunkI5PINI5Tjs.prisma.productReview.findMany({
    where: {
      productId,
      status: "APPROVED"
    },
    select: {
      rating: true,
      isVerifiedPurchase: true,
      images: true
    }
  });
  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedPurchaseCount: 0,
      withImagesCount: 0
    };
  }
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  let verifiedPurchaseCount = 0;
  let withImagesCount = 0;
  for (const review of reviews) {
    ratingDistribution[review.rating]++;
    ratingSum += review.rating;
    if (review.isVerifiedPurchase) verifiedPurchaseCount++;
    if (review.images && Array.isArray(review.images) && review.images.length > 0) {
      withImagesCount++;
    }
  }
  return {
    averageRating: Math.round(ratingSum / totalReviews * 10) / 10,
    totalReviews,
    ratingDistribution,
    verifiedPurchaseCount,
    withImagesCount
  };
}
async function getReviewDashboardStats() {
  const [total, pending, approved, rejected, flagged, avgRating] = await Promise.all([
    _chunkI5PINI5Tjs.prisma.productReview.count(),
    _chunkI5PINI5Tjs.prisma.productReview.count({ where: { status: "PENDING" } }),
    _chunkI5PINI5Tjs.prisma.productReview.count({ where: { status: "APPROVED" } }),
    _chunkI5PINI5Tjs.prisma.productReview.count({ where: { status: "REJECTED" } }),
    _chunkI5PINI5Tjs.prisma.productReview.count({ where: { status: "FLAGGED" } }),
    _chunkI5PINI5Tjs.prisma.productReview.aggregate({
      where: { status: "APPROVED" },
      _avg: { rating: true }
    })
  ]);
  return {
    total,
    pending,
    approved,
    rejected,
    flagged,
    averageRating: Math.round((avgRating._avg.rating || 0) * 10) / 10
  };
}
async function canCustomerReviewProduct(productId, customerId, email) {
  if (!customerId && !email) {
    return {
      canReview: true,
      isVerifiedPurchaser: false
    };
  }
  const existingReview = await _chunkI5PINI5Tjs.prisma.productReview.findFirst({
    where: {
      productId,
      OR: [
        ...customerId ? [{ customerId }] : [],
        ...email ? [{ reviewerEmail: email }] : []
      ]
    }
  });
  if (existingReview) {
    return {
      canReview: false,
      reason: "You have already reviewed this product",
      isVerifiedPurchaser: existingReview.isVerifiedPurchase
    };
  }
  let isVerifiedPurchaser = false;
  if (customerId) {
    const purchase = await _chunkI5PINI5Tjs.prisma.orderItem.findFirst({
      where: {
        order: {
          customerId,
          paymentStatus: "PAID"
        },
        productId
      }
    });
    isVerifiedPurchaser = !!purchase;
  }
  return {
    canReview: true,
    isVerifiedPurchaser
  };
}
async function getOrdersForReviewRequest(daysAfterDelivery = 7, limit = 50) {
  const cutoffDate = /* @__PURE__ */ new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAfterDelivery);
  const orders = await _chunkI5PINI5Tjs.prisma.order.findMany({
    where: {
      status: "DELIVERED",
      paymentStatus: "PAID",
      // Filter out orders that already have review request sent (stored in internalNotes)
      NOT: {
        internalNotes: { contains: "[REVIEW_REQUEST_SENT]" }
      },
      // Find orders with shipments delivered around the cutoff
      shipments: {
        some: {
          deliveredAt: {
            lte: cutoffDate,
            gte: new Date(cutoffDate.getTime() - 24 * 60 * 60 * 1e3)
            // Within 1 day window
          }
        }
      }
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: {
                take: 1,
                include: {
                  media: {
                    select: { url: true }
                  }
                }
              }
            }
          }
        }
      },
      customer: {
        select: {
          firstName: true,
          lastName: true
        }
      },
      shippingAddress: true
    },
    take: limit
  });
  return orders;
}
async function sendReviewRequestEmail(orderId) {
  try {
    const order = await _chunkI5PINI5Tjs.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: {
                  take: 1,
                  include: {
                    media: {
                      select: { url: true }
                    }
                  }
                }
              }
            }
          }
        },
        customer: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        shippingAddress: true
      }
    });
    if (!order || !order.email) {
      return { success: false, error: "Order not found or no email" };
    }
    const settings = await _chunkMT3LB7M4js.getEmailSettings.call(void 0, );
    const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const storeName = settings.fromName || "Our Store";
    const productsToReview = [];
    for (const item of order.items) {
      const existingReview = await _chunkI5PINI5Tjs.prisma.productReview.findFirst({
        where: {
          productId: item.productId,
          reviewerEmail: order.email
        }
      });
      if (!existingReview && item.product) {
        productsToReview.push(item);
      }
    }
    if (productsToReview.length === 0) {
      await markReviewRequestSent(orderId);
      return { success: true, messageId: "skipped-already-reviewed" };
    }
    const customerName = order.shippingAddress ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim() : order.customer ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(" ") || "Valued Customer" : "Valued Customer";
    const emailHtml = generateReviewRequestEmail({
      storeName,
      storeUrl,
      customerName,
      orderNumber: order.orderNumber,
      products: productsToReview.map((item) => {
        var _a, _b;
        return {
          id: item.product.id,
          name: item.product.title,
          slug: item.product.slug,
          imageUrl: (_b = (_a = item.product.images[0]) == null ? void 0 : _a.media) == null ? void 0 : _b.url
        };
      })
    });
    const result = await _chunkMT3LB7M4js.sendEmail.call(void 0, {
      to: { email: order.email, name: customerName },
      subject: `How was your purchase? Leave a review!`,
      html: emailHtml
    });
    if (result.success) {
      await markReviewRequestSent(orderId);
    }
    return result;
  } catch (error) {
    console.error("Send review request email error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email"
    };
  }
}
async function markReviewRequestSent(orderId) {
  const order = await _chunkI5PINI5Tjs.prisma.order.findUnique({
    where: { id: orderId },
    select: { internalNotes: true }
  });
  const currentNotes = (order == null ? void 0 : order.internalNotes) || "";
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const marker = `[REVIEW_REQUEST_SENT:${timestamp}]`;
  await _chunkI5PINI5Tjs.prisma.order.update({
    where: { id: orderId },
    data: {
      internalNotes: currentNotes ? `${currentNotes}
${marker}` : marker
    }
  });
}
function generateReviewRequestEmail(data) {
  const productBlocks = data.products.map(
    (product) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            ${product.imageUrl ? `
            <td width="80" valign="middle" style="padding-right: 16px;">
              <img src="${product.imageUrl}" alt="${product.name}" width="80" height="80" style="border-radius: 8px; object-fit: cover;">
            </td>
            ` : ""}
            <td valign="middle">
              <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #18181b;">${product.name}</p>
              <a href="${data.storeUrl}/products/${product.slug}?review=true#reviews" style="display: inline-block; padding: 8px 16px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Write a Review</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
  ).join("");
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review Your Purchase</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: #18181b; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${data.storeName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Star Rating Icon -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="font-size: 48px;">
                      <span style="color: #fbbf24;">&#9733;</span>
                      <span style="color: #fbbf24;">&#9733;</span>
                      <span style="color: #fbbf24;">&#9733;</span>
                      <span style="color: #fbbf24;">&#9733;</span>
                      <span style="color: #fbbf24;">&#9733;</span>
                    </div>
                  </td>
                </tr>
              </table>

              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b; text-align: center;">How was your purchase?</h2>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; line-height: 1.6; text-align: center;">
                Hi ${data.customerName},<br><br>
                We hope you're enjoying your recent purchase from order #${data.orderNumber}! Your feedback helps other shoppers make informed decisions and helps us improve.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; line-height: 1.6; text-align: center;">
                <strong>Would you take a moment to share your experience?</strong>
              </p>

              <!-- Products to Review -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                ${productBlocks}
              </table>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6; text-align: center;">
                Your honest review, whether positive or constructive, is valuable to us and our community.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f4f4f5; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                Thank you for shopping with ${data.storeName}
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                <a href="${data.storeUrl}" style="color: #71717a; text-decoration: underline;">Visit our store</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
async function bulkApproveReviews(reviewIds) {
  return _chunkI5PINI5Tjs.prisma.productReview.updateMany({
    where: { id: { in: reviewIds } },
    data: {
      status: "APPROVED",
      publishedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function bulkRejectReviews(reviewIds) {
  return _chunkI5PINI5Tjs.prisma.productReview.updateMany({
    where: { id: { in: reviewIds } },
    data: { status: "REJECTED" }
  });
}
async function bulkDeleteReviews(reviewIds) {
  return _chunkI5PINI5Tjs.prisma.productReview.deleteMany({
    where: { id: { in: reviewIds } }
  });
}

// src/lib/seo/types.ts
var DEFAULT_SEO_CONFIG = {
  siteName: "My Store",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  defaultTitle: "My Store",
  titleTemplate: "%s | My Store",
  defaultDescription: "Welcome to our store",
  locale: "en_US",
  themeColor: "#000000"
};
var ROBOTS_CONFIGS = {
  default: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  noIndex: {
    index: false,
    follow: true
  },
  noFollow: {
    index: true,
    follow: false
  },
  none: {
    index: false,
    follow: false
  }
};

// src/lib/seo/index.ts
var seoConfigCache = null;
var seoConfigCacheTime = 0;
var SEO_CACHE_TTL = 60 * 1e3;
async function getSeoConfig() {
  const now = Date.now();
  if (seoConfigCache && now - seoConfigCacheTime < SEO_CACHE_TTL) {
    return seoConfigCache;
  }
  const settings = await _chunkI5PINI5Tjs.prisma.setting.findMany({
    where: { key: { startsWith: "seo." } }
  });
  const config = _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, DEFAULT_SEO_CONFIG);
  for (const setting of settings) {
    const key = setting.key.replace("seo.", "");
    switch (key) {
      case "siteName":
        config.siteName = setting.value;
        break;
      case "siteUrl":
        config.siteUrl = setting.value;
        break;
      case "defaultTitle":
        config.defaultTitle = setting.value;
        break;
      case "titleTemplate":
        config.titleTemplate = setting.value;
        break;
      case "defaultDescription":
        config.defaultDescription = setting.value;
        break;
      case "defaultImage":
        config.defaultImage = setting.value;
        break;
      case "twitterHandle":
        config.twitterHandle = setting.value;
        break;
      case "locale":
        config.locale = setting.value;
        break;
      case "themeColor":
        config.themeColor = setting.value;
        break;
      case "keywords":
        config.keywords = JSON.parse(setting.value);
        break;
    }
  }
  seoConfigCache = config;
  seoConfigCacheTime = now;
  return config;
}
function clearSeoConfigCache() {
  seoConfigCache = null;
  seoConfigCacheTime = 0;
}
async function generateMetadata(pageSeo = {}, type = "website") {
  const config = await getSeoConfig();
  const title = pageSeo.title || config.defaultTitle;
  const description = pageSeo.description || config.defaultDescription;
  const image = pageSeo.image || config.defaultImage;
  const url = pageSeo.canonical || config.siteUrl;
  const metadata = {
    title: pageSeo.title ? config.titleTemplate.replace("%s", pageSeo.title) : config.defaultTitle,
    description,
    keywords: pageSeo.keywords || config.keywords,
    authors: pageSeo.author ? [{ name: pageSeo.author }] : void 0,
    metadataBase: new URL(config.siteUrl),
    alternates: {
      canonical: pageSeo.canonical
    },
    openGraph: {
      title,
      description,
      url,
      siteName: config.siteName,
      locale: config.locale,
      type,
      images: image ? [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title
        }
      ] : void 0
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : void 0,
      creator: config.twitterHandle,
      site: config.twitterHandle
    },
    robots: {
      index: !pageSeo.noIndex,
      follow: !pageSeo.noFollow,
      googleBot: {
        index: !pageSeo.noIndex,
        follow: !pageSeo.noFollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1
      }
    }
  };
  return metadata;
}
async function generateProductMetadata(product) {
  const baseMetadata = await generateMetadata(product, "product");
  if (baseMetadata.openGraph && product.price) {
    baseMetadata.openGraph.price = {
      amount: product.price.toString(),
      currency: product.currency || "USD"
    };
  }
  return baseMetadata;
}
async function generateArticleMetadata(article) {
  const metadata = await generateMetadata(article, "article");
  if (metadata.openGraph) {
    const og = metadata.openGraph;
    og.type = "article";
    if (article.publishedTime) {
      og.publishedTime = article.publishedTime;
    }
    if (article.modifiedTime) {
      og.modifiedTime = article.modifiedTime;
    }
    if (article.author) {
      og.authors = [article.author];
    }
    if (article.section) {
      og.section = article.section;
    }
    if (article.tags) {
      og.tags = article.tags;
    }
  }
  return metadata;
}
function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#000000" }
    ]
  };
}
function generateOrganizationSchema(org) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: org.url,
    logo: org.logo,
    description: org.description,
    sameAs: org.sameAs,
    contactPoint: org.contactPoint ? {
      "@type": "ContactPoint",
      contactType: org.contactPoint.type,
      telephone: org.contactPoint.telephone,
      email: org.contactPoint.email,
      areaServed: org.contactPoint.areaServed,
      availableLanguage: org.contactPoint.availableLanguage
    } : void 0
  };
}
function generateLocalBusinessSchema(business) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    url: business.url,
    logo: business.logo,
    description: business.description,
    sameAs: business.sameAs,
    address: business.address ? {
      "@type": "PostalAddress",
      streetAddress: business.address.streetAddress,
      addressLocality: business.address.addressLocality,
      addressRegion: business.address.addressRegion,
      postalCode: business.address.postalCode,
      addressCountry: business.address.addressCountry
    } : void 0,
    geo: business.geo ? {
      "@type": "GeoCoordinates",
      latitude: business.geo.latitude,
      longitude: business.geo.longitude
    } : void 0,
    openingHoursSpecification: business.openingHours,
    priceRange: business.priceRange
  };
}
async function generateWebsiteSchema(searchPath = "/search") {
  const config = await getSeoConfig();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.siteName,
    url: config.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${config.siteUrl}${searchPath}?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}
async function generateBreadcrumbSchema(items) {
  const config = await getSeoConfig();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${config.siteUrl}${item.url}`
    }))
  };
}
async function generateProductSchema(product) {
  const config = await getSeoConfig();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: product.brand ? {
      "@type": "Brand",
      name: product.brand
    } : void 0,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "USD",
      availability: `https://schema.org/${product.availability || "InStock"}`,
      url: product.url || config.siteUrl
    }
  };
  if (product.reviewCount && product.ratingValue) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount
    };
  }
  return schema;
}
async function generateArticleSchema(article) {
  const config = await getSeoConfig();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: article.author ? {
      "@type": "Person",
      name: article.author
    } : void 0,
    publisher: {
      "@type": "Organization",
      name: config.siteName,
      logo: config.defaultImage ? {
        "@type": "ImageObject",
        url: config.defaultImage
      } : void 0
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url || config.siteUrl
    }
  };
}
function generateFaqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}
function renderJsonLd(data) {
  const jsonLd = Array.isArray(data) ? data : [data];
  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

// src/lib/site-settings/index.ts
var _react = require('react');
var DEFAULT_SITE_SETTINGS_ID = "default";
var getSiteSettings = _react.cache.call(void 0, async () => {
  try {
    const settings = await _chunkI5PINI5Tjs.prisma.siteSettings.findUnique({
      where: { id: DEFAULT_SITE_SETTINGS_ID }
    });
    if (!settings) {
      return null;
    }
    return {
      id: settings.id,
      header: settings.header,
      footer: settings.footer,
      announcementBar: settings.announcementBar,
      showAnnouncementBar: settings.showAnnouncementBar,
      siteName: settings.siteName,
      siteTagline: settings.siteTagline,
      logoUrl: settings.logoUrl,
      logoAlt: settings.logoAlt,
      faviconUrl: settings.faviconUrl,
      socialLinks: settings.socialLinks,
      defaultMetaTitle: settings.defaultMetaTitle,
      defaultMetaDescription: settings.defaultMetaDescription,
      defaultOgImage: settings.defaultOgImage,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      businessAddress: settings.businessAddress,
      googleAnalyticsId: settings.googleAnalyticsId,
      facebookPixelId: settings.facebookPixelId
    };
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return null;
  }
});
async function getOrCreateSiteSettings() {
  let settings = await getSiteSettings();
  if (!settings) {
    const created = await _chunkI5PINI5Tjs.prisma.siteSettings.create({
      data: {
        id: DEFAULT_SITE_SETTINGS_ID,
        showAnnouncementBar: false
      }
    });
    settings = {
      id: created.id,
      header: null,
      footer: null,
      announcementBar: null,
      showAnnouncementBar: created.showAnnouncementBar,
      siteName: null,
      siteTagline: null,
      logoUrl: null,
      logoAlt: null,
      faviconUrl: null,
      socialLinks: null,
      defaultMetaTitle: null,
      defaultMetaDescription: null,
      defaultOgImage: null,
      contactEmail: null,
      contactPhone: null,
      businessAddress: null,
      googleAnalyticsId: null,
      facebookPixelId: null
    };
  }
  return settings;
}
async function updateSiteSettings(data) {
  const prismaData = _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, data.header !== void 0 && { header: data.header }), data.footer !== void 0 && { footer: data.footer }), data.announcementBar !== void 0 && { announcementBar: data.announcementBar }), data.showAnnouncementBar !== void 0 && { showAnnouncementBar: data.showAnnouncementBar }), data.siteName !== void 0 && { siteName: data.siteName }), data.siteTagline !== void 0 && { siteTagline: data.siteTagline }), data.logoUrl !== void 0 && { logoUrl: data.logoUrl }), data.logoAlt !== void 0 && { logoAlt: data.logoAlt }), data.faviconUrl !== void 0 && { faviconUrl: data.faviconUrl }), data.socialLinks !== void 0 && { socialLinks: data.socialLinks }), data.defaultMetaTitle !== void 0 && { defaultMetaTitle: data.defaultMetaTitle }), data.defaultMetaDescription !== void 0 && { defaultMetaDescription: data.defaultMetaDescription }), data.defaultOgImage !== void 0 && { defaultOgImage: data.defaultOgImage }), data.contactEmail !== void 0 && { contactEmail: data.contactEmail }), data.contactPhone !== void 0 && { contactPhone: data.contactPhone }), data.businessAddress !== void 0 && { businessAddress: data.businessAddress }), data.googleAnalyticsId !== void 0 && { googleAnalyticsId: data.googleAnalyticsId }), data.facebookPixelId !== void 0 && { facebookPixelId: data.facebookPixelId });
  const updated = await _chunkI5PINI5Tjs.prisma.siteSettings.upsert({
    where: { id: DEFAULT_SITE_SETTINGS_ID },
    create: _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      id: DEFAULT_SITE_SETTINGS_ID
    }, prismaData),
    update: prismaData
  });
  return {
    id: updated.id,
    header: updated.header,
    footer: updated.footer,
    announcementBar: updated.announcementBar,
    showAnnouncementBar: updated.showAnnouncementBar,
    siteName: updated.siteName,
    siteTagline: updated.siteTagline,
    logoUrl: updated.logoUrl,
    logoAlt: updated.logoAlt,
    faviconUrl: updated.faviconUrl,
    socialLinks: updated.socialLinks,
    defaultMetaTitle: updated.defaultMetaTitle,
    defaultMetaDescription: updated.defaultMetaDescription,
    defaultOgImage: updated.defaultOgImage,
    contactEmail: updated.contactEmail,
    contactPhone: updated.contactPhone,
    businessAddress: updated.businessAddress,
    googleAnalyticsId: updated.googleAnalyticsId,
    facebookPixelId: updated.facebookPixelId
  };
}
async function updateHeaderConfig(headerData) {
  return updateSiteSettings({ header: headerData });
}
async function updateFooterConfig(footerData) {
  return updateSiteSettings({ footer: footerData });
}
async function updateAnnouncementBarConfig(announcementData, showAnnouncementBar) {
  return updateSiteSettings({
    announcementBar: announcementData,
    showAnnouncementBar
  });
}

// src/lib/workflows/event-bus.ts
var _uuid = require('uuid');
var EventBus = class {
  constructor() {
    this.subscriptions = /* @__PURE__ */ new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1e3;
  }
  /**
   * Subscribe to events
   */
  subscribe(subscription) {
    const id = _uuid.v4.call(void 0, );
    const fullSubscription = _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, subscription), { id });
    const eventTypes = Array.isArray(subscription.eventType) ? subscription.eventType : [subscription.eventType];
    for (const eventType of eventTypes) {
      const existing = this.subscriptions.get(eventType) || [];
      existing.push(fullSubscription);
      existing.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      this.subscriptions.set(eventType, existing);
    }
    return id;
  }
  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId) {
    let found = false;
    for (const [eventType, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((s) => s.id !== subscriptionId);
      if (filtered.length !== subs.length) {
        found = true;
        this.subscriptions.set(eventType, filtered);
      }
    }
    return found;
  }
  /**
   * Emit an event
   */
  async emit(type, data, metadata) {
    const event = {
      id: _uuid.v4.call(void 0, ),
      type,
      timestamp: /* @__PURE__ */ new Date(),
      data,
      metadata
    };
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
    const subscribers = this.subscriptions.get(type) || [];
    const wildcardSubscribers = this.subscriptions.get("*") || [];
    const allSubscribers = [...subscribers, ...wildcardSubscribers];
    for (const subscription of allSubscribers) {
      try {
        if (subscription.filter && !subscription.filter(event)) {
          continue;
        }
        await subscription.handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${type}:`, error);
      }
    }
    await this.triggerEventWorkflows(event);
  }
  /**
   * Emit event without waiting for handlers (fire-and-forget)
   */
  emitAsync(type, data, metadata) {
    this.emit(type, data, metadata).catch((error) => {
      console.error(`[EventBus] Async emit error for ${type}:`, error);
    });
  }
  /**
   * Get recent events
   */
  getHistory(limit = 100) {
    return this.eventHistory.slice(-limit);
  }
  /**
   * Get subscriptions for debugging
   */
  getSubscriptions() {
    return new Map(this.subscriptions);
  }
  /**
   * Clear all subscriptions (for testing)
   */
  clearSubscriptions() {
    this.subscriptions.clear();
  }
  /**
   * Trigger workflows configured for EVENT trigger type
   */
  async triggerEventWorkflows(event) {
    try {
      const workflows = await _chunkI5PINI5Tjs.prisma.workflow.findMany({
        where: {
          enabled: true,
          triggerType: "EVENT"
        }
      });
      for (const workflow of workflows) {
        const triggerConfig = workflow.triggerConfig;
        if (!triggerConfig) continue;
        const eventTypes = triggerConfig.eventTypes;
        if (!eventTypes || !eventTypes.includes(event.type)) continue;
        const filter = triggerConfig.filter;
        if (filter && !this.matchesFilter(event.data, filter)) continue;
        const { executeWorkflow: executeWorkflow2 } = await Promise.resolve().then(() => _interopRequireWildcard(require("./engine-HXCA6C72.js")));
        executeWorkflow2(workflow.id, {
          triggeredBy: "event",
          eventData: event
        }).catch((error) => {
          console.error(`[EventBus] Workflow execution error for ${workflow.id}:`, error);
        });
      }
    } catch (error) {
      console.error("[EventBus] Error triggering event workflows:", error);
    }
  }
  /**
   * Check if data matches a filter object
   */
  matchesFilter(data, filter) {
    if (!data || typeof data !== "object") return false;
    const dataObj = data;
    for (const [key, value] of Object.entries(filter)) {
      const dataValue = this.getNestedValue(dataObj, key);
      if (typeof value === "object" && value !== null) {
        const ops = value;
        if ("$eq" in ops && dataValue !== ops.$eq) return false;
        if ("$neq" in ops && dataValue === ops.$neq) return false;
        if ("$gt" in ops && (typeof dataValue !== "number" || dataValue <= ops.$gt)) return false;
        if ("$gte" in ops && (typeof dataValue !== "number" || dataValue < ops.$gte)) return false;
        if ("$lt" in ops && (typeof dataValue !== "number" || dataValue >= ops.$lt)) return false;
        if ("$lte" in ops && (typeof dataValue !== "number" || dataValue > ops.$lte)) return false;
        if ("$in" in ops && !Array.isArray(ops.$in)) return false;
        if ("$in" in ops && !ops.$in.includes(dataValue)) return false;
        if ("$contains" in ops && (typeof dataValue !== "string" || !dataValue.includes(ops.$contains))) return false;
        if ("$exists" in ops && (ops.$exists ? dataValue === void 0 : dataValue !== void 0)) return false;
      } else {
        if (dataValue !== value) return false;
      }
    }
    return true;
  }
  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      if (current && typeof current === "object") {
        return current[key];
      }
      return void 0;
    }, obj);
  }
};
var eventBus = new EventBus();
function emit(type, data, metadata) {
  return eventBus.emit(type, data, metadata);
}
function emitAsync(type, data, metadata) {
  eventBus.emitAsync(type, data, metadata);
}
function subscribe(subscription) {
  return eventBus.subscribe(subscription);
}
function unsubscribe(subscriptionId) {
  return eventBus.unsubscribe(subscriptionId);
}
var events = {
  // Order events
  order: {
    created: (order) => emit("order.created", order),
    paid: (order) => emit("order.paid", order),
    shipped: (order, shipment) => emit("order.shipped", { order, shipment }),
    delivered: (order) => emit("order.delivered", order),
    cancelled: (order, reason) => emit("order.cancelled", { order, reason }),
    refunded: (order, refund) => emit("order.refunded", { order, refund })
  },
  // User events
  user: {
    created: (user) => emit("user.created", user),
    updated: (user, changes) => emit("user.updated", { user, changes }),
    deleted: (userId) => emit("user.deleted", { userId }),
    subscribed: (user, list) => emit("user.subscribed", { user, list }),
    unsubscribed: (user, list) => emit("user.unsubscribed", { user, list })
  },
  // Product events
  product: {
    created: (product) => emit("product.created", product),
    updated: (product, changes) => emit("product.updated", { product, changes }),
    deleted: (productId) => emit("product.deleted", { productId }),
    lowStock: (product, threshold) => emit("product.low_stock", { product, threshold }),
    outOfStock: (product) => emit("product.out_of_stock", product)
  },
  // Content events
  content: {
    pageCreated: (page) => emit("page.created", page),
    pagePublished: (page) => emit("page.published", page),
    pageUpdated: (page) => emit("page.updated", page),
    blogCreated: (post) => emit("blog.created", post),
    blogPublished: (post) => emit("blog.published", post),
    blogUpdated: (post) => emit("blog.updated", post)
  },
  // Payment events
  payment: {
    succeeded: (payment) => emit("payment.succeeded", payment),
    failed: (payment, error) => emit("payment.failed", { payment, error }),
    subscriptionCreated: (subscription) => emit("subscription.created", subscription),
    subscriptionCancelled: (subscription) => emit("subscription.cancelled", subscription)
  },
  // Form events
  form: {
    submitted: (form, data) => emit("form.submitted", { form, data }),
    contactCreated: (contact) => emit("contact.created", contact)
  },
  // Webhook events
  webhook: {
    received: (source, payload) => emit("webhook.received", { source, payload })
  },
  // Custom events
  custom: (eventType, data) => emit(eventType, data)
};

// src/lib/workflows/react-flow.ts
var nodeTypeDefinitions = {
  trigger: {
    type: "trigger",
    label: "Trigger",
    description: "Starting point of the workflow",
    icon: "Zap",
    color: "#f59e0b",
    category: "trigger",
    handles: { inputs: 0, outputs: 1 }
  },
  primitive: {
    type: "primitive",
    label: "Action",
    description: "Execute a primitive action",
    icon: "Play",
    color: "#3b82f6",
    category: "action",
    handles: { inputs: 1, outputs: 1 }
  },
  condition: {
    type: "condition",
    label: "Condition",
    description: "Branch based on conditions",
    icon: "GitBranch",
    color: "#8b5cf6",
    category: "control",
    handles: { inputs: 1, outputs: 2, conditionalOutputs: ["true", "false"] }
  },
  loop: {
    type: "loop",
    label: "Loop",
    description: "Iterate over a collection",
    icon: "Repeat",
    color: "#10b981",
    category: "control",
    handles: { inputs: 1, outputs: 2, conditionalOutputs: ["body", "complete"] }
  },
  delay: {
    type: "delay",
    label: "Delay",
    description: "Wait for a specified duration",
    icon: "Clock",
    color: "#6b7280",
    category: "control",
    handles: { inputs: 1, outputs: 1 }
  },
  parallel: {
    type: "parallel",
    label: "Parallel",
    description: "Execute multiple branches simultaneously",
    icon: "GitMerge",
    color: "#ec4899",
    category: "control",
    handles: { inputs: 1, outputs: 4 }
  },
  output: {
    type: "output",
    label: "Output",
    description: "Workflow output/result",
    icon: "Flag",
    color: "#14b8a6",
    category: "output",
    handles: { inputs: 1, outputs: 0 }
  }
};
function toReactFlowNodes(templateNodes) {
  return templateNodes.map((node) => ({
    id: node.id,
    type: getReactFlowNodeType(node.data.nodeType),
    position: node.position,
    data: {
      label: node.data.label,
      nodeType: node.data.nodeType,
      primitiveId: node.data.primitiveId,
      config: node.data.config
    }
  }));
}
function toReactFlowEdges(templateEdges) {
  return templateEdges.map((edge) => {
    var _a;
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: ((_a = edge.data) == null ? void 0 : _a.condition) ? "conditional" : "default",
      animated: false,
      data: edge.data
    };
  });
}
function fromReactFlowNodes(nodes) {
  return nodes.map((node) => ({
    id: node.id,
    type: node.data.nodeType,
    position: node.position,
    data: {
      label: node.data.label,
      nodeType: node.data.nodeType,
      primitiveId: node.data.primitiveId,
      config: node.data.config
    }
  }));
}
function fromReactFlowEdges(edges) {
  return edges.map((edge) => {
    var _a, _b;
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: (_a = edge.sourceHandle) != null ? _a : void 0,
      targetHandle: (_b = edge.targetHandle) != null ? _b : void 0,
      data: edge.data
    };
  });
}
function getReactFlowNodeType(nodeType) {
  return `workflow-${nodeType}`;
}
function validateWorkflow(nodes, edges) {
  const errors = [];
  const warnings = [];
  const triggerNodes = nodes.filter((n) => n.data.nodeType === "trigger");
  if (triggerNodes.length === 0) {
    errors.push({
      type: "error",
      code: "NO_TRIGGER",
      message: "Workflow must have at least one trigger node"
    });
  }
  if (triggerNodes.length > 1) {
    warnings.push({
      type: "warning",
      code: "MULTIPLE_TRIGGERS",
      message: "Workflow has multiple trigger nodes"
    });
  }
  const connectedNodeIds = /* @__PURE__ */ new Set();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });
  nodes.forEach((node) => {
    if (node.data.nodeType === "trigger") {
      if (!edges.some((e) => e.source === node.id)) {
        warnings.push({
          type: "warning",
          code: "DEAD_END_TRIGGER",
          message: `Trigger node "${node.data.label}" has no outgoing connections`,
          nodeId: node.id
        });
      }
      return;
    }
    if (!edges.some((e) => e.target === node.id)) {
      errors.push({
        type: "error",
        code: "DISCONNECTED_NODE",
        message: `Node "${node.data.label}" has no incoming connections`,
        nodeId: node.id
      });
    }
  });
  nodes.filter((n) => n.data.nodeType === "primitive").forEach((node) => {
    if (!node.data.primitiveId) {
      errors.push({
        type: "error",
        code: "MISSING_PRIMITIVE",
        message: `Action node "${node.data.label}" has no primitive assigned`,
        nodeId: node.id
      });
    }
  });
  nodes.filter((n) => n.data.nodeType === "condition").forEach((node) => {
    var _a;
    if (!((_a = node.data.config) == null ? void 0 : _a.condition)) {
      warnings.push({
        type: "warning",
        code: "MISSING_CONDITION",
        message: `Condition node "${node.data.label}" has no condition configured`,
        nodeId: node.id
      });
    }
  });
  edges.forEach((edge) => {
    if (edge.source === edge.target) {
      errors.push({
        type: "error",
        code: "SELF_LOOP",
        message: "Edge creates a self-loop",
        edgeId: edge.id
      });
    }
  });
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
function autoLayoutNodes(nodes, edges, options) {
  const direction = (options == null ? void 0 : options.direction) || "TB";
  const spacingX = (options == null ? void 0 : options.nodeSpacingX) || 200;
  const spacingY = (options == null ? void 0 : options.nodeSpacingY) || 100;
  const children = /* @__PURE__ */ new Map();
  const parents = /* @__PURE__ */ new Map();
  nodes.forEach((node) => {
    children.set(node.id, []);
    parents.set(node.id, []);
  });
  edges.forEach((edge) => {
    var _a, _b;
    (_a = children.get(edge.source)) == null ? void 0 : _a.push(edge.target);
    (_b = parents.get(edge.target)) == null ? void 0 : _b.push(edge.source);
  });
  const rootNodes = nodes.filter(
    (n) => {
      var _a;
      return n.data.nodeType === "trigger" || ((_a = parents.get(n.id)) == null ? void 0 : _a.length) === 0;
    }
  );
  const levels = /* @__PURE__ */ new Map();
  const queue = rootNodes.map((n) => ({
    id: n.id,
    level: 0
  }));
  while (queue.length > 0) {
    const { id, level } = queue.shift();
    if (levels.has(id)) continue;
    levels.set(id, level);
    const nodeChildren = children.get(id) || [];
    nodeChildren.forEach((childId) => {
      queue.push({ id: childId, level: level + 1 });
    });
  }
  const levelGroups = /* @__PURE__ */ new Map();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level).push(nodeId);
  });
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return nodes.map((node) => {
    const level = levels.get(node.id) || 0;
    const nodesAtLevel = levelGroups.get(level) || [];
    const indexAtLevel = nodesAtLevel.indexOf(node.id);
    const totalWidth = (nodesAtLevel.length - 1) * spacingX;
    const startX = -totalWidth / 2;
    let position;
    if (direction === "TB") {
      position = {
        x: startX + indexAtLevel * spacingX,
        y: level * spacingY
      };
    } else {
      position = {
        x: level * spacingX,
        y: startX + indexAtLevel * spacingY
      };
    }
    return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, node), {
      position
    });
  });
}
var nodeIdCounter = 0;
function generateNodeId() {
  return `node_${Date.now()}_${++nodeIdCounter}`;
}
function generateEdgeId(source, target) {
  return `edge_${source}_${target}_${++nodeIdCounter}`;
}
function createTriggerNode(position, triggerType) {
  return {
    id: generateNodeId(),
    type: "workflow-trigger",
    position,
    data: {
      label: `${triggerType.charAt(0).toUpperCase() + triggerType.slice(1)} Trigger`,
      nodeType: "trigger",
      config: {}
    }
  };
}
function createPrimitiveNode(position, primitiveId, primitiveName, primitiveIcon) {
  return {
    id: generateNodeId(),
    type: "workflow-primitive",
    position,
    data: {
      label: primitiveName,
      nodeType: "primitive",
      primitiveId,
      primitiveName,
      primitiveIcon,
      config: {
        inputMapping: {}
      }
    }
  };
}
function createConditionNode(position, label = "Condition") {
  return {
    id: generateNodeId(),
    type: "workflow-condition",
    position,
    data: {
      label,
      nodeType: "condition",
      config: {
        condition: {
          type: "simple",
          field: "",
          operator: "eq",
          value: ""
        }
      }
    }
  };
}
function createOutputNode(position, label = "Output") {
  return {
    id: generateNodeId(),
    type: "workflow-output",
    position,
    data: {
      label,
      nodeType: "output",
      config: {
        inputMapping: {}
      }
    }
  };
}
function serializeWorkflow(nodes, edges, viewport) {
  return {
    nodes: fromReactFlowNodes(nodes),
    edges: fromReactFlowEdges(edges),
    viewport
  };
}
function deserializeWorkflow(data) {
  return {
    nodes: toReactFlowNodes(data.nodes),
    edges: toReactFlowEdges(data.edges),
    viewport: data.viewport
  };
}

// src/lib/workflows/actions/index.ts
var actionRegistry = /* @__PURE__ */ new Map();
function registerAction(action) {
  actionRegistry.set(action.name, action);
}
function getAction(name) {
  return actionRegistry.get(name);
}
function getAllActions() {
  return Array.from(actionRegistry.values());
}
function getActionsByCategory(category) {
  return getAllActions().filter((a) => a.category === category);
}
async function executeAction(name, input, context) {
  const action = getAction(name);
  if (!action) {
    throw new Error(`Action not found: ${name}`);
  }
  return action.handler(input, context);
}
registerAction({
  name: "http.request",
  description: "Make an HTTP request",
  category: "http",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Request URL" },
      method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
      headers: { type: "object", description: "Request headers" },
      body: { description: "Request body" },
      timeout: { type: "number", description: "Timeout in ms" }
    },
    required: ["url"]
  },
  handler: async (input) => {
    const { url, method = "GET", headers = {}, body, timeout = 3e4 } = input;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : void 0,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType == null ? void 0 : contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        ok: response.ok
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
});
registerAction({
  name: "http.webhook",
  description: "Send a webhook notification",
  category: "http",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Webhook URL" },
      payload: { type: "object", description: "Webhook payload" },
      secret: { type: "string", description: "Webhook secret for signing" }
    },
    required: ["url", "payload"]
  },
  handler: async (input) => {
    const { url, payload, secret } = input;
    const headers = {
      "Content-Type": "application/json"
    };
    if (secret) {
      const crypto = await Promise.resolve().then(() => _interopRequireWildcard(require("crypto")));
      const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
      headers["X-Webhook-Signature"] = signature;
    }
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    return {
      status: response.status,
      success: response.ok
    };
  }
});
registerAction({
  name: "data.transform",
  description: "Transform data using a mapping",
  category: "data",
  inputSchema: {
    type: "object",
    properties: {
      input: { description: "Input data to transform" },
      mapping: { type: "object", description: "Field mapping" }
    },
    required: ["input", "mapping"]
  },
  handler: async (input) => {
    const { input: data, mapping } = input;
    if (!data || typeof data !== "object") {
      return data;
    }
    const dataObj = data;
    const result = {};
    for (const [targetKey, sourceKey] of Object.entries(mapping)) {
      const value = sourceKey.split(".").reduce((obj, key) => {
        if (obj && typeof obj === "object") {
          return obj[key];
        }
        return void 0;
      }, dataObj);
      result[targetKey] = value;
    }
    return result;
  }
});
registerAction({
  name: "data.filter",
  description: "Filter array data",
  category: "data",
  inputSchema: {
    type: "object",
    properties: {
      array: { type: "array", description: "Array to filter" },
      field: { type: "string", description: "Field to check" },
      operator: { type: "string", enum: ["eq", "neq", "gt", "gte", "lt", "lte", "contains"] },
      value: { description: "Value to compare" }
    },
    required: ["array", "field", "operator", "value"]
  },
  handler: async (input) => {
    const { array, field, operator, value } = input;
    if (!Array.isArray(array)) {
      return [];
    }
    return array.filter((item) => {
      const fieldValue = item[field];
      switch (operator) {
        case "eq":
          return fieldValue === value;
        case "neq":
          return fieldValue !== value;
        case "gt":
          return typeof fieldValue === "number" && fieldValue > value;
        case "gte":
          return typeof fieldValue === "number" && fieldValue >= value;
        case "lt":
          return typeof fieldValue === "number" && fieldValue < value;
        case "lte":
          return typeof fieldValue === "number" && fieldValue <= value;
        case "contains":
          return typeof fieldValue === "string" && fieldValue.includes(value);
        default:
          return true;
      }
    });
  }
});
registerAction({
  name: "data.map",
  description: "Map array data to new structure",
  category: "data",
  inputSchema: {
    type: "object",
    properties: {
      array: { type: "array", description: "Array to map" },
      mapping: { type: "object", description: "Field mapping for each item" }
    },
    required: ["array", "mapping"]
  },
  handler: async (input) => {
    const { array, mapping } = input;
    if (!Array.isArray(array)) {
      return [];
    }
    return array.map((item) => {
      const result = {};
      const itemObj = item;
      for (const [targetKey, sourceKey] of Object.entries(mapping)) {
        result[targetKey] = itemObj[sourceKey];
      }
      return result;
    });
  }
});
registerAction({
  name: "data.aggregate",
  description: "Aggregate array data",
  category: "data",
  inputSchema: {
    type: "object",
    properties: {
      array: { type: "array", description: "Array to aggregate" },
      operation: { type: "string", enum: ["sum", "avg", "min", "max", "count"] },
      field: { type: "string", description: "Field to aggregate (for sum, avg, min, max)" }
    },
    required: ["array", "operation"]
  },
  handler: async (input) => {
    const { array, operation, field } = input;
    if (!Array.isArray(array)) {
      return null;
    }
    const values = field ? array.map((item) => item[field]).filter((v) => typeof v === "number") : array.filter((v) => typeof v === "number");
    switch (operation) {
      case "sum":
        return values.reduce((a, b) => a + b, 0);
      case "avg":
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case "min":
        return values.length > 0 ? Math.min(...values) : null;
      case "max":
        return values.length > 0 ? Math.max(...values) : null;
      case "count":
        return array.length;
      default:
        return null;
    }
  }
});
registerAction({
  name: "logic.switch",
  description: "Switch/case logic",
  category: "logic",
  inputSchema: {
    type: "object",
    properties: {
      value: { description: "Value to switch on" },
      cases: { type: "object", description: "Case mappings (value -> result)" },
      default: { description: "Default result if no case matches" }
    },
    required: ["value", "cases"]
  },
  handler: async (input) => {
    const { value, cases, default: defaultValue } = input;
    const casesObj = cases;
    const key = String(value);
    if (key in casesObj) {
      return casesObj[key];
    }
    return defaultValue;
  }
});
registerAction({
  name: "logic.coalesce",
  description: "Return first non-null value",
  category: "logic",
  inputSchema: {
    type: "object",
    properties: {
      values: { type: "array", description: "Array of values to check" }
    },
    required: ["values"]
  },
  handler: async (input) => {
    var _a;
    const { values } = input;
    if (!Array.isArray(values)) {
      return null;
    }
    return (_a = values.find((v) => v !== null && v !== void 0)) != null ? _a : null;
  }
});
registerAction({
  name: "string.template",
  description: "Render a string template",
  category: "string",
  inputSchema: {
    type: "object",
    properties: {
      template: { type: "string", description: "Template string with {{placeholders}}" },
      data: { type: "object", description: "Data for placeholders" }
    },
    required: ["template", "data"]
  },
  handler: async (input) => {
    const { template, data } = input;
    const dataObj = data;
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const value = dataObj[key.trim()];
      return value !== void 0 && value !== null ? String(value) : "";
    });
  }
});
registerAction({
  name: "string.format",
  description: "Format values (number, date, currency)",
  category: "string",
  inputSchema: {
    type: "object",
    properties: {
      value: { description: "Value to format" },
      type: { type: "string", enum: ["number", "date", "currency", "percent"] },
      locale: { type: "string", description: "Locale for formatting" },
      options: { type: "object", description: "Format options" }
    },
    required: ["value", "type"]
  },
  handler: async (input) => {
    const { value, type, locale = "en-US", options = {} } = input;
    switch (type) {
      case "number":
        return new Intl.NumberFormat(locale, options).format(value);
      case "date":
        return new Intl.DateTimeFormat(locale, options).format(new Date(value));
      case "currency":
        return new Intl.NumberFormat(locale, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
          style: "currency",
          currency: "USD"
        }, options)).format(value);
      case "percent":
        return new Intl.NumberFormat(locale, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
          style: "percent"
        }, options)).format(value);
      default:
        return String(value);
    }
  }
});
registerAction({
  name: "variable.set",
  description: "Set a workflow variable",
  category: "variable",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Variable name" },
      value: { description: "Variable value" }
    },
    required: ["name", "value"]
  },
  handler: async (input, context) => {
    const { name, value } = input;
    context.variables[name] = value;
    return value;
  }
});
registerAction({
  name: "variable.get",
  description: "Get a workflow variable",
  category: "variable",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Variable name" },
      default: { description: "Default value if not found" }
    },
    required: ["name"]
  },
  handler: async (input, context) => {
    var _a;
    const { name, default: defaultValue } = input;
    return (_a = context.variables[name]) != null ? _a : defaultValue;
  }
});
registerAction({
  name: "util.log",
  description: "Log a message (for debugging)",
  category: "utility",
  inputSchema: {
    type: "object",
    properties: {
      message: { type: "string", description: "Log message" },
      data: { description: "Additional data to log" },
      level: { type: "string", enum: ["info", "warn", "error", "debug"] }
    },
    required: ["message"]
  },
  handler: async (input) => {
    const { message, data, level = "info" } = input;
    const logFn = console[level] || console.log;
    logFn(`[Workflow] ${message}`, data || "");
    return { logged: true, message, level };
  }
});
registerAction({
  name: "util.wait",
  description: "Wait for a specified duration",
  category: "utility",
  inputSchema: {
    type: "object",
    properties: {
      duration: { type: "number", description: "Duration in milliseconds" }
    },
    required: ["duration"]
  },
  handler: async (input) => {
    const { duration } = input;
    await new Promise((resolve) => setTimeout(resolve, duration));
    return { waited: duration };
  }
});
registerAction({
  name: "util.timestamp",
  description: "Get current timestamp",
  category: "utility",
  inputSchema: {
    type: "object",
    properties: {
      format: { type: "string", enum: ["iso", "unix", "date"] }
    }
  },
  handler: async (input) => {
    const { format = "iso" } = input;
    const now = /* @__PURE__ */ new Date();
    switch (format) {
      case "unix":
        return Math.floor(now.getTime() / 1e3);
      case "date":
        return now.toDateString();
      default:
        return now.toISOString();
    }
  }
});
registerAction({
  name: "util.uuid",
  description: "Generate a UUID",
  category: "utility",
  inputSchema: {
    type: "object",
    properties: {}
  },
  handler: async () => {
    const { v4: uuidv42 } = await Promise.resolve().then(() => _interopRequireWildcard(require("uuid")));
    return uuidv42();
  }
});
var actionCategories = [
  { id: "http", label: "HTTP", icon: "Globe" },
  { id: "data", label: "Data", icon: "Database" },
  { id: "logic", label: "Logic", icon: "GitBranch" },
  { id: "string", label: "String", icon: "Type" },
  { id: "variable", label: "Variables", icon: "Variable" },
  { id: "utility", label: "Utility", icon: "Wrench" }
];

// src/lib/workflows/templates/index.ts
async function getWorkflowTemplates(options) {
  const {
    category,
    search,
    onlyActive = true,
    includeWorkflowCount = false
  } = options != null ? options : {};
  const templates = await _chunkI5PINI5Tjs.prisma.workflowTemplate.findMany({
    where: _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, onlyActive && { isActive: true }), category && { category }), search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } }
      ]
    }),
    orderBy: [
      { category: "asc" },
      { name: "asc" }
    ]
  });
  if (includeWorkflowCount) {
    const templateIds = templates.map((t) => t.id);
    const workflowCounts = await _chunkI5PINI5Tjs.prisma.workflow.groupBy({
      by: ["templateId"],
      where: { templateId: { in: templateIds } },
      _count: true
    });
    const countMap = new Map(workflowCounts.map((wc) => [wc.templateId, wc._count]));
    return templates.map((template) => {
      var _a;
      return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, template), {
        workflowCount: (_a = countMap.get(template.id)) != null ? _a : 0
      });
    });
  }
  return templates;
}
async function getWorkflowTemplate(idOrSlug) {
  const template = await _chunkI5PINI5Tjs.prisma.workflowTemplate.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    }
  });
  if (!template) return null;
  const workflowCount = await _chunkI5PINI5Tjs.prisma.workflow.count({
    where: { templateId: template.id }
  });
  return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, template), {
    workflowCount
  });
}
async function getTemplatesByCategory() {
  const templates = await getWorkflowTemplates({
    includeWorkflowCount: true
  });
  const byCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});
  return byCategory;
}
async function getPopularTemplates(limit = 5) {
  const templates = await getWorkflowTemplates({
    includeWorkflowCount: true
  });
  return templates.sort((a, b) => {
    var _a, _b;
    return ((_a = b.workflowCount) != null ? _a : 0) - ((_b = a.workflowCount) != null ? _b : 0);
  }).slice(0, limit);
}
async function getRecommendedTemplates(limit = 4) {
  const installedTemplates = await _chunkI5PINI5Tjs.prisma.workflow.findMany({
    where: { templateId: { not: null } },
    select: { templateId: true },
    distinct: ["templateId"]
  });
  const installedIds = installedTemplates.map((w) => w.templateId).filter((id) => id !== null);
  const templates = await _chunkI5PINI5Tjs.prisma.workflowTemplate.findMany({
    where: {
      isActive: true,
      id: { notIn: installedIds },
      tags: { has: "essential" }
    },
    orderBy: { name: "asc" },
    take: limit
  });
  return templates;
}
async function installWorkflowTemplate(templateIdOrSlug, options) {
  var _a, _b, _c, _d;
  try {
    const template = await getWorkflowTemplate(templateIdOrSlug);
    if (!template) {
      return {
        success: false,
        error: `Template not found: ${templateIdOrSlug}`
      };
    }
    const baseSlug = `${template.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;
    while (await _chunkI5PINI5Tjs.prisma.workflow.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    const stepDefs = template.steps;
    const { nodes, edges } = convertStepsToReactFlow(stepDefs, options == null ? void 0 : options.configOverrides);
    const workflow = await _chunkI5PINI5Tjs.prisma.workflow.create({
      data: {
        name: (_a = options == null ? void 0 : options.name) != null ? _a : template.name,
        slug,
        description: template.description,
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 },
        triggerType: template.trigger,
        triggerConfig: (_b = template.triggerConfig) != null ? _b : {},
        config: (_c = options == null ? void 0 : options.configOverrides) != null ? _c : {},
        enabled: (_d = options == null ? void 0 : options.enabled) != null ? _d : false,
        templateId: template.id,
        pluginId: options == null ? void 0 : options.pluginId
      }
    });
    const steps = await Promise.all(
      stepDefs.map(
        (step, index) => {
          var _a2, _b2, _c2;
          return _chunkI5PINI5Tjs.prisma.workflowStep.create({
            data: {
              workflowId: workflow.id,
              name: step.name,
              type: step.type,
              order: (_a2 = step.order) != null ? _a2 : index,
              config: (_b2 = step.config) != null ? _b2 : {},
              conditions: (_c2 = step.conditions) != null ? _c2 : {},
              enabled: true
            }
          });
        }
      )
    );
    return {
      success: true,
      workflow,
      steps
    };
  } catch (error) {
    console.error("Failed to install workflow template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
function convertStepsToReactFlow(steps, configOverrides) {
  const nodes = [];
  const edges = [];
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  sortedSteps.forEach((step, index) => {
    const nodeId = generateNodeId();
    const nodeType = mapStepTypeToNodeType(step.type);
    nodes.push({
      id: nodeId,
      type: nodeType,
      position: { x: 250, y: index * 150 },
      data: {
        label: step.name,
        stepType: step.type,
        config: _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, step.config), getConfigOverridesForStep(step.name, configOverrides)),
        conditions: step.conditions
      }
    });
    if (index < sortedSteps.length - 1) {
      edges.push({
        id: generateEdgeId(nodeId, "placeholder"),
        source: nodeId,
        target: "",
        // Will be filled in after all nodes are created
        sourceHandle: "output",
        targetHandle: "input"
      });
    }
  });
  edges.forEach((edge, index) => {
    if (index < nodes.length - 1) {
      edge.target = nodes[index + 1].id;
    }
  });
  const layoutedNodes = autoLayoutNodes(nodes, edges);
  return {
    nodes: layoutedNodes,
    edges
  };
}
function mapStepTypeToNodeType(stepType) {
  var _a;
  const typeMap = {
    TRIGGER: "trigger",
    ACTION: "primitive",
    CONDITION: "condition",
    DELAY: "delay",
    LOOP: "loop",
    TRANSFORM: "transform",
    HTTP: "http",
    DATABASE: "database",
    NOTIFICATION: "notification",
    END: "output"
  };
  return (_a = typeMap[stepType]) != null ? _a : "primitive";
}
function getConfigOverridesForStep(stepName, overrides) {
  var _a;
  if (!overrides) return {};
  const stepKey = stepName.toLowerCase().replace(/\s+/g, "_");
  return (_a = overrides[stepKey]) != null ? _a : {};
}
async function createTemplateFromWorkflow(workflowId, templateData) {
  var _a, _b, _c;
  const workflow = await _chunkI5PINI5Tjs.prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: { orderBy: { order: "asc" } } }
  });
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }
  const steps = workflow.steps.map((step) => {
    var _a2, _b2;
    return {
      name: step.name,
      type: step.type,
      order: step.order,
      config: (_a2 = step.config) != null ? _a2 : {},
      conditions: (_b2 = step.conditions) != null ? _b2 : {}
    };
  });
  return _chunkI5PINI5Tjs.prisma.workflowTemplate.create({
    data: {
      name: templateData.name,
      slug: templateData.slug,
      description: (_a = templateData.description) != null ? _a : workflow.description,
      category: templateData.category,
      trigger: workflow.triggerType,
      triggerConfig: (_b = workflow.triggerConfig) != null ? _b : {},
      steps,
      icon: templateData.icon,
      color: templateData.color,
      tags: (_c = templateData.tags) != null ? _c : [],
      documentation: templateData.documentation,
      exampleUseCase: templateData.exampleUseCase,
      isSystem: false,
      isActive: true
    }
  });
}
async function updateTemplate(templateId, data) {
  const template = await _chunkI5PINI5Tjs.prisma.workflowTemplate.findUnique({
    where: { id: templateId }
  });
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  if (template.isSystem) {
    throw new Error("System templates cannot be modified");
  }
  return _chunkI5PINI5Tjs.prisma.workflowTemplate.update({
    where: { id: templateId },
    data
  });
}
async function deleteTemplate(templateId) {
  const template = await _chunkI5PINI5Tjs.prisma.workflowTemplate.findUnique({
    where: { id: templateId }
  });
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  if (template.isSystem) {
    throw new Error("System templates cannot be deleted");
  }
  await _chunkI5PINI5Tjs.prisma.workflow.updateMany({
    where: { templateId },
    data: { templateId: null }
  });
  await _chunkI5PINI5Tjs.prisma.workflowTemplate.delete({
    where: { id: templateId }
  });
}
async function getTemplateStats(templateId) {
  const workflows = await _chunkI5PINI5Tjs.prisma.workflow.findMany({
    where: { templateId },
    select: {
      id: true,
      enabled: true,
      executionCount: true,
      successCount: true,
      failureCount: true
    }
  });
  const workflowIds = workflows.map((w) => w.id);
  const recentExecutions = await _chunkI5PINI5Tjs.prisma.workflowExecution.findMany({
    where: {
      workflowId: { in: workflowIds },
      status: "COMPLETED",
      completedAt: { not: null }
    },
    select: {
      startedAt: true,
      completedAt: true
    },
    orderBy: { startedAt: "desc" },
    take: 100
  });
  const executionTimes = recentExecutions.filter((e) => e.completedAt).map((e) => e.completedAt.getTime() - e.startedAt.getTime());
  const avgTime = executionTimes.length > 0 ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length : 0;
  return {
    totalInstalls: workflows.length,
    activeInstalls: workflows.filter((w) => w.enabled).length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.executionCount, 0),
    successfulExecutions: workflows.reduce((sum, w) => sum + w.successCount, 0),
    failedExecutions: workflows.reduce((sum, w) => sum + w.failureCount, 0),
    averageExecutionTime: Math.round(avgTime)
  };
}
async function getCategoryStats() {
  const templates = await _chunkI5PINI5Tjs.prisma.workflowTemplate.groupBy({
    by: ["category"],
    _count: true
  });
  const workflows = await _chunkI5PINI5Tjs.prisma.workflow.findMany({
    where: { templateId: { not: null } },
    select: { template: { select: { category: true } } }
  });
  const stats = {};
  templates.forEach((t) => {
    stats[t.category] = {
      templateCount: t._count,
      workflowCount: 0
    };
  });
  workflows.forEach((w) => {
    var _a;
    if (((_a = w.template) == null ? void 0 : _a.category) && stats[w.template.category]) {
      stats[w.template.category].workflowCount++;
    }
  });
  return stats;
}

// src/lib/workflows/toggle.ts
var activeSubscriptions = /* @__PURE__ */ new Map();
async function enableWorkflow(workflowId) {
  return setWorkflowEnabled(workflowId, true);
}
async function disableWorkflow(workflowId) {
  return setWorkflowEnabled(workflowId, false);
}
async function toggleWorkflow(workflowId) {
  const workflow = await _chunkI5PINI5Tjs.prisma.workflow.findUnique({
    where: { id: workflowId }
  });
  if (!workflow) {
    return {
      success: false,
      error: `Workflow not found: ${workflowId}`
    };
  }
  return setWorkflowEnabled(workflowId, !workflow.enabled);
}
async function setWorkflowEnabled(workflowId, enabled) {
  try {
    const workflow = await _chunkI5PINI5Tjs.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        workflowNodes: true
      }
    });
    if (!workflow) {
      return {
        success: false,
        error: `Workflow not found: ${workflowId}`
      };
    }
    if (enabled) {
      const validation = validateWorkflowForEnable(workflow);
      if (!validation.valid) {
        return {
          success: false,
          error: `Cannot enable workflow: ${validation.errors.join(", ")}`
        };
      }
    }
    const updatedWorkflow = await _chunkI5PINI5Tjs.prisma.workflow.update({
      where: { id: workflowId },
      data: { enabled }
    });
    if (enabled) {
      await activateWorkflowTrigger(updatedWorkflow);
    } else {
      await deactivateWorkflowTrigger(updatedWorkflow);
    }
    return {
      success: true,
      workflow: updatedWorkflow,
      message: `Workflow ${enabled ? "enabled" : "disabled"} successfully`
    };
  } catch (error) {
    console.error("Failed to toggle workflow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function enableWorkflows(workflowIds) {
  return bulkSetEnabled(workflowIds, true);
}
async function disableWorkflows(workflowIds) {
  return bulkSetEnabled(workflowIds, false);
}
async function disableAllWorkflows() {
  const enabledWorkflows = await _chunkI5PINI5Tjs.prisma.workflow.findMany({
    where: { enabled: true },
    select: { id: true }
  });
  const workflowIds = enabledWorkflows.map((w) => w.id);
  if (workflowIds.length === 0) {
    return {
      success: true,
      results: [],
      enabledCount: 0,
      disabledCount: 0,
      errorCount: 0
    };
  }
  return bulkSetEnabled(workflowIds, false);
}
async function enableWorkflowsByCategory(templateCategory) {
  const workflows = await _chunkI5PINI5Tjs.prisma.workflow.findMany({
    where: {
      template: { category: templateCategory }
    },
    select: { id: true }
  });
  return bulkSetEnabled(workflows.map((w) => w.id), true);
}
async function disableWorkflowsByTrigger(triggerType) {
  const workflows = await _chunkI5PINI5Tjs.prisma.workflow.findMany({
    where: { triggerType, enabled: true },
    select: { id: true }
  });
  return bulkSetEnabled(workflows.map((w) => w.id), false);
}
async function bulkSetEnabled(workflowIds, enabled) {
  var _a;
  const results = [];
  let enabledCount = 0;
  let disabledCount = 0;
  let errorCount = 0;
  for (const workflowId of workflowIds) {
    const result = await setWorkflowEnabled(workflowId, enabled);
    if (result.success) {
      if (enabled) enabledCount++;
      else disabledCount++;
    } else {
      errorCount++;
    }
    results.push({
      workflowId,
      success: result.success,
      enabled: (_a = result.workflow) == null ? void 0 : _a.enabled,
      error: result.error
    });
  }
  return {
    success: errorCount === 0,
    results,
    enabledCount,
    disabledCount,
    errorCount
  };
}
function validateWorkflowForEnable(workflow) {
  const errors = [];
  const warnings = [];
  const nodes = workflow.nodes;
  const hasTrigger = nodes.some(
    (node) => {
      var _a;
      return node.type === "trigger" || ((_a = node.data) == null ? void 0 : _a.stepType) === "TRIGGER";
    }
  );
  if (!hasTrigger) {
    errors.push("Workflow must have a trigger node");
  }
  const hasAction = nodes.some(
    (node) => {
      var _a;
      return node.type === "primitive" || node.type === "action" || ((_a = node.data) == null ? void 0 : _a.stepType) === "ACTION";
    }
  );
  if (!hasAction) {
    warnings.push("Workflow has no action nodes");
  }
  if (workflow.triggerType === "SCHEDULE") {
    const triggerConfig = workflow.triggerConfig;
    if (!(triggerConfig == null ? void 0 : triggerConfig.cron)) {
      errors.push("Scheduled workflow must have a cron expression");
    }
  }
  if (workflow.triggerType === "EVENT") {
    const triggerConfig = workflow.triggerConfig;
    if (!(triggerConfig == null ? void 0 : triggerConfig.eventType)) {
      errors.push("Event workflow must specify an event type");
    }
  }
  if (workflow.triggerType === "WEBHOOK") {
    const triggerConfig = workflow.triggerConfig;
    if (!(triggerConfig == null ? void 0 : triggerConfig.path)) {
      errors.push("Webhook workflow must specify a path");
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
async function canEnableWorkflow(workflowId) {
  const workflow = await _chunkI5PINI5Tjs.prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { workflowNodes: true }
  });
  if (!workflow) {
    return {
      canEnable: false,
      validation: {
        valid: false,
        errors: ["Workflow not found"],
        warnings: []
      }
    };
  }
  const validation = validateWorkflowForEnable(workflow);
  return {
    canEnable: validation.valid,
    validation
  };
}
async function activateWorkflowTrigger(workflow) {
  var _a;
  const triggerConfig = (_a = workflow.triggerConfig) != null ? _a : {};
  switch (workflow.triggerType) {
    case "EVENT":
      await activateEventTrigger(workflow, triggerConfig);
      break;
    case "SCHEDULE":
      break;
    case "WEBHOOK":
      console.log(`Activated webhook workflow: ${workflow.slug} at path ${triggerConfig.path}`);
      break;
    case "MANUAL":
      break;
    case "AI_AGENT":
      break;
  }
}
async function deactivateWorkflowTrigger(workflow) {
  const unsubscribeFn = activeSubscriptions.get(workflow.id);
  if (unsubscribeFn) {
    unsubscribeFn();
    activeSubscriptions.delete(workflow.id);
  }
}
async function activateEventTrigger(workflow, triggerConfig) {
  const eventType = triggerConfig.eventType;
  if (!eventType) {
    console.warn(`Event workflow ${workflow.id} has no eventType configured`);
    return;
  }
  const subscriptionId = subscribe({
    eventType,
    handler: async (event) => {
      try {
        const { executeWorkflow: executeWorkflow2 } = await Promise.resolve().then(() => _interopRequireWildcard(require("./engine-HXCA6C72.js")));
        if (triggerConfig.filters) {
          const matches = matchEventFilters(event.data, triggerConfig.filters);
          if (!matches) return;
        }
        await executeWorkflow2(workflow.id, {
          triggeredBy: "event",
          eventData: {
            type: eventType,
            data: event.data,
            timestamp: event.timestamp
          }
        });
      } catch (error) {
        console.error(`Failed to execute workflow ${workflow.id} for event ${eventType}:`, error);
      }
    }
  });
  activeSubscriptions.set(workflow.id, () => unsubscribe(subscriptionId));
  console.log(`Activated event trigger for workflow ${workflow.slug}: ${eventType}`);
}
function matchEventFilters(eventData, filters) {
  for (const [key, value] of Object.entries(filters)) {
    const eventValue = getNestedValue2(eventData, key);
    if (typeof value === "object" && value !== null) {
      for (const [op, opValue] of Object.entries(value)) {
        switch (op) {
          case "$eq":
            if (eventValue !== opValue) return false;
            break;
          case "$ne":
            if (eventValue === opValue) return false;
            break;
          case "$gt":
            if (!(eventValue > opValue)) return false;
            break;
          case "$gte":
            if (!(eventValue >= opValue)) return false;
            break;
          case "$lt":
            if (!(eventValue < opValue)) return false;
            break;
          case "$lte":
            if (!(eventValue <= opValue)) return false;
            break;
          case "$in":
            if (!Array.isArray(opValue) || !opValue.includes(eventValue)) return false;
            break;
          case "$nin":
            if (!Array.isArray(opValue) || opValue.includes(eventValue)) return false;
            break;
          case "$contains":
            if (typeof eventValue !== "string" || !eventValue.includes(opValue)) return false;
            break;
        }
      }
    } else {
      if (eventValue !== value) return false;
    }
  }
  return true;
}
function getNestedValue2(obj, path) {
  return path.split(".").reduce((current, key) => current == null ? void 0 : current[key], obj);
}
async function getWorkflowStatus(workflowId) {
  const workflow = await _chunkI5PINI5Tjs.prisma.workflow.findUnique({
    where: { id: workflowId }
  });
  if (!workflow) return null;
  const successRate = workflow.executionCount > 0 ? workflow.successCount / workflow.executionCount * 100 : 0;
  return {
    id: workflow.id,
    name: workflow.name,
    slug: workflow.slug,
    enabled: workflow.enabled,
    triggerType: workflow.triggerType,
    lastRunAt: workflow.lastRunAt,
    executionCount: workflow.executionCount,
    successCount: workflow.successCount,
    failureCount: workflow.failureCount,
    successRate: Math.round(successRate * 100) / 100
  };
}
async function getAllWorkflowStatuses() {
  const workflows = await _chunkI5PINI5Tjs.prisma.workflow.findMany({
    orderBy: [
      { enabled: "desc" },
      { name: "asc" }
    ]
  });
  return workflows.map((workflow) => {
    const successRate = workflow.executionCount > 0 ? workflow.successCount / workflow.executionCount * 100 : 0;
    return {
      id: workflow.id,
      name: workflow.name,
      slug: workflow.slug,
      enabled: workflow.enabled,
      triggerType: workflow.triggerType,
      lastRunAt: workflow.lastRunAt,
      executionCount: workflow.executionCount,
      successCount: workflow.successCount,
      failureCount: workflow.failureCount,
      successRate: Math.round(successRate * 100) / 100
    };
  });
}
async function getEnabledWorkflowCounts() {
  const counts = await _chunkI5PINI5Tjs.prisma.workflow.groupBy({
    by: ["triggerType"],
    where: { enabled: true },
    _count: true
  });
  const result = {
    MANUAL: 0,
    SCHEDULE: 0,
    WEBHOOK: 0,
    EVENT: 0,
    AI_AGENT: 0
  };
  counts.forEach((c) => {
    result[c.triggerType] = c._count;
  });
  return result;
}
async function initializeEventWorkflows() {
  const eventWorkflows = await _chunkI5PINI5Tjs.prisma.workflow.findMany({
    where: {
      enabled: true,
      triggerType: "EVENT"
    }
  });
  console.log(`Initializing ${eventWorkflows.length} event workflows...`);
  for (const workflow of eventWorkflows) {
    try {
      await activateWorkflowTrigger(workflow);
    } catch (error) {
      console.error(`Failed to initialize workflow ${workflow.id}:`, error);
    }
  }
  console.log("Event workflow initialization complete");
}
function cleanupAllSubscriptions() {
  console.log(`Cleaning up ${activeSubscriptions.size} workflow subscriptions...`);
  for (const [workflowId, unsubscribeFn] of activeSubscriptions) {
    try {
      unsubscribeFn();
    } catch (error) {
      console.error(`Failed to cleanup subscription for workflow ${workflowId}:`, error);
    }
  }
  activeSubscriptions.clear();
  console.log("Workflow subscription cleanup complete");
}

// src/lib/shippo/index.ts
var _shippo = require('shippo');

// src/lib/shippo/types.ts
var SHIPMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "label_purchased", label: "Label Purchased" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "exception", label: "Exception" },
  { value: "refunded", label: "Refunded" }
];
var CARRIER_OPTIONS = [
  { value: "usps", label: "USPS" },
  { value: "ups", label: "UPS" },
  { value: "fedex", label: "FedEx" }
];
var LABEL_FORMAT_OPTIONS = [
  { value: "PDF", label: "PDF (Standard)" },
  { value: "PDF_4x6", label: "PDF 4x6 (Thermal)" },
  { value: "PNG", label: "PNG" }
];

// src/lib/shippo/index.ts
var cachedSettings = null;
var cacheExpiry = 0;
var CACHE_TTL = 6e4;
async function getShippingSettings() {
  if (cachedSettings && Date.now() < cacheExpiry) {
    return cachedSettings;
  }
  const envApiKey = process.env.SHIPPO_API_KEY;
  const envWebhookSecret = process.env.SHIPPO_WEBHOOK_SECRET;
  try {
    const settings = await _chunkI5PINI5Tjs.prisma.setting.findMany({
      where: { group: "shipping" }
    });
    if (settings.length > 0) {
      const settingsMap = {};
      for (const setting of settings) {
        settingsMap[setting.key] = setting.encrypted ? _chunkMT3LB7M4js.safeDecrypt.call(void 0, setting.value) : setting.value;
      }
      const dbSettings = {
        enabled: settingsMap["shipping.enabled"] === "true",
        // Always fall back to env var for API key - makes setup easier
        shippoApiKey: settingsMap["shipping.shippoApiKey"] || envApiKey,
        shippoWebhookSecret: settingsMap["shipping.shippoWebhookSecret"] || envWebhookSecret,
        testMode: settingsMap["shipping.testMode"] === "true",
        useElements: settingsMap["shipping.useElements"] !== "false",
        // Default to true
        fromName: settingsMap["shipping.fromName"],
        fromCompany: settingsMap["shipping.fromCompany"],
        fromStreet1: settingsMap["shipping.fromStreet1"],
        fromStreet2: settingsMap["shipping.fromStreet2"],
        fromCity: settingsMap["shipping.fromCity"],
        fromState: settingsMap["shipping.fromState"],
        fromZip: settingsMap["shipping.fromZip"],
        fromCountry: settingsMap["shipping.fromCountry"] || "US",
        fromPhone: settingsMap["shipping.fromPhone"],
        fromEmail: settingsMap["shipping.fromEmail"],
        enabledCarriers: settingsMap["shipping.enabledCarriers"] ? JSON.parse(settingsMap["shipping.enabledCarriers"]) : ["usps", "ups", "fedex"],
        defaultLabelFormat: settingsMap["shipping.defaultLabelFormat"] || "PDF",
        defaultPackageWeight: settingsMap["shipping.defaultPackageWeight"] ? parseInt(settingsMap["shipping.defaultPackageWeight"]) : 16,
        requireSignature: settingsMap["shipping.requireSignature"] === "true"
      };
      if (dbSettings.enabled || dbSettings.shippoApiKey && settingsMap["shipping.enabled"] === void 0) {
        if (settingsMap["shipping.enabled"] === void 0 && dbSettings.shippoApiKey) {
          dbSettings.enabled = true;
        }
        cachedSettings = dbSettings;
        cacheExpiry = Date.now() + CACHE_TTL;
        return dbSettings;
      }
    }
  } catch (error) {
    console.warn("Could not fetch shipping settings from database, using env vars:", error);
  }
  const envSettings = {
    enabled: !!envApiKey,
    // Auto-enable if API key exists
    shippoApiKey: envApiKey,
    shippoWebhookSecret: envWebhookSecret,
    testMode: process.env.NODE_ENV !== "production",
    useElements: true,
    // Default to using Shippo Elements
    fromName: process.env.SHIP_FROM_NAME,
    fromCompany: process.env.SHIP_FROM_COMPANY,
    fromStreet1: process.env.SHIP_FROM_STREET,
    fromStreet2: process.env.SHIP_FROM_STREET2,
    fromCity: process.env.SHIP_FROM_CITY,
    fromState: process.env.SHIP_FROM_STATE,
    fromZip: process.env.SHIP_FROM_ZIP,
    fromCountry: process.env.SHIP_FROM_COUNTRY || "US",
    fromPhone: process.env.SHIP_FROM_PHONE,
    fromEmail: process.env.SHIP_FROM_EMAIL,
    enabledCarriers: ["usps", "ups", "fedex"],
    defaultLabelFormat: "PDF",
    defaultPackageWeight: 16,
    requireSignature: false
  };
  cachedSettings = envSettings;
  cacheExpiry = Date.now() + CACHE_TTL;
  return envSettings;
}
function clearShippingSettingsCache() {
  cachedSettings = null;
  cacheExpiry = 0;
}
async function getShippoApiKey() {
  const settings = await getShippingSettings();
  const apiKey = settings.shippoApiKey || process.env.SHIPPO_API_KEY;
  if (!apiKey) {
    throw new Error("Shippo API key is not configured. Set it in Settings > Shipping or SHIPPO_API_KEY env var.");
  }
  return apiKey;
}
async function getShippoClientAsync() {
  const apiKey = await getShippoApiKey();
  return new (0, _shippo.Shippo)({ apiKeyHeader: apiKey });
}
async function getDefaultFromAddress() {
  const settings = await getShippingSettings();
  return {
    name: settings.fromName || process.env.SHIP_FROM_NAME || "",
    company: settings.fromCompany || process.env.SHIP_FROM_COMPANY,
    street1: settings.fromStreet1 || process.env.SHIP_FROM_STREET || "",
    street2: settings.fromStreet2 || process.env.SHIP_FROM_STREET2,
    city: settings.fromCity || process.env.SHIP_FROM_CITY || "",
    state: settings.fromState || process.env.SHIP_FROM_STATE || "",
    zip: settings.fromZip || process.env.SHIP_FROM_ZIP || "",
    country: settings.fromCountry || process.env.SHIP_FROM_COUNTRY || "US",
    phone: settings.fromPhone || process.env.SHIP_FROM_PHONE,
    email: settings.fromEmail || process.env.SHIP_FROM_EMAIL
  };
}
async function validateAddress(address) {
  var _a, _b, _c, _d;
  const shippo = await getShippoClientAsync();
  try {
    const response = await shippo.addresses.create({
      name: address.name,
      company: address.company,
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone,
      email: address.email,
      validate: true
    });
    const isValid = (_b = (_a = response.validationResults) == null ? void 0 : _a.isValid) != null ? _b : false;
    const messages = ((_d = (_c = response.validationResults) == null ? void 0 : _c.messages) == null ? void 0 : _d.map((msg) => ({
      source: msg.source || "shippo",
      code: msg.code || "",
      text: msg.text || "",
      type: msg.type || "info"
    }))) || [];
    return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, address), {
      name: response.name || address.name,
      street1: response.street1 || address.street1,
      street2: response.street2,
      city: response.city || address.city,
      state: response.state || address.state,
      zip: response.zip || address.zip,
      country: response.country || address.country,
      isValid,
      messages
    });
  } catch (error) {
    console.error("Address validation error:", error);
    return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, address), {
      isValid: false,
      messages: [{
        source: "shippo",
        code: "VALIDATION_ERROR",
        text: error instanceof Error ? error.message : "Address validation failed",
        type: "error"
      }]
    });
  }
}
async function createShipment(request) {
  var _a;
  const shippo = await getShippoClientAsync();
  try {
    const shipment = await shippo.shipments.create({
      addressFrom: {
        name: request.addressFrom.name,
        company: request.addressFrom.company,
        street1: request.addressFrom.street1,
        street2: request.addressFrom.street2,
        city: request.addressFrom.city,
        state: request.addressFrom.state,
        zip: request.addressFrom.zip,
        country: request.addressFrom.country,
        phone: request.addressFrom.phone,
        email: request.addressFrom.email
      },
      addressTo: {
        name: request.addressTo.name,
        company: request.addressTo.company,
        street1: request.addressTo.street1,
        street2: request.addressTo.street2,
        city: request.addressTo.city,
        state: request.addressTo.state,
        zip: request.addressTo.zip,
        country: request.addressTo.country,
        phone: request.addressTo.phone,
        email: request.addressTo.email
      },
      parcels: request.parcels.map((parcel) => ({
        length: String(parcel.length),
        width: String(parcel.width),
        height: String(parcel.height),
        weight: String(parcel.weight),
        massUnit: parcel.massUnit || "oz",
        distanceUnit: parcel.distanceUnit || "in"
      })),
      extra: request.extra ? {
        signatureConfirmation: request.extra.signature,
        insurance: request.extra.insurance ? {
          amount: request.extra.insurance.amount,
          currency: request.extra.insurance.currency,
          content: request.extra.insurance.content
        } : void 0,
        reference1: request.extra.reference1,
        reference2: request.extra.reference2,
        saturdayDelivery: request.extra.saturdayDelivery
      } : void 0,
      async: false
    });
    const rates = (shipment.rates || []).map((rate) => {
      var _a2, _b, _c;
      return {
        rateId: rate.objectId || "",
        carrier: mapCarrier(rate.provider || ""),
        carrierAccount: rate.carrierAccount || "",
        servicelevel: {
          name: ((_a2 = rate.servicelevel) == null ? void 0 : _a2.name) || "",
          token: ((_b = rate.servicelevel) == null ? void 0 : _b.token) || "",
          terms: (_c = rate.servicelevel) == null ? void 0 : _c.terms
        },
        amount: rate.amount || "0",
        currency: rate.currency || "USD",
        amountLocal: rate.amountLocal,
        currencyLocal: rate.currencyLocal,
        estimatedDays: rate.estimatedDays,
        durationTerms: rate.durationTerms,
        zone: rate.zone,
        attributes: rate.attributes,
        provider: rate.provider,
        arrivesBy: rate.arrivesBy
      };
    });
    rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    return {
      shipmentId: shipment.objectId || "",
      status: shipment.status || "ERROR",
      rates,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: (_a = shipment.messages) == null ? void 0 : _a.map((msg) => ({
        source: msg.source || "",
        code: msg.code || "",
        text: msg.text || ""
      }))
    };
  } catch (error) {
    console.error("Create shipment error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create shipment");
  }
}
async function getRates(shipmentId) {
  const shippo = await getShippoClientAsync();
  try {
    const shipment = await shippo.shipments.get(shipmentId);
    const rates = (shipment.rates || []).map((rate) => {
      var _a, _b, _c;
      return {
        rateId: rate.objectId || "",
        carrier: mapCarrier(rate.provider || ""),
        carrierAccount: rate.carrierAccount || "",
        servicelevel: {
          name: ((_a = rate.servicelevel) == null ? void 0 : _a.name) || "",
          token: ((_b = rate.servicelevel) == null ? void 0 : _b.token) || "",
          terms: (_c = rate.servicelevel) == null ? void 0 : _c.terms
        },
        amount: rate.amount || "0",
        currency: rate.currency || "USD",
        amountLocal: rate.amountLocal,
        currencyLocal: rate.currencyLocal,
        estimatedDays: rate.estimatedDays,
        durationTerms: rate.durationTerms,
        zone: rate.zone,
        attributes: rate.attributes,
        provider: rate.provider,
        arrivesBy: rate.arrivesBy
      };
    });
    return rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
  } catch (error) {
    console.error("Get rates error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get rates");
  }
}
async function purchaseLabel(request) {
  var _a, _b, _c, _d;
  const shippo = await getShippoClientAsync();
  try {
    const transaction = await shippo.transactions.create({
      rate: request.rateId,
      labelFileType: mapLabelFormat(request.labelFormat || "PDF"),
      async: (_a = request.async) != null ? _a : false
    });
    const rateData = typeof transaction.rate === "string" ? { objectId: transaction.rate } : transaction.rate;
    return {
      transactionId: transaction.objectId || "",
      status: transaction.status || "ERROR",
      rate: {
        rateId: (rateData == null ? void 0 : rateData.objectId) || request.rateId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        carrier: mapCarrier((rateData == null ? void 0 : rateData.provider) || ""),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        carrierAccount: (rateData == null ? void 0 : rateData.carrierAccount) || "",
        servicelevel: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: ((_b = rateData == null ? void 0 : rateData.servicelevel) == null ? void 0 : _b.name) || "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token: ((_c = rateData == null ? void 0 : rateData.servicelevel) == null ? void 0 : _c.token) || ""
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        amount: (rateData == null ? void 0 : rateData.amount) || "0",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currency: (rateData == null ? void 0 : rateData.currency) || "USD"
      },
      trackingNumber: transaction.trackingNumber || "",
      trackingUrl: transaction.trackingUrlProvider || "",
      labelUrl: transaction.labelUrl || "",
      commercialInvoiceUrl: transaction.commercialInvoiceUrl,
      eta: transaction.eta,
      messages: (_d = transaction.messages) == null ? void 0 : _d.map((msg) => ({
        source: msg.source || "",
        code: msg.code || "",
        text: msg.text || ""
      }))
    };
  } catch (error) {
    console.error("Purchase label error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to purchase label");
  }
}
async function getTracking(carrier, trackingNumber) {
  var _a, _b, _c, _d;
  const shippo = await getShippoClientAsync();
  try {
    const tracking = await shippo.trackingStatus.get(carrier, trackingNumber);
    const toIsoString = (date) => {
      if (!date) return void 0;
      return date instanceof Date ? date.toISOString() : date;
    };
    return {
      carrier,
      trackingNumber: tracking.trackingNumber || trackingNumber,
      eta: toIsoString(tracking.eta),
      servicelevel: tracking.servicelevel ? {
        name: tracking.servicelevel.name || "",
        token: tracking.servicelevel.token || ""
      } : void 0,
      addressFrom: tracking.addressFrom ? {
        city: tracking.addressFrom.city,
        state: tracking.addressFrom.state,
        zip: tracking.addressFrom.zip,
        country: tracking.addressFrom.country
      } : void 0,
      addressTo: tracking.addressTo ? {
        city: tracking.addressTo.city,
        state: tracking.addressTo.state,
        zip: tracking.addressTo.zip,
        country: tracking.addressTo.country
      } : void 0,
      trackingStatus: {
        status: mapTrackingStatus(((_a = tracking.trackingStatus) == null ? void 0 : _a.status) || "UNKNOWN"),
        statusDetails: ((_b = tracking.trackingStatus) == null ? void 0 : _b.statusDetails) || "",
        statusDate: toIsoString((_c = tracking.trackingStatus) == null ? void 0 : _c.statusDate) || (/* @__PURE__ */ new Date()).toISOString(),
        location: ((_d = tracking.trackingStatus) == null ? void 0 : _d.location) ? {
          city: tracking.trackingStatus.location.city,
          state: tracking.trackingStatus.location.state,
          zip: tracking.trackingStatus.location.zip,
          country: tracking.trackingStatus.location.country
        } : void 0
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trackingHistory: (tracking.trackingHistory || []).map((event) => ({
        status: mapTrackingStatus(event.status || "UNKNOWN"),
        statusDetails: event.statusDetails || "",
        statusDate: toIsoString(event.statusDate) || "",
        location: event.location ? {
          city: event.location.city,
          state: event.location.state,
          zip: event.location.zip,
          country: event.location.country
        } : void 0
      }))
    };
  } catch (error) {
    console.error("Get tracking error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get tracking");
  }
}
async function refundLabel(transactionId) {
  const shippo = await getShippoClientAsync();
  try {
    const refund = await shippo.refunds.create({
      transaction: transactionId
    });
    return {
      transactionId,
      status: refund.status || "PENDING"
    };
  } catch (error) {
    console.error("Refund label error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to refund label");
  }
}
async function registerTrackingWebhook(webhookUrl) {
  const apiKey = await getShippoApiKey();
  try {
    const response = await fetch("https://api.goshippo.com/webhooks/", {
      method: "POST",
      headers: {
        "Authorization": `ShippoToken ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: webhookUrl,
        event: "track_updated",
        is_test: process.env.NODE_ENV !== "production"
      })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register webhook: ${error}`);
    }
  } catch (error) {
    console.error("Register webhook error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to register webhook");
  }
}
function mapCarrier(provider) {
  const lower = provider.toLowerCase();
  if (lower.includes("usps")) return "usps";
  if (lower.includes("ups")) return "ups";
  if (lower.includes("fedex")) return "fedex";
  return "usps";
}
function mapLabelFormat(format) {
  if (format.startsWith("PDF")) return "PDF";
  if (format === "PNG") return "PNG";
  if (format === "ZPLII") return "ZPLII";
  return "PDF";
}
function mapTrackingStatus(status) {
  const statusMap = {
    "UNKNOWN": "UNKNOWN",
    "PRE_TRANSIT": "PRE_TRANSIT",
    "TRANSIT": "TRANSIT",
    "DELIVERED": "DELIVERED",
    "RETURNED": "RETURNED",
    "FAILURE": "FAILURE"
  };
  return statusMap[status] || "UNKNOWN";
}

// src/lib/dashboard/types.ts
var DEFAULT_WIDGETS = {
  // Core
  "profile-overview": { title: "Profile", colSpan: 2 },
  "quick-actions": { title: "Quick Actions", colSpan: 2 },
  "notifications": { title: "Notifications", colSpan: 1 },
  "support": { title: "Need Help?", colSpan: 1 },
  // E-commerce
  "recent-orders": { title: "Recent Orders", colSpan: 4 },
  "order-tracking": { title: "Track Your Order", colSpan: 2 },
  "payment-methods": { title: "Payment Methods", colSpan: 2 },
  "addresses": { title: "Addresses", colSpan: 2 },
  "wishlist": { title: "Wishlist", colSpan: 2 },
  "loyalty-points": { title: "Rewards", colSpan: 1 },
  "subscriptions": { title: "Subscriptions", colSpan: 2 },
  // Consulting
  "active-projects": { title: "Active Projects", colSpan: 4 },
  "project-milestones": { title: "Milestones", colSpan: 2 },
  "invoices": { title: "Invoices", colSpan: 2 },
  "upcoming-meetings": { title: "Upcoming Meetings", colSpan: 2 },
  "time-tracking": { title: "Time Tracking", colSpan: 2 },
  "documents": { title: "Documents", colSpan: 2 },
  // Bookings
  "upcoming-bookings": { title: "Upcoming Bookings", colSpan: 4 },
  "booking-history": { title: "Past Bookings", colSpan: 4 },
  "available-services": { title: "Book a Service", colSpan: 2 },
  // SaaS
  "usage-stats": { title: "Usage", colSpan: 2 },
  "billing-summary": { title: "Billing", colSpan: 2 },
  "api-keys": { title: "API Keys", colSpan: 2 }
};
var DASHBOARD_PRESETS = {
  ecommerce: {
    title: "My Account",
    showOverview: true,
    tabs: [
      {
        id: "orders",
        label: "Orders",
        slug: "orders",
        icon: "package",
        enabled: true,
        order: 1,
        widgets: [
          { id: "recent-orders", type: "recent-orders", title: "Orders", enabled: true, order: 1 }
        ]
      },
      {
        id: "addresses",
        label: "Addresses",
        slug: "addresses",
        icon: "map-pin",
        enabled: true,
        order: 2,
        widgets: [
          { id: "addresses", type: "addresses", title: "Addresses", enabled: true, order: 1 }
        ]
      },
      {
        id: "payments",
        label: "Payment Methods",
        slug: "payments",
        icon: "credit-card",
        enabled: true,
        order: 3,
        widgets: [
          { id: "payment-methods", type: "payment-methods", title: "Payment Methods", enabled: true, order: 1 }
        ]
      }
    ]
  },
  consulting: {
    title: "Client Portal",
    showOverview: true,
    tabs: [
      {
        id: "projects",
        label: "Projects",
        slug: "projects",
        icon: "briefcase",
        enabled: true,
        order: 1,
        widgets: [
          { id: "active-projects", type: "active-projects", title: "Your Projects", enabled: true, order: 1 }
        ]
      },
      {
        id: "billing",
        label: "Billing",
        slug: "billing",
        icon: "file-text",
        enabled: true,
        order: 2,
        widgets: [
          { id: "invoices", type: "invoices", title: "Invoices", enabled: true, order: 1 }
        ]
      },
      {
        id: "meetings",
        label: "Meetings",
        slug: "meetings",
        icon: "calendar",
        enabled: true,
        order: 3,
        widgets: [
          { id: "upcoming-meetings", type: "upcoming-meetings", title: "Upcoming Meetings", enabled: true, order: 1 }
        ]
      },
      {
        id: "documents",
        label: "Documents",
        slug: "documents",
        icon: "folder",
        enabled: true,
        order: 4,
        widgets: [
          { id: "documents", type: "documents", title: "Shared Documents", enabled: true, order: 1 }
        ]
      }
    ]
  },
  services: {
    title: "My Account",
    showOverview: true,
    tabs: [
      {
        id: "bookings",
        label: "My Bookings",
        slug: "bookings",
        icon: "calendar-check",
        enabled: true,
        order: 1,
        widgets: [
          { id: "upcoming-bookings", type: "upcoming-bookings", title: "Upcoming", enabled: true, order: 1 },
          { id: "booking-history", type: "booking-history", title: "History", enabled: true, order: 2 }
        ]
      },
      {
        id: "services",
        label: "Book",
        slug: "book",
        icon: "plus-circle",
        enabled: true,
        order: 2,
        widgets: [
          { id: "available-services", type: "available-services", title: "Book a Service", enabled: true, order: 1 }
        ]
      }
    ]
  },
  booking: {
    title: "My Reservations",
    showOverview: true,
    tabs: [
      {
        id: "reservations",
        label: "Reservations",
        slug: "reservations",
        icon: "calendar",
        enabled: true,
        order: 1,
        widgets: [
          { id: "upcoming-bookings", type: "upcoming-bookings", title: "Upcoming", enabled: true, order: 1 }
        ]
      }
    ]
  },
  saas: {
    title: "Dashboard",
    showOverview: true,
    tabs: [
      {
        id: "usage",
        label: "Usage",
        slug: "usage",
        icon: "bar-chart",
        enabled: true,
        order: 1,
        widgets: [
          { id: "usage-stats", type: "usage-stats", title: "Usage Statistics", enabled: true, order: 1 }
        ]
      },
      {
        id: "billing",
        label: "Billing",
        slug: "billing",
        icon: "credit-card",
        enabled: true,
        order: 2,
        widgets: [
          { id: "billing-summary", type: "billing-summary", title: "Billing", enabled: true, order: 1 },
          { id: "invoices", type: "invoices", title: "Invoices", enabled: true, order: 2 }
        ]
      },
      {
        id: "api",
        label: "API",
        slug: "api",
        icon: "code",
        enabled: true,
        order: 3,
        widgets: [
          { id: "api-keys", type: "api-keys", title: "API Keys", enabled: true, order: 1 }
        ]
      }
    ]
  },
  custom: {
    title: "My Account",
    showOverview: true,
    tabs: []
  }
};
function getDefaultDashboardConfig(preset = "ecommerce") {
  var _a;
  const presetConfig = DASHBOARD_PRESETS[preset];
  return {
    preset,
    title: presetConfig.title || "My Account",
    showOverview: (_a = presetConfig.showOverview) != null ? _a : true,
    tabs: presetConfig.tabs || [],
    theme: {
      borderRadius: "md",
      cardStyle: "bordered"
    }
  };
}

// src/lib/dashboard/index.ts
var DASHBOARD_SETTINGS_KEY = "dashboard.config";
async function getDashboardConfig() {
  try {
    const setting = await _chunkI5PINI5Tjs.prisma.setting.findUnique({
      where: { key: DASHBOARD_SETTINGS_KEY }
    });
    if (setting == null ? void 0 : setting.value) {
      const config = JSON.parse(setting.value);
      return _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, getDefaultDashboardConfig(config.preset)), config);
    }
  } catch (error) {
    console.error("Error loading dashboard config:", error);
  }
  return getDefaultDashboardConfig("ecommerce");
}
async function saveDashboardConfig(config) {
  const currentConfig = await getDashboardConfig();
  const newConfig = _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, currentConfig), config);
  await _chunkI5PINI5Tjs.prisma.setting.upsert({
    where: { key: DASHBOARD_SETTINGS_KEY },
    create: {
      key: DASHBOARD_SETTINGS_KEY,
      value: JSON.stringify(newConfig),
      group: "dashboard",
      encrypted: false
    },
    update: {
      value: JSON.stringify(newConfig)
    }
  });
  return newConfig;
}
async function applyDashboardPreset(preset) {
  const presetConfig = getDefaultDashboardConfig(preset);
  return saveDashboardConfig(presetConfig);
}
async function toggleTab(tabId, enabled) {
  const config = await getDashboardConfig();
  const tabIndex = config.tabs.findIndex((t) => t.id === tabId);
  if (tabIndex >= 0) {
    config.tabs[tabIndex].enabled = enabled;
    return saveDashboardConfig(config);
  }
  return config;
}
async function addTab(tab) {
  const config = await getDashboardConfig();
  const maxOrder = Math.max(...config.tabs.map((t) => t.order), 0);
  config.tabs.push(_chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, tab), {
    order: maxOrder + 1
  }));
  return saveDashboardConfig(config);
}
async function removeTab(tabId) {
  const config = await getDashboardConfig();
  config.tabs = config.tabs.filter((t) => t.id !== tabId);
  return saveDashboardConfig(config);
}
async function reorderTabs(tabIds) {
  const config = await getDashboardConfig();
  config.tabs = tabIds.map((id, index) => {
    const tab = config.tabs.find((t) => t.id === id);
    if (tab) {
      return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, tab), { order: index + 1 });
    }
    return null;
  }).filter((t) => t !== null);
  return saveDashboardConfig(config);
}
async function addWidget(tabId, widget) {
  const config = await getDashboardConfig();
  const tabIndex = config.tabs.findIndex((t) => t.id === tabId);
  if (tabIndex >= 0) {
    const maxOrder = Math.max(...config.tabs[tabIndex].widgets.map((w) => w.order), 0);
    config.tabs[tabIndex].widgets.push(_chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, widget), {
      order: maxOrder + 1
    }));
    return saveDashboardConfig(config);
  }
  return config;
}
async function removeWidget(tabId, widgetId) {
  const config = await getDashboardConfig();
  const tabIndex = config.tabs.findIndex((t) => t.id === tabId);
  if (tabIndex >= 0) {
    config.tabs[tabIndex].widgets = config.tabs[tabIndex].widgets.filter(
      (w) => w.id !== widgetId
    );
    return saveDashboardConfig(config);
  }
  return config;
}
async function toggleWidget(tabId, widgetId, enabled) {
  const config = await getDashboardConfig();
  const tabIndex = config.tabs.findIndex((t) => t.id === tabId);
  if (tabIndex >= 0) {
    const widgetIndex = config.tabs[tabIndex].widgets.findIndex((w) => w.id === widgetId);
    if (widgetIndex >= 0) {
      config.tabs[tabIndex].widgets[widgetIndex].enabled = enabled;
      return saveDashboardConfig(config);
    }
  }
  return config;
}
function getAvailablePresets() {
  return [
    {
      id: "ecommerce",
      name: "E-commerce",
      description: "Orders, shipping tracking, payment methods, addresses, and wishlist"
    },
    {
      id: "consulting",
      name: "Consulting / Agency",
      description: "Projects, milestones, invoices, meetings, and shared documents"
    },
    {
      id: "services",
      name: "Service Business",
      description: "Appointment booking, service history, and scheduling"
    },
    {
      id: "booking",
      name: "Reservations",
      description: "Simple booking and reservation management"
    },
    {
      id: "saas",
      name: "SaaS Platform",
      description: "Usage statistics, billing, subscriptions, and API keys"
    },
    {
      id: "custom",
      name: "Custom",
      description: "Start from scratch and build your own dashboard layout"
    }
  ];
}

// src/lib/routes/index.ts

var getRouteConfig = _react.cache.call(void 0, async (slug) => {
  const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;
  const routeConfig = await _chunkI5PINI5Tjs.prisma.routeConfig.findUnique({
    where: { slug: normalizedSlug },
    include: {
      page: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          content: true,
          metaTitle: true,
          metaDescription: true
        }
      }
    }
  });
  if (!routeConfig || !routeConfig.isActive) {
    return { type: "NOT_FOUND" };
  }
  switch (routeConfig.type) {
    case "PUCK":
      if (!routeConfig.page) {
        return { type: "NOT_FOUND" };
      }
      if (routeConfig.page.status !== "PUBLISHED") {
        return { type: "NOT_FOUND" };
      }
      return {
        type: "PUCK",
        pageId: routeConfig.page.id,
        pageContent: routeConfig.page.content,
        pageTitle: routeConfig.page.title,
        pageSlug: routeConfig.page.slug,
        pageMetaTitle: routeConfig.page.metaTitle,
        pageMetaDescription: routeConfig.page.metaDescription
      };
    case "CUSTOM":
      if (!routeConfig.componentKey) {
        return { type: "NOT_FOUND" };
      }
      return {
        type: "CUSTOM",
        componentKey: routeConfig.componentKey
      };
    case "REDIRECT":
      if (!routeConfig.redirectUrl) {
        return { type: "NOT_FOUND" };
      }
      return {
        type: "REDIRECT",
        redirectUrl: routeConfig.redirectUrl,
        redirectCode: routeConfig.redirectCode || 307
      };
    default:
      return { type: "NOT_FOUND" };
  }
});
async function isSlugReserved(slug) {
  const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;
  const existing = await _chunkI5PINI5Tjs.prisma.routeConfig.findUnique({
    where: { slug: normalizedSlug },
    select: { id: true }
  });
  return !!existing;
}
async function getAllRouteConfigs() {
  return _chunkI5PINI5Tjs.prisma.routeConfig.findMany({
    include: {
      page: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true
        }
      }
    },
    orderBy: { slug: "asc" }
  });
}





























































































































































































































































































exports.DEFAULT_ANALYTICS_SETTINGS = DEFAULT_ANALYTICS_SETTINGS; exports.DEFAULT_CONSENT = DEFAULT_CONSENT; exports.getAnalyticsSettings = getAnalyticsSettings; exports.clearAnalyticsSettingsCache = clearAnalyticsSettingsCache; exports.trackServerEvent = trackServerEvent; exports.trackPurchase = trackPurchase; exports.getAnalyticsSummary = getAnalyticsSummary; exports.generateGtagScript = generateGtagScript; exports.generateMatomoScript = generateMatomoScript; exports.createPost = createPost; exports.getPost = getPost; exports.getPostBySlug = getPostBySlug; exports.listPosts = listPosts; exports.updatePost = updatePost; exports.deletePost = deletePost; exports.incrementPostViews = incrementPostViews; exports.createCategory = createCategory; exports.getCategory = getCategory; exports.getCategoryBySlug = getCategoryBySlug; exports.listCategories = listCategories; exports.updateCategory = updateCategory; exports.deleteCategory = deleteCategory; exports.createTag = createTag; exports.getTag = getTag; exports.getTagBySlug = getTagBySlug; exports.listTags = listTags; exports.updateTag = updateTag; exports.deleteTag = deleteTag; exports.getOrCreateCart = getOrCreateCart; exports.addToCart = addToCart; exports.updateCartItem = updateCartItem; exports.removeFromCart = removeFromCart; exports.clearCart = clearCart; exports.applyDiscount = applyDiscount; exports.removeDiscount = removeDiscount; exports.updateCartEmail = updateCartEmail; exports.mergeCartsOnLogin = mergeCartsOnLogin; exports.convertCart = convertCart; exports.markAbandonedCarts = markAbandonedCarts; exports.getAbandonedCartsForRecovery = getAbandonedCartsForRecovery; exports.markRecoveryEmailSent = markRecoveryEmailSent; exports.markCartRecovered = markCartRecovered; exports.cleanupExpiredCarts = cleanupExpiredCarts; exports.getCartStats = getCartStats; exports.validateDiscountCode = validateDiscountCode; exports.getApplicableItems = getApplicableItems; exports.isFirstOrderForUser = isFirstOrderForUser; exports.recordDiscountUsage = recordDiscountUsage; exports.calculateDiscount = calculateDiscount; exports.formatDiscount = formatDiscount; exports.getDiscountSummary = getDiscountSummary; exports.calculateCartTotals = calculateCartTotals; exports.getStripeSettings = getStripeSettings; exports.clearStripeSettingsCache = clearStripeSettingsCache; exports.createCheckoutSession = createCheckoutSession; exports.createPaymentIntent = createPaymentIntent; exports.capturePaymentIntent = capturePaymentIntent; exports.cancelPaymentIntent = cancelPaymentIntent; exports.createCustomer = createCustomer; exports.getOrCreateCustomer = getOrCreateCustomer; exports.createSubscription = createSubscription; exports.cancelSubscription = cancelSubscription; exports.createRefund = createRefund; exports.getCheckoutSession = getCheckoutSession; exports.getPaymentIntent = getPaymentIntent; exports.constructWebhookEvent = constructWebhookEvent; exports.createBillingPortalSession = createBillingPortalSession; exports.listPaymentMethods = listPaymentMethods; exports.listInvoices = listInvoices; exports.getProduct = getProduct; exports.createProduct = createProduct; exports.createPrice = createPrice; exports.createStripeCoupon = createStripeCoupon; exports.createStripePromotionCode = createStripePromotionCode; exports.syncDiscountToStripe = syncDiscountToStripe; exports.deleteStripeDiscount = deleteStripeDiscount; exports.toggleStripePromotionCode = toggleStripePromotionCode; exports.importFromStripe = importFromStripe; exports.listUnimportedStripeCoupons = listUnimportedStripeCoupons; exports.validateStripePromotionCode = validateStripePromotionCode; exports.FIELD_TEMPLATES = FIELD_TEMPLATES; exports.DEFAULT_FORM_SETTINGS = DEFAULT_FORM_SETTINGS; exports.createForm = createForm; exports.getForm = getForm; exports.updateForm = updateForm; exports.deleteForm = deleteForm; exports.validateFormData = validateFormData; exports.submitForm = submitForm; exports.getFormSubmissions = getFormSubmissions; exports.markSubmissionRead = markSubmissionRead; exports.starSubmission = starSubmission; exports.deleteSubmission = deleteSubmission; exports.getLowStockItems = getLowStockItems; exports.sendLowStockAlert = sendLowStockAlert; exports.subscribeToBackInStock = subscribeToBackInStock; exports.unsubscribeFromBackInStock = unsubscribeFromBackInStock; exports.sendBackInStockNotifications = sendBackInStockNotifications; exports.checkAndNotifyBackInStock = checkAndNotifyBackInStock; exports.reserveStock = reserveStock; exports.releaseReservation = releaseReservation; exports.releaseSessionReservations = releaseSessionReservations; exports.convertReservationsToOrder = convertReservationsToOrder; exports.deductStockForOrder = deductStockForOrder; exports.cleanupExpiredReservations = cleanupExpiredReservations; exports.getAvailableStock = getAvailableStock; exports.listMedia = listMedia; exports.getMedia = getMedia; exports.createMedia = createMedia; exports.updateMedia = updateMedia; exports.deleteMedia = deleteMedia; exports.restoreMedia = restoreMedia; exports.bulkDeleteMedia = bulkDeleteMedia; exports.bulkMoveMedia = bulkMoveMedia; exports.bulkTagMedia = bulkTagMedia; exports.bulkUntagMedia = bulkUntagMedia; exports.bulkRestoreMedia = bulkRestoreMedia; exports.getMediaStats = getMediaStats; exports.sendOrderConfirmation = sendOrderConfirmation; exports.sendShippingNotification = sendShippingNotification; exports.sendDeliveryConfirmation = sendDeliveryConfirmation; exports.sendRefundNotification = sendRefundNotification; exports.PERMISSIONS = PERMISSIONS; exports.PERMISSION_GROUPS = PERMISSION_GROUPS; exports.BUILT_IN_ROLES = BUILT_IN_ROLES; exports.getUserPermissions = getUserPermissions; exports.hasPermission = hasPermission; exports.checkPermission = checkPermission; exports.hasAllPermissions = hasAllPermissions; exports.hasAnyPermission = hasAnyPermission; exports.isSuperAdmin = isSuperAdmin; exports.logAuditEvent = logAuditEvent; exports.seedBuiltInRoles = seedBuiltInRoles; exports.assignRole = assignRole; exports.removeRole = removeRole; exports.grantPermission = grantPermission; exports.denyPermission = denyPermission; exports.removePermissionOverride = removePermissionOverride; exports.DEFAULT_WORKFLOW_TEMPLATES = DEFAULT_WORKFLOW_TEMPLATES; exports.listWorkflows = listWorkflows; exports.getWorkflow = getWorkflow; exports.getDefaultWorkflow = getDefaultWorkflow; exports.createWorkflow = createWorkflow; exports.updateWorkflow = updateWorkflow; exports.deleteWorkflow = deleteWorkflow; exports.duplicateWorkflow = duplicateWorkflow; exports.assignWorkflowToOrder = assignWorkflowToOrder; exports.initializeOrderWorkflow = initializeOrderWorkflow; exports.generateId = generateId; exports.incrementVersion = incrementVersion; exports.slugify = slugify; exports.validateHandlerSecurity = validateHandlerSecurity; exports.PluginRegistry = PluginRegistry; exports.getPluginRegistry = getPluginRegistry; exports.resetPluginRegistry = resetPluginRegistry; exports.executePrimitive = executePrimitive; exports.testPrimitive = testPrimitive; exports.executeByIdOrName = executeByIdOrName; exports.getExecutionStats = getExecutionStats; exports.getRecentExecutions = getRecentExecutions; exports.loadBuiltInPrimitives = loadBuiltInPrimitives; exports.getReviews = getReviews; exports.getProductReviews = getProductReviews; exports.getReviewById = getReviewById; exports.submitReview = submitReview; exports.updateReview = updateReview; exports.deleteReview = deleteReview; exports.approveReview = approveReview; exports.rejectReview = rejectReview; exports.flagReview = flagReview; exports.respondToReview = respondToReview; exports.voteReview = voteReview; exports.getProductReviewStats = getProductReviewStats; exports.getReviewDashboardStats = getReviewDashboardStats; exports.canCustomerReviewProduct = canCustomerReviewProduct; exports.getOrdersForReviewRequest = getOrdersForReviewRequest; exports.sendReviewRequestEmail = sendReviewRequestEmail; exports.bulkApproveReviews = bulkApproveReviews; exports.bulkRejectReviews = bulkRejectReviews; exports.bulkDeleteReviews = bulkDeleteReviews; exports.DEFAULT_SEO_CONFIG = DEFAULT_SEO_CONFIG; exports.ROBOTS_CONFIGS = ROBOTS_CONFIGS; exports.getSeoConfig = getSeoConfig; exports.clearSeoConfigCache = clearSeoConfigCache; exports.generateMetadata = generateMetadata; exports.generateProductMetadata = generateProductMetadata; exports.generateArticleMetadata = generateArticleMetadata; exports.generateViewport = generateViewport; exports.generateOrganizationSchema = generateOrganizationSchema; exports.generateLocalBusinessSchema = generateLocalBusinessSchema; exports.generateWebsiteSchema = generateWebsiteSchema; exports.generateBreadcrumbSchema = generateBreadcrumbSchema; exports.generateProductSchema = generateProductSchema; exports.generateArticleSchema = generateArticleSchema; exports.generateFaqSchema = generateFaqSchema; exports.renderJsonLd = renderJsonLd; exports.getSiteSettings = getSiteSettings; exports.getOrCreateSiteSettings = getOrCreateSiteSettings; exports.updateSiteSettings = updateSiteSettings; exports.updateHeaderConfig = updateHeaderConfig; exports.updateFooterConfig = updateFooterConfig; exports.updateAnnouncementBarConfig = updateAnnouncementBarConfig; exports.eventBus = eventBus; exports.emit = emit; exports.emitAsync = emitAsync; exports.subscribe = subscribe; exports.unsubscribe = unsubscribe; exports.events = events; exports.nodeTypeDefinitions = nodeTypeDefinitions; exports.toReactFlowNodes = toReactFlowNodes; exports.toReactFlowEdges = toReactFlowEdges; exports.fromReactFlowNodes = fromReactFlowNodes; exports.fromReactFlowEdges = fromReactFlowEdges; exports.validateWorkflow = validateWorkflow; exports.autoLayoutNodes = autoLayoutNodes; exports.generateNodeId = generateNodeId; exports.generateEdgeId = generateEdgeId; exports.createTriggerNode = createTriggerNode; exports.createPrimitiveNode = createPrimitiveNode; exports.createConditionNode = createConditionNode; exports.createOutputNode = createOutputNode; exports.serializeWorkflow = serializeWorkflow; exports.deserializeWorkflow = deserializeWorkflow; exports.registerAction = registerAction; exports.getAction = getAction; exports.getAllActions = getAllActions; exports.getActionsByCategory = getActionsByCategory; exports.executeAction = executeAction; exports.actionCategories = actionCategories; exports.getWorkflowTemplates = getWorkflowTemplates; exports.getWorkflowTemplate = getWorkflowTemplate; exports.getTemplatesByCategory = getTemplatesByCategory; exports.getPopularTemplates = getPopularTemplates; exports.getRecommendedTemplates = getRecommendedTemplates; exports.installWorkflowTemplate = installWorkflowTemplate; exports.createTemplateFromWorkflow = createTemplateFromWorkflow; exports.updateTemplate = updateTemplate; exports.deleteTemplate = deleteTemplate; exports.getTemplateStats = getTemplateStats; exports.getCategoryStats = getCategoryStats; exports.enableWorkflow = enableWorkflow; exports.disableWorkflow = disableWorkflow; exports.toggleWorkflow = toggleWorkflow; exports.enableWorkflows = enableWorkflows; exports.disableWorkflows = disableWorkflows; exports.disableAllWorkflows = disableAllWorkflows; exports.enableWorkflowsByCategory = enableWorkflowsByCategory; exports.disableWorkflowsByTrigger = disableWorkflowsByTrigger; exports.canEnableWorkflow = canEnableWorkflow; exports.getWorkflowStatus = getWorkflowStatus; exports.getAllWorkflowStatuses = getAllWorkflowStatuses; exports.getEnabledWorkflowCounts = getEnabledWorkflowCounts; exports.initializeEventWorkflows = initializeEventWorkflows; exports.cleanupAllSubscriptions = cleanupAllSubscriptions; exports.SHIPMENT_STATUSES = SHIPMENT_STATUSES; exports.CARRIER_OPTIONS = CARRIER_OPTIONS; exports.LABEL_FORMAT_OPTIONS = LABEL_FORMAT_OPTIONS; exports.getShippingSettings = getShippingSettings; exports.clearShippingSettingsCache = clearShippingSettingsCache; exports.getDefaultFromAddress = getDefaultFromAddress; exports.validateAddress = validateAddress; exports.createShipment = createShipment; exports.getRates = getRates; exports.purchaseLabel = purchaseLabel; exports.getTracking = getTracking; exports.refundLabel = refundLabel; exports.registerTrackingWebhook = registerTrackingWebhook; exports.DEFAULT_WIDGETS = DEFAULT_WIDGETS; exports.DASHBOARD_PRESETS = DASHBOARD_PRESETS; exports.getDefaultDashboardConfig = getDefaultDashboardConfig; exports.getDashboardConfig = getDashboardConfig; exports.saveDashboardConfig = saveDashboardConfig; exports.applyDashboardPreset = applyDashboardPreset; exports.toggleTab = toggleTab; exports.addTab = addTab; exports.removeTab = removeTab; exports.reorderTabs = reorderTabs; exports.addWidget = addWidget; exports.removeWidget = removeWidget; exports.toggleWidget = toggleWidget; exports.getAvailablePresets = getAvailablePresets; exports.getRouteConfig = getRouteConfig; exports.isSlugReserved = isSlugReserved; exports.getAllRouteConfigs = getAllRouteConfigs;
//# sourceMappingURL=chunk-3U2WKHNO.js.map