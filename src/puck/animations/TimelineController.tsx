"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useAnimation, useInView, type AnimationPlaybackControls } from "framer-motion";

// Type alias for animation controls
type AnimationControlsType = ReturnType<typeof useAnimation>;
import { TimelineConfig, TimelineEntry, AnimationConfig } from "./types";
import { getTransition } from "./presets";

/**
 * Timeline Context
 *
 * Provides orchestration for timeline-based animations across multiple components.
 */

interface TimelineContextValue {
  /** Register a component's animation controls */
  registerComponent: (id: string, controls: AnimationControlsType) => void;
  /** Unregister a component */
  unregisterComponent: (id: string) => void;
  /** Play the timeline */
  play: () => Promise<void>;
  /** Pause the timeline */
  pause: () => void;
  /** Reset the timeline to the beginning */
  reset: () => void;
  /** Seek to a specific time */
  seekTo: (time: number) => void;
  /** Get current playback time */
  getCurrentTime: () => number;
  /** Whether timeline is playing */
  isPlaying: boolean;
  /** Current progress (0-1) */
  progress: number;
  /** Total duration */
  duration: number;
}

const TimelineContext = createContext<TimelineContextValue | null>(null);

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider");
  }
  return context;
}

/**
 * Hook for components to participate in a timeline
 */
export function useTimelineComponent(componentId: string) {
  const controls = useAnimation();
  const timeline = useContext(TimelineContext);

  useEffect(() => {
    if (timeline) {
      timeline.registerComponent(componentId, controls);
      return () => timeline.unregisterComponent(componentId);
    }
  }, [componentId, controls, timeline]);

  return { controls, timeline };
}

interface TimelineProviderProps {
  children: ReactNode;
  config: TimelineConfig;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

/**
 * Timeline Provider
 *
 * Wraps components that should animate according to a timeline.
 */
export function TimelineProvider({
  children,
  config,
  onComplete,
  onProgress,
}: TimelineProviderProps) {
  const componentControls = useRef<Map<string, AnimationControlsType>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total duration from sequence
  const duration = calculateTotalDuration(config.sequence);

  // Scroll trigger
  const isInView = useInView(containerRef, {
    once: config.trigger !== "onScroll",
    amount: 0.3,
  });

  const registerComponent = useCallback((id: string, controls: AnimationControlsType) => {
    componentControls.current.set(id, controls);
  }, []);

  const unregisterComponent = useCallback((id: string) => {
    componentControls.current.delete(id);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    startTimeRef.current = null;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Reset all component animations to hidden
    componentControls.current.forEach((controls) => {
      controls.set("hidden");
    });
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const play = useCallback(async () => {
    if (isPlaying) return;

    setIsPlaying(true);
    startTimeRef.current = performance.now() - progress * duration * 1000;

    // Process each entry in the sequence
    const processSequence = async (loopIteration: number = 0) => {
      let currentTime = 0;

      for (const entry of config.sequence) {
        const startTime = parseStartTime(entry.startAt, currentTime);
        const controls = componentControls.current.get(entry.target);

        if (!controls) continue;

        // Wait until start time
        const waitTime = (startTime - currentTime) * 1000;
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        // Run the animation
        const transition = entry.animation.duration
          ? getTransition(entry.animation as AnimationConfig)
          : { duration: 0.5 };

        await controls.start("visible", { ...transition });

        // Update current time
        currentTime = startTime + (entry.animation.duration || 0.5);
      }

      // Handle looping
      if (config.loop) {
        const maxLoops = typeof config.loop === "number" ? config.loop : Infinity;
        if (loopIteration < maxLoops - 1) {
          reset();
          await processSequence(loopIteration + 1);
        }
      }
    };

    // Update progress during playback
    const updateProgress = () => {
      if (!isPlaying || startTimeRef.current === null) return;

      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const newProgress = Math.min(elapsed / duration, 1);

      setProgress(newProgress);
      onProgress?.(newProgress);

      if (newProgress < 1) {
        rafRef.current = requestAnimationFrame(updateProgress);
      } else {
        onComplete?.();
        if (!config.loop) {
          setIsPlaying(false);
        }
      }
    };

    rafRef.current = requestAnimationFrame(updateProgress);
    await processSequence();
  }, [isPlaying, progress, duration, config, onProgress, onComplete, reset]);

  const seekTo = useCallback((time: number) => {
    const normalizedProgress = Math.max(0, Math.min(time / duration, 1));
    setProgress(normalizedProgress);
    startTimeRef.current = performance.now() - normalizedProgress * duration * 1000;
  }, [duration]);

  const getCurrentTime = useCallback(() => {
    return progress * duration;
  }, [progress, duration]);

  // Auto-play based on trigger
  useEffect(() => {
    if (config.autoPlay !== false) {
      if (config.trigger === "onLoad") {
        play();
      } else if (config.trigger === "onScroll" && isInView) {
        play();
      }
    }
  }, [config.autoPlay, config.trigger, isInView, play]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const contextValue: TimelineContextValue = {
    registerComponent,
    unregisterComponent,
    play,
    pause,
    reset,
    seekTo,
    getCurrentTime,
    isPlaying,
    progress,
    duration,
  };

  return (
    <TimelineContext.Provider value={contextValue}>
      <div ref={containerRef}>{children}</div>
    </TimelineContext.Provider>
  );
}

/**
 * Calculate total duration of a timeline sequence
 */
function calculateTotalDuration(sequence: TimelineEntry[]): number {
  let maxEndTime = 0;
  let currentTime = 0;

  for (const entry of sequence) {
    const startTime = parseStartTime(entry.startAt, currentTime);
    const entryDuration = entry.animation.duration || 0.5;
    const endTime = startTime + entryDuration;

    maxEndTime = Math.max(maxEndTime, endTime);
    currentTime = startTime + entryDuration;
  }

  return maxEndTime;
}

/**
 * Parse startAt value to absolute time
 */
function parseStartTime(
  startAt: TimelineEntry["startAt"],
  currentTime: number
): number {
  if (typeof startAt === "number") {
    return startAt;
  }

  if (startAt === "previous") {
    return currentTime;
  }

  // Handle relative offsets like "+=0.5" or "-=0.2"
  const match = startAt.match(/^([+-])=(\d+\.?\d*)$/);
  if (match) {
    const sign = match[1] === "+" ? 1 : -1;
    const offset = parseFloat(match[2]);
    return currentTime + sign * offset;
  }

  return currentTime;
}

/**
 * Timeline playback controls component
 */
interface TimelineControlsProps {
  className?: string;
  showProgress?: boolean;
  showTime?: boolean;
}

export function TimelineControls({
  className,
  showProgress = true,
  showTime = true,
}: TimelineControlsProps) {
  const timeline = useTimeline();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex items-center gap-3 ${className || ""}`}>
      {/* Play/Pause Button */}
      <button
        onClick={() => (timeline.isPlaying ? timeline.pause() : timeline.play())}
        className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
      >
        {timeline.isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Reset Button */}
      <button
        onClick={() => timeline.reset()}
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Progress Bar */}
      {showProgress && (
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${timeline.progress * 100}%` }}
          />
        </div>
      )}

      {/* Time Display */}
      {showTime && (
        <span className="text-sm text-gray-600 font-mono">
          {formatTime(timeline.getCurrentTime())} / {formatTime(timeline.duration)}
        </span>
      )}
    </div>
  );
}

/**
 * Create a timeline configuration helper
 */
export function createTimeline(
  name: string,
  sequence: TimelineEntry[],
  options?: Partial<Omit<TimelineConfig, "id" | "name" | "sequence">>
): TimelineConfig {
  return {
    id: `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    sequence,
    loop: false,
    autoPlay: true,
    trigger: "onScroll",
    ...options,
  };
}

/**
 * Create a timeline entry helper
 */
export function createTimelineEntry(
  target: string,
  animation: Partial<AnimationConfig>,
  startAt: TimelineEntry["startAt"] = "previous",
  label?: string
): TimelineEntry {
  return {
    target,
    animation,
    startAt,
    label,
  };
}
