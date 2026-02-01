'use client';

/**
 * Media Help Panel
 *
 * Collapsible help panel that provides guidance for using the media manager.
 * Can be shown/hidden by users and remembers preference.
 */

import { useState, useEffect } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Upload,
  FolderPlus,
  Tag,
  Search,
  Trash2,
  Image,
  FileVideo,
  FileText,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaHelpPanelProps {
  className?: string;
}

export function MediaHelpPanel({ className }: MediaHelpPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('media-help-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('media-help-dismissed', 'true');
  };

  const handleShow = () => {
    setIsDismissed(false);
    localStorage.removeItem('media-help-dismissed');
  };

  if (isDismissed) {
    return (
      <button
        onClick={handleShow}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Show Help
      </button>
    );
  }

  return (
    <div
      className={cn(
        'bg-muted/50 border rounded-lg overflow-hidden transition-all',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Media Library Help</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="p-1 hover:bg-muted rounded"
            title="Dismiss help"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Quick Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <HelpCard
              icon={Upload}
              title="Upload Files"
              description="Drag & drop files or click to browse. Max 50MB per file."
            />
            <HelpCard
              icon={FolderPlus}
              title="Create Folders"
              description="Organize files into folders like Products, Blog, Branding."
            />
            <HelpCard
              icon={Tag}
              title="Add Tags"
              description="Tag files for easy discovery across folders."
            />
            <HelpCard
              icon={Search}
              title="Search"
              description="Find files by name, title, alt text, or tags."
            />
            <HelpCard
              icon={Trash2}
              title="Bulk Actions"
              description="Select multiple files to move, tag, or delete."
            />
            <HelpCard
              icon={HelpCircle}
              title="Help Mode"
              description="Press Ctrl+Q for interactive help on any element."
            />
          </div>

          {/* Supported Formats */}
          <div className="pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Supported File Types
            </h4>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-blue-500" />
                <span>JPG, PNG, GIF, WebP, SVG</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileVideo className="w-3.5 h-3.5 text-purple-500" />
                <span>MP4, WebM, MOV</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                <span>PDF, DOC, XLS, PPT</span>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Best Practices
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                • <strong>Optimize images</strong> before upload - resize to max
                2000px width
              </li>
              <li>
                • <strong>Add alt text</strong> for accessibility and SEO
              </li>
              <li>
                • <strong>Use descriptive names</strong> like
                "blue-shoes-side.jpg" not "IMG_1234.jpg"
              </li>
              <li>
                • <strong>Organize early</strong> - create folders before bulk
                uploading
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

interface HelpCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function HelpCard({ icon: Icon, title, description }: HelpCardProps) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 bg-background rounded-md border">
      <div className="p-1.5 bg-primary/10 rounded">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div>
        <h4 className="text-xs font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default MediaHelpPanel;
