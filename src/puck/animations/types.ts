import { Variants, Transition } from "framer-motion";

export interface AnimationConfig {
  // Whether animation is enabled
  enabled: boolean;

  // Animation type
  type: "none" | "fade" | "slide" | "scale" | "blur" | "custom";

  // Direction for slide animations
  direction?: "up" | "down" | "left" | "right";

  // Timing
  duration: number;
  delay: number;
  stagger?: number; // For children

  // Easing
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring";

  // Spring config (when easing is spring)
  springConfig?: {
    stiffness: number;
    damping: number;
    mass: number;
  };

  // Trigger
  trigger: "onLoad" | "onScroll" | "onHover" | "onClick";

  // Scroll trigger options
  scrollTrigger?: {
    threshold: number; // 0-1, when element should animate
    once: boolean; // Only animate once
  };

  // Hover animation (separate from entrance)
  hover?: {
    scale?: number;
    rotate?: number;
    y?: number;
    x?: number;
    opacity?: number;
  };

  // Custom variants (advanced)
  customVariants?: Variants;
}

export interface LockConfig {
  isLocked: boolean;
  lockType: "full" | "position" | "content" | "style";
  password?: string; // Optional password protection
}

export interface GroupConfig {
  groupId?: string;
  isGroupParent: boolean;
  groupChildren?: string[];
  collapsed?: boolean;
}

// Default animation config
export const defaultAnimationConfig: AnimationConfig = {
  enabled: false,
  type: "none",
  duration: 0.5,
  delay: 0,
  easing: "easeOut",
  trigger: "onScroll",
  scrollTrigger: {
    threshold: 0.2,
    once: true,
  },
};

// Default lock config
export const defaultLockConfig: LockConfig = {
  isLocked: false,
  lockType: "full",
};

// Default group config
export const defaultGroupConfig: GroupConfig = {
  isGroupParent: false,
  collapsed: false,
};
