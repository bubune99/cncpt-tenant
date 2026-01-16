'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Mail, 
  Copy, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MoreVertical 
} from 'lucide-react';

interface BusinessOwner {
  id: string;
  stackAuthUserId: string;
  email: string;
  businessName: string;
  settings?: {
    invitationToken?: string;
    invitationExpires?: string;
    invitationSent?: string;
    invitationAccepted?: string;
  };
}

interface InvitationStatusBadgeProps {
  businessOwner: BusinessOwner;
  onInvitationResent?: () => void;
}

export default function InvitationStatusBadge({ 
  businessOwner, 
  onInvitationResent 
}: InvitationStatusBadgeProps) {
  const [isResending, setIsResending] = useState(false);

  // Determine invitation status
  const isAccepted = !businessOwner.stackAuthUserId.startsWith('pending-');
  const hasInvitation = !!businessOwner.settings?.invitationToken;
  const invitationExpires = businessOwner.settings?.invitationExpires;
  const isExpired = invitationExpires ? new Date(invitationExpires) < new Date() : false;

  const getStatus = () => {
    if (isAccepted) return 'accepted';
    if (!hasInvitation) return 'no-invitation';
    if (isExpired) return 'expired';
    return 'pending';
  };

  const status = getStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'accepted':
        return {
          badge: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>,
          tooltip: 'Business owner has accepted invitation and can log in'
        };
      case 'expired':
        return {
          badge: <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </Badge>,
          tooltip: `Invitation expired on ${new Date(invitationExpires!).toLocaleDateString()}`
        };
      case 'pending':
        return {
          badge: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>,
          tooltip: `Invitation expires on ${new Date(invitationExpires!).toLocaleDateString()}`
        };
      default:
        return {
          badge: <Badge variant="secondary">
            <Mail className="w-3 h-3 mr-1" />
            No Invitation
          </Badge>,
          tooltip: 'No invitation has been sent'
        };
    }
  };

  const { badge, tooltip } = getStatusConfig();

  const copyInvitationUrl = () => {
    if (!businessOwner.settings?.invitationToken) return;
    
    const invitationUrl = `${window.location.origin}/invitation/accept?token=${businessOwner.settings.invitationToken}`;
    navigator.clipboard.writeText(invitationUrl);
    alert('Invitation URL copied to clipboard!');
  };

  const resendInvitation = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/invitation/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessOwnerId: businessOwner.id,
          extendDays: 7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend invitation');
      }

      const result = await response.json();
      
      alert(`✅ Invitation resent successfully!

New invitation URL: ${result.invitationUrl}
Expires: ${new Date(result.invitationExpires).toLocaleDateString()}

The invitation URL has been copied to your clipboard.`);

      // Copy new URL to clipboard
      navigator.clipboard.writeText(result.invitationUrl);
      
      if (onInvitationResent) {
        onInvitationResent();
      }

    } catch (error) {
      alert(`❌ Failed to resend invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsResending(false);
    }
  };

  const showActions = !isAccepted && (hasInvitation || status === 'no-invitation');

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasInvitation && (
              <DropdownMenuItem onClick={copyInvitationUrl}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Invitation URL
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={resendInvitation} disabled={isResending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Resending...' : 'Resend Invitation'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}