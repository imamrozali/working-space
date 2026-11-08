---
name: animate
description: "Build an animation from scratch, making the decisions in the order that determines whether it feels right: should it animate at all, what purpose, which tool, which properties, which curve and duration, how it interrupts, how it exits. Writes production-ready implementation following Emil Kowalski's animation engineering principles. Use when asked to animate something, add motion, make a component feel alive, or build a transition."
---

# Animate: UI Motion Engineering Skill

This skill enforces strict design-engineering standards for building user interface animations. It stops AI models from guessing curves, adding sluggish motion, or animating layout-thrashing properties.

Knowledge source: Emil Kowalski's animation philosophy (from skills.sh / `emilkowalski/skills`).

---

## Operating Posture

Act as a senior design engineer. When asked to animate a component:
- Never present animation options as an arbitrary menu: make the definitive call, state the reasoning in one concise sentence, and write the code.
- Declining to animate an unnecessary element is a success. If motion would degrade usability, explain why and decline.
- Follow the sequence in order. Do not pick a curve before knowing whether the element should animate at all.
- Comply with Anti-Slop Rule R-02: never use em dashes in code, comments, or documentation.

---

## The 6-Step Decision Sequence

### Step 1: The Gate (Should it animate at all?)
Evaluate the interaction frequency and context before writing any CSS or motion code:
- **High-Frequency Actions:** Actions performed dozens or hundreds of times per day (e.g. text inputs, command palette toggles, list row navigation) should **NOT** have entrance/exit animations. Motion here creates friction.
- **Keyboard Shortcuts:** Keyboard-initiated triggers should snap instantly. Do not animate windows or dropdowns when triggered by power users via hotkeys.
- **Touch / Mobile:** Avoid hover transitions on touch-only devices. Wrap hover rules in `@media (hover: hover) and (pointer: fine)`.

### Step 2: Named Purpose
Every animation must have an explicit, defendable purpose. If you cannot name one, do not animate:
1. **Feedback:** Acknowledging user interaction (e.g. button press scale down, toggle switch flick).
2. **Spatial Consistency:** Connecting where an element came from and where it went (e.g. accordion expanding, modal sliding from trigger).
3. **State Indication:** Showing active vs inactive, loading vs ready.
4. **Preventing Jarring Change:** Smoothing layout reflows when items are added or deleted.
5. **Delight:** Reserved for rare, high-value moments (e.g. celebration on task completion). Never used on standard navigation.

### Step 3: Tool Selection (Cheapest that works)
Walk down this hierarchy and stop at the first tool that satisfies the requirement:
1. **CSS Transitions:** Best for hover, active states, focus rings, and opacity/transform toggles.
2. **`@starting-style` + CSS Transitions:** Best for popovers, dialogs, and native enter/exit transitions without JavaScript.
3. **CSS Keyframe Animations:** Best for looping spinners or multi-step declarative sequences.
4. **Web Animations API (WAAPI):** Best for dynamic values calculated at runtime in JavaScript.
5. **Motion Libraries (e.g. motion.dev, framer-motion):** Best for gesture-driven drag-to-dismiss, physics-based springs, and complex layout transitions.

### Step 4: Safe Properties & Geometry
- **GPU-Only Properties:** Only animate `transform` and `opacity`. These run on the compositor thread and never trigger layout or paint cycles.
- **FORBIDDEN Properties:** Never animate `width`, `height`, `top`, `left`, `right`, `bottom`, `margin`, or `padding`. Use scale, translate, or CSS grid interpolation (`grid-template-rows: 0fr` to `1fr`) instead.
- **Entrance Scaling:** Never scale from `0` (`scale(0)`). Scaling from zero looks cartoonish and jarring. Instead, use soft scaling from `0.92` to `0.97` paired with `opacity: 0` to `1`.
- **Transform Origin:** Set the `transform-origin` to match the anchor of the component (e.g. `transform-origin: top center` for dropdown menus).

### Step 5: Easing and Duration Scales
- **UI Duration Ceiling:** Keep standard interface transitions fast: **150ms to 280ms**. Animations longer than 300ms feel sluggish.
- **Never Use `ease-in` on Entrances:** `ease-in` starts with zero velocity, making UI elements feel unresponsive and delayed.
- **Entrance Curves:** Use snappy ease-out curves with strong initial deceleration:
  - Snappy UI Decel: `cubic-bezier(0.16, 1, 0.3, 1)` (PS5 / Apple standard)
  - Quick Enter: `cubic-bezier(0, 0, 0.2, 1)` or `cubic-bezier(0.23, 1, 0.32, 1)`
  - Exit Transitions: Keep exits faster than entrances (e.g. enter 220ms, exit 150ms with `cubic-bezier(0.4, 0, 1, 1)`).
- **Spring Physics:** When using springs, prefer high stiffness and critical damping:
  - Snappy: `stiffness: 400, damping: 30`
  - Gentle: `stiffness: 250, damping: 25`

### Step 6: Interruption & Accessibility
- **Interruption Safety:** Rapid clicks or gesture releases must not restart keyframe animations from the beginning. Transitions and physics springs naturally retarget from the current state.
- **Reduced Motion:** Always include accessibility fallbacks:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

---

## Reference Recipes

For specific component implementations (Button Press, Dropdown, Modal, Toast, Stagger, Tab Indicator), inspect and reference `RECIPES.md`.

