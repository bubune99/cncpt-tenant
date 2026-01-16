import {
  __spreadValues
} from "./chunk-C2QMXRW7.mjs";

// src/hooks/use-auth.ts
import { useUser } from "@stackframe/stack";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
function useAuth() {
  const stackUser = useUser();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const syncAttemptedRef = useRef(false);
  useEffect(() => {
    if (stackUser && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true;
      const syncUser = async () => {
        try {
          const response = await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stackAuthId: stackUser.id,
              email: stackUser.primaryEmail,
              name: stackUser.displayName,
              avatar: stackUser.profileImageUrl
            })
          });
          if (response.ok) {
            const data = await response.json();
            setDbUser(data.user);
          } else {
            const error = await response.json();
            console.error("User sync failed:", error);
            setSyncError(error.error || "Sync failed");
          }
        } catch (error) {
          console.error("User sync error:", error);
          setSyncError("Network error during sync");
        }
      };
      syncUser();
    }
  }, [stackUser]);
  useEffect(() => {
    if (stackUser !== void 0) {
      setAuthChecked(true);
    }
    if (!stackUser) {
      syncAttemptedRef.current = false;
      setDbUser(null);
      setSyncError(null);
    }
  }, [stackUser]);
  return {
    user: stackUser,
    dbUser,
    // The synced database user with local ID
    isLoading: stackUser === void 0,
    isAuthenticated: !!stackUser,
    authChecked,
    syncError,
    signOut: async () => {
      try {
        if (stackUser) {
          await stackUser.signOut();
        } else {
          router.push("/handler/sign-out");
        }
      } catch (error) {
        console.error("Sign out error:", error);
        router.push("/handler/sign-out");
      }
    }
  };
}

// src/hooks/use-media-upload.ts
import { useState as useState2, useCallback } from "react";
function useMediaUpload(options = {}) {
  const [uploads, setUploads] = useState2(/* @__PURE__ */ new Map());
  const [isUploading, setIsUploading] = useState2(false);
  const updateUpload = useCallback((id, updates) => {
    setUploads((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(id);
      if (current) {
        newMap.set(id, __spreadValues(__spreadValues({}, current), updates));
      }
      return newMap;
    });
  }, []);
  const uploadFile = useCallback(
    async (file) => {
      var _a, _b;
      const uploadId = `${file.name}-${Date.now()}`;
      setUploads((prev) => {
        const newMap = new Map(prev);
        newMap.set(uploadId, {
          id: uploadId,
          filename: file.name,
          progress: 0,
          status: "pending",
          size: file.size
        });
        return newMap;
      });
      try {
        updateUpload(uploadId, { status: "uploading", progress: 10 });
        const presignResponse = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "presign",
            filename: file.name,
            mimeType: file.type,
            size: file.size
          })
        });
        if (!presignResponse.ok) {
          const error = await presignResponse.json();
          throw new Error(error.error || "Failed to get upload URL");
        }
        const presignData = await presignResponse.json();
        updateUpload(uploadId, { progress: 30 });
        const uploadResponse = await fetch(presignData.uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type
          }
        });
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }
        updateUpload(uploadId, { progress: 70 });
        const completeResponse = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            filename: presignData.key.split("/").pop(),
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            url: presignData.publicUrl,
            key: presignData.key,
            bucket: presignData.bucket,
            provider: presignData.provider,
            folderId: options.folderId
          })
        });
        if (!completeResponse.ok) {
          const error = await completeResponse.json();
          throw new Error(error.error || "Failed to create media record");
        }
        const media = await completeResponse.json();
        updateUpload(uploadId, {
          status: "complete",
          progress: 100,
          url: media.url
        });
        (_a = options.onSuccess) == null ? void 0 : _a.call(options, media);
        return media;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        updateUpload(uploadId, {
          status: "error",
          error: message
        });
        (_b = options.onError) == null ? void 0 : _b.call(options, message);
        throw error;
      }
    },
    [options, updateUpload]
  );
  const uploadFiles = useCallback(
    async (files) => {
      setIsUploading(true);
      const fileArray = Array.from(files);
      const results = [];
      for (const file of fileArray) {
        try {
          const media = await uploadFile(file);
          results.push(media);
        } catch (error) {
        }
      }
      setIsUploading(false);
      return results;
    },
    [uploadFile]
  );
  const clearCompleted = useCallback(() => {
    setUploads((prev) => {
      const newMap = new Map(prev);
      for (const [id, upload] of newMap) {
        if (upload.status === "complete" || upload.status === "error") {
          newMap.delete(id);
        }
      }
      return newMap;
    });
  }, []);
  const clearAll = useCallback(() => {
    setUploads(/* @__PURE__ */ new Map());
  }, []);
  return {
    uploads: Array.from(uploads.values()),
    isUploading,
    uploadFile,
    uploadFiles,
    clearCompleted,
    clearAll
  };
}

export {
  useAuth,
  useMediaUpload
};
//# sourceMappingURL=chunk-L2ZOWITB.mjs.map