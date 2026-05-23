# 2026 BHPH Advertising Compliance Guide

This guide defines the regulatory boundaries and advertising compliance rules for Buy Here Pay Here (BHPH) marketing copy. The AI generation engine, post-processing filters, and manual editing prompts utilize these guidelines to eliminate legal liability and ensure safe, honest marketing.

---

## 1. Regulatory Context

BHPH dealerships are subject to strict state and federal consumer protection laws. Key regulators include:
- **Federal Trade Commission (FTC):** Enforces rules against deceptive or unfair advertising practices.
- **Consumer Financial Protection Bureau (CFPB):** Monitors retail financing compliance and equal credit access.
- **Truth in Lending Act (TILA) / Regulation Z:** Governs disclosure of credit terms in advertisements.
- **Equal Credit Opportunity Act (ECOA) / Regulation B:** Prohibits discrimination in credit applications.

---

## 2. Core Compliance Rules

Every piece of generated or edited copy must satisfy these five rules:

### Rule 1: Eliminate "Guaranteed Approval" Claims
*   **The Risk:** The FTC has ruled that "Guaranteed Approval," "100% Approved," or "Everybody Drives" are inherently deceptive if the dealer has *any* criteria under which a buyer can be rejected (e.g. lack of income, active bankruptcy, lack of down payment).
*   **The Rule:** **NEVER** use the word "Guarantee" or "Guaranteed" in relation to credit, approvals, or vehicle availability.
*   **Safe Alternatives:** 
    *   *"Income-Based Approvals"*
    *   *"We work with past credit issues"*
    *   *"Flexible dealership guidelines"*
    *   *"Bring your W-2 or SSI check to qualify"*

### Rule 2: Regulation Z Triggering Terms (Payment Claims)
*   **The Risk:** Under TILA / Reg Z, if you state *any* specific credit terms (the "triggering terms"), you must clearly and conspicuously disclose the full credit package (down payment, repayment terms, APR, and total cost of finance).
*   **Triggering Terms:**
    *   The amount or percentage of any down payment (e.g., "$500 Down")
    *   The amount of any payment (e.g., "$75 a week")
    *   The number of payments or period of repayment (e.g., "30 months")
    *   The amount of any finance charge (e.g., "18% APR")
*   **The Rule:** The copywriter **MUST NOT** generate or output specific payment claims (e.g., "$99 a week") unless the dealer has explicitly uploaded an approved, fully-compliant Regulation Z disclosure template for that vehicle.
*   **Safe Alternatives:**
    *   *"Low down payment options available"*
    *   *"Terms tailored to your paycheck schedule"*
    *   *"Ask about our budget-friendly programs"*

### Rule 3: Honest Down Payments (Anti-Bait-and-Switch)
*   **The Risk:** Advertising a vehicle at "$500 Down" when the actual down payment required based on the buyer's credit or the vehicle's cost ends up being higher violates FTC rules against bait-and-switch.
*   **The Rule:** Down payment values in copy templates or variables **MUST** match the manager-approved value in the inventory record exactly. If the `down_payment` field is null or empty, the AI must fallback to non-specific value claims.
*   **Safe Alternatives (Null Fallbacks):**
    *   *"Flexible down payments"*
    *   *"Down payment programs to fit your budget"*
    *   *"Ask about our monthly specials"*

### Rule 4: Paycheck Alignment & Starter Interrupt Disclosures
*   **The Risk:** If you require weekly payments and GPS/starter-interrupt installations, hiding this until the final signature can be flagged as an unfair trade practice.
*   **The Rule:** Be transparent about pay-cycle terms and collateral protection.
*   **Safe Copy Integrations:**
    *   *"Payments structured to align with your payday (weekly/bi-weekly)"*
    *   *"Vehicles are equipped with GPS protection for worry-free financing"*

### Rule 5: Spanish Language Advertising (Translations & Contracts)
*   **The Risk:** In many jurisdictions, if an advertisement or negotiation is conducted in Spanish, the dealer **MUST** provide the credit contract and TILA disclosures in Spanish as well. Providing Spanish ads but only English contracts violates ECOA and state-level fair lending acts.
*   **The Rule:** All generated Spanish copy must include a disclaimer warning the operator that native language advertising requires corresponding native language contracts and disclosures.
*   **Required Operator Warning (Visible on Export):**
    *   *"⚠️ NOTE: You are exporting Spanish advertising copy. Under state and federal laws, if you advertise or negotiate in Spanish, you must provide the credit contract, TILA disclosures, and buyers guides in Spanish. Ensure your dealership has these Spanish forms ready."*

---

## 3. The Compliance Parser (Post-Processing Rule Engine)

The GetGoGone generator runs all outputs through a deterministic compliance parser before rendering. It checks for banned terms and immediately flags or replaces them:

```
[Banned Input Detected] ──► [Compliance Parser] ──► [Replaced with Safe Option]
      "Guaranteed"              ---------->           "Income-Based"
      "100% Approved"           ---------->           "Flexible Guidelines"
      "No Credit Check"         ---------->           "No FICO Credit Required"
```

### Compliance Checklist for Approving Drafts:
1.  Is there a "Guarantee" claim? (Must be false)
2.  Is there a specific payment dollar amount without a disclosure? (Must be false)
3.  Is the down payment accurate to the inventory record? (Must be true)
4.  Is the language clean, respectful, and free of high-pressure sales jargon? (Must be true)
