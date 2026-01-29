/**
 * v0 Component Parser
 *
 * Parses React/Tailwind code from v0.dev to extract component structure.
 */

import {
  ParsedV0Component,
  ParsedProp,
  ParsedImport,
  PropType,
} from "./types";

/**
 * Parse v0 component code
 */
export function parseV0Component(code: string): ParsedV0Component {
  const cleanedCode = cleanCode(code);

  return {
    name: extractComponentName(cleanedCode),
    displayName: extractDisplayName(cleanedCode),
    description: extractDescription(cleanedCode),
    sourceCode: cleanedCode,
    language: detectLanguage(cleanedCode),
    props: extractProps(cleanedCode),
    imports: extractImports(cleanedCode),
    dependencies: extractDependencies(cleanedCode),
    hasChildren: hasChildrenProp(cleanedCode),
    tailwindClasses: extractTailwindClasses(cleanedCode),
  };
}

/**
 * Clean up the code (remove extra whitespace, format consistently)
 */
function cleanCode(code: string): string {
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .trim();
}

/**
 * Extract component name from code
 */
function extractComponentName(code: string): string {
  // Try to find export default function Name
  const exportDefaultMatch = code.match(
    /export\s+default\s+function\s+(\w+)/
  );
  if (exportDefaultMatch) {
    return exportDefaultMatch[1];
  }

  // Try to find export function Name
  const exportFunctionMatch = code.match(
    /export\s+function\s+(\w+)/
  );
  if (exportFunctionMatch) {
    return exportFunctionMatch[1];
  }

  // Try to find const Name = () =>
  const constArrowMatch = code.match(
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/
  );
  if (constArrowMatch) {
    return constArrowMatch[1];
  }

  // Try to find function Name
  const functionMatch = code.match(/function\s+(\w+)/);
  if (functionMatch) {
    return functionMatch[1];
  }

  return "CustomComponent";
}

/**
 * Generate display name from component name
 */
function extractDisplayName(code: string): string {
  const name = extractComponentName(code);
  // Convert PascalCase to Title Case with spaces
  return name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
}

/**
 * Extract description from JSDoc comment
 */
function extractDescription(code: string): string | undefined {
  const jsdocMatch = code.match(/\/\*\*\s*\n([^*]|\*[^/])*\*\//);
  if (jsdocMatch) {
    const comment = jsdocMatch[0];
    const descMatch = comment.match(/@description\s+(.+)|^\s*\*\s+([^@\n]+)/m);
    if (descMatch) {
      return (descMatch[1] || descMatch[2]).trim();
    }
  }
  return undefined;
}

/**
 * Detect if code is TypeScript or JavaScript
 */
function detectLanguage(code: string): "typescript" | "javascript" {
  // Check for TypeScript-specific syntax
  const hasTypeAnnotations = /:\s*(string|number|boolean|React\.|any|\{[^}]+\})/i.test(code);
  const hasInterface = /interface\s+\w+/.test(code);
  const hasType = /type\s+\w+\s*=/.test(code);
  const hasGeneric = /<[A-Z]\w*>/.test(code);

  if (hasTypeAnnotations || hasInterface || hasType || hasGeneric) {
    return "typescript";
  }
  return "javascript";
}

/**
 * Extract props from component
 */
function extractProps(code: string): ParsedProp[] {
  const props: ParsedProp[] = [];

  // Try to find TypeScript interface/type for props
  const propsInterfaceMatch = code.match(
    /(?:interface|type)\s+(\w*Props\w*)\s*(?:=\s*)?\{([^}]+)\}/
  );

  if (propsInterfaceMatch) {
    const propsBody = propsInterfaceMatch[2];
    const propLines = propsBody.split(/[;\n]/).filter((line) => line.trim());

    for (const line of propLines) {
      const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/);
      if (propMatch) {
        const [, name, optional, typeStr] = propMatch;
        props.push({
          name,
          type: parseTypeString(typeStr.trim()),
          required: !optional,
          options: extractEnumOptions(typeStr),
        });
      }
    }
  }

  // Try to find destructured props in function signature
  const destructuredMatch = code.match(
    /(?:function\s+\w+|const\s+\w+\s*=)\s*\(\s*\{([^}]+)\}/
  );

  if (destructuredMatch && props.length === 0) {
    const propsStr = destructuredMatch[1];
    const propMatches = propsStr.matchAll(/(\w+)(?:\s*=\s*([^,}]+))?/g);

    for (const match of propMatches) {
      const [, name, defaultValue] = match;
      if (name && !props.find((p) => p.name === name)) {
        props.push({
          name,
          type: inferTypeFromDefault(defaultValue),
          required: !defaultValue,
          defaultValue: parseDefaultValue(defaultValue),
        });
      }
    }
  }

  return props;
}

/**
 * Parse TypeScript type string to our PropType
 */
function parseTypeString(typeStr: string): PropType {
  const normalized = typeStr.toLowerCase().trim();

  if (normalized === "string") return "string";
  if (normalized === "number") return "number";
  if (normalized === "boolean" || normalized === "bool") return "boolean";
  if (normalized.includes("|") && !normalized.includes("=>")) return "select";
  if (normalized.startsWith("{")) return "object";
  if (normalized.includes("[]") || normalized.startsWith("array")) return "array";
  if (normalized.includes("=>") || normalized === "function") return "function";
  if (
    normalized.includes("react.node") ||
    normalized.includes("reactnode") ||
    normalized === "node"
  )
    return "node";

  return "unknown";
}

/**
 * Extract enum/union options from type string
 */
function extractEnumOptions(typeStr: string): string[] | undefined {
  if (!typeStr.includes("|")) return undefined;

  const options = typeStr
    .split("|")
    .map((opt) => opt.trim().replace(/['"]/g, ""))
    .filter((opt) => opt && !opt.includes("=>"));

  return options.length > 0 ? options : undefined;
}

/**
 * Infer type from default value
 */
function inferTypeFromDefault(defaultValue: string | undefined): PropType {
  if (!defaultValue) return "unknown";

  const trimmed = defaultValue.trim();

  if (trimmed === "true" || trimmed === "false") return "boolean";
  if (/^['"`]/.test(trimmed)) return "string";
  if (/^-?\d+\.?\d*$/.test(trimmed)) return "number";
  if (trimmed.startsWith("{")) return "object";
  if (trimmed.startsWith("[")) return "array";

  return "unknown";
}

/**
 * Parse default value string to actual value
 */
function parseDefaultValue(defaultValue: string | undefined): unknown {
  if (!defaultValue) return undefined;

  const trimmed = defaultValue.trim();

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^['"`](.*)['"`]$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  return undefined;
}

/**
 * Extract import statements
 */
function extractImports(code: string): ParsedImport[] {
  const imports: ParsedImport[] = [];
  const importRegex = /import\s+(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const [, defaultImport, namedImportsStr, source] = match;
    const namedImports = namedImportsStr
      ? namedImportsStr.split(",").map((s) => s.trim().split(/\s+as\s+/)[0])
      : [];

    imports.push({
      source,
      defaultImport: defaultImport || undefined,
      namedImports,
      isRelative: source.startsWith(".") || source.startsWith("/"),
    });
  }

  return imports;
}

/**
 * Extract npm dependencies from imports
 */
function extractDependencies(code: string): string[] {
  const imports = extractImports(code);
  const deps = new Set<string>();

  for (const imp of imports) {
    if (!imp.isRelative) {
      // Get the package name (handle scoped packages)
      const pkgName = imp.source.startsWith("@")
        ? imp.source.split("/").slice(0, 2).join("/")
        : imp.source.split("/")[0];
      deps.add(pkgName);
    }
  }

  return Array.from(deps);
}

/**
 * Check if component accepts children
 */
function hasChildrenProp(code: string): boolean {
  return (
    /children/.test(code) ||
    /\{children\}/.test(code) ||
    /props\.children/.test(code)
  );
}

/**
 * Extract Tailwind CSS classes from code
 */
function extractTailwindClasses(code: string): string[] {
  const classes = new Set<string>();

  // Match className="..." or className={`...`} or className={cn(...)}
  const classPatterns = [
    /className=["']([^"']+)["']/g,
    /className=\{[`"']([^`"']+)[`"']\}/g,
    /cn\(["']([^"']+)["']/g,
    /clsx\(["']([^"']+)["']/g,
  ];

  for (const pattern of classPatterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const classString = match[1];
      classString.split(/\s+/).forEach((cls) => {
        if (cls && !cls.includes("${")) {
          classes.add(cls);
        }
      });
    }
  }

  return Array.from(classes);
}

/**
 * Validate parsed component
 */
export function validateParsedComponent(
  parsed: ParsedV0Component
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required fields
  if (!parsed.name) {
    errors.push("Could not extract component name");
  }

  if (!parsed.sourceCode) {
    errors.push("No source code provided");
  }

  // Check for unsupported dependencies
  const unsupportedDeps = parsed.dependencies.filter((dep) =>
    ["next/image", "next/link", "next/router"].includes(dep)
  );
  if (unsupportedDeps.length > 0) {
    warnings.push(
      `Component uses Next.js-specific imports that may need adjustment: ${unsupportedDeps.join(", ")}`
    );
  }

  // Check for complex props
  const complexProps = parsed.props.filter(
    (p) => p.type === "function" || p.type === "unknown"
  );
  if (complexProps.length > 0) {
    warnings.push(
      `Some props have complex types that may need manual configuration: ${complexProps.map((p) => p.name).join(", ")}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
