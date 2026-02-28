/**
 * AST Parser
 *
 * Parses TSX source code into a structured representation using
 * the TypeScript Compiler API. Extracts component structure, JSX tree,
 * data arrays, and section type heuristics.
 */

import ts from "typescript";

export interface ParsedSection {
  name: string;
  sectionType: "header" | "footer" | "hero" | "section" | "unknown";
  rootElement: ParsedElement | null;
  dataArrays: DataArray[];
  hasState: boolean;
  imports: string[];
}

export interface ParsedElement {
  tag: string;
  classes: string[];
  attributes: Record<string, string>;
  textContent: string | null;
  children: ParsedElement[];
  isComponent: boolean;
  // Data array reference (e.g., .map() source variable name)
  mapSource?: string;
  mapItemTemplate?: ParsedElement;
}

export interface DataArray {
  name: string;
  items: Record<string, unknown>[];
}

/**
 * Parse a TSX source file into a structured section representation.
 */
export function parseSection(source: string, filePath: string): ParsedSection {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const name = extractComponentName(sourceFile);
  const imports = extractImports(sourceFile);
  const hasState = source.includes("useState");
  const dataArrays = extractDataArrays(sourceFile);
  const rootElement = extractJsxRoot(sourceFile);
  const sectionType = detectSectionType(name, rootElement);

  return {
    name,
    sectionType,
    rootElement,
    dataArrays,
    hasState,
    imports,
  };
}

/**
 * Find the exported component function name.
 */
function extractComponentName(sourceFile: ts.SourceFile): string {
  let name = "UnknownComponent";

  ts.forEachChild(sourceFile, (node) => {
    // export default function Name
    if (ts.isFunctionDeclaration(node) && node.name) {
      const mods = ts.getModifiers(node);
      if (mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        name = node.name.text;
      }
    }

    // export default function Name (with default)
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      if (ts.isIdentifier(node.expression)) {
        name = node.expression.text;
      }
    }

    // const Name = () => ... with export
    if (ts.isVariableStatement(node)) {
      const mods = ts.getModifiers(node);
      if (mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        const decl = node.declarationList.declarations[0];
        if (decl && ts.isIdentifier(decl.name)) {
          const declName = decl.name.text;
          // PascalCase check — likely a component
          if (declName[0] === declName[0].toUpperCase()) {
            name = declName;
          }
        }
      }
    }
  });

  // If no export found, look for any PascalCase function
  if (name === "UnknownComponent") {
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const n = node.name.text;
        if (n[0] === n[0].toUpperCase() && n !== "UnknownComponent") {
          name = n;
        }
      }
    });
  }

  return name;
}

/**
 * Extract import source paths.
 */
function extractImports(sourceFile: ts.SourceFile): string[] {
  const imports: string[] = [];

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      if (ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text);
      }
    }
  });

  return imports;
}

/**
 * Extract top-level const array declarations with object literals.
 */
function extractDataArrays(sourceFile: ts.SourceFile): DataArray[] {
  const arrays: DataArray[] = [];

  function visit(node: ts.Node) {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          decl.initializer &&
          ts.isArrayLiteralExpression(decl.initializer)
        ) {
          const items = extractArrayItems(decl.initializer);
          if (items.length > 0) {
            arrays.push({
              name: decl.name.text,
              items,
            });
          }
        }
      }
    }
  }

  // Walk top-level and function-level variables
  ts.forEachChild(sourceFile, (node) => {
    visit(node);
    // Also check inside function bodies
    if (ts.isFunctionDeclaration(node) && node.body) {
      ts.forEachChild(node.body, visit);
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.initializer) {
          walkForArrays(decl.initializer, arrays);
        }
      }
    }
  });

  return arrays;
}

function walkForArrays(node: ts.Node, arrays: DataArray[]) {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    if (node.body && ts.isBlock(node.body)) {
      ts.forEachChild(node.body, (child) => {
        if (ts.isVariableStatement(child)) {
          for (const decl of child.declarationList.declarations) {
            if (
              ts.isIdentifier(decl.name) &&
              decl.initializer &&
              ts.isArrayLiteralExpression(decl.initializer)
            ) {
              const items = extractArrayItems(decl.initializer);
              if (items.length > 0) {
                arrays.push({
                  name: decl.name.text,
                  items,
                });
              }
            }
          }
        }
      });
    }
  }
}

function extractArrayItems(
  arr: ts.ArrayLiteralExpression
): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = [];

  for (const element of arr.elements) {
    if (ts.isObjectLiteralExpression(element)) {
      const obj: Record<string, unknown> = {};
      for (const prop of element.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          obj[prop.name.text] = extractLiteralValue(prop.initializer);
        }
      }
      if (Object.keys(obj).length > 0) {
        items.push(obj);
      }
    }
  }

  return items;
}

function extractLiteralValue(node: ts.Expression): unknown {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return parseFloat(node.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((el) =>
      ts.isExpression(el) ? extractLiteralValue(el) : null
    );
  }

  if (ts.isObjectLiteralExpression(node)) {
    const obj: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        obj[prop.name.text] = extractLiteralValue(prop.initializer);
      }
    }
    return obj;
  }

  // Template literal — extract static parts
  if (ts.isTemplateExpression(node)) {
    let text = node.head.text;
    for (const span of node.templateSpans) {
      text += "..." + span.literal.text;
    }
    return text;
  }

  return null; // Complex expression — can't extract statically
}

/**
 * Find the JSX return statement in the component and parse the JSX tree.
 */
function extractJsxRoot(sourceFile: ts.SourceFile): ParsedElement | null {
  let jsxRoot: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment | null = null;

  function findReturnJsx(node: ts.Node) {
    if (jsxRoot) return;

    if (ts.isReturnStatement(node) && node.expression) {
      const jsx = findJsxInExpression(node.expression);
      if (jsx) {
        jsxRoot = jsx;
        return;
      }
    }

    ts.forEachChild(node, findReturnJsx);
  }

  // Walk all top-level declarations to find component function
  ts.forEachChild(sourceFile, (node) => {
    if (jsxRoot) return;

    if (ts.isFunctionDeclaration(node) && node.body) {
      findReturnJsx(node.body);
    }

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.initializer) {
          // Arrow function: const Foo = () => <div>...</div> or () => { return <div>...</div>; }
          if (ts.isArrowFunction(decl.initializer)) {
            if (ts.isBlock(decl.initializer.body)) {
              findReturnJsx(decl.initializer.body);
            } else {
              // Concise body: () => <div>...</div>
              const jsx = findJsxInExpression(decl.initializer.body);
              if (jsx) jsxRoot = jsx;
            }
          }
          // Function expression
          if (ts.isFunctionExpression(decl.initializer) && decl.initializer.body) {
            findReturnJsx(decl.initializer.body);
          }
        }
      }
    }

    // export default expression
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      if (ts.isArrowFunction(node.expression)) {
        if (ts.isBlock(node.expression.body)) {
          findReturnJsx(node.expression.body);
        } else {
          const jsx = findJsxInExpression(node.expression.body);
          if (jsx) jsxRoot = jsx;
        }
      }
    }
  });

  if (!jsxRoot) return null;
  return parseJsxNode(jsxRoot);
}

function findJsxInExpression(
  expr: ts.Expression
): ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment | null {
  if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr) || ts.isJsxFragment(expr)) {
    return expr;
  }
  if (ts.isParenthesizedExpression(expr)) {
    return findJsxInExpression(expr.expression);
  }
  // Handle conditional: condition ? <A /> : <B /> — take the first branch
  if (ts.isConditionalExpression(expr)) {
    return findJsxInExpression(expr.whenTrue);
  }
  return null;
}

/**
 * Recursively parse a JSX node into our ParsedElement structure.
 */
function parseJsxNode(
  node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment
): ParsedElement {
  if (ts.isJsxFragment(node)) {
    const children = parseJsxChildren(node);
    return {
      tag: "Fragment",
      classes: [],
      attributes: {},
      textContent: null,
      children,
      isComponent: false,
    };
  }

  const opening = ts.isJsxElement(node)
    ? node.openingElement
    : node;

  const tag = getTagName(opening);
  const isComponent = /^[A-Z]/.test(tag);
  const { classes, attributes } = extractJsxAttributes(opening);

  let children: ParsedElement[] = [];
  let textContent: string | null = null;
  let mapSource: string | undefined;
  let mapItemTemplate: ParsedElement | undefined;

  if (ts.isJsxElement(node)) {
    // Check for .map() pattern in children
    const mapInfo = findMapPattern(node);
    if (mapInfo) {
      mapSource = mapInfo.source;
      mapItemTemplate = mapInfo.template;
    }

    // Extract text content and child elements
    const result = parseJsxElementChildren(node);
    textContent = result.text;
    children = result.children;
  }

  return {
    tag,
    classes,
    attributes,
    textContent,
    children,
    isComponent,
    mapSource,
    mapItemTemplate,
  };
}

function getTagName(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): string {
  const tagName = node.tagName;
  if (ts.isIdentifier(tagName)) {
    return tagName.text;
  }
  if (ts.isPropertyAccessExpression(tagName)) {
    // e.g., motion.div → div
    if (ts.isIdentifier(tagName.expression) && tagName.expression.text === "motion") {
      return tagName.name.text;
    }
    return tagName.name.text;
  }
  return "div";
}

function extractJsxAttributes(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): { classes: string[]; attributes: Record<string, string> } {
  const classes: string[] = [];
  const attributes: Record<string, string> = {};

  for (const attr of node.attributes.properties) {
    if (!ts.isJsxAttribute(attr) || !attr.name) continue;

    const name = ts.isIdentifier(attr.name) ? attr.name.text : "";

    if (name === "className") {
      const classStr = extractAttributeStringValue(attr);
      if (classStr) {
        classes.push(
          ...classStr
            .split(/\s+/)
            .filter((c) => c && !c.includes("${"))
        );
      }
      continue;
    }

    // Extract common attributes
    if (["href", "src", "alt", "id", "type", "placeholder", "target", "rel", "name", "value", "aria-label"].includes(name)) {
      const val = extractAttributeStringValue(attr);
      if (val) attributes[name] = val;
    }
  }

  return { classes, attributes };
}

function extractAttributeStringValue(attr: ts.JsxAttribute): string | null {
  if (!attr.initializer) return null;

  // className="..."
  if (ts.isStringLiteral(attr.initializer)) {
    return attr.initializer.text;
  }

  // className={...}
  if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
    const expr = attr.initializer.expression;

    // className={"..."}
    if (ts.isStringLiteral(expr)) {
      return expr.text;
    }

    // className={`...`} — extract static parts
    if (ts.isNoSubstitutionTemplateLiteral(expr)) {
      return expr.text;
    }

    // className={`${condition ? 'a' : 'b'} static-class`}
    if (ts.isTemplateExpression(expr)) {
      let text = expr.head.text;
      for (const span of expr.templateSpans) {
        text += " " + span.literal.text;
      }
      return text.trim();
    }

    // className={cn("class1", "class2")} — extract string args
    if (ts.isCallExpression(expr)) {
      const strings: string[] = [];
      for (const arg of expr.arguments) {
        if (ts.isStringLiteral(arg)) {
          strings.push(arg.text);
        }
      }
      return strings.join(" ");
    }
  }

  return null;
}

function parseJsxChildren(
  node: ts.JsxElement | ts.JsxFragment
): ParsedElement[] {
  const result = parseJsxElementChildren(
    node as unknown as ts.JsxElement
  );
  return result.children;
}

function parseJsxElementChildren(
  node: ts.JsxElement | ts.JsxFragment
): { text: string | null; children: ParsedElement[] } {
  const children: ParsedElement[] = [];
  let textParts: string[] = [];

  for (const child of node.children) {
    if (ts.isJsxText(child)) {
      const text = child.text.trim();
      if (text) textParts.push(text);
      continue;
    }

    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      children.push(parseJsxNode(child));
      continue;
    }

    if (ts.isJsxFragment(child)) {
      // Flatten fragment children
      const fragChildren = parseJsxChildren(child);
      children.push(...fragChildren);
      continue;
    }

    if (ts.isJsxExpression(child) && child.expression) {
      // String literal expression: {"text"}
      if (ts.isStringLiteral(child.expression)) {
        textParts.push(child.expression.text);
        continue;
      }

      // Template literal
      if (ts.isNoSubstitutionTemplateLiteral(child.expression)) {
        textParts.push(child.expression.text);
        continue;
      }

      // Variable reference or property access — try to get name
      if (ts.isIdentifier(child.expression)) {
        textParts.push(`{${child.expression.text}}`);
        continue;
      }

      if (ts.isPropertyAccessExpression(child.expression)) {
        textParts.push(`{${child.expression.getText()}}`);
        continue;
      }

      // JSX inside expression
      const innerJsx = findJsxInExpression(child.expression);
      if (innerJsx) {
        children.push(parseJsxNode(innerJsx));
        continue;
      }

      // .map() call — handled at parent level via findMapPattern
    }
  }

  const text = textParts.length > 0 ? textParts.join(" ") : null;
  return { text, children };
}

/**
 * Detect .map() patterns in JSX children for data array iteration.
 */
function findMapPattern(
  node: ts.JsxElement
): { source: string; template: ParsedElement } | null {
  for (const child of node.children) {
    if (!ts.isJsxExpression(child) || !child.expression) continue;

    // Look for: {items.map((item) => <div>...</div>)}
    if (ts.isCallExpression(child.expression)) {
      const call = child.expression;
      if (
        ts.isPropertyAccessExpression(call.expression) &&
        ts.isIdentifier(call.expression.name) &&
        call.expression.name.text === "map"
      ) {
        const source = ts.isIdentifier(call.expression.expression)
          ? call.expression.expression.text
          : call.expression.expression.getText();

        // Get the callback
        const callback = call.arguments[0];
        if (!callback) continue;

        let callbackBody: ts.ConciseBody | undefined;
        if (ts.isArrowFunction(callback)) {
          callbackBody = callback.body;
        } else if (ts.isFunctionExpression(callback)) {
          callbackBody = callback.body;
        }

        if (!callbackBody) continue;

        let templateJsx: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment | null = null;

        if (ts.isBlock(callbackBody)) {
          // { return <div>...</div>; }
          ts.forEachChild(callbackBody, (stmt) => {
            if (ts.isReturnStatement(stmt) && stmt.expression) {
              templateJsx = findJsxInExpression(stmt.expression);
            }
          });
        } else {
          // () => <div>...</div>
          templateJsx = findJsxInExpression(callbackBody as ts.Expression);
        }

        if (templateJsx) {
          return {
            source,
            template: parseJsxNode(templateJsx),
          };
        }
      }
    }
  }

  return null;
}

/**
 * Detect section type from component name and root JSX element.
 */
function detectSectionType(
  name: string,
  root: ParsedElement | null
): ParsedSection["sectionType"] {
  const lowerName = name.toLowerCase();

  // Name-based heuristics
  if (lowerName.includes("header") || lowerName.includes("navbar") || lowerName.includes("navigation") || lowerName === "nav") {
    return "header";
  }
  if (lowerName.includes("footer")) {
    return "footer";
  }
  if (lowerName.includes("hero")) {
    return "hero";
  }

  // Root element tag heuristics
  if (root) {
    const tag = root.tag.toLowerCase();
    if (tag === "header" || tag === "nav") return "header";
    if (tag === "footer") return "footer";
    if (tag === "section" || tag === "main" || tag === "div") return "section";
  }

  return "section";
}
