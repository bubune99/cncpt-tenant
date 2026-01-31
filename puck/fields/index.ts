// Custom field components
export { AnimationField } from "./AnimationField";
export { LockField } from "./LockField";
export { GroupField } from "./GroupField";

// Advanced section wrapper for collapsible fields
export {
  AdvancedSection,
  FieldRow,
  CompactCheckbox,
  CompactNumberInput,
  CompactRadioGroup,
  compactInputStyle,
  compactSelectStyle,
} from "./AdvancedSection";

// Combined advanced fields panel (collapsible)
export {
  AdvancedFieldsPanel,
  defaultAdvancedSettings,
} from "./AdvancedFieldsPanel";
export type { AdvancedFieldsSettings } from "./AdvancedFieldsPanel";
export { ColorField } from "./ColorField";
export { SpacingField } from "./SpacingField";
export { ShadowField, getShadowCSS } from "./ShadowField";
export { BorderRadiusField } from "./BorderRadiusField";
export { ResponsiveVisibility, ResponsiveVisibilityField } from "./ResponsiveVisibility";
export type { VisibilitySettings } from "./ResponsiveVisibility";

// Typography field with helpers
export { TypographyField, getTypographyStyles, defaultTypographySettings } from "./TypographyField";
export type { TypographySettings } from "./TypographyField";

// Background field with helpers
export {
  BackgroundField,
  getBackgroundStyles,
  BackgroundOverlay,
  getBlurStyles,
  defaultBackgroundSettings
} from "./BackgroundField";
export type { BackgroundSettings } from "./BackgroundField";

// Layout field with helpers
export {
  LayoutField,
  getLayoutStyles,
  defaultLayoutSettings
} from "./LayoutField";
export type { LayoutSettings } from "./LayoutField";

// Size field with helpers
export {
  SizeField,
  getSizeStyles,
  defaultSizeSettings
} from "./SizeField";
export type { SizeSettings } from "./SizeField";

// Position field with helpers
export {
  PositionField,
  getPositionStyles,
  defaultPositionSettings
} from "./PositionField";
export type { PositionSettings } from "./PositionField";

// Border field with helpers
export {
  BorderField,
  getBorderStyles,
  defaultBorderSettings
} from "./BorderField";
export type { BorderSettings } from "./BorderField";

// Effects field with helpers
export {
  EffectsField,
  getEffectsStyles,
  defaultEffectsSettings
} from "./EffectsField";
export type { EffectsSettings } from "./EffectsField";

// Transform field with helpers
export {
  TransformField,
  getTransformStyles,
  defaultTransformSettings
} from "./TransformField";
export type { TransformSettings } from "./TransformField";

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

// Combined style settings interface
export interface StyleSettings {
  typography?: import("./TypographyField").TypographySettings;
  layout?: import("./LayoutField").LayoutSettings;
  size?: import("./SizeField").SizeSettings;
  position?: import("./PositionField").PositionSettings;
  border?: import("./BorderField").BorderSettings;
  effects?: import("./EffectsField").EffectsSettings;
  transform?: import("./TransformField").TransformSettings;
}

// Combined style getter
import React from "react";
import { getTypographyStyles } from "./TypographyField";
import { getLayoutStyles } from "./LayoutField";
import { getSizeStyles } from "./SizeField";
import { getPositionStyles } from "./PositionField";
import { getBorderStyles } from "./BorderField";
import { getEffectsStyles } from "./EffectsField";
import { getTransformStyles } from "./TransformField";

export function getAllStyles(settings?: StyleSettings): React.CSSProperties {
  if (!settings) return {};

  return {
    ...getTypographyStyles(settings.typography),
    ...getLayoutStyles(settings.layout),
    ...getSizeStyles(settings.size),
    ...getPositionStyles(settings.position),
    ...getBorderStyles(settings.border),
    ...getEffectsStyles(settings.effects),
    ...getTransformStyles(settings.transform),
  };
}
