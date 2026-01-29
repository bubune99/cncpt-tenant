"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _chunkSKQV2OMQjs = require('./chunk-SKQV2OMQ.js');




var _chunkHY7GTCJMjs = require('./chunk-HY7GTCJM.js');

// src/components/ui/scroll-area.tsx
var _reactscrollarea = require('@radix-ui/react-scroll-area'); var ScrollAreaPrimitive = _interopRequireWildcard(_reactscrollarea);
var _jsxruntime = require('react/jsx-runtime');
function ScrollArea(_a) {
  var _b = _a, {
    className,
    children
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className",
    "children"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    ScrollAreaPrimitive.Root,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "scroll-area",
      className: _chunkSKQV2OMQjs.cn.call(void 0, "relative", className)
    }, props), {
      children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          ScrollAreaPrimitive.Viewport,
          {
            "data-slot": "scroll-area-viewport",
            className: "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
            children
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ScrollBar, {}),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ScrollAreaPrimitive.Corner, {})
      ]
    })
  );
}
function ScrollBar(_a) {
  var _b = _a, {
    className,
    orientation = "vertical"
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className",
    "orientation"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    ScrollAreaPrimitive.ScrollAreaScrollbar,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "scroll-area-scrollbar",
      orientation,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
        className
      )
    }, props), {
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        ScrollAreaPrimitive.ScrollAreaThumb,
        {
          "data-slot": "scroll-area-thumb",
          className: "bg-border relative flex-1 rounded-full"
        }
      )
    })
  );
}



exports.ScrollArea = ScrollArea;
//# sourceMappingURL=chunk-HQVSQ2EO.js.map