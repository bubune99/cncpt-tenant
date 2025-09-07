# Code Dumping Ground

## Purpose
This directory serves as a repository for:
- External code examples and templates
- v0-generated components before integration
- Code snippets for reference
- Experimental implementations
- Competitive analysis code

## Structure

### 📁 v0-generated-code/
Store all v0.dev generated components here before integrating them into the main platform.

#### Session Structure:
- `session-XXX-[feature]/`
  - `v0-prompt.md` - The prompt used in v0
  - `generated-code.tsx` - Raw output from v0
  - `extraction-notes.md` - Notes on what to extract
  - `integration-status.md` - Track integration progress

### 📁 vercel-templates/
Templates and examples from Vercel:
- Next.js Commerce
- Next.js SaaS Starter
- AI Chatbot examples

### 📁 github-repos/
Useful code from GitHub repositories:
- shadcn/ui examples
- React Flow examples
- Payment integration samples

### 📁 external-libraries/
Examples from various UI and utility libraries for evaluation.

### 📁 code-snippets/
Reusable code snippets organized by category.

## Workflow

1. **Generate with v0**: Create components using v0.dev
2. **Store in session folder**: Save with prompt and notes
3. **Add meta-tags**: Enhance with meta-tag annotations
4. **Test integration**: Verify in development branch
5. **Move to platform**: Integrate into main platform code
6. **Archive session**: Move to archived-sessions when complete

## Important Notes

- Code in this directory is NOT production-ready
- Always review and test before integration
- Document extraction decisions
- Keep licensing information when copying external code
- Clean up regularly to avoid clutter