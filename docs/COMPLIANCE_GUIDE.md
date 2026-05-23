# Compliance Guide

BHPH advertising must avoid risky or misleading claims.

Avoid:
- Guaranteed approval
- Everyone approved
- No credit check unless legally and operationally true
- Specific payment claims without required terms
- Down payment guarantees without conditions

Prefer:
- Financing options available
- Apply online
- Trade-ins welcome
- Down payment options available
- Subject to approval
- See dealer for details

Spanish copy should be natural, clear, and compliant rather than literal machine translation.

## Vehicle History Reports & Trademark Compliance

Dealerships often provide vehicle history reports (e.g. Carfax, AutoCheck) to buyers. However, unless the dealership possesses an active paid subscription/license with these specific providers:
- **DO NOT** generate or use official trademarked logos or badges (such as the Carfax mascot, logo, or brand ribbons) in ad creatives, flyers, or listings. Doing so exposes the dealership and agency to severe trademark infringement liabilities.
- **DO** use generic trust-oriented descriptions in visual templates and copy (e.g., *"Free Vehicle History"*, *"Reporte de Historial Gratis"*).
- **DO** leverage high-fidelity dynamic QR Code overlays pointing to hosted reports (entered manually via `vehicles.source_url` under inventory records), allowing buyers to scan and retrieve reports seamlessly without utilizing unlicensed assets.

Implementation rule:
When live vehicle data does not include approved payment terms, UI and generated copy should avoid weekly/monthly payment claims. Use down-payment-first language and phrases like "financing options available" or "available after approval" instead of showing `$0/wk` or inventing payment terms.
