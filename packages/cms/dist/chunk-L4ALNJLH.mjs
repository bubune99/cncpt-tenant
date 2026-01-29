// src/hooks/use-mobile.ts
import * as React from "react";
var MOBILE_BREAKPOINT = 768;
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(void 0);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}

// src/hooks/usePermissions.ts
import { useState as useState2, useEffect as useEffect2, useCallback, useMemo } from "react";
function permissionMatches(userPermission, requiredPermission) {
  if (userPermission === requiredPermission) return true;
  if (userPermission === "*") return true;
  if (userPermission.endsWith(".*")) {
    const resource = userPermission.slice(0, -2);
    return requiredPermission.startsWith(resource + ".");
  }
  return false;
}
function usePermissions() {
  const [data, setData] = useState2(null);
  const [isLoading, setIsLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/auth/permissions");
      if (!response.ok) {
        if (response.status === 401) {
          setData(null);
          return;
        }
        throw new Error("Failed to fetch permissions");
      }
      const permData = await response.json();
      setData(permData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect2(() => {
    fetchPermissions();
  }, [fetchPermissions]);
  const can = useCallback(
    (permission) => {
      if (!data) return false;
      if (data.isSuperAdmin) return true;
      return data.permissions.some((p) => permissionMatches(p, permission));
    },
    [data]
  );
  const canAny = useCallback(
    (permissions) => {
      return permissions.some((p) => can(p));
    },
    [can]
  );
  const canAll = useCallback(
    (permissions) => {
      return permissions.every((p) => can(p));
    },
    [can]
  );
  const hasRole = useCallback(
    (roleName) => {
      if (!data) return false;
      return data.roles.some((r) => r.name === roleName);
    },
    [data]
  );
  return useMemo(
    () => {
      var _a, _b, _c;
      return {
        permissions: (_a = data == null ? void 0 : data.permissions) != null ? _a : [],
        roles: (_b = data == null ? void 0 : data.roles) != null ? _b : [],
        isSuperAdmin: (_c = data == null ? void 0 : data.isSuperAdmin) != null ? _c : false,
        isLoading,
        error,
        can,
        canAny,
        canAll,
        hasRole,
        refresh: fetchPermissions
      };
    },
    [data, isLoading, error, can, canAny, canAll, hasRole, fetchPermissions]
  );
}

// src/exports/hooks.ts
import { useDebounceValue, useDebounceCallback } from "usehooks-ts";

export {
  useIsMobile,
  usePermissions,
  useDebounceValue,
  useDebounceCallback
};
//# sourceMappingURL=chunk-L4ALNJLH.mjs.map