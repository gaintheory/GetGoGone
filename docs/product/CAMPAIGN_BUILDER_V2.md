# Campaign Builder V2

Campaign Builder V2 replaces the generic "same form for every platform" approach with a channel-based system.

## Principle

Each marketing channel has its own job, format, buyer behavior, and publishing constraints. GetGoGone should guide the user through the right setup for each selected channel instead of pretending one ad fits everywhere.

## Core Flow

1. Select or confirm vehicle.
2. Choose campaign goal.
3. Choose marketing channels.
4. Configure each selected channel with channel-specific fields.
5. Generate channel-specific outputs.
6. Review, save, export, or launch where integrations allow.

## Campaign Goals

- Generate finance applications
- Drive calls
- Drive messages
- Promote commercial/work vehicles
- Move aging inventory
- Promote Spanish-language buyers
- Announce fresh arrival
- Push low down payment offer
- Reactivate old leads

## Channel Modules

Each channel module should define:

- `id`
- `name`
- `category`
- `bestFor`
- `whenToUse`
- `setupFields`
- `generatedOutputs`
- `creativeFormats`
- `publishingMethod`
- `complianceNotes`

This allows channels such as CarGurus, Autotrader, Cars.com, or new social platforms to be added without redesigning the whole builder.

## Initial Channels

### Meta Paid Ads

Used for Facebook and Instagram paid campaigns.

Setup:
- Objective: leads, messages, calls, traffic
- Budget
- Schedule
- Radius/location
- Language: English, Spanish, bilingual
- CTA
- Destination: finance app, vehicle page, Messenger, phone call

Outputs:
- Primary text variations
- Headlines
- Descriptions
- CTA recommendation
- Creative size checklist
- Audience summary
- Compliance notes

Publishing:
- Export/launch package first
- API launch later

### Facebook Organic / Groups

Used for current free posting workflows without replacing Carsforsale's existing flow.

Setup:
- Posting angle
- English/Spanish/bilingual copy
- Group checklist
- Repost reminder

Outputs:
- Group-friendly post copy
- Short title
- Spanish version
- Comment/reply starters

Publishing:
- Copy/export/checklist
- "Open existing Carsforsale/Facebook flow"

### Instagram Organic

Setup:
- Feed, story, or reel
- Caption tone
- Hashtag set
- CTA

Outputs:
- Caption
- Story text overlay
- Reel/walkaround script
- Hashtag suggestions

Publishing:
- Export/copy package

### Google Business Profile

Setup:
- Post type: update, offer, event
- CTA link
- Expiration date for offers

Outputs:
- Short local post
- CTA text
- Photo recommendation

Publishing:
- API later or manual copy/export

### Craigslist

Setup:
- Location
- Price
- Body style/category
- Repost reminder

Outputs:
- Listing title
- Plain-text listing body
- Posting checklist
- Image package checklist

Publishing:
- Manual export/checklist

### LinkedIn Commercial Vehicles

Only shown as recommended when the vehicle is a truck, cargo van, passenger van, box truck, or other work vehicle.

Setup:
- Business audience
- Use case: contractor, delivery, fleet, service business
- Company page or paid campaign

Outputs:
- Professional post copy
- Commercial use bullets
- Business-focused headline

Publishing:
- Copy/export or paid campaign package

### Marketplace Listings

Used for paid or existing access channels such as Cars.com, CarGurus, and Autotrader.

Setup:
- Marketplace channel
- Listing emphasis
- Condition notes
- Feature highlights

Outputs:
- Listing title
- Marketplace description
- Feature highlights
- Seller notes

Publishing:
- Export/checklist unless an API or feed is available.

### SMS / Email

Used for existing leads, past buyers, and segmented follow-up.

Setup:
- Segment
- Channel: SMS or email
- Schedule
- Language
- Consent reminder

Outputs:
- SMS copy
- Email subject/body
- Follow-up variants

Publishing:
- Provider integration later
- Draft/save first

### TikTok / YouTube Shorts

Setup:
- Video type
- Duration
- Angle
- Language

Outputs:
- Walkaround script
- Shot list
- Caption
- Thumbnail/title ideas

Publishing:
- Export/checklist

## UI Direction

The builder should have:

- Left panel: vehicle summary and campaign goal
- Center panel: selected channel modules
- Right panel: generated outputs and creative preview

Avoid:
- A single generic text form for every channel
- Making Facebook organic posting the center of the product
- Inventing payment terms when the source data only has down payment

## Data Direction

Use existing `campaigns` as the campaign parent and `campaign_channels` as the selected channel module instances.

Store channel-specific setup and generated output in:

- `campaign_channels.platform_payload`
- `campaign_channels.headline`
- `campaign_channels.primary_text`
- `campaign_channels.description`
- `campaign_channels.call_to_action`

This keeps the database flexible while the product learns which channels need deeper structured tables.

## Current Implementation

The Campaign Builder now saves drafts through `/api/campaigns`.

Save behavior:
- upserts the selected vehicle into `vehicles` by VIN when available
- creates a `campaigns` row with `campaign_type = channel_builder`
- creates one `campaign_channels` row per selected channel module
- stores module metadata, setup fields, generated outputs, creative formats, publishing method, compliance notes, goal, language, and vehicle snapshot in `platform_payload`

Campaign review:
- the Campaigns screen reads saved campaigns from `/api/campaigns`
- clicking a campaign opens a review screen
- the review screen shows campaign summary, vehicle, selected channel modules, generated copy, setup requirements, outputs, formats, publishing path, compliance notes, and CTA
- copy/export controls are present at the package and channel level
- channel review cards now allow editing headline, generated copy, CTA, setup fields, and publishing path
- saving a channel persists the edits back to `campaign_channels`
- export now downloads `.txt` packages with copy, CTA, setup checklist, publishing path, expected outputs, creative formats, and compliance notes
- each export also registers a saved asset record in `campaign_assets`, and the Campaign Review summary shows recently saved assets

Next product step:
Add image/creative asset exports to the package after the creative designer has persisted assets.
