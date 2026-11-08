# OMNI FOUNDATION: STRICT HIGH-FIDELITY DESIGN SYSTEM

**Version:** 3.0.0  
**Product:** Omni Core Software Foundation (Desktop, Web, Service, Storage)  
**Primary Visual Source of Truth:** [antislop.ai.id/install](https://antislop.ai.id/install)  
**Design Philosophy:** Strict High-Fidelity Console Hub Interface  
**Primary Theme:** Pitch Black Backdrop (`#000000`) with Frosted Glass Surfaces  
**Status:** Active Design Guidelines  

---

## 1. Reference Inspection & Visual Analysis

This document defines the exact measured visual design tokens, component specifications, and interaction geometry extracted directly from `https://antislop.ai.id/install` and its core stylesheet (`ps5-hub.css`).

Omni Foundation replicates this visual language with high fidelity:
- Zero generic SaaS dashboard patterns.
- Zero arbitrary or floating rectangular cards.
- Exact measured clamp scales for typography, padding, and layout bounds.
- Authentic interactive audio synthesis using Web Audio API.
- Full compliance with Anti-Slop mandatory rules (including strict Rule R-02: zero em dashes).

---

## 2. Color System & Exact Measured Tokens

### Canvas, Scrim & Atmospheric Lighting

| Token | Measured Value | Implementation |
|:---|:---|:---|
| `--ps-bg` | `#000000` | True pitch black base viewport canvas |
| `--ps-white` | `#ffffff` | Pure white for high-contrast active elements |
| Top Ambient Beam | `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255, 255, 255, 0.05), transparent 70%)` | Height 300px, 90% viewport width |
| Atmospheric Vignette | `radial-gradient(ellipse 95% 75% at 50% 32%, transparent 25%, rgba(3, 5, 8, 0.65) 80%), linear-gradient(180deg, rgba(3, 5, 8, 0.85) 0%, rgba(3, 5, 8, 0.12) 20%, rgba(3, 5, 8, 0.35) 55%, rgba(3, 5, 8, 0.95) 100%)` | Fullscreen fixed scrim |
| Glider Box Shadow | `0 0 10px rgba(255, 255, 255, 0.7), 0 0 2px rgba(255, 255, 255, 0.95)` | Active tab bottom glider |

### Frosted Glass Surfaces & Borders

| Surface Element | Background | Border | Box Shadow |
|:---|:---|:---|:---|
| Ribbon Tile (Base) | `#18181b` | `2px solid transparent` | `0 4px 16px rgba(0, 0, 0, 0.5)` |
| Ribbon Tile (Active) | `rgba(255, 255, 255, 0.10)` | `2px solid #ffffff` | `0 0 18px rgba(255, 255, 255, 0.4)` |
| Command Capsule (`form-pill-container`) | `rgba(255, 255, 255, 0.08)` (backdrop-filter: blur(18px)) | `1px solid rgba(255, 255, 255, 0.16)` | `0 10px 30px rgba(0, 0, 0, 0.35)` |
| Capsule (Focus / Hover) | `rgba(255, 255, 255, 0.11)` | `1px solid rgba(255, 255, 255, 0.45)` | `0 0 14px rgba(255, 255, 255, 0.18)` |
| Console Stream Card (`subpage-step-code-card`) | `rgba(14, 18, 24, 0.85)` | `1px solid rgba(255, 255, 255, 0.12)` | `0 8px 24px rgba(0, 0, 0, 0.45)` |
| Primary Pill Button (`ps5-btn-primary`) | `#ffffff` (hover: `#f2f2f7`, active: `#e4e4e7`) | None | `0 6px 18px rgba(0, 0, 0, 0.45)` |
| Secondary Button (`ps5-btn-secondary`) | `rgba(255, 255, 255, 0.08)` (hover: `rgba(255, 255, 255, 0.16)`) | `1px solid rgba(255, 255, 255, 0.18)` | None |
| Action Pill & Preset (`ps5-preset-btn`) | `rgba(255, 255, 255, 0.08)` (active: `#ffffff`, text: `#000000`) | `1px solid rgba(255, 255, 255, 0.16)` | active: `0 0 12px rgba(255, 255, 255, 0.35)` |
| Copy Circle Button (`btn-icon-copy`) | `rgba(255, 255, 255, 0.12)` (copied: `rgba(15, 80, 40, 0.55)`) | `1px solid rgba(255, 255, 255, 0.22)` | None |
| System Bar Pill (`ps5-sys-btn-pill`) | `rgba(255, 255, 255, 0.08)` (hover: `rgba(255, 255, 255, 0.16)`) | `1px solid rgba(255, 255, 255, 0.16)` | None |

### Text Colors

| Hierarchy | Color / Value | Usage |
|:---|:---|:---|
| Primary Headings & Active Tab | `#ffffff` | Title, active tab, affirmative buttons |
| Primary Body Copy | `rgba(255, 255, 255, 0.82)` | Descriptions, card text |
| Inactive Tab & Secondary Labels | `rgba(255, 255, 255, 0.45)` | Inactive hub tabs, category labels |
| Dim / Subtle Metadata | `rgba(255, 255, 255, 0.28)` | Timestamps, decorative separators |

---

## 3. Typography & Spacing Scale

### Font Family
- **Interface Font:** `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Font:** `ui-monospace, "SF Mono", Menlo, Consolas, monospace`

### Typography Hierarchy (Measured Clamp Values)

| Role | Font Size | Weight | Line Height | Letter Spacing |
|:---|:---:|:---:|:---:|:---:|
| Large Hero Title (`ps5-game-title`) | `clamp(30px, 4.2vw, 52px)` | 800 | 1.05 | `-0.02em` |
| Section Headline | `clamp(20px, 2.5vw, 28px)` | 700 | 1.20 | `-0.01em` |
| Topbar Hub Tab (`ps5-hub-tab`) | `clamp(16px, 1.35vw, 21px)` | 700 | 1.20 | `-0.01em` |
| Subpage Section Title | `clamp(17px, 1.4vw, 22px)` | 700 | 1.25 | `-0.01em` |
| Description Text (`ps5-game-desc`) | `clamp(13px, 0.95vw, 14.5px)` | 400 | 1.50 | `normal` |
| Primary Button Text | `clamp(14px, 1.05vw, 15px)` | 700 | 1.20 | `-0.01em` |
| Bottom Bar Text | `clamp(11.5px, 0.9vw, 12.5px)` | 500 | 1.20 | `0.02em` |
| Code Stream Pre | `12px` | 500 | 1.55 | `normal` |

---

## 4. Layout Geometry & Container Dimensions

Derived from `.ps5-app` and viewport boundaries:

- **Root Viewport Padding:** `padding: clamp(14px, 2.2vh, 26px) clamp(20px, 3.5vw, 54px)`
- **Top Bar Height:** `clamp(36px, 4.5vh, 44px)`
- **Content Max Width:** `1040px` centered on wide displays
- **Ribbon Track Gap:** `clamp(14px, 1.3vw, 18px)`
- **Ribbon Section Scroll Cushion:** `width: calc(100% + 56px); margin: 0 -28px -16px -28px; padding: 16px 28px 30px 28px;` (ensures hover scale and glow never clip at viewport or container edges)
- **Ribbon Tile Size:** `width: clamp(76px, 5.8vw, 86px); height: clamp(76px, 5.8vw, 86px); border-radius: 14px; overflow: visible;`
- **Command Capsule Width:** `max-width: 530px; width: 100%;`
- **Command Capsule Padding:** `padding: 5px 6px 5px 20px; border-radius: 999px;`
- **Primary Action Button:** `height: clamp(42px, 4.8vh, 48px); padding: 0 clamp(24px, 2.6vw, 34px); border-radius: 999px;`
- **Circular Icon Button (`btn-icon-copy`):** `width: 40px; height: 40px; border-radius: 999px;`

---

## 5. Component Specifications & Behavior

### 1. Topbar Navigation (`ps5-topbar`)
- Left: Brand identifier (OMNI FOUNDATION) with edition badge.
- Center / Main: Hub Tabs (`ps5-hub-tabs`) with gap `clamp(18px, 2vw, 30px)`.
- Active Tab Glider: Animated sliding indicator `height: 2.5px; background: #ffffff; border-radius: 999px;` with white glow.
- Right: System actions containing audio toggle button (`ps5-sound-toggle-btn`) and connection status pill.

### 2. Service Ribbon Carousel (`ps5-tiles-track`)
- Displays horizontal service units (Desktop Platform, Web Platform, Web Service, Web Storage).
- Uses `scroll-snap-type: x mandatory` with smooth momentum scroll behavior.
- Outer wrapper uses generous horizontal padding (`28px`) combined with matching negative margins (`-28px`) so that hover expansion (`scale(1.03)` / `scale(1.08)`) and multi-layer outer shadows (`box-shadow: 0 0 20px ...`) never clip against the left or right scroll container boundaries.
- Active tile scales up (`transform: translateY(-4px) scale(1.08)`) with a high-intensity white border and outer shadow.
- Audio Feedback: Selecting an inactive tile plays `nav.mp3` (`playNav()`); clicking an already active tile plays `enter.mp3` (`playEnter()`).

### 3. Frosted Glass Capsule Forms & Input Fields

#### A. Command Capsule (`form-pill-container`)
- Frosted glass background with `background: rgba(255, 255, 255, 0.08)` and `backdrop-filter: blur(18px)`.
- Displays the cryptographic pairing code or terminal command on the left with monospace styling.
- Houses the circular icon copy button (`.btn-icon-copy`) on the right.
- Visual state transitions smoothly on hover and focus with white glow `0 0 16px rgba(255, 255, 255, 0.18)`.

#### B. Integrated Console Action Form (`ps5-capsule-form`)
- Unified command capsule housing a terminal prefix (`$`, `>`, `ws://`, `rust>`), transparent text input, and embedded affirmative pill submit button.
- Geometry: `border-radius: 9999px; height: 50px; padding: 4px 6px 4px 18px;`.
- Interaction: Smooth focus-within lighting (`border-color: rgba(255, 255, 255, 0.42); background: rgba(255, 255, 255, 0.12); box-shadow: 0 0 16px rgba(255, 255, 255, 0.16);`).
- Integrated Submit Button (`.capsule-submit-btn`): Height 40px, spring scale on hover (`scale(1.05)`), tactile press (`scale(0.96)`).

#### C. Multi-Field Input Capsule Box (`ps5-capsule-input-box`)
- Used for structured form workflows (such as browser pairing input with separate challenge code).
- Accompanied by `.field-label` featuring a cyan indicator dot (`.field-label-dot`).
- Embedded prefix symbol (`$`, `#`) in monospace font for instant visual distinction.

### 4. Step Code Block (`subpage-step-code-card`)
- Dark translucent container for streaming WebSocket packets, audit logs, and paired messages.
- Rounded corners at `12px`.
- High legibility monospace formatting with distinct color tags for senders and timestamps.

### 5. Controller Action Bar (`ps5-bottom-bar`)
- Bottom dock displaying action prompts and keyboard shortcut hints (Enter to select, Esc to return, Tab to navigate).

---

## 6. Scratch Iconography & Visual Architecture Illustrations

### 6.1 Zero-Emoji Quality Enforcement
In strict compliance with Anti-Slop visual standards and PlayStation 5 UI fidelity:
- **Zero Emojis Permitted:** Under no circumstances are Unicode emojis allowed in any interface component, ribbon tile, status badge, code stream, or documentation. All visual indicators must use scratch vector SVGs.
- **Visual Uniformity:** All iconography must be rendered as clean, precision-crafted vector SVGs or scratch illustration schematics. Emojis produce OS-dependent styling, inconsistent color palettes, and degraded visual authority.

### 6.2 Scratch Vector Icon Specifications

All interface icons are constructed from scratch using standardized SVG geometry:
- **Default ViewBox:** `0 0 24 24`
- **Default Stroke:** `currentColor`
- **Default Fill:** `none`
- **Stroke Width:** `1.75px` to `2.0px`
- **Stroke Cap / Join:** `round`

#### 1. Desktop Host Platform (`IconDesktop`)
Represents the native Tauri v2 desktop runtime:
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
  <line x1="8" y1="21" x2="16" y2="21" />
  <line x1="12" y1="17" x2="12" y2="21" />
</svg>
```

#### 2. Web Client Platform (`IconWebClient`)
Represents remote browser instances and handheld client access:
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
  <line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2.5" />
</svg>
```

#### 3. Central Web Service Hub (`IconServiceHub`)
Represents the WebSocket session router and pairing authority on port 8080:
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="2" width="20" height="6" rx="2" />
  <rect x="2" y="10" width="20" height="6" rx="2" />
  <rect x="2" y="18" width="20" height="6" rx="2" />
  <line x1="6" y1="5" x2="6.01" y2="5" stroke-width="2.2" />
  <line x1="6" y1="13" x2="6.01" y2="13" stroke-width="2.2" />
  <line x1="6" y1="21" x2="6.01" y2="21" stroke-width="2.2" />
</svg>
```

#### 4. Web Storage CDN Vault (`IconStorageCDN`)
Represents the static media storage and path-protected file vault on port 9000:
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <ellipse cx="12" cy="5" rx="9" ry="3" />
  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
</svg>
```

#### 5. System Diagnostic Alert (`IconAlert`)
Replaces unstyled error icons with high-clarity warning geometry:
```svg
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  <line x1="12" y1="9" x2="12" y2="13" />
  <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2.5" />
</svg>
```

#### 6. Clipboard Interaction (`IconCopy` and `IconCheck`)
Provides instant tactile visual feedback for token and code copying:
```svg
<!-- Copy Trigger -->
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
</svg>

<!-- Copied Confirmation -->
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12" />
</svg>
```

### 6.3 Scratch Architectural Layout Illustrations

#### Viewport Layout Schema
```text
+-----------------------------------------------------------------------------------+
|  [OMNI FOUNDATION]     [Console]  [Hub Network]  [Security Token]    (SND) [ST:OK] |
|                               --- Sliding Glider ---                              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [IconDesktop]      [IconServiceHub]     [IconStorageCDN]     [IconWebClient]     |
|   Desktop Host         Web Service          Web Storage          Web Client       |
|  (Tauri Engine)        (Port 8080)          (Port 9000)        (Remote Client)    |
|   [ ACTIVE ]                                                                      |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  /omni                                                                            |
|  Omni Desktop Platform                                                            |
|  Host Device: Running Tauri 2.12 Native Shell                                     |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |  $  PAIR-7842-8921                                       [ Copy SVG Icon ]  |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  [ Primary Action Button ]       [ Secondary Switcher ]                           |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|  +-- Streaming WebSocket Packet Matrix ----------------------------------------+  |
|  | [14:22:01] <SYS> WebSocket connection established to ws://127.0.0.1:8080   |  |
|  | [14:22:03] <HUB> Generated session token for pair code PAIR-7842-8921      |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
|  (Enter) Select    (Esc) Return    (Tab) Switch Hub     (Space) Trigger Audio     |
+-----------------------------------------------------------------------------------+
```

#### Layer Elevation & Surface Geometry Schema
```text
Z-Index Level      Surface Element                     Effect / Backdrop Filter
-----------------------------------------------------------------------------------
z-index: 1000      .ps5-boot-screen (Startup Curtain)  Pitch black #000000 + Logo Fade
z-index: 100       .ps5-topbar                         Fixed sticky, blur(12px)
z-index: 50        .ps5-tile.active (Highlighted)      Scale(1.08), Glow 0 0 20px
z-index: 20        .form-pill-container                Glass blur(18px), border rgba(255)
z-index: 10        .subpage-step-code-card             Solid dark rgba(14, 18, 24, 0.85)
z-index: 1         .ps5-vignette                       Radial vignette + gradient scrim
z-index: 0         canvas base                         #000000 true pitch black
```

---

## 7. PlayStation 5 UI Sound Architecture

The sound system reproduces the authentic PlayStation 5 console interactive audio experience extracted directly from the reference website:

### 6.1 Audio Assets & Sound Specifications

All audio cues utilize authentic sampled console assets delivered via dual-pipeline architecture (in-memory Base64 decoding via Web Audio API with static asset fallback in `/assets/sounds/`):

1. **PS5 Startup Chime (`ps5-startup.mp3`):**
   - File: `/assets/sounds/ps5-startup.mp3` (273 KB)
   - Usage: Authentic PS5 initial boot sequence and console activation.
   - Volume: `0.80`
   - Trigger: Initial application mount and boot screen completion.

2. **Navigation Tick (`nav.mp3` / `SOUND_B64_NAV`):**
   - File: `/assets/sounds/nav.mp3` (15.7 KB)
   - Usage: Ribbon carousel tile selection, switching active tiles, and interactive navigation.
   - Volume: `0.72`
   - Trigger: Selecting an inactive ribbon tile, keyboard tab traversal.

3. **Confirm & Select (`enter.mp3` / `SOUND_B64_ENTER`):**
   - File: `/assets/sounds/enter.mp3` (30.1 KB)
   - Usage: Primary actions, clicking an already active ribbon tile, form submissions, and modal opens.
   - Volume: `0.78`
   - Trigger: Clicking an active tile, submitting forms, or pressing Enter on selected actions.

4. **Back & Return (`back.mp3` / `SOUND_B64_BACK`):**
   - File: `/assets/sounds/back.mp3` (36.4 KB)
   - Usage: Circle button return, modal close, canceling selection, and disconnecting session.
   - Volume: `0.78`
   - Trigger: Disconnecting paired session, closing panels, or pressing Esc.

5. **Hub Tab Switch (`tab_hub.mp3` / `SOUND_B64_HUB`):**
   - File: `/assets/sounds/tab_hub.mp3` (33.3 KB)
   - Usage: L1 / R1 bumper tab switching between main console sections.
   - Volume: `0.72`
   - Trigger: Changing between Console, Hub Network, and Security Token tabs.

6. **Action Confirmation (`click-clipboard.mp3` / `SOUND_B64_COPY`):**
   - File: `/assets/sounds/click-clipboard.mp3` (4.65 KB)
   - Usage: High-clarity feedback chime for clipboard copy and token export.
   - Volume: `0.85`
   - Trigger: Clicking the copy button inside the command capsule (`.btn-icon-copy`).

7. **Sub-Tab Badge (`badge.mp3` / `SOUND_B64_BADGE`):**
   - File: `/assets/sounds/badge.mp3` or soft 740Hz -> 520Hz sine sweep (50ms).
   - Usage: Minor badge toggles and sub-filters.
   - Volume: `0.08`

### 7.2 Playback Pipeline & Performance Rules

- **Zero-Latency In-Memory Buffers:** Base64 encoded audio strings are decoded into `AudioBuffer` objects on initial user gesture or idle callback (`requestIdleCallback`), ensuring sounds play with zero network round-trip.
- **HTML5 Audio Fallback:** Secondary audio pipeline resolves to `/assets/sounds/*.mp3` if Web Audio API decoding is interrupted.
- **Audio Context Unlock:** Automatically listens for first pointer, key, or touch interactions (`pointerdown`, `keydown`, `touchstart`) to resume suspended browser `AudioContext`.
- **Persistent State:** Audio mute/unmute state is persisted in `localStorage` under key `omni_sound_enabled`. Toggle button updates both the audio state and UI icon dynamically.

---

## 8. Motion & Easing Curves

```css
--ease-ps: cubic-bezier(0.16, 1, 0.3, 1);       /* Smooth console deceleration */
--ease-spring: cubic-bezier(0.34, 1.25, 0.64, 1); /* Spring bounce for interactive buttons */
--ease-tile: cubic-bezier(0.2, 0.8, 0.25, 1);    /* Fluid horizontal scroll momentum */
```

- Glider sliding timing: `0.32s cubic-bezier(0.2, 0.9, 0.2, 1)`.
- Button scale interaction: `transform: scale(1.06)` hover, `scale(0.96)` active.
- Reduced motion support: all transition times drop to `0.01ms` when `prefers-reduced-motion` is active.

---

## 9. Responsive Breakpoints

Exact breakpoints inspected from `ps5-hub.css`:

- **Desktop (min-width: 1025px):** Full horizontal ribbon layout, fixed topbar, centered 1040px max content container.
- **Laptop / Compact Desktop (max-width: 1024px):** Fluid clamp scaling for headers and tile tracks.
- **Tablet (max-width: 880px):** Mobile layout mode activated, ribbon tiles scroll horizontally via touch momentum.
- **Phone (max-width: 480px):**
  - Root padding reduced to `12px`.
  - Tile dimensions adjust to `66px x 66px`.
  - Title size scales to `clamp(24px, 7.5vw, 30px)`.
  - Pill input container height adjusts to `48px`.
  - Bottom action bar hidden.
- **Ultra-Compact (max-width: 340px):** Text wrap margins adjusted to prevent layout shifts.

---

## 10. Quality Verification Checklist

Every UI update must satisfy:
- [ ] Root canvas uses `#000000` with the atmospheric vignette scrim.
- [ ] Typography uses Google Font `Plus Jakarta Sans`.
- [ ] Command inputs use the `.form-pill-container` capsule geometry.
- [ ] Zero emojis used: all icons and graphics rendered as scratch vector SVGs or illustrations.
- [ ] Web Audio procedural sounds trigger on navigation, tab switch, enter, and copy.
- [ ] Sound toggle button in the topbar functions and persists state in `localStorage`.
- [ ] Zero horizontal overflow on mobile viewports down to 340px.
- [ ] Strict compliance with Rule R-02 (zero em dashes in text, comments, or documentation).
- [ ] Zero TypeScript or bundler errors across all packages.
