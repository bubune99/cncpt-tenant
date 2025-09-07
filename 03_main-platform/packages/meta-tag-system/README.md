# Meta-Tag Hybrid System

## Overview
The Meta-Tag Hybrid System bridges no-code visual development with professional code editing, enabling seamless collaboration between designers, developers, and AI.

## Core Concept

Meta-tags are intelligent code annotations that make React components "AI-aware" and "visually-editable" without sacrificing code quality.

## Meta-Tag Syntax

### Basic Structure
```tsx
{/* @builder:TYPE id="UNIQUE_ID" [ATTRIBUTES] */}
  <!-- Component/Section Content -->
{/* @builder:end */}
```

### Supported Types
- `page` - Top-level page container
- `section` - Major page sections  
- `component` - Individual components
- `item` - List items or repeated elements
- `conditional` - Conditional rendering blocks
- `wrapper` - Container elements

### Attributes
- `id` - Unique identifier (required)
- `type` - Component/section type
- `source` - Data source (database|code|v0)
- `editable` - Properties that can be edited visually
- `ai-description` - Context for AI understanding
- `custom` - Contains custom developer code

## v0 Integration

### Workflow
1. Generate component with v0
2. Add meta-tags to generated code
3. Import into platform
4. Enable visual editing

### Example: v0-Generated Pricing Component
```tsx
{/* @builder:section id="pricing" type="pricing" source="v0" editable="tiers,features" */}
<section className="pricing-section">
  {/* @builder:component id="pricing-header" source="v0" */}
  <h2>Choose Your Plan</h2>
  {/* @builder:end */}
  
  {/* v0-generated pricing tiers */}
  <div className="pricing-grid">
    {tiers.map((tier, index) => (
      /* @builder:item id={`tier-${index}`} type="pricing-tier" source="v0" */
      <PricingTier key={index} {...tier} />
      /* @builder:end */
    ))}
  </div>
</section>
{/* @builder:end */}
```

## Features

### For No-Code Users
- Visual editing of v0-generated components
- Drag-and-drop interface
- Real-time preview
- No code knowledge required

### For Developers  
- Full code control
- Git-friendly workflow
- Clear boundaries between generated and custom code
- Standard React development

### For AI
- Precise targeting of components
- Understanding of component hierarchy
- Ability to modify without breaking custom code
- Context-aware suggestions

## API

### Parser
```typescript
import { MetaTagParser } from '@cncpt/meta-tag-system';

const parser = new MetaTagParser();
const metaTags = parser.parseFile(fileContent);
```

### Renderer
```typescript
import { HybridSectionRenderer } from '@cncpt/meta-tag-system';

<HybridSectionRenderer
  metaTag={metaTag}
  sectionData={databaseSection}
  isEditable={true}
  onUpdate={handleUpdate}
/>
```

### AI Processor
```typescript
import { HybridAIProcessor } from '@cncpt/meta-tag-system';

const processor = new HybridAIProcessor();
const result = await processor.processCommand(
  "Change hero title to 'Welcome'",
  { pageContent, metaTags, databaseSections }
);
```

## Installation

```bash
pnpm add @cncpt/meta-tag-system
```

## Configuration

```javascript
// meta-tag.config.js
module.exports = {
  parser: {
    tagPrefix: '@builder',
    supportedTypes: ['page', 'section', 'component', 'item'],
  },
  renderer: {
    editableByDefault: false,
    syncWithDatabase: true,
  },
  ai: {
    enableSuggestions: true,
    autoGenerateTags: true,
  }
};
```

## Best Practices

1. **Always add IDs** - Every meta-tag needs a unique ID
2. **Specify source** - Mark whether content is from v0, database, or custom
3. **Mark editable properties** - Be explicit about what can be edited visually
4. **Preserve custom code** - Don't wrap custom logic in editable tags
5. **Use descriptive types** - Help AI understand component purpose

## License

Part of CNCPT-TENANT Platform