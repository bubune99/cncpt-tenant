// Custom field components
export { AnimationField } from "./AnimationField";
export { LockField } from "./LockField";
export { GroupField } from "./GroupField";
export { ColorField } from "./ColorField";
export { SpacingField } from "./SpacingField";
export { ShadowField, getShadowCSS } from "./ShadowField";
export { BorderRadiusField } from "./BorderRadiusField";
export { ResponsiveVisibility, ResponsiveVisibilityField } from "./ResponsiveVisibility";
export type { VisibilitySettings } from "./ResponsiveVisibility";

// Background field with helpers
export {
  BackgroundField,
  getBackgroundStyles,
  BackgroundOverlay,
  getBlurStyles,
  defaultBackgroundSettings
} from "./BackgroundField";
export type { BackgroundSettings } from "./BackgroundField";

// Shared field definitions for Puck config
export {
  animationFields,
  lockFields,
  groupFields,
  enhancedFields,
  enhancedDefaultProps,
} from "./sharedFields";
export type { AnimationProps, LockProps, GroupProps, EnhancedComponentProps } from "./sharedFields";

// Platform integration fields (existing)
export { MediaPickerField, mediaPickerFieldConfig } from "./MediaPickerField";
export { ProductPickerField, productPickerFieldConfig } from "./ProductPickerField";
export { BlogPostPickerField, blogPostPickerFieldConfig } from "./BlogPostPickerField";
export { FormPickerField, formPickerFieldConfig } from "./FormPickerField";
