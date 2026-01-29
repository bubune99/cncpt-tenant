"use client";

import { useState } from "react";
import { LottieConfig } from "../animations/types";
import { SimpleLottie, LottieRegistry } from "../animations/LottieWrapper";

interface LottieFieldProps {
  value: Partial<LottieConfig> | undefined;
  onChange: (value: Partial<LottieConfig>) => void;
  label?: string;
}

const defaultConfig: LottieConfig = {
  animationId: "",
  playMode: "auto",
  loop: true,
  speed: 1,
  direction: 1,
};

const PLAY_MODES = [
  { value: "auto", label: "Auto Play" },
  { value: "hover", label: "Play on Hover" },
  { value: "scroll", label: "Play on Scroll" },
  { value: "click", label: "Play on Click" },
] as const;

export function LottieField({ value, onChange, label }: LottieFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const config: LottieConfig = {
    ...defaultConfig,
    ...value,
  };

  const handleChange = (updates: Partial<LottieConfig>) => {
    onChange({ ...config, ...updates });
  };

  const availableAnimations = LottieRegistry.list();

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Animation Source */}
      <div className="space-y-2">
        <label className="block text-xs text-gray-500">Animation Source</label>

        {/* Registered Animations Dropdown */}
        {availableAnimations.length > 0 && (
          <select
            value={config.animationId}
            onChange={(e) => handleChange({ animationId: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select animation...</option>
            {availableAnimations.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        )}

        {/* URL Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Or enter animation URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => {
              if (urlInput) {
                handleChange({ animationId: urlInput });
                setUrlInput("");
              }
            }}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Load
          </button>
        </div>
      </div>

      {/* Preview */}
      {config.animationId && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="flex justify-center">
            <SimpleLottie
              src={
                LottieRegistry.has(config.animationId)
                  ? LottieRegistry.get(config.animationId)!
                  : config.animationId
              }
              width={150}
              height={150}
              loop={config.loop}
              autoplay={true}
            />
          </div>
        </div>
      )}

      {/* Settings Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        Animation Settings
      </button>

      {/* Settings Panel */}
      {isExpanded && (
        <div className="space-y-4 pl-4 border-l-2 border-gray-200">
          {/* Play Mode */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Play Mode</label>
            <select
              value={config.playMode}
              onChange={(e) =>
                handleChange({ playMode: e.target.value as LottieConfig["playMode"] })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {PLAY_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {/* Loop */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lottie-loop"
              checked={config.loop}
              onChange={(e) => handleChange({ loop: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="lottie-loop" className="text-sm text-gray-700">
              Loop Animation
            </label>
          </div>

          {/* Speed */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Speed: {config.speed}x
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={config.speed}
              onChange={(e) => handleChange({ speed: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Direction */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Direction</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleChange({ direction: 1 })}
                className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                  config.direction === 1
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                Forward
              </button>
              <button
                onClick={() => handleChange({ direction: -1 })}
                className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                  config.direction === -1
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                Reverse
              </button>
            </div>
          </div>

          {/* Frame Range */}
          <div className="space-y-2">
            <label className="block text-xs text-gray-500">
              Frame Range (optional)
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Start"
                  value={config.startFrame ?? ""}
                  onChange={(e) =>
                    handleChange({
                      startFrame: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="End"
                  value={config.endFrame ?? ""}
                  onChange={(e) =>
                    handleChange({
                      endFrame: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LottieField;
