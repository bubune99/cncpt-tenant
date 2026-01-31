"use client";

import { ReactNode, useEffect, useRef } from "react";
import { motion, useInView, useAnimation, Variants } from "framer-motion";
import { AnimationConfig, defaultAnimationConfig } from "./types";
import { getTransition, getPresetById } from "./presets";

interface AnimatedWrapperProps {
  children: ReactNode;
  animation?: Partial<AnimationConfig>;
  presetId?: string;
  className?: string;
  style?: React.CSSProperties;
  isEditing?: boolean;
}

export function AnimatedWrapper({
  children,
  animation = defaultAnimationConfig,
  presetId,
  className,
  style,
  isEditing = false,
}: AnimatedWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Merge with preset if provided
  const preset = presetId ? getPresetById(presetId) : null;
  const config: AnimationConfig = {
    ...defaultAnimationConfig,
    ...preset?.config,
    ...animation,
  };

  // Get variants from preset or generate from config
  const variants: Variants = preset?.variants || generateVariants(config);

  // Scroll trigger
  const isInView = useInView(ref, {
    once: config.scrollTrigger?.once ?? true,
    amount: config.scrollTrigger?.threshold ?? 0.2,
  });

  useEffect(() => {
    if (isEditing) {
      // In edit mode, show everything immediately
      controls.set("visible");
      return;
    }

    if (config.trigger === "onLoad") {
      controls.start("visible");
    } else if (config.trigger === "onScroll" && isInView) {
      controls.start("visible");
    }
  }, [isInView, config.trigger, controls, isEditing]);

  // If animation is disabled or we're in editing mode, render without animation
  if (!config.enabled || isEditing) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const transition = getTransition(config);

  // Hover animation props
  const hoverProps = config.hover
    ? {
        whileHover: {
          ...config.hover,
          transition: { duration: 0.2 },
        },
      }
    : {};

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={transition}
      {...hoverProps}
    >
      {children}
    </motion.div>
  );
}

// Generate variants from animation config
function generateVariants(config: AnimationConfig): Variants {
  const hidden: Record<string, number | string> = { opacity: 0 };
  const visible: Record<string, number | string> = { opacity: 1 };

  switch (config.type) {
    case "fade":
      // Just opacity, already set
      break;

    case "slide":
      const distance = 40;
      switch (config.direction) {
        case "up":
          hidden.y = distance;
          visible.y = 0;
          break;
        case "down":
          hidden.y = -distance;
          visible.y = 0;
          break;
        case "left":
          hidden.x = distance;
          visible.x = 0;
          break;
        case "right":
          hidden.x = -distance;
          visible.x = 0;
          break;
      }
      break;

    case "scale":
      hidden.scale = 0.8;
      visible.scale = 1;
      break;

    case "blur":
      hidden.filter = "blur(10px)";
      visible.filter = "blur(0px)";
      break;

    case "custom":
      return config.customVariants || { hidden, visible };

    default:
      break;
  }

  return { hidden, visible };
}

// Stagger container for animating children
interface StaggerContainerProps {
  children: ReactNode;
  stagger?: number;
  className?: string;
  style?: React.CSSProperties;
  isEditing?: boolean;
}

export function StaggerContainer({
  children,
  stagger = 0.1,
  className,
  style,
  isEditing = false,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1,
      },
    },
  };

  if (isEditing) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

// Stagger child item
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function StaggerItem({ children, className, style }: StaggerItemProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0, 0, 0.2, 1] },
    },
  };

  return (
    <motion.div className={className} style={style} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
