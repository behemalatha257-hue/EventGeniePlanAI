# Accessibility (A11y) Statement & Guidelines - EventGeniePlan AI

EventGeniePlan AI is built in conformance with the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** standards to ensure an inclusive, barrier-free experience for event planners and guests with diverse abilities.

---

## 1. Accessibility Features Implemented

### A. Color Contrast & Visual Design
- **High Contrast Palette:** In both Midnight Luxury (dark mode) and Daylight Crisp (light mode), all text elements maintain a minimum contrast ratio of **4.5:1** against their background for standard body text, and **3:1** for large headings and icons.
- **Color Independence:** Information is never conveyed by color alone. Overruns, friction conflicts, and status tags are accompanied by explicit text labels (e.g., `⚠️ Overrun Detected`, `🚨 Active Clash`, `✔ Adopted`) and distinct SVG icons.

### B. Keyboard Navigation & Focus Management
- **Full Keyboard Operability:** All interactive components (navigation tabs, quick prompt chips, contract sample selectors, date pickers, drag-and-drop actions) can be operated via standard keyboard controls (`Tab`, `Shift+Tab`, `Enter`, `Space`).
- **Visible Focus Indicator:** Interactive elements have a distinct 2px outline focus ring (`outline: 2px solid var(--accent-purple); outline-offset: 2px`).

### C. Screen Reader & ARIA Support
- **Semantic HTML5:** Native landmark elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<aside>`) provide clear page structure.
- **ARIA Roles & Attributes:**
  - Tab navigation uses `role="tablist"`, `role="tab"`, and `aria-selected="true/false"`.
  - Dynamic content updates (live countdown, AI chat history, toast messages) utilize `aria-live="polite"` so screen readers announce incoming messages without interrupting the user.
  - Interactive checkboxes implement `role="checkbox"` and `aria-checked="true/false"`.
  - Form fields and textareas have explicit programmatic `<label>` associations.

---

## 2. Keyboard Navigation Shortcut Map

| Key Combination | Action |
| :--- | :--- |
| `Tab` | Move to next interactive element |
| `Shift + Tab` | Move to previous interactive element |
| `Enter` | Activate button, select tab, or send chat message |
| `Space` | Toggle milestone checkbox or green swap adoption |
| `Esc` | Dismiss modal alerts or unfocus active inputs |
