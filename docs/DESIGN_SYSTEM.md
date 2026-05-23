# Design System

GetGoGone should feel like a clean operational SaaS dashboard for a small dealership.

Style:
- Light interface
- Compact cards and tables
- Practical workflow-first screens
- 6-8px radius
- Clear status colors
- No landing-page styling inside the app

Primary palette:
- Primary: #2563EB
- Success: #16A34A
- Warning: #F59E0B
- Danger: #DC2626
- Background: #F6F7F9
- Surface: #FFFFFF
- Text: #111827
- Muted text: #64748B

Core UX:
The app should help a salesperson move from vehicle to campaign to creative to lead follow-up quickly, in English or Spanish.

Visual source of truth:
The Claude Design handoff defines the initial app theme and styling. Preserve its CSS variables, colors, spacing, typography, card/table/button treatments, layout density, and overall component feel during implementation. Do not replace the look with a different UI kit or Tailwind/shadcn interpretation unless explicitly approved.

Implementation note:
The handoff's `styles.css` has been copied directly to `src/app/globals.css`. Future styling changes should be intentionally documented here and should preserve the established Claude theme unless explicitly approved.

### Glassmorphic Modal Component Style
Added premium modal styling overlay and card classes in `src/app/globals.css` to enable rich, detailed workflow decisions (e.g. Agent Proposals & recommendations) while retaining absolute cohesion with the core design language:
- `.modal-overlay`: Absolute fixed viewport overlay with a muted slate glass style (`rgba(15, 23, 42, 0.45)`) and smooth backdrop blur filter (`blur(8px)`).
- `.modal-card`: Elevated, scale-in animated glass panel (`background: rgba(255, 255, 255, 0.9)`, border `rgba(255, 255, 255, 0.6)`) that floats perfectly above dashboard tables.
- `.modal-h`, `.modal-b`, `.modal-f`: Cohesive semantic sections representing Header, scrollable Body, and action Footer respectively.

### AI Overlay Vector Canvas Styles
To support fully editable, responsive, and compliance-safe marketing overlays, the design system defines high-impact vector layers that float above the protected base vehicle photo:
- **Canvas Coordinates**: A relative 100x100 percent coordinate system maps all vector assets dynamically across any chosen export aspect ratio (Facebook Square, Craigslist Banner, etc.) without pixelation.
- **Bilingual Trust Ribbons**: Sleek contrasting red/gold banner ribbons that structure bilingual text dynamically, strictly preventing trademarked logos (e.g. unlicensed Carfax) while providing high-converting marketing CTAs.
- **Dynamic Variable Placeholders**: Form-field inputs support double-curly variable syntax (e.g. `{{down_payment}} DOWN`) which dynamically binds lot inventory specifications into standard text layers upon render.
- **Single-Transaction History Batches**: sidebar additions (collages, text title blocks, shape layouts, or generated AI overlays) route through a atomic `onAddLayers` batch handler. This bundles all newly applied layers into a single history step, maintaining a clean Undo/Redo track.
