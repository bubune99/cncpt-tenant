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

// Lottie animation config
export interface LottieConfig {
  /** Unique ID for the animation */
  animationId: string;
  /** Play mode */
  playMode: "auto" | "hover" | "scroll" | "click";
  /** Whether to loop */
  loop: boolean;
  /** Playback speed */
  speed: number;
  /** Playback direction (1 = forward, -1 = reverse) */
  direction?: 1 | -1;
  /** Start frame for segment playback */
  startFrame?: number;
  /** End frame for segment playback */
  endFrame?: number;
}

// Default Lottie config
export const defaultLottieConfig: LottieConfig = {
  animationId: "",
  playMode: "auto",
  loop: true,
  speed: 1,
  direction: 1,
};

// Timeline entry for sequenced animations
export interface TimelineEntry {
  /** Target component ID */
  target: string;
  /** Optional label for the entry */
  label?: string;
  /** Start time (number in seconds, or relative like "+=0.5", "-=0.2", or "previous"/"start") */
  startAt: number | "previous" | "start" | `+=${number}` | `-=${number}`;
  /** Animation config for this entry */
  animation: Partial<AnimationConfig>;
}

// Timeline config for orchestrated animations
export interface TimelineConfig {
  /** Unique ID for the timeline */
  id?: string;
  /** Display name for the timeline */
  name?: string;
  /** Sequence of animations */
  sequence: TimelineEntry[];
  /** Trigger for the timeline */
  trigger: "onLoad" | "onScroll" | "onClick";
  /** Loop the timeline (true = infinite, number = specific count) */
  loop?: boolean | number;
  /** Delay before starting */
  delay?: number;
  /** Auto-play on trigger */
  autoPlay?: boolean;
}

// Default timeline config
export const defaultTimelineConfig: TimelineConfig = {
  sequence: [],
  trigger: "onScroll",
  loop: false,
  delay: 0,
  autoPlay: true,
};
