# Option B: External v0-to-Puck Agent

> **Status**: Planned for future implementation
> **Prerequisites**: Option A (in-app agent) is complete
> **Estimated Scope**: New npm package with Claude Agent SDK

## Overview

This document outlines the implementation plan for an **external agent package** that converts v0.dev components to Puck editor components. This agent will run as a standalone CLI/service that can be npm-linked during development or deployed as a microservice.

## Why External Agent?

| Benefit | Description |
|---------|-------------|
| **Separation of concerns** | Heavy AI processing outside the main Next.js app |
| **npm link workflow** | Develop locally, link to CMS during dev |
| **CI/CD integration** | Automate v0 → Puck pipeline in build processes |
| **Batch processing** | Convert multiple components at once |
| **Reusability** | Use with other projects, not just this CMS |
| **Version control** | Generated components go through git review |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     v0-to-puck-agent (External Package)                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐   │
│  │   CLI       │    │  Agent Core  │    │  Output Adapters        │   │
│  │  Interface  │───▶│  (Claude SDK)│───▶│  - File System          │   │
│  │             │    │              │    │  - API (HTTP)           │   │
│  └─────────────┘    └──────────────┘    │  - npm link             │   │
│                            │            └─────────────────────────┘   │
│                            ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                         Tools                                    │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │  v0_fetch      │ Fetch component from v0.dev URL or API         │  │
│  │  v0_generate   │ Generate new component via v0 Platform API     │  │
│  │  parse_react   │ AST parse to extract props/types               │  │
│  │  map_to_puck   │ Map React elements to Puck primitives          │  │
│  │  generate_puck │ Create PuckComponentConfig                     │  │
│  │  validate      │ Validate generated Puck config                 │  │
│  │  write_file    │ Output to file system                          │  │
│  │  api_push      │ Push to CMS API endpoint                       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Integration Points                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. npm link (Development)                                              │
│     ┌──────────────────┐         ┌──────────────────────────┐          │
│     │ v0-to-puck-agent │ ──────▶ │ nextjs-cms/src/puck/     │          │
│     │ (linked package) │  write  │ components/custom/       │          │
│     └──────────────────┘         └──────────────────────────┘          │
│                                                                         │
│  2. API Integration (Production)                                        │
│     ┌──────────────────┐         ┌──────────────────────────┐          │
│     │ v0-to-puck-agent │ ──────▶ │ POST /api/v0/components  │          │
│     │ (microservice)   │  HTTP   │ (CMS API)                │          │
│     └──────────────────┘         └──────────────────────────┘          │
│                                                                         │
│  3. CI/CD Integration                                                   │
│     ┌──────────────────┐         ┌──────────────────────────┐          │
│     │ GitHub Action    │ ──────▶ │ PR with generated        │          │
│     │ or similar       │  git    │ Puck components          │          │
│     └──────────────────┘         └──────────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Package Structure

```
v0-to-puck-agent/
├── package.json
├── tsconfig.json
├── README.md
├── .env.example
│
├── src/
│   ├── index.ts                 # Main exports
│   ├── cli.ts                   # CLI entry point
│   ├── agent.ts                 # Claude Agent SDK agent
│   │
│   ├── tools/
│   │   ├── index.ts             # Tool exports
│   │   ├── v0-fetch.ts          # Fetch from v0.dev URL
│   │   ├── v0-generate.ts       # Generate via v0 Platform API
│   │   ├── parse-react.ts       # AST parsing with ts-morph
│   │   ├── map-to-puck.ts       # Element → Primitive mapping
│   │   ├── generate-puck.ts     # Create Puck config
│   │   ├── validate.ts          # Validation
│   │   ├── write-file.ts        # File system output
│   │   └── api-push.ts          # HTTP API output
│   │
│   ├── primitives/
│   │   ├── index.ts             # Primitive registry
│   │   ├── catalog.ts           # All available primitives
│   │   └── mapping-rules.ts     # JSX → Primitive rules
│   │
│   ├── adapters/
│   │   ├── filesystem.ts        # Write to local files
│   │   ├── api.ts               # Push to CMS API
│   │   └── git.ts               # Create PR with changes
│   │
│   └── prompts/
│       ├── system.ts            # System prompt for agent
│       └── examples.ts          # Few-shot examples
│
├── bin/
│   └── v0-to-puck.js            # CLI executable
│
└── tests/
    ├── agent.test.ts
    ├── tools/
    └── fixtures/
        └── sample-v0-components/
```

## Implementation Plan

### Phase 1: Package Setup

```bash
# Initialize package
mkdir v0-to-puck-agent && cd v0-to-puck-agent
npm init -y

# Install dependencies
npm install @anthropic-ai/claude-agent-sdk
npm install ts-morph                    # TypeScript AST parsing
npm install commander                   # CLI framework
npm install zod                         # Schema validation
npm install dotenv                      # Environment config

# Dev dependencies
npm install -D typescript @types/node tsx
```

**package.json configuration:**
```json
{
  "name": "v0-to-puck-agent",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "v0-to-puck": "./bin/v0-to-puck.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "test": "vitest"
  },
  "peerDependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.0"
  }
}
```

### Phase 2: Core Agent Implementation

**src/agent.ts:**
```typescript
import { Agent, Tool } from '@anthropic-ai/claude-agent-sdk';
import { v0FetchTool } from './tools/v0-fetch';
import { parseReactTool } from './tools/parse-react';
import { mapToPuckTool } from './tools/map-to-puck';
import { generatePuckTool } from './tools/generate-puck';
import { validateTool } from './tools/validate';
import { writeFileTool } from './tools/write-file';
import { SYSTEM_PROMPT } from './prompts/system';

export interface V0ToPuckAgentConfig {
  anthropicApiKey?: string;
  outputDir?: string;
  cmsApiUrl?: string;
  verbose?: boolean;
}

export class V0ToPuckAgent {
  private agent: Agent;
  private config: V0ToPuckAgentConfig;

  constructor(config: V0ToPuckAgentConfig = {}) {
    this.config = config;

    this.agent = new Agent({
      model: 'claude-sonnet-4-20250514',
      apiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
      systemPrompt: SYSTEM_PROMPT,
      tools: this.getTools(),
      maxIterations: 20,
    });
  }

  private getTools(): Tool[] {
    return [
      v0FetchTool,
      parseReactTool,
      mapToPuckTool,
      generatePuckTool,
      validateTool,
      writeFileTool(this.config.outputDir),
    ];
  }

  async convertFromUrl(url: string, options?: ConvertOptions): Promise<ConvertResult> {
    const result = await this.agent.run(`
      Convert the v0.dev component at ${url} to a Puck component.
      ${options?.name ? `Name it: ${options.name}` : ''}
      ${options?.category ? `Category: ${options.category}` : ''}

      Steps:
      1. Fetch the component code from the URL
      2. Parse the React component to extract props and structure
      3. Map JSX elements to Puck primitives
      4. Generate the Puck ComponentConfig
      5. Validate the generated config
      6. Write the output file
    `);

    return this.parseResult(result);
  }

  async convertFromCode(code: string, options?: ConvertOptions): Promise<ConvertResult> {
    const result = await this.agent.run(`
      Convert this React component code to a Puck component:

      \`\`\`tsx
      ${code}
      \`\`\`

      ${options?.name ? `Name it: ${options.name}` : ''}
      ${options?.category ? `Category: ${options.category}` : ''}
    `);

    return this.parseResult(result);
  }

  async batchConvert(items: BatchConvertItem[]): Promise<BatchConvertResult> {
    const results: ConvertResult[] = [];

    for (const item of items) {
      const result = item.url
        ? await this.convertFromUrl(item.url, item.options)
        : await this.convertFromCode(item.code!, item.options);
      results.push(result);
    }

    return { results, successful: results.filter(r => r.success).length };
  }
}
```

### Phase 3: Tool Implementations

**src/tools/v0-fetch.ts:**
```typescript
import { Tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export const v0FetchTool: Tool = {
  name: 'v0_fetch',
  description: 'Fetch component code from a v0.dev URL',
  inputSchema: z.object({
    url: z.string().url().describe('The v0.dev URL to fetch'),
  }),

  async execute({ url }) {
    // Try v0 Platform API first (if available)
    if (process.env.V0_API_KEY) {
      try {
        const response = await fetch(`https://api.v0.dev/v1/generations/${extractId(url)}`, {
          headers: { Authorization: `Bearer ${process.env.V0_API_KEY}` },
        });
        if (response.ok) {
          const data = await response.json();
          return { success: true, code: data.code, name: data.name };
        }
      } catch (e) {
        // Fall through to scraping
      }
    }

    // Fallback: Scrape the page
    const response = await fetch(url);
    const html = await response.text();
    const code = extractCodeFromHtml(html);

    return { success: true, code };
  },
};
```

**src/tools/parse-react.ts:**
```typescript
import { Tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Project, SyntaxKind } from 'ts-morph';

export const parseReactTool: Tool = {
  name: 'parse_react',
  description: 'Parse React/TypeScript component to extract props, types, and structure',
  inputSchema: z.object({
    code: z.string().describe('The React component code to parse'),
  }),

  async execute({ code }) {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('component.tsx', code);

    // Find the main component (default export or named export)
    const component = findMainComponent(sourceFile);

    // Extract props interface
    const props = extractPropsInterface(component);

    // Extract JSX structure
    const jsxStructure = extractJsxStructure(component);

    // Extract imports
    const imports = extractImports(sourceFile);

    return {
      success: true,
      componentName: component.getName(),
      props,
      jsxStructure,
      imports,
      hasChildren: jsxStructure.some(el => el.hasChildren),
    };
  },
};
```

**src/tools/generate-puck.ts:**
```typescript
import { Tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export const generatePuckTool: Tool = {
  name: 'generate_puck',
  description: 'Generate a Puck ComponentConfig from parsed component data',
  inputSchema: z.object({
    componentName: z.string(),
    displayName: z.string(),
    description: z.string().optional(),
    category: z.string().default('Custom'),
    props: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'select', 'array', 'object']),
      required: z.boolean(),
      defaultValue: z.any().optional(),
      options: z.array(z.string()).optional(),
      description: z.string().optional(),
    })),
    renderCode: z.string().describe('The React render function code'),
  }),

  async execute(input) {
    const fields = generateFields(input.props);
    const defaultProps = generateDefaultProps(input.props);

    const puckConfig = {
      label: input.displayName,
      fields,
      defaultProps,
      // The render function will be the original component
      render: `(props) => <${input.componentName} {...props} />`,
    };

    const outputCode = `
import { ComponentConfig } from '@puckeditor/core';

// Original component (paste your v0 component code here)
${input.renderCode}

export const ${input.componentName}Config: ComponentConfig = {
  label: "${input.displayName}",
  fields: ${JSON.stringify(fields, null, 2)},
  defaultProps: ${JSON.stringify(defaultProps, null, 2)},
  render: (props) => <${input.componentName} {...props} />,
};
`;

    return {
      success: true,
      puckConfig,
      outputCode,
    };
  },
};
```

### Phase 4: CLI Implementation

**src/cli.ts:**
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { V0ToPuckAgent } from './agent';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('v0-to-puck')
  .description('Convert v0.dev components to Puck editor components')
  .version('0.1.0');

program
  .command('convert')
  .description('Convert a v0 component to Puck')
  .argument('<source>', 'v0.dev URL or path to component file')
  .option('-n, --name <name>', 'Component name')
  .option('-c, --category <category>', 'Component category', 'Custom')
  .option('-o, --output <dir>', 'Output directory', './puck-components')
  .option('--api <url>', 'Push to CMS API instead of file')
  .option('-v, --verbose', 'Verbose output')
  .action(async (source, options) => {
    const agent = new V0ToPuckAgent({
      outputDir: options.output,
      cmsApiUrl: options.api,
      verbose: options.verbose,
    });

    console.log(`Converting: ${source}`);

    const isUrl = source.startsWith('http');
    const result = isUrl
      ? await agent.convertFromUrl(source, options)
      : await agent.convertFromCode(fs.readFileSync(source, 'utf-8'), options);

    if (result.success) {
      console.log(`✓ Component saved to: ${result.outputPath}`);
    } else {
      console.error(`✗ Conversion failed: ${result.error}`);
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Convert multiple components from a manifest file')
  .argument('<manifest>', 'Path to manifest.json file')
  .option('-o, --output <dir>', 'Output directory', './puck-components')
  .option('-v, --verbose', 'Verbose output')
  .action(async (manifestPath, options) => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const agent = new V0ToPuckAgent({
      outputDir: options.output,
      verbose: options.verbose,
    });

    const result = await agent.batchConvert(manifest.components);
    console.log(`Converted ${result.successful}/${manifest.components.length} components`);
  });

program
  .command('link')
  .description('Link this package to a target project for development')
  .argument('<projectDir>', 'Path to target Next.js/Puck project')
  .action(async (projectDir) => {
    // Create symlink to output directory
    const targetPath = path.join(projectDir, 'src/puck/components/v0-imported');
    // ... implementation
    console.log(`Linked output to: ${targetPath}`);
  });

program.parse();
```

### Phase 5: npm Link Workflow

**Development workflow:**
```bash
# In v0-to-puck-agent directory
npm link

# In nextjs-cms directory
npm link v0-to-puck-agent

# Now you can use the CLI
v0-to-puck convert https://v0.dev/t/abc123 --output src/puck/components/custom

# Or import programmatically in your code
import { V0ToPuckAgent } from 'v0-to-puck-agent';
```

**Integration with CMS:**
```typescript
// In nextjs-cms/src/lib/v0/external-agent.ts
import { V0ToPuckAgent } from 'v0-to-puck-agent';

const agent = new V0ToPuckAgent({
  outputDir: path.join(process.cwd(), 'src/puck/components/custom'),
  verbose: process.env.NODE_ENV === 'development',
});

export async function importV0ComponentExternal(url: string, options?: ImportOptions) {
  return agent.convertFromUrl(url, options);
}
```

## v0 Platform API Integration

The v0 Platform API (currently in beta) provides programmatic access to v0's AI generation capabilities.

**Setup:**
```typescript
// Using the official v0-sdk
import { v0 } from 'v0-sdk';

const client = new v0({
  apiKey: process.env.V0_API_KEY,
});

// Generate a new component
const result = await client.chats.create({
  message: "Create a pricing table with 3 tiers",
  systemPrompt: "Generate shadcn/ui components with Tailwind",
});

// Access the generated code
const code = result.messages.find(m => m.type === 'code')?.content;
```

**Tool integration:**
```typescript
// src/tools/v0-generate.ts
export const v0GenerateTool: Tool = {
  name: 'v0_generate',
  description: 'Generate a new component using v0 AI',
  inputSchema: z.object({
    prompt: z.string().describe('Description of the component to generate'),
    style: z.enum(['shadcn', 'tailwind', 'minimal']).default('shadcn'),
  }),

  async execute({ prompt, style }) {
    const client = new v0({ apiKey: process.env.V0_API_KEY });

    const result = await client.chats.create({
      message: prompt,
      systemPrompt: getSystemPromptForStyle(style),
    });

    return {
      success: true,
      code: extractCodeFromMessages(result.messages),
      previewUrl: result.webUrl,
    };
  },
};
```

## Environment Variables

```bash
# .env.example
ANTHROPIC_API_KEY=sk-ant-...      # Required: Claude API key
V0_API_KEY=v0_...                  # Optional: v0 Platform API key
CMS_API_URL=http://localhost:3000  # Optional: CMS API endpoint
CMS_API_KEY=...                    # Optional: CMS API authentication
```

## Testing Strategy

```typescript
// tests/agent.test.ts
import { describe, it, expect } from 'vitest';
import { V0ToPuckAgent } from '../src/agent';

describe('V0ToPuckAgent', () => {
  it('converts simple component from code', async () => {
    const agent = new V0ToPuckAgent();

    const result = await agent.convertFromCode(`
      export function PricingCard({ title, price, features }) {
        return (
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-3xl">{price}</p>
            <ul>{features.map(f => <li key={f}>{f}</li>)}</ul>
          </div>
        );
      }
    `, { name: 'PricingCard', category: 'Cards' });

    expect(result.success).toBe(true);
    expect(result.puckConfig.label).toBe('Pricing Card');
    expect(result.puckConfig.fields).toHaveProperty('title');
    expect(result.puckConfig.fields).toHaveProperty('price');
    expect(result.puckConfig.fields).toHaveProperty('features');
  });
});
```

## Migration from Option A

When implementing Option B, the existing in-app code can be reused:

| Existing Code | Reuse Strategy |
|---------------|----------------|
| `src/lib/v0/parser.ts` | Copy and adapt for standalone use |
| `src/lib/v0/converter.ts` | Copy and adapt |
| `src/lib/v0-agent/tools/primitives.ts` | Copy as primitive catalog |
| `src/lib/v0-agent/prompts/system.ts` | Copy and enhance |
| `src/lib/v0/types.ts` | Copy shared types |

## Deployment Options

### Option 1: npm Package (Recommended for dev)
```bash
npm publish
# Users install and use CLI
npx v0-to-puck convert https://v0.dev/t/xxx
```

### Option 2: Docker Microservice
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Option 3: Serverless Function
```typescript
// api/convert.ts (Vercel/Netlify)
export default async function handler(req, res) {
  const agent = new V0ToPuckAgent();
  const result = await agent.convertFromUrl(req.body.url);
  res.json(result);
}
```

## Future Enhancements

1. **Real-time preview** - WebSocket connection to show conversion progress
2. **Component library sync** - Keep Puck components in sync with v0 updates
3. **Figma integration** - Convert Figma designs via v0 to Puck
4. **Theme extraction** - Extract design tokens from v0 components
5. **Dependency bundling** - Bundle required npm packages with components
6. **Version diffing** - Show what changed when re-importing a component

## References

- [Claude Agent SDK Documentation](https://docs.anthropic.com/agent-sdk)
- [v0 Platform API](https://v0.dev/docs/api/platform)
- [Puck Editor Documentation](https://puckeditor.com/docs)
- [ts-morph AST Documentation](https://ts-morph.com)
- Existing implementation: `src/lib/v0-agent/` in this repository
