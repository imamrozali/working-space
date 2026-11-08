# UI Motion Recipes Reference

Production-ready animation implementations conforming to Emil Kowalski's animation engineering guidelines.

---

## 1. Micro-Feedback: Button Tactile Press

```css
.btn-tactile {
  transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease;
  will-change: transform;
}

@media (hover: hover) and (pointer: fine) {
  .btn-tactile:hover {
    transform: translateY(-1px);
  }
}

.btn-tactile:active {
  transform: scale(0.97);
  transition-duration: 0.06s;
}
```

---

## 2. Dropdown / Popover Menu (Modern CSS `@starting-style`)

Anchored from top with subtle scale (`0.95` to `1`) and quick deceleration:

```css
.popover-menu {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
  transform-origin: top center;
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
              display 0.18s allow-discrete;
  display: none;
}

.popover-menu[open],
.popover-menu.is-active {
  display: block;
  opacity: 1;
  transform: scale(1) translateY(0);
}

@starting-style {
  .popover-menu[open],
  .popover-menu.is-active {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
}
```

---

## 3. Modal / Dialog Dialog Overlay & Card

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  transition: opacity 0.22s ease-out;
}

.modal-content {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal.is-open .modal-content {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Exit state: faster and sharp */
.modal.is-closing .modal-content {
  opacity: 0;
  transform: scale(0.96) translateY(4px);
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}
```

---

## 4. Accordion Expand / Collapse (GPU / Grid Interpolation)

Avoids animating `height: auto` by utilizing CSS Grid row sizing:

```css
.accordion-item {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.accordion-item.is-expanded {
  grid-template-rows: 1fr;
}

.accordion-inner {
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.2s ease-out;
}

.accordion-item.is-expanded .accordion-inner {
  opacity: 1;
}
```

---

## 5. Toast Notification (Slide & Fade with Interruption Handling)

```css
.toast-item {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-item.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.toast-item.is-dismissing {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
  transition: opacity 0.15s ease, transform 0.15s ease;
}
```

---

## 6. Sliding Tab Glider

Hardware-accelerated sliding indicator:

```css
.tab-glider {
  position: absolute;
  bottom: 0;
  height: 2.5px;
  background: #ffffff;
  border-radius: 9999px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              width 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, width;
}
```

---

## 7. Staggered List Entrance

Limit stagger delay to maximum 30-40ms per child, capping at 5-6 items so the list feels snappy:

```css
.list-item {
  opacity: 0;
  transform: translateY(6px);
  animation: itemEntrance 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.list-item:nth-child(1) { animation-delay: 0.02s; }
.list-item:nth-child(2) { animation-delay: 0.05s; }
.list-item:nth-child(3) { animation-delay: 0.08s; }
.list-item:nth-child(4) { animation-delay: 0.11s; }
.list-item:nth-child(5) { animation-delay: 0.14s; }

@keyframes itemEntrance {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

