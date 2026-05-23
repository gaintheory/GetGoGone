# Product Scope

Primary users:
- Owner or manager
- Sales manager
- Salespeople

Core modules:
- Inventory
- Vehicle detail pages
- Campaign builder with channel-specific marketing modules
- Creative builder
- Marketing composer
- Lead management
- Workflows and tasks
- Reports
- Integrations
- Settings

Initial dealership reality:
- Inventory and leads are currently handled in Carsforsale/MyCommandCenter.
- Current advertising is mostly free Facebook posting, with occasional paid Facebook ads.
- Spanish support is critical.
- Down payment advertising is common; payment advertising requires caution.
- All salespeople should be able to participate in marketing and follow-up.

Strategic direction:
Carsforsale is treated as an integration/source, not the long-term product backbone. GetGoGone owns campaign creation, creative generation, marketing workflows, lead engagement, reporting, and team accountability.

Campaign Builder direction:
The campaign builder should not use one generic ad form for every platform. Each selected marketing channel should expose channel-specific setup, generated outputs, creative needs, and publishing/export behavior. See `docs/product/CAMPAIGN_BUILDER_V2.md`.

Templates direction:
Templates are not a top-level workspace module. A template is a reusable asset/starting point that lives inside the Designer and feeds creative creation. The Designer should support both blank canvases and template-based starts. Saved creatives and exports belong in the asset library, not in a separate Templates tab.

Designer direction:
The Designer is vehicle-first. A user selects a vehicle before choosing an overlay approach. The vehicle photo is always the base layer; "blank" means a blank ad overlay on top of that photo, not an empty design with no vehicle. Users can apply a defined template overlay or build their own overlay with text, badges, photo/collage tools, brand elements, undo/redo, layer deletion, reset, and clear-overlay controls.

Designer offer direction:
Offer terms are edited separately from visual text layers. Templates must use approved offer values or safe fallback labels such as "Low Down Payment", "Call for Price", and "Terms Available". The Designer must not render `$0 Down` just because source data is missing or zero. Weekly/monthly payment numbers should only display when explicitly marked approved.

Designer import direction:
Template import belongs inside Designer. Supported source categories are GetGoGone JSON templates, dealer-owned PNG/JPG/SVG/PDF designs, exported layouts from tools the dealer has rights to use, and approved partner badge assets. Imported third-party templates require clear commercial-use rights; official logos/badges are upload-only and should not be recreated.

Designer persistence direction:
Designer templates and creative versions must be recoverable after save. A saved template is a reusable overlay starting point inside Designer. A saved creative is a finished/editable version that appears in Designer's Saved panel and the Creatives asset library. Rendered image export and campaign attachment are separate follow-up capabilities.
