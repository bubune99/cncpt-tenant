"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkHY7GTCJMjs = require('./chunk-HY7GTCJM.js');

// src/hooks/use-auth.ts
var _stack = require('@stackframe/stack');
var _react = require('react');
var _navigation = require('next/navigation');
function useAuth() {
  const stackUser = _stack.useUser.call(void 0, );
  const router = _navigation.useRouter.call(void 0, );
  const [authChecked, setAuthChecked] = _react.useState.call(void 0, false);
  const [dbUser, setDbUser] = _react.useState.call(void 0, null);
  const [syncError, setSyncError] = _react.useState.call(void 0, null);
  const syncAttemptedRef = _react.useRef.call(void 0, false);
  _react.useEffect.call(void 0, () => {
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
  _react.useEffect.call(void 0, () => {
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

function useMediaUpload(options = {}) {
  const [uploads, setUploads] = _react.useState.call(void 0, /* @__PURE__ */ new Map());
  const [isUploading, setIsUploading] = _react.useState.call(void 0, false);
  const updateUpload = _react.useCallback.call(void 0, (id, updates) => {
    setUploads((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(id);
      if (current) {
        newMap.set(id, _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, current), updates));
      }
      return newMap;
    });
  }, []);
  const uploadFile = _react.useCallback.call(void 0, 
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
  const uploadFiles = _react.useCallback.call(void 0, 
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
  const clearCompleted = _react.useCallback.call(void 0, () => {
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
  const clearAll = _react.useCallback.call(void 0, () => {
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




exports.useAuth = useAuth; exports.useMediaUpload = useMediaUpload;
//# sourceMappingURL=chunk-N4AHK34E.js.map