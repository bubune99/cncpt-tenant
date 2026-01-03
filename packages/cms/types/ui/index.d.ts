import * as React from 'react';

// Button
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

// Card
export declare const Card: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
export declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
export declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
export declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
export declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
export declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

// Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

// Label
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
export declare const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;

// Textarea
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

// Select
export declare const Select: React.FC<any>;
export declare const SelectContent: React.FC<any>;
export declare const SelectItem: React.FC<any>;
export declare const SelectTrigger: React.FC<any>;
export declare const SelectValue: React.FC<any>;

// Dialog
export declare const Dialog: React.FC<any>;
export declare const DialogContent: React.FC<any>;
export declare const DialogHeader: React.FC<any>;
export declare const DialogTitle: React.FC<any>;
export declare const DialogDescription: React.FC<any>;
export declare const DialogFooter: React.FC<any>;
export declare const DialogTrigger: React.FC<any>;

// Tabs
export declare const Tabs: React.FC<any>;
export declare const TabsContent: React.FC<any>;
export declare const TabsList: React.FC<any>;
export declare const TabsTrigger: React.FC<any>;

// Badge
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}
export declare const Badge: React.FC<BadgeProps>;

// Switch
export declare const Switch: React.FC<any>;

// Checkbox
export declare const Checkbox: React.FC<any>;

// Avatar
export declare const Avatar: React.FC<any>;
export declare const AvatarFallback: React.FC<any>;
export declare const AvatarImage: React.FC<any>;

// Dropdown Menu
export declare const DropdownMenu: React.FC<any>;
export declare const DropdownMenuContent: React.FC<any>;
export declare const DropdownMenuItem: React.FC<any>;
export declare const DropdownMenuTrigger: React.FC<any>;
export declare const DropdownMenuSeparator: React.FC<any>;

// Tooltip
export declare const Tooltip: React.FC<any>;
export declare const TooltipContent: React.FC<any>;
export declare const TooltipProvider: React.FC<any>;
export declare const TooltipTrigger: React.FC<any>;

// Skeleton
export declare const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>>;

// Separator
export declare const Separator: React.FC<any>;

// ScrollArea
export declare const ScrollArea: React.FC<any>;

// Alert
export declare const Alert: React.FC<any>;
export declare const AlertTitle: React.FC<any>;
export declare const AlertDescription: React.FC<any>;
