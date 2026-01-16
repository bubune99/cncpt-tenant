"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/lib/media/types.ts
function getMediaType(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf" || mimeType.includes("document") || mimeType.includes("spreadsheet") || mimeType.includes("presentation") || mimeType === "text/plain" || mimeType === "text/csv" || mimeType.includes("word") || mimeType.includes("excel") || mimeType.includes("powerpoint")) {
    return "document";
  }
  return "other";
}
function getFileExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function getMediaTypeIcon(mimeType) {
  const type = getMediaType(mimeType);
  switch (type) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "audio":
      return "Music";
    case "document":
      if (mimeType === "application/pdf") return "FileText";
      if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "FileSpreadsheet";
      if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "Presentation";
      return "FileText";
    default:
      return "File";
  }
}
function isAllowedFileType(mimeType, allowedTypes) {
  return allowedTypes.some((allowed) => {
    if (allowed.endsWith("/*")) {
      const prefix = allowed.slice(0, -2);
      return mimeType.startsWith(prefix);
    }
    return mimeType === allowed;
  });
}
var DEFAULT_ALLOWED_TYPES = [
  "image/*",
  "video/*",
  "audio/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv"
];
var DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;
function generateCorsConfig(allowedOrigins) {
  return [
    {
      AllowedOrigins: allowedOrigins,
      AllowedMethods: ["GET", "PUT", "HEAD", "DELETE"],
      AllowedHeaders: [
        "Content-Type",
        "Content-Length",
        "x-amz-acl",
        "x-amz-content-sha256",
        "x-amz-date",
        "x-amz-user-agent",
        "authorization"
      ],
      ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
      MaxAgeSeconds: 3600
    }
  ];
}
function getCorsConfigJson(allowedOrigins) {
  return JSON.stringify(generateCorsConfig(allowedOrigins), null, 2);
}












exports.getMediaType = getMediaType; exports.getFileExtension = getFileExtension; exports.formatFileSize = formatFileSize; exports.generateSlug = generateSlug; exports.getMediaTypeIcon = getMediaTypeIcon; exports.isAllowedFileType = isAllowedFileType; exports.DEFAULT_ALLOWED_TYPES = DEFAULT_ALLOWED_TYPES; exports.DEFAULT_MAX_FILE_SIZE = DEFAULT_MAX_FILE_SIZE; exports.generateCorsConfig = generateCorsConfig; exports.getCorsConfigJson = getCorsConfigJson;
//# sourceMappingURL=chunk-BHKDPOTY.js.map