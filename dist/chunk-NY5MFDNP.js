"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _chunkSKQV2OMQjs = require('./chunk-SKQV2OMQ.js');



var _chunkHY7GTCJMjs = require('./chunk-HY7GTCJM.js');

// src/components/ui/input.tsx
var _jsxruntime = require('react/jsx-runtime');
function Input(_a) {
  var _b = _a, { className, type } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className", "type"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "input",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      type,
      "data-slot": "input",
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )
    }, props)
  );
}

// src/components/ui/label.tsx
var _reactlabel = require('@radix-ui/react-label'); var LabelPrimitive = _interopRequireWildcard(_reactlabel);

function Label(_a) {
  var _b = _a, {
    className
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    LabelPrimitive.Root,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "label",
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )
    }, props)
  );
}




exports.Input = Input; exports.Label = Label;
//# sourceMappingURL=chunk-NY5MFDNP.js.map