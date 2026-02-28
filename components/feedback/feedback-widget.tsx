'use client';

/**
 * Feedback Widget Component
 *
 * A floating button that opens a feedback modal.
 * Can be placed in dashboard, CMS admin, or any protected page.
 */

import { useState } from 'react';
import { useUser } from '@stackframe/stack';
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FeedbackType = 'BUG' | 'FEATURE' | 'GENERAL' | 'OTHER';

interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  tenantId?: number;
  className?: string;
}

const feedbackTypes: { value: FeedbackType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'BUG', label: 'Bug Report', icon: Bug, description: 'Something is broken' },
  { value: 'FEATURE', label: 'Feature Request', icon: Lightbulb, description: 'Suggest an improvement' },
  { value: 'GENERAL', label: 'General Feedback', icon: MessageSquarePlus, description: 'Share your thoughts' },
  { value: 'OTHER', label: 'Other', icon: HelpCircle, description: 'Something else' },
];

export function FeedbackWidget({ position = 'bottom-right', tenantId, className }: FeedbackWidgetProps) {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<FeedbackType>('GENERAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: subject.trim() || undefined,
          message: message.trim(),
          pageUrl: window.location.href,
          tenantId,
        }),
      });

      if (response.ok) {
        toast.success('Thank you for your feedback!');
        setOpen(false);
        setType('GENERAL');
        setSubject('');
        setMessage('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Only show for authenticated users
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className={cn(
            'fixed z-40 h-12 w-12 rounded-full shadow-lg',
            position === 'bottom-right' ? 'bottom-20 right-6' : 'bottom-20 left-6',
            className
          )}
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span className="sr-only">Send Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by sharing your thoughts, reporting bugs, or suggesting features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Type Selection */}
          <div className="space-y-2">
            <Label>What type of feedback?</Label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                    type === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn('h-4 w-4', type === value ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject (optional) */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              placeholder="Brief summary..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Your feedback *</Label>
            <Textarea
              id="message"
              placeholder={
                type === 'BUG'
                  ? 'Describe the bug, what you expected, and steps to reproduce...'
                  : type === 'FEATURE'
                  ? 'Describe the feature you would like to see...'
                  : 'Share your thoughts...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !message.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
