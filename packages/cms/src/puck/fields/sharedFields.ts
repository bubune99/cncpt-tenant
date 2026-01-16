import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../animations/types";

// Shared prop interfaces
export interface AnimationProps {
  animation?: Partial<AnimationConfig>;
}

export interface LockProps {
  lock?: Partial<LockConfig>;
}

export interface GroupProps {
  group?: Partial<GroupConfig>;
}

export interface EnhancedComponentProps extends AnimationProps, LockProps, GroupProps {}

// Default props for enhanced components
export const enhancedDefaultProps = {
  animation: defaultAnimationConfig,
  lock: defaultLockConfig,
  group: defaultGroupConfig,
};

// Shared field definitions for animation
export const animationFields = {
  animation: {
    type: "custom" as const,
    label: "Animation",
    render: ({ value, onChange }: { value: Partial<AnimationConfig>; onChange: (value: Partial<AnimationConfig>) => void }) => {
      // We'll use dynamic import to avoid SSR issues
      const AnimationField = require("./AnimationField").AnimationField;
      return AnimationField({ value: value || defaultAnimationConfig, onChange });
    },
  },
};

// Shared field definitions for lock
export const lockFields = {
  lock: {
    type: "custom" as const,
    label: "Lock",
    render: ({ value, onChange }: { value: Partial<LockConfig>; onChange: (value: Partial<LockConfig>) => void }) => {
      const LockField = require("./LockField").LockField;
      return LockField({ value: value || defaultLockConfig, onChange });
    },
  },
};

// Shared field definitions for group
export const groupFields = {
  group: {
    type: "custom" as const,
    label: "Group",
    render: ({ value, onChange }: { value: Partial<GroupConfig>; onChange: (value: Partial<GroupConfig>) => void }) => {
      const GroupField = require("./GroupField").GroupField;
      return GroupField({ value: value || defaultGroupConfig, onChange });
    },
  },
};

// Combined enhanced fields
export const enhancedFields = {
  ...animationFields,
  ...lockFields,
  ...groupFields,
};
