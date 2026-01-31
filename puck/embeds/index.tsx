'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/cms/utils';

// ============ FORM EMBED ============
export interface FormEmbedProps {
  formId: string;
  showTitle?: boolean;
  showDescription?: boolean;
  className?: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormData {
  id: string;
  name: string;
  description: string | null;
  fields: FormField[];
  submitButtonText: string;
  successMessage: string | null;
  status: string;
}

export function FormEmbed({
  formId,
  showTitle = true,
  showDescription = true,
  className,
}: FormEmbedProps) {
  const [form, setForm] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!formId) {
      setError('No form selected');
      setIsLoading(false);
      return;
    }

    const fetchForm = async () => {
      try {
        const response = await fetch('/api/forms/' + formId);
        if (!response.ok) {
          throw new Error('Form not found');
        }
        const data = await response.json();
        if (data.form.status !== 'ACTIVE') {
          throw new Error('Form is not active');
        }
        setForm(data.form);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await fetch('/api/forms/' + formId + '/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <div className="animate-pulse">Loading form...</div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className={cn('p-8 text-center text-red-500', className)}>
        {error}
      </div>
    );
  }

  if (!form) {
    return (
      <div className={cn('p-8 text-center text-muted-foreground', className)}>
        Select a form to embed
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <div className="text-green-600 text-lg font-medium">
          {form.successMessage || 'Thank you for your submission!'}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-6', className)}>
      {showTitle && form.name && (
        <h3 className="text-xl font-semibold mb-2">{form.name}</h3>
      )}
      {showDescription && form.description && (
        <p className="text-muted-foreground mb-6">{form.description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {form.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                value={formValues[field.id] || ''}
                onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
              />
            ) : field.type === 'select' ? (
              <select
                className="w-full px-3 py-2 border rounded-md"
                required={field.required}
                value={formValues[field.id] || ''}
                onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'radio' ? (
              <div className="space-y-2">
                {field.options?.map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={field.id}
                      value={opt}
                      required={field.required}
                      checked={formValues[field.id] === opt}
                      onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : field.type === 'checkbox' ? (
              <div className="space-y-2">
                {field.options?.map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={opt}
                      checked={(formValues[field.id] || '').includes(opt)}
                      onChange={(e) => {
                        const current = formValues[field.id] || '';
                        const values = current.split(',').filter(Boolean);
                        if (e.target.checked) {
                          values.push(opt);
                        } else {
                          const idx = values.indexOf(opt);
                          if (idx > -1) values.splice(idx, 1);
                        }
                        setFormValues({ ...formValues, [field.id]: values.join(',') });
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : field.type === 'toggle' ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formValues[field.id] === 'true'}
                  onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.checked ? 'true' : 'false' })}
                />
                {field.placeholder || 'Enable'}
              </label>
            ) : (
              <input
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                className="w-full px-3 py-2 border rounded-md"
                placeholder={field.placeholder}
                required={field.required}
                value={formValues[field.id] || ''}
                onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
              />
            )}

            {fieldErrors[field.id] && (
              <p className="text-red-500 text-sm">{fieldErrors[field.id]}</p>
            )}
          </div>
        ))}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : form.submitButtonText}
        </button>
      </form>
    </div>
  );
}

// ============ PRODUCT EMBED ============
export interface ProductEmbedProps {
  productId: string;
  showImage?: boolean;
  showPrice?: boolean;
  showDescription?: boolean;
  showButton?: boolean;
  buttonText?: string;
  imageHeight?: 'small' | 'medium' | 'large';
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  images: Array<{ url: string; alt?: string }>;
  status: string;
}

export function ProductEmbed({
  productId,
  showImage = true,
  showPrice = true,
  showDescription = true,
  showButton = true,
  buttonText = 'View Product',
  imageHeight = 'medium',
}: ProductEmbedProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const imageHeights = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64',
  };

  useEffect(() => {
    if (!productId) {
      setError('No product selected');
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await fetch('/api/products/' + productId);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="p-4 text-center animate-pulse">Loading product...</div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {error || 'Select a product to embed'}
      </div>
    );
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {showImage && product.images?.[0] && (
        <div className={cn('relative overflow-hidden bg-muted', imageHeights[imageHeight])}>
          <img
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        {showPrice && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
        )}
        {showDescription && product.description && (
          <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
        {showButton && (
          <a
            href={'/products/' + product.slug}
            className="mt-4 block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
}

// ============ PRODUCT GRID ============
export interface ProductGridProps {
  categoryId?: string;
  limit?: number;
  columns?: 2 | 3 | 4;
  showImage?: boolean;
  showPrice?: boolean;
  showDescription?: boolean;
  gap?: 'small' | 'medium' | 'large';
}

export function ProductGrid({
  categoryId,
  limit = 8,
  columns = 4,
  showImage = true,
  showPrice = true,
  showDescription = false,
  gap = 'medium',
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const gaps = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = '/api/products?limit=' + limit + '&status=ACTIVE';
        if (categoryId) {
          url += '&categoryId=' + categoryId;
        }
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || data || []);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, limit]);

  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">Loading products...</div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No products found
      </div>
    );
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className={cn('grid', gridCols[columns], gaps[gap])}>
      {products.map((product) => (
        <a
          key={product.id}
          href={'/products/' + product.slug}
          className="border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
        >
          {showImage && product.images?.[0] && (
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-medium">{product.name}</h3>
            {showPrice && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold">{formatPrice(product.price)}</span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>
            )}
            {showDescription && product.description && (
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

// ============ BLOG POST EMBED ============
export interface BlogPostEmbedProps {
  postId: string;
  showImage?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  showAuthor?: boolean;
  imageHeight?: 'small' | 'medium' | 'large';
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage?: { url: string; alt?: string } | null;
  featuredImageId?: string | null;
  author?: { name: string } | null;
  publishedAt: string | null;
  status: string;
}

export function BlogPostEmbed({
  postId,
  showImage = true,
  showExcerpt = true,
  showDate = true,
  showAuthor = true,
  imageHeight = 'medium',
}: BlogPostEmbedProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const imageHeights = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64',
  };

  useEffect(() => {
    if (!postId) {
      setError('No post selected');
      setIsLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await fetch('/api/blog/' + postId);
        if (!response.ok) {
          throw new Error('Post not found');
        }
        const data = await response.json();
        setPost(data.post || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="p-4 text-center animate-pulse">Loading post...</div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {error || 'Select a blog post to embed'}
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <a
      href={'/blog/' + post.slug}
      className="block border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
    >
      {showImage && post.featuredImage && (
        <div className={cn('relative overflow-hidden bg-muted', imageHeights[imageHeight])}>
          <img
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{post.title}</h3>
        {(showDate || showAuthor) && (
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            {showDate && post.publishedAt && (
              <span>{formatDate(post.publishedAt)}</span>
            )}
            {showDate && showAuthor && post.author && <span>•</span>}
            {showAuthor && post.author && (
              <span>{post.author.name}</span>
            )}
          </div>
        )}
        {showExcerpt && post.excerpt && (
          <p className="text-muted-foreground text-sm mt-2 line-clamp-3">
            {post.excerpt}
          </p>
        )}
      </div>
    </a>
  );
}

// ============ BLOG GRID ============
export interface BlogGridProps {
  categoryId?: string;
  tagId?: string;
  limit?: number;
  columns?: 2 | 3 | 4;
  showImage?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  gap?: 'small' | 'medium' | 'large';
}

export function BlogGrid({
  categoryId,
  tagId,
  limit = 6,
  columns = 3,
  showImage = true,
  showExcerpt = true,
  showDate = true,
  gap = 'medium',
}: BlogGridProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const gaps = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let url = '/api/blog?limit=' + limit + '&status=PUBLISHED';
        if (categoryId) {
          url += '&categoryId=' + categoryId;
        }
        if (tagId) {
          url += '&tagId=' + tagId;
        }
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || data || []);
        }
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [categoryId, tagId, limit]);

  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">Loading posts...</div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No posts found
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={cn('grid', gridCols[columns], gaps[gap])}>
      {posts.map((post) => (
        <a
          key={post.id}
          href={'/blog/' + post.slug}
          className="border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
        >
          {showImage && post.featuredImage && (
            <div className="aspect-video overflow-hidden bg-muted">
              <img
                src={post.featuredImage.url}
                alt={post.featuredImage.alt || post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-medium">{post.title}</h3>
            {showDate && post.publishedAt && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(post.publishedAt)}
              </p>
            )}
            {showExcerpt && post.excerpt && (
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                {post.excerpt}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
