<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GetGoGone Project Rules

## Documentation Discipline

Every meaningful product, architecture, data model, integration, design system, workflow, or implementation direction change must be reflected in the relevant markdown file under `docs/` in the same work session.

Use:
- `docs/DECISIONS.md` for major choices and rationale.
- `docs/PROJECT_BRIEF.md` for project purpose changes.
- `docs/PRODUCT_SCOPE.md` for feature or workflow scope changes.
- `docs/ARCHITECTURE.md` for stack, structure, or technical approach changes.
- `docs/DATA_MODEL.md` for entity, table, or relationship changes.
- `docs/INTEGRATIONS.md` for external service/account/API changes.
- `docs/DESIGN_SYSTEM.md` for visual, layout, style, or component convention changes.
- `docs/COMPLIANCE_GUIDE.md` for advertising, finance, or messaging rules.
- `docs/DEALER_DISCOVERY.md` for owner/manager/salesperson workflow findings.

If code changes make a doc stale, update the doc before considering the task complete.

## Visual Source Of Truth

The Claude Design handoff is the visual source of truth for the initial GetGoGone app. Preserve its styling, theme, spacing, colors, typography, and component feel unless the user explicitly approves a design change.
