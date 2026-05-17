/**
 * Allow importing plain CSS files as side-effects (e.g. scoped design-system sheets).
 * This declaration suppresses TS2882 without enabling CSS Modules object exports.
 */
declare module "*.css" {}
