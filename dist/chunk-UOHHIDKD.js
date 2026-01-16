"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }// src/hooks/use-mobile.ts
var _react = require('react'); var React = _interopRequireWildcard(_react);
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
  const [data, setData] = _react.useState.call(void 0, null);
  const [isLoading, setIsLoading] = _react.useState.call(void 0, true);
  const [error, setError] = _react.useState.call(void 0, null);
  const fetchPermissions = _react.useCallback.call(void 0, async () => {
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
  _react.useEffect.call(void 0, () => {
    fetchPermissions();
  }, [fetchPermissions]);
  const can = _react.useCallback.call(void 0, 
    (permission) => {
      if (!data) return false;
      if (data.isSuperAdmin) return true;
      return data.permissions.some((p) => permissionMatches(p, permission));
    },
    [data]
  );
  const canAny = _react.useCallback.call(void 0, 
    (permissions) => {
      return permissions.some((p) => can(p));
    },
    [can]
  );
  const canAll = _react.useCallback.call(void 0, 
    (permissions) => {
      return permissions.every((p) => can(p));
    },
    [can]
  );
  const hasRole = _react.useCallback.call(void 0, 
    (roleName) => {
      if (!data) return false;
      return data.roles.some((r) => r.name === roleName);
    },
    [data]
  );
  return _react.useMemo.call(void 0, 
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
var _usehooksts = require('usehooks-ts');






exports.useIsMobile = useIsMobile; exports.usePermissions = usePermissions; exports.useDebounceValue = _usehooksts.useDebounceValue; exports.useDebounceCallback = _usehooksts.useDebounceCallback;
//# sourceMappingURL=chunk-UOHHIDKD.js.map