/**
 * R2 Storage Module
 *
 * Exports all R2-related functionality for image storage.
 */

export { r2Client, R2_CONFIG, listImages, uploadImage, deleteImage, getCategories } from "./client";
export type { R2Image } from "./client";
