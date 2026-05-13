---
name: SkillSwap
description: Peer-to-peer skill exchange — teach what you know, learn what you want.
colors:
  deep-ink-blue: "#1F4E79"
  deep-ink-blue-light: "#2E75B6"
  deep-ink-blue-dark: "#163a5c"
  reciprocity-green: "#00C9A7"
  reciprocity-green-light: "#00e6bf"
  near-white-bg: "#F8F9FA"
  card-white: "#FFFFFF"
  deep-ink-text: "#1a1a2e"
  muted-grey: "#6b7280"
  border-grey: "#e5e7eb"
  success-green: "#10b981"
  caution-amber: "#f59e0b"
  alert-red: "#ef4444"
typography:
  display:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "1.8rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "'DM Sans', -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "'DM Sans', -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'DM Sans', -apple-system, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  pill: "50px"
  card: "12px"
  sm: "8px"
  avatar: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.deep-ink-blue}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.deep-ink-blue-dark}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-accent:
    backgroundColor: "{colors.reciprocity-green}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.deep-ink-blue}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted-grey}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  chip-default:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-ink-text}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  chip-active:
    backgroundColor: "{colors.deep-ink-blue}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-ink-text}"
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: SkillSwap

## 1. Overview

**Creative North Star: "The Community Bulletin Board"**

SkillSwap should feel like a physical bulletin board that someone who genuinely cared — not a committee, not a growth team — put up in a university corridor. Posts are written by real people for real people. The board's material shows through; there is warmth in its organisation, and clarity in its layout. A student scans it between classes; they are not sold to.

The system is restrained by principle, not by accident. Deep Ink Blue anchors navigation, headings, and primary actions — the things that orient the eye. Reciprocity Green appears at exchange-positive moments only: a skill on offer, a session confirmed. Everything else steps back. The near-white background, quiet grey borders, and readable DM Sans body text exist to make the content — real people and real skills — the loudest thing on screen.

The theme is unambiguously light. The scene: a student scanning available skill listings on their phone during a lunch break in a campus café, mid-morning light through the window. Daytime, warm ambient, phone in one hand. Dark mode would contradict the North Star entirely. This system rejects the Fiverr / Upwork energy of transactional exchanges, hustle-culture urgency, and ranked-provider leaderboards. SkillSwap is a peer meeting a peer; the design must feel like that at every touchpoint.

**Key Characteristics:**
- Light-mode surface; daylight reading context; no dark variant
- Restrained colour palette: one primary, one reserved accent, near-white canvas
- Serif display type (Playfair Display) at gateway and hero entry points only; DM Sans governs the product flow
- Structural shadow: surfaces are flat at rest, elevated on interaction or float
- Mobile-first navigation; bottom nav is the primary wayfinding surface
- Warm without being twee; functional without being cold

## 2. Colors: The Ink and Exchange Palette

Two intentional colours work against a near-white field. Everything else is neutral.

### Primary
- **Deep Ink Blue** (#1F4E79): The system's anchor. Navigation, headings, primary CTAs, active states, avatar backgrounds. Used at full weight for trust signals; at 6% opacity (`rgba(31,78,121,0.06)`) for hover backgrounds; as a tinting agent in shadow values. Confident without being aggressive.
- **Deep Ink Blue Light** (#2E75B6): Border tones, avatar rings, input focus borders, and link tones in secondary contexts.
- **Deep Ink Blue Dark** (#163a5c): Hover state of the primary button. Deep headings in high-contrast contexts.

### Secondary
- **Reciprocity Green** (#00C9A7): Reserved exclusively for exchange-positive moments — skill offered badges, confirmed sessions, positive status indicators, the accent button variant. Its brightness is its signal. Rarity is the mechanism.
- **Reciprocity Green Light** (#00e6bf): Hover variant of the accent button only.

### Neutral
- **Near-White Background** (#F8F9FA): The canvas. Almost white, barely warm. Every page sits on this.
- **Card White** (#FFFFFF): Cards sit 1 tone above the background. No shadow at rest; their background creates the separation.
- **Border Grey** (#e5e7eb): Structural dividers. Quiet, never decorative.
- **Deep Ink Text** (#1a1a2e): Body text with a deliberate navy tint. Not pure black; reads as ink on paper.
- **Muted Grey** (#6b7280): Secondary text, metadata, placeholders, ghost button colour.

### Semantic
- **Success Green** (#10b981): Confirmed and completed states only.
- **Caution Amber** (#f59e0b): Warnings, star rating fills.
- **Alert Red** (#ef4444): Errors, danger-action buttons, unread notification badges.

### Named Rules
**The Reciprocity Rule.** Reciprocity Green (#00C9A7) is reserved for exchange-positive contexts: skill-offered badges, confirmed session status, the accent button on exchange-initiating actions. Using it for generic decoration drains its signal. Every appearance of this colour should mean "something good is available for you."

**The One Primary Rule.** Deep Ink Blue carries all primary interactive weight. Do not introduce a third accent hue. If an element needs emphasis, reach for Deep Ink Blue tints or typographic weight — not a new colour.

## 3. Typography: The Scholar's Pairing

**Display Font:** Playfair Display (Georgia, serif)
**Body Font:** DM Sans (-apple-system, BlinkMacSystemFont, sans-serif)

**Character:** The pairing holds a specific tension: editorial warmth at the entry points (auth headline, homepage hero), functional clarity inside the product flow. Playfair Display signals moments worth pausing at. DM Sans carries the rest — approachable, legible at small sizes on phone screens, free of fussiness.

### Hierarchy
- **Display** (Playfair Display, 700, clamp(2rem, 5vw, 2.5rem), line-height 1.2): Homepage hero headline only. The brand's voice at maximum volume. Appears once per session view.
- **Headline** (Playfair Display, 700, 1.8rem, line-height 1.25): Auth page heading — "Welcome Back" / "Join SkillSwap". Gateway moments only; nowhere inside the authenticated product.
- **Title** (DM Sans, 700, 1.5rem, line-height 1.35): Page-level headings inside the app. Profile name, page header h1.
- **Body** (DM Sans, 400, 1rem, line-height 1.6): All primary content. Caps at 65–75ch in reading contexts (profile bio, skill descriptions).
- **Label** (DM Sans, 500, 0.82–0.88rem, line-height 1.4): Badge text, form labels, metadata, bottom nav labels, card micro-copy. Never Playfair at this scale.

### Named Rules
**The Serif Gateway Rule.** Playfair Display appears only at entry points: the homepage hero and the auth card heading. Inside the authenticated product — sessions, messages, profile, search — DM Sans governs everything. A Playfair headline inside a session card would be a category error.

**The Sentence-Case Rule.** Category and level enum values (PROGRAMMING, DESIGN, BEGINNER) are stored as uppercase strings in the database. In display, they must be sentence-cased: "Programming", "Design", "Beginner". Uppercase labels read as a system artifact, not a design choice.

## 4. Elevation: Flat by Default, Lifted by State

SkillSwap uses structural shadows — purposeful, not decorative. Every surface begins flat. Shadow appears when a surface rises in response to user interaction or when a surface genuinely floats above the page.

### Shadow Vocabulary
- **Subtle ambient** (`0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`): Available for persistent floating surfaces and non-interactive cards that need the lightest possible separation.
- **Card hover lift** (`0 10px 40px rgba(31,78,121,0.12)`): Applied on card `:hover`. Tinted toward Deep Ink Blue — the shadow belongs to the palette.
- **Gateway elevation** (`0 25px 60px rgba(0,0,0,0.15)`): The auth card only. The one surface that is always fully elevated; it is the gateway to the product.
- **Float layer** (`0 8px 32px rgba(0,0,0,0.12)`): Notification dropdowns, tooltips, and any absolutely-positioned panel.

### Named Rules
**The Flat-By-Default Rule.** Cards, list items, and containers sit on the same plane as the page at rest. Shadow is a response to state (hover, focus, float) — never a decorative background texture.

**The Tinted Shadow Rule.** Deep shadows use `rgba(31,78,121,...)` tinted toward Deep Ink Blue rather than pure black `rgba(0,0,0,...)`. This keeps depth inside the palette and prevents shadows from feeling disconnected from the brand.

## 5. Components

### Buttons
Gently rounded (8px, `--radius-sm`). Not pill; not square. Weight and colour vary by role; shape is consistent.

- **Primary:** Deep Ink Blue (#1F4E79) fill, white text, 10px 20px padding. Hover: shifts to Dark variant (#163a5c), lifts 1px (`translateY(-1px)`), card-hover shadow appears. The dominant CTA.
- **Accent:** Reciprocity Green (#00C9A7) fill, white text. Used for skill-offering affirmations and exchange-initiating moments only. Not for navigation or generic confirmation.
- **Outline:** Transparent fill, 1.5px Deep Ink Blue border and text. Hover: fills with primary. Used for secondary CTAs alongside a primary button.
- **Ghost:** Transparent fill, muted grey text. Hover: near-white background, text shifts to body text colour. Used for Logout and any destructive low-priority action.
- **Danger:** Alert Red (#ef4444) fill. Destructive actions only (delete, cancel session).
- **Size variants:** sm (6px 14px, 0.82rem), default (10px 20px, 0.9rem), lg (14px 28px, 1rem).

### Chips / Filter Pills
Full pill (50px radius). 1.5px Border Grey stroke, white background in default state. On active: fills with Deep Ink Blue, border disappears. Transition: 0.2s all. Used exclusively for category filtering. Only one chip active at a time per filter group.

### Cards / Containers
- **Corner style:** Gently rounded (12px, `--radius`).
- **Background:** Card White (#FFFFFF).
- **Shadow:** None at rest. Card-hover shadow on `:hover`, border becomes transparent.
- **Border:** 1px Border Grey (#e5e7eb) at rest.
- **Padding:** 20px consistently.

**Inconsistency to resolve:** ProfilePage.jsx renders its profile and skills card with `rounded-2xl` (Tailwind, 16px) and `border-gray-100` (lighter than `--border`). These deviate from the card token. The profile card should use `border-radius: 12px` and `border: 1px solid #e5e7eb` to match the system.

### Skill Cards (Signature Component)
The primary content unit of the product. Structured vertically:
1. **Header row:** 48px circular avatar (Deep Ink Blue fill, white initial, or photo) + provider name (0.95rem, 600) + city (0.82rem, muted grey)
2. **Skill title:** 1.1rem, 700, Deep Ink Blue Dark
3. **Description excerpt:** 0.88rem, muted grey, line-height 1.5, 2-line clamp
4. **Footer row:** Category badge (blue-tinted pill) + Level badge (green-tinted pill) + star rating (amber, 0.88rem)

Gap between rows: 12px. Card hover lifts the whole unit. Cursor: pointer.

### Inputs / Fields
- **Default:** White background, 1.5px Border Grey, 8px radius, 10px 14px padding.
- **Focus:** Border shifts to Deep Ink Blue Light (#2E75B6), box-shadow `0 0 0 3px rgba(46,117,182,0.1)`.
- **Search bar exception:** 50px pill radius — the only pill-shaped input in the system. Its shape signals "search" distinctly from form fields.
- **Error state:** Not currently defined. Recommended: border shifts to Alert Red (#ef4444), box-shadow `0 0 0 3px rgba(239,68,68,0.1)`.
- **Disabled state:** Not currently defined. Recommended: `opacity: 0.5`, `cursor: not-allowed`, background shifts to near-white.

### Navigation (Desktop)
Sticky top bar, 64px height. `backdrop-filter: blur(12px)` at 92% white opacity prevents content bleed-through on scroll — functional, not decorative. Brand logo + wordmark (Deep Ink Blue, 700, 1.25rem) left; nav links centre; notification bell + display name + avatar + logout right.

Active link treatment: Deep Ink Blue text + `rgba(31,78,121,0.06)` background, 8px radius. No underlines. Hover uses the same background without the text colour shift.

### Navigation (Mobile — Bottom Nav)
Fixed bottom bar, white, 1px border-top. 5 items stacked as icon (24px stroke icon) + label (0.7rem, 500). Active: Deep Ink Blue stroke and text. No filled icons. Padding respects `safe-area-inset-bottom` for notched devices. This is the primary navigation surface; desktop nav is secondary.

### Badges
Pill shape (20px radius), 4px 10px padding, 0.78rem, 600.
- **Category:** 8% Deep Ink Blue background (`rgba(31,78,121,0.08)`), Deep Ink Blue text.
- **Level:** 10% Reciprocity Green background (`rgba(0,201,167,0.10)`), dark green text (#059669). Also expressed in ProfilePage as Tailwind classes (purple/blue/green per level) — this second implementation should be removed and unified to the CSS token approach.
- **Session status:** Requested (amber tint, `#fef3c7` / `#b45309`), Confirmed (green tint, `#d1fae5` / `#047857`), Completed (blue tint, `#dbeafe` / `#1e40af`), Cancelled (red tint, `#fee2e2` / `#b91c1c`).

### Modals
White card, 12px radius, 32px padding, max 500px wide, max 90vh with overflow scroll. Overlay: `rgba(0,0,0,0.5)`. No shadow on the modal card — the overlay provides the separation. Dismiss: click outside or explicit close button (✕ with `:hover` colour shift to Alert Red).

**The Modal-as-Last-Resort Rule.** Modals are currently used for "Add skill" — acceptable since the form is genuinely modal in nature (you must complete it before returning to context). Don't expand modal use to confirmations, filters, or any flow that could be done inline or as a full page on mobile.

## 6. Do's and Don'ts

### Do:
- **Do** use Reciprocity Green (#00C9A7) exclusively for exchange-positive moments: skill-offered indicators, confirmed session badges, accent CTAs on exchange-initiating actions.
- **Do** keep card surfaces flat at rest. The 1px border is sufficient separation. Shadow is earned on hover.
- **Do** use Playfair Display only at the homepage hero and the auth card heading. DM Sans governs everything inside the authenticated product.
- **Do** sentence-case all enum values in display: "Programming" not "PROGRAMMING", "Beginner" not "BEGINNER".
- **Do** tint deep shadows toward Deep Ink Blue (`rgba(31,78,121,...)`) rather than pure black.
- **Do** use the pill radius (50px) only for the search bar and filter chips. Cards: 12px. Buttons and inputs: 8px. Avatars: 50%.
- **Do** cap body text at 65–75ch in reading contexts (bio, skill description, message bubbles).
- **Do** use the CSS custom property system (`var(--primary)`, `var(--radius)`, etc.) for all components, not raw Tailwind colour classes. Both systems currently coexist; new work must use the token system.
- **Do** respect `prefers-reduced-motion`: wrap `transition` and `transform` declarations in `@media (prefers-reduced-motion: no-preference)`.

### Don't:
- **Don't** use Fiverr / Upwork patterns: no "hire now" CTAs, no provider tier badges, no ranking leaderboards that reduce people to a score, no transaction-framing language.
- **Don't** use gradient text (`background-clip: text` with a gradient). Use a single solid colour. Weight and size carry emphasis.
- **Don't** replicate the auth page gradient (`linear-gradient(135deg, #1F4E79, #2E75B6, #00C9A7)`) inside the product. It belongs to the gateway surface only.
- **Don't** use glassmorphism decoratively. The navbar `backdrop-filter: blur(12px)` is functional — it prevents content bleed on scroll. Don't extend this treatment to cards, modals, or other containers.
- **Don't** introduce a third accent colour. Deep Ink Blue + Reciprocity Green is the palette. Additional hues dilute both.
- **Don't** use `border-left` or `border-right` greater than 1px as a coloured accent stripe on cards, list items, alerts, or callouts. Use background tints, leading icons, or full borders instead.
- **Don't** render nested cards. A card inside a card is always wrong. Skill items inside the Profile skills card are correctly rendered as `<li>` list items — don't promote them to cards.
- **Don't** build a dark mode. The Community Bulletin Board metaphor is a daytime surface. A dark variant would contradict the North Star without a distinct design rationale to justify it.
- **Don't** use raw Tailwind colour classes (`text-gray-900`, `bg-blue-600`, `border-gray-200`) on new components. These bypass the token system and create a second source of truth for colour values.
