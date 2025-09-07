# v0 Integration Guide for CNCPT-TENANT

## Overview
This guide explains how to integrate v0 by Vercel into the CNCPT-TENANT platform for AI-powered component generation with meta-tag support.

## What is v0?
v0 is Vercel's AI-powered UI generation tool that creates React components from natural language descriptions. It generates production-ready code using shadcn/ui components and Tailwind CSS.

## Integration Workflow

### Step 1: Generate Component with v0

1. **Navigate to v0.dev**
2. **Describe your component** in natural language:
   ```
   "Create a pricing section with 3 tiers (Basic, Pro, Enterprise), 
   feature comparison, monthly/yearly toggle, and call-to-action buttons"
   ```
3. **Review and iterate** on the generated component
4. **Copy the code** when satisfied

### Step 2: Add Meta-Tags

Transform v0-generated code into platform-compatible components:

#### Original v0 Output:
```tsx
export function PricingSection() {
  return (
    <section className="py-24">
      <h2 className="text-4xl font-bold text-center mb-12">
        Choose Your Plan
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {/* Pricing tiers */}
      </div>
    </section>
  );
}
```

#### With Meta-Tags Added:
```tsx
{/* @builder:section id="pricing-section" type="pricing" source="v0" editable="title,tiers" */}
export function PricingSection() {
  return (
    <section className="py-24">
      {/* @builder:component id="pricing-title" type="heading" editable="true" */}
      <h2 className="text-4xl font-bold text-center mb-12">
        Choose Your Plan
      </h2>
      {/* @builder:end */}
      
      {/* @builder:component id="pricing-grid" type="tier-container" source="v0" */}
      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier, index) => (
          /* @builder:item id={`tier-${index}`} type="pricing-tier" editable="name,price,features" */
          <PricingTier key={index} {...tier} />
          /* @builder:end */
        ))}
      </div>
      {/* @builder:end */}
    </section>
  );
}
{/* @builder:end */}
```

### Step 3: Import into Platform

1. **Save the component** in appropriate location:
   ```
   03_main-platform/apps/[app-name]/src/components/v0-generated/
   ```

2. **Register with Meta-Tag System**:
   ```typescript
   import { registerComponent } from '@cncpt/meta-tag-system';
   import { PricingSection } from './v0-generated/PricingSection';

   registerComponent({
     component: PricingSection,
     metaTags: {
       id: 'pricing-section',
       type: 'pricing',
       source: 'v0',
       editable: ['title', 'tiers']
     }
   });
   ```

3. **Enable Visual Editing**:
   ```typescript
   import { enableVisualEditing } from '@cncpt/meta-tag-system';

   enableVisualEditing('pricing-section', {
     allowDragDrop: true,
     editableProps: ['title', 'tiers', 'pricing'],
     aiEnhanced: true
   });
   ```

## Common v0 Component Patterns

### Hero Section
```
v0 Prompt: "Create a hero section with headline, subheading, CTA buttons, and background image"

Meta-Tag Pattern:
- Section wrapper with id="hero"
- Editable headline component
- Editable CTA buttons
- Image component with source="database"
```

### Feature Grid
```
v0 Prompt: "Create a 3-column feature grid with icons, titles, and descriptions"

Meta-Tag Pattern:
- Section wrapper with id="features"
- Repeatable feature items
- Editable content for each feature
- Icon selection from library
```

### Testimonials
```
v0 Prompt: "Create a testimonial carousel with customer quotes and avatars"

Meta-Tag Pattern:
- Section wrapper with id="testimonials"
- Carousel component with controls
- Repeatable testimonial items
- Database-driven content
```

## AI Enhancement Pipeline

### 1. Initial Generation (v0)
```typescript
const component = await v0Agent.generate({
  prompt: userDescription,
  style: 'shadcn',
  responsive: true
});
```

### 2. Meta-Tag Injection
```typescript
const taggedComponent = await metaTagSystem.enhance(component, {
  autoDetectEditables: true,
  preserveCustomLogic: true
});
```

### 3. Visual Editor Integration
```typescript
const editableComponent = await visualEditor.register(taggedComponent, {
  dragDropEnabled: true,
  aiAssisted: true
});
```

### 4. Continuous Optimization
```typescript
const optimized = await aiAgents.optimize(editableComponent, {
  seo: true,
  performance: true,
  accessibility: true
});
```

## Best Practices

### Do's
- ✅ Use descriptive IDs for meta-tags
- ✅ Mark data-driven content as `source="database"`
- ✅ Preserve v0's responsive design classes
- ✅ Keep custom logic separate from editable content
- ✅ Test visual editing after adding meta-tags

### Don'ts
- ❌ Don't wrap entire components if only parts are editable
- ❌ Don't remove v0's accessibility features
- ❌ Don't modify core component logic without testing
- ❌ Don't forget to specify editable properties
- ❌ Don't mix database and static content without clear boundaries

## Troubleshooting

### Component Not Appearing in Visual Editor
- Check meta-tag syntax is correct
- Verify component is registered with the system
- Ensure IDs are unique across the page

### Edits Not Persisting
- Verify `source="database"` for dynamic content
- Check database schema matches component props
- Ensure proper permissions for editing

### Styling Issues After Import
- Preserve all Tailwind classes from v0
- Check for CSS conflicts with existing styles
- Verify shadcn/ui components are installed

## Advanced Features

### Conditional Rendering
```tsx
{/* @builder:conditional id="premium-features" condition="plan === 'premium'" */}
  {/* v0-generated premium content */}
{/* @builder:end */}
```

### Dynamic Lists
```tsx
{/* @builder:repeater id="product-list" source="database" */}
  {products.map(product => (
    /* @builder:item */
    <ProductCard {...product} />
    /* @builder:end */
  ))}
{/* @builder:end */}
```

### Nested Components
```tsx
{/* @builder:section id="main" */}
  {/* @builder:component id="header" source="v0" */}
    <Header />
  {/* @builder:end */}
  
  {/* @builder:component id="content" source="database" */}
    <Content />
  {/* @builder:end */}
{/* @builder:end */}
```

## Resources

- [v0.dev](https://v0.dev) - Generate components
- [Meta-Tag System Docs](/packages/meta-tag-system/README.md)
- [AI Agents Documentation](/packages/ai-agents/README.md)
- [Platform Architecture](/Planning-Documents/unified_platform_vision.md)

## Support

For issues or questions:
- Check the troubleshooting section
- Review example implementations in `/02_development-branches/`
- Contact the platform team

---

*This guide is part of the CNCPT-TENANT platform documentation*