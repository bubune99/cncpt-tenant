# AI Agents Package

## Overview
Multi-agent AI architecture for the CNCPT-TENANT platform, orchestrating specialized AI agents for different business domains.

## Agent Architecture

### Main Consultant Agent (Orchestrator)
The executive decision-maker that coordinates all other agents.

```typescript
import { ConsultantAgent } from '@cncpt/ai-agents';

const consultant = new ConsultantAgent({
  context: businessContext,
  agents: [uiAgent, contentAgent, seoAgent, analyticsAgent]
});

const decision = await consultant.analyze(situation);
```

## Specialized Agents

### UI/UX Agent (v0 Integration)
Generates React components and UI elements using v0 by Vercel.

```typescript
import { V0Agent } from '@cncpt/ai-agents';

const uiAgent = new V0Agent();
const component = await uiAgent.generateComponent({
  prompt: "Create a pricing table with 3 tiers",
  style: "modern, shadcn/ui"
});
```

### Visual Content Agent (Recraft Integration)
Creates vector graphics, illustrations, and brand assets.

```typescript
import { RecraftAgent } from '@cncpt/ai-agents';

const visualAgent = new RecraftAgent();
const graphic = await visualAgent.generateGraphic({
  prompt: "Hero section illustration",
  style: brandGuidelines,
  format: "svg"
});
```

### Code Agent (Cursor/Windsurf Integration)
Develops custom integrations and business logic.

```typescript
import { CodeAgent } from '@cncpt/ai-agents';

const codeAgent = new CodeAgent();
const implementation = await codeAgent.implement({
  task: "Add Stripe payment integration",
  context: projectContext
});
```

### SEO & Marketing Agent
Optimizes content for search and marketing performance.

```typescript
import { MarketingAgent } from '@cncpt/ai-agents';

const marketingAgent = new MarketingAgent();
const optimization = await marketingAgent.optimize({
  content: pageContent,
  keywords: targetKeywords,
  competitors: competitorData
});
```

### Business Intelligence Agent
Analyzes data and provides strategic insights.

```typescript
import { BusinessAgent } from '@cncpt/ai-agents';

const businessAgent = new BusinessAgent();
const insights = await businessAgent.analyze({
  metrics: businessMetrics,
  timeframe: "last_quarter"
});
```

## Agent Coordination

### Conflict Resolution
When agents disagree, the system uses performance-based seniority:

```typescript
const resolution = await consultant.resolveConflict({
  agent1: { recommendation: "Increase price", confidence: 0.8 },
  agent2: { recommendation: "Maintain price", confidence: 0.9 },
  context: marketConditions
});
```

### Task Delegation
The consultant agent automatically delegates tasks:

```typescript
const task = {
  type: "create_landing_page",
  requirements: specifications
};

const delegation = await consultant.delegate(task);
// Automatically routes to:
// - V0Agent for UI generation
// - RecraftAgent for graphics
// - MarketingAgent for copy
// - CodeAgent for integrations
```

## Context Management

### Multi-Dimensional Context
```typescript
const context = {
  temporal: {
    realTime: currentSessions,
    immediate: recentOrders,
    shortTerm: campaignMetrics,
    historical: yearlyTrends
  },
  domains: {
    product: productCatalog,
    customer: customerSegments,
    campaign: activePromotions,
    business: companyGoals
  }
};
```

### Relevance Scoring
```typescript
const relevance = calculateRelevance({
  recency: 0.4,
  domainMatch: 0.3,
  businessImpact: 0.3
});
```

## Proactive Coaching

### Meeting Cadence
```typescript
const coachingSchedule = {
  daily: ["What needs immediate attention?"],
  weekly: ["Review performance metrics", "Set priorities"],
  monthly: ["Assess quarterly progress", "Market analysis"],
  quarterly: ["Strategic planning", "Competitive positioning"]
};
```

### Smart Questions
The AI proactively asks strategic questions:

```typescript
const question = await businessAgent.generateQuestion({
  context: currentPerformance,
  pattern: "underperforming_product"
});
// "This product's conversion dropped 15%. Should we adjust pricing or improve descriptions?"
```

## Installation

```bash
pnpm add @cncpt/ai-agents
```

## Configuration

```typescript
// ai-agents.config.ts
export default {
  providers: {
    v0: { apiKey: process.env.V0_API_KEY },
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    recraft: { apiKey: process.env.RECRAFT_API_KEY }
  },
  orchestration: {
    defaultModel: 'gpt-4',
    fallbackModel: 'claude-3',
    maxRetries: 3
  },
  specialization: {
    uiGeneration: 'v0',
    visualContent: 'recraft',
    businessLogic: 'claude-3',
    dataAnalysis: 'gpt-4'
  }
};
```

## Usage Example

```typescript
import { AgentOrchestrator } from '@cncpt/ai-agents';

const orchestrator = new AgentOrchestrator(config);

// Natural language command
const result = await orchestrator.execute({
  command: "Create a landing page for our new product launch",
  context: businessContext
});

// Result includes:
// - UI components (from v0)
// - Graphics (from Recraft)
// - SEO-optimized copy (from Marketing Agent)
// - Implementation code (from Code Agent)
// - Performance predictions (from Business Agent)
```

## Best Practices

1. **Define clear context** - Provide comprehensive business context
2. **Set agent boundaries** - Be explicit about what each agent can modify
3. **Monitor performance** - Track agent success rates
4. **Regular calibration** - Update agent parameters based on outcomes
5. **Human oversight** - Require approval for high-stakes decisions

## License

Part of CNCPT-TENANT Platform