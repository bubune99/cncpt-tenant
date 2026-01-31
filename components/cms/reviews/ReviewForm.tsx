'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Loader2, X, Upload, CheckCircle } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/cms/utils';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  productId: string;
  productName: string;
  orderId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
  reviewerName: string;
  reviewerEmail: string;
  images: string[];
}

export function ReviewForm({
  productId,
  productName,
  orderId,
  open,
  onOpenChange,
  onSuccess,
}: ReviewFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    rating: 0,
    title: '',
    content: '',
    pros: '',
    cons: '',
    reviewerName: '',
    reviewerEmail: '',
    images: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.rating) {
      newErrors.rating = 'Please select a rating';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Please write a review';
    } else if (formData.content.length < 20) {
      newErrors.content = 'Review must be at least 20 characters';
    }
    if (!formData.reviewerName.trim()) {
      newErrors.reviewerName = 'Please enter your name';
    }
    if (!formData.reviewerEmail.trim()) {
      newErrors.reviewerEmail = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reviewerEmail)) {
      newErrors.reviewerEmail = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          orderId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitted(true);
      sonnerToast.success('Review submitted!', {
        description: 'Thank you for your feedback. Your review will be visible after moderation.',
      });

      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 5) {
      sonnerToast.error('Maximum 5 images allowed');
      return;
    }

    try {
      setUploadingImage(true);

      // Upload each file
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          sonnerToast.error(`File ${file.name} is too large (max 5MB)`);
          continue;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      sonnerToast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleClose = () => {
    if (!submitting) {
      setSubmitted(false);
      setFormData({
        rating: 0,
        title: '',
        content: '',
        pros: '',
        cons: '',
        reviewerName: '',
        reviewerEmail: '',
        images: [],
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <DialogHeader>
              <DialogTitle>Thank You!</DialogTitle>
              <DialogDescription>
                Your review has been submitted and will be visible after moderation.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience with {productName}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rating */}
              <div className="space-y-2">
                <Label>Rating *</Label>
                <StarRating
                  rating={formData.rating}
                  size="lg"
                  interactive
                  onChange={(rating) =>
                    setFormData((prev) => ({ ...prev, rating }))
                  }
                />
                {errors.rating && (
                  <p className="text-sm text-destructive">{errors.rating}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Review Title</Label>
                <Input
                  id="title"
                  placeholder="Summarize your review"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  maxLength={100}
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Your Review *</Label>
                <Textarea
                  id="content"
                  placeholder="What did you like or dislike? How did you use the product?"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={4}
                  className={cn(errors.content && 'border-destructive')}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {errors.content ? (
                    <span className="text-destructive">{errors.content}</span>
                  ) : (
                    <span>Minimum 20 characters</span>
                  )}
                  <span>{formData.content.length}/2000</span>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pros">Pros</Label>
                  <Textarea
                    id="pros"
                    placeholder="What did you like?"
                    value={formData.pros}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, pros: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cons">Cons</Label>
                  <Textarea
                    id="cons"
                    placeholder="What could be improved?"
                    value={formData.cons}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cons: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Add Photos (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative h-20 w-20 rounded overflow-hidden border"
                    >
                      <Image
                        src={image}
                        alt={`Upload ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 h-5 w-5 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 5 && (
                    <label className="h-20 w-20 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                      {uploadingImage ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1">Add</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Up to 5 images, max 5MB each
                </p>
              </div>

              {/* Reviewer Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reviewerName">Your Name *</Label>
                  <Input
                    id="reviewerName"
                    placeholder="John Doe"
                    value={formData.reviewerName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reviewerName: e.target.value,
                      }))
                    }
                    className={cn(errors.reviewerName && 'border-destructive')}
                  />
                  {errors.reviewerName && (
                    <p className="text-sm text-destructive">{errors.reviewerName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewerEmail">Your Email *</Label>
                  <Input
                    id="reviewerEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.reviewerEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reviewerEmail: e.target.value,
                      }))
                    }
                    className={cn(errors.reviewerEmail && 'border-destructive')}
                  />
                  {errors.reviewerEmail && (
                    <p className="text-sm text-destructive">{errors.reviewerEmail}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Your email will not be published. Required fields are marked with *
              </p>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
