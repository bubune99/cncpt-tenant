"use client";

import { useRef, useEffect, useState } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { useInView } from "framer-motion";
import { LottieConfig } from "./types";

interface LottieWrapperProps {
  /** Lottie animation data (JSON object) */
  animationData?: Record<string, unknown>;
  /** URL to load animation from */
  animationUrl?: string;
  /** Lottie configuration */
  config?: Partial<LottieConfig>;
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Disable in editor mode */
  isEditing?: boolean;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Callback when animation completes a loop */
  onLoopComplete?: () => void;
  /** Callback when animation completes */
  onComplete?: () => void;
}

const defaultConfig: LottieConfig = {
  animationId: "",
  playMode: "auto",
  loop: true,
  speed: 1,
  direction: 1,
};

export function LottieWrapper({
  animationData,
  animationUrl,
  config = defaultConfig,
  className,
  style,
  isEditing = false,
  width,
  height,
  onLoopComplete,
  onComplete,
}: LottieWrapperProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedData, setLoadedData] = useState<Record<string, unknown> | null>(
    animationData || null
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Merge with default config
  const fullConfig: LottieConfig = {
    ...defaultConfig,
    ...config,
  };

  // Scroll trigger for scroll-based playback
  const isInView = useInView(containerRef, {
    once: false,
    amount: 0.5,
  });

  // Load animation from URL if provided
  useEffect(() => {
    if (animationUrl && !animationData) {
      fetch(animationUrl)
        .then((res) => res.json())
        .then((data) => setLoadedData(data))
        .catch((err) => console.error("Failed to load Lottie animation:", err));
    }
  }, [animationUrl, animationData]);

  // Update animation data when prop changes
  useEffect(() => {
    if (animationData) {
      setLoadedData(animationData);
    }
  }, [animationData]);

  // Control playback based on config
  useEffect(() => {
    if (!lottieRef.current || isEditing) return;

    const lottie = lottieRef.current;

    // Set playback speed
    lottie.setSpeed(fullConfig.speed);

    // Set direction
    lottie.setDirection(fullConfig.direction || 1);

    // Handle different play modes
    switch (fullConfig.playMode) {
      case "auto":
        lottie.play();
        break;

      case "hover":
        if (isHovered) {
          lottie.play();
        } else {
          lottie.pause();
          lottie.goToAndStop(0, true);
        }
        break;

      case "scroll":
        if (isInView) {
          lottie.play();
        } else {
          lottie.pause();
        }
        break;

      case "click":
        if (isClicked) {
          lottie.play();
        } else {
          lottie.pause();
        }
        break;
    }
  }, [
    fullConfig.playMode,
    fullConfig.speed,
    fullConfig.direction,
    isHovered,
    isInView,
    isClicked,
    isEditing,
  ]);

  // Handle segment playback
  useEffect(() => {
    if (!lottieRef.current) return;

    if (fullConfig.startFrame !== undefined && fullConfig.endFrame !== undefined) {
      lottieRef.current.playSegments(
        [fullConfig.startFrame, fullConfig.endFrame],
        true
      );
    }
  }, [fullConfig.startFrame, fullConfig.endFrame]);

  // Don't render if no animation data
  if (!loadedData) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          width: width || "100%",
          height: height || "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
          ...style,
        }}
      >
        <span style={{ color: "#888", fontSize: "12px" }}>
          {animationUrl ? "Loading animation..." : "No animation data"}
        </span>
      </div>
    );
  }

  // In editing mode, show static first frame
  if (isEditing) {
    return (
      <div ref={containerRef} className={className} style={style}>
        <Lottie
          animationData={loadedData}
          autoplay={false}
          loop={false}
          style={{
            width: width || "100%",
            height: height || "auto",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (fullConfig.playMode === "click") {
          setIsClicked(!isClicked);
        }
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={loadedData}
        autoplay={fullConfig.playMode === "auto"}
        loop={fullConfig.loop}
        style={{
          width: width || "100%",
          height: height || "auto",
        }}
        onLoopComplete={onLoopComplete}
        onComplete={onComplete}
      />
    </div>
  );
}

/**
 * Simple Lottie player for standalone use
 */
export function SimpleLottie({
  src,
  loop = true,
  autoplay = true,
  width,
  height,
  className,
  style,
}: {
  src: string | Record<string, unknown>;
  loop?: boolean;
  autoplay?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [data, setData] = useState<Record<string, unknown> | null>(
    typeof src === "object" ? src : null
  );

  useEffect(() => {
    if (typeof src === "string") {
      fetch(src)
        .then((res) => res.json())
        .then(setData)
        .catch(console.error);
    }
  }, [src]);

  if (!data) return null;

  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={{
        width: width || "100%",
        height: height || "auto",
        ...style,
      }}
    />
  );
}

/**
 * Lottie animation registry for bundled animations
 */
export class LottieRegistry {
  private static animations: Map<string, Record<string, unknown>> = new Map();

  static register(id: string, data: Record<string, unknown>): void {
    this.animations.set(id, data);
  }

  static get(id: string): Record<string, unknown> | undefined {
    return this.animations.get(id);
  }

  static has(id: string): boolean {
    return this.animations.has(id);
  }

  static list(): string[] {
    return Array.from(this.animations.keys());
  }

  static clear(): void {
    this.animations.clear();
  }
}
