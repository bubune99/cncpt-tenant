import { Variants, Transition, Easing } from "framer-motion";
import { AnimationConfig } from "./types";

// Animation preset definitions
export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  category: "entrance" | "attention" | "exit" | "scroll";
  config: Partial<AnimationConfig>;
  variants: Variants;
}

// Easing functions mapping - using cubic bezier values
export const easingMap: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  spring: [0.43, 0.13, 0.23, 0.96], // spring-like bezier
};

// Get transition config from animation config
export function getTransition(config: AnimationConfig): Transition {
  const base: Transition = {
    duration: config.duration,
    delay: config.delay,
  };

  if (config.easing === "spring" && config.springConfig) {
    return {
      ...base,
      type: "spring",
      stiffness: config.springConfig.stiffness,
      damping: config.springConfig.damping,
      mass: config.springConfig.mass,
    };
  }

  return {
    ...base,
    ease: easingMap[config.easing] as Easing,
  };
}

// Entrance animation presets
export const entrancePresets: AnimationPreset[] = [
  {
    id: "fade-in",
    name: "Fade In",
    description: "Simple opacity fade",
    category: "entrance",
    config: { type: "fade", duration: 0.5 },
    variants: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  },
  {
    id: "fade-up",
    name: "Fade Up",
    description: "Fade in while sliding up",
    category: "entrance",
    config: { type: "slide", direction: "up", duration: 0.6 },
    variants: {
      hidden: { opacity: 0, y: 40 },
      visible: { opacity: 1, y: 0 },
    },
  },
  {
    id: "fade-down",
    name: "Fade Down",
    description: "Fade in while sliding down",
    category: "entrance",
    config: { type: "slide", direction: "down", duration: 0.6 },
    variants: {
      hidden: { opacity: 0, y: -40 },
      visible: { opacity: 1, y: 0 },
    },
  },
  {
    id: "fade-left",
    name: "Fade Left",
    description: "Fade in from the right",
    category: "entrance",
    config: { type: "slide", direction: "left", duration: 0.6 },
    variants: {
      hidden: { opacity: 0, x: 40 },
      visible: { opacity: 1, x: 0 },
    },
  },
  {
    id: "fade-right",
    name: "Fade Right",
    description: "Fade in from the left",
    category: "entrance",
    config: { type: "slide", direction: "right", duration: 0.6 },
    variants: {
      hidden: { opacity: 0, x: -40 },
      visible: { opacity: 1, x: 0 },
    },
  },
  {
    id: "scale-up",
    name: "Scale Up",
    description: "Grow from smaller size",
    category: "entrance",
    config: { type: "scale", duration: 0.5 },
    variants: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  {
    id: "scale-down",
    name: "Scale Down",
    description: "Shrink from larger size",
    category: "entrance",
    config: { type: "scale", duration: 0.5 },
    variants: {
      hidden: { opacity: 0, scale: 1.2 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  {
    id: "blur-in",
    name: "Blur In",
    description: "Fade in with blur",
    category: "entrance",
    config: { type: "blur", duration: 0.6 },
    variants: {
      hidden: { opacity: 0, filter: "blur(10px)" },
      visible: { opacity: 1, filter: "blur(0px)" },
    },
  },
  {
    id: "spring-up",
    name: "Spring Up",
    description: "Bouncy slide up",
    category: "entrance",
    config: { type: "slide", direction: "up", easing: "spring", duration: 0.8 },
    variants: {
      hidden: { opacity: 0, y: 60 },
      visible: { opacity: 1, y: 0 },
    },
  },
  {
    id: "rotate-in",
    name: "Rotate In",
    description: "Fade in with rotation",
    category: "entrance",
    config: { type: "custom", duration: 0.6 },
    variants: {
      hidden: { opacity: 0, rotate: -10, scale: 0.9 },
      visible: { opacity: 1, rotate: 0, scale: 1 },
    },
  },
];

// Attention/hover animation presets
export const attentionPresets: AnimationPreset[] = [
  {
    id: "hover-lift",
    name: "Hover Lift",
    description: "Lift up on hover",
    category: "attention",
    config: { hover: { y: -8, scale: 1.02 } },
    variants: {},
  },
  {
    id: "hover-grow",
    name: "Hover Grow",
    description: "Scale up on hover",
    category: "attention",
    config: { hover: { scale: 1.05 } },
    variants: {},
  },
  {
    id: "hover-glow",
    name: "Hover Glow",
    description: "Brighten on hover",
    category: "attention",
    config: { hover: { scale: 1.02, opacity: 0.9 } },
    variants: {},
  },
  {
    id: "hover-tilt",
    name: "Hover Tilt",
    description: "Slight rotation on hover",
    category: "attention",
    config: { hover: { rotate: 2, scale: 1.02 } },
    variants: {},
  },
];

// Stagger presets for parent containers
export const staggerPresets = [
  { id: "stagger-fast", name: "Fast Stagger", stagger: 0.05 },
  { id: "stagger-normal", name: "Normal Stagger", stagger: 0.1 },
  { id: "stagger-slow", name: "Slow Stagger", stagger: 0.15 },
  { id: "stagger-dramatic", name: "Dramatic Stagger", stagger: 0.25 },
];

// All presets combined
export const allAnimationPresets = [...entrancePresets, ...attentionPresets];

// Get preset by ID
export function getPresetById(id: string): AnimationPreset | undefined {
  return allAnimationPresets.find((p) => p.id === id);
}

// Get presets by category
export function getPresetsByCategory(category: AnimationPreset["category"]): AnimationPreset[] {
  return allAnimationPresets.filter((p) => p.category === category);
}
