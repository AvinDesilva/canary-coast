---
name: canary-coast-design
description: Editorial Minimalism + High-Contrast Fintech aesthetic. Swiss Style typography, magazine-inspired asymmetrical layouts, bold color blocking, and sharp geometric forms. Root in data visualization and cartography. Avoids AI slop, soft shadows, and generic SaaS aesthetics. Tailored for Harris County projects, mapping apps, and data-heavy UIs.
license: Canary Coast Project
---

# Canary Coast Design System: Editorial Minimalism + High-Contrast Fintech

A sophisticated design language rooted in **Swiss Style graphic design** and **modern magazine layouts**, optimized for data-heavy applications, cartography, and fintech products. This system rejects "AI Slop" and "Generic SaaS" aesthetics in favor of **bold color blocking, oversized typography, sharp borders, and asymmetrical composition**.

**Use this skill when:**
- Building map-based applications with environmental or financial data overlays
- Creating dashboards that prioritize data as visual art (oversized metrics, tight typography)
- Designing financial or risk assessment UIs that need bold, legible aesthetics
- Developing interfaces that blend magazine-style editorial layout with technical precision
- Working on projects emphasizing sharp contrast, minimalism, and geographic/spatial narrative
- Implementing fintech-adjacent designs that reject pastel palettes and rounded corners

---

## 1. Design Philosophy

### Core Principles
- **Data is Art:** Oversized numerals and metrics are the focal point. Typography hierarchy must shock and delight.
- **Editorial Logic:** Think magazine masthead, not SaaS dashboard. Asymmetry, generous white space, and unexpected composition drive engagement.
- **Geographic Framing:** Use stark containers, pill-shaped crops for imagery, and perfect circles for status indicators. Emphasize spatial relationships.
- **Neo-Brutalism:** Heavy 2px borders, hard-edged depth, and flat planes (no soft shadows). Maximum legibility and visual punch.
- **No Timidity:** Bold color blocking over gradients. Saturated, high-contrast accents. Every element must earn its place.

### What Gets Rejected
- ❌ Inter, Roboto, Arial, system fonts
- ❌ Purple gradients, pastel color schemes, soft rounded corners (except full pills)
- ❌ Centered symmetric grids, predictable card layouts, generic SaaS patterns
- ❌ Soft shadows, subtle colors, timid hierarchy
- ❌ Generic micro-interactions without purpose

---

## 2. Color Palette (Saturated Monochromatic)

The **Canary Coast Palette** emphasizes deep, saturated blues with emerald safety accent and sky blue for action:

| Role | Hex | Usage | Notes |
|------|-----|-------|-------|
| **Primary Base** | `#273A71` (Twilight Indigo) | Backgrounds, headers, deep containers | Dark-mode dominant; creates visual anchor |
| **Secondary Base** | `#3358A3` (Dusk Blue) | Secondary containers, cards, overlays | Slightly lighter; maintains cohesion |
| **Tertiary Base** | `#3A70BA` (Sapphire Sky) | Borders, dividers, map overlays | Geographic/data framing |
| **Action Primary** | `#3BADF6` (Fresh Sky) | Buttons, selection, hovers, CTAs | High utility; commands attention |
| **Status / Safe** | `#6DD799` (Emerald) | "Safe" indicators, Canary badges, active states, pulse animations | Signals low-risk, active data, interactivity |
| **Text Primary** | `#D6DEE9` (Alice Blue) | Body text, labels, descriptions on dark | High contrast on Twilight Indigo |
| **Text Alt** | `#000000` (Black) | Contrast text on Emerald, strong emphasis | Used sparingly; maximum legibility |

### Color Application Rules
- **Dark Backgrounds:** Twilight Indigo (#273A71) with Alice Blue (#D6DEE9) text
- **Light Text on Dark:** Alice Blue is the only light text color; never use white
- **Accent Leverage:** Emerald signals safety, Fresh Sky signals action
- **Map Layers:** Desaturate base map in Alice Blue, overlay Sapphire Sky for flood zones or risk areas
- **Borders & Dividers:** Use Sapphire Sky or Emerald; never use gray
- **No Gradients:** Solid, saturated color blocks only

### CSS Variable Foundation
```css
:root {
  --color-twilight-indigo: #273A71;
  --color-dusk-blue: #3358A3;
  --color-sapphire-sky: #3A70BA;
  --color-fresh-sky: #3BADF6;
  --color-emerald: #6DD799;
  --color-alice-blue: #D6DEE9;
  --color-black: #000000;
}
```

---

## 3. Typography (Hero First)

### Font Pairing
- **Display / Headlines:** **Fraunces (700+ Bold)** — Bold, serif, distinctive. Creates magazine masthead feel. Tight leading (0.9–1.0).
- **Body / Navigation:** **Plus Jakarta Sans** — Technical, clean sans-serif. Handles data, navigation, labels. Standard 1.5 line-height for readability.

### Typographic Hierarchy

#### Hero Headlines (Magazine Masthead)
```
Font Family: Fraunces, 700–800 weight
Font Size: 2.5rem – 4rem (64px+)
Line Height: 0.9 – 1.0
Letter Spacing: -1px (tight tracking)
Color: Alice Blue (#D6DEE9) on Twilight Indigo
Usage: Page titles, section headers, major data labels
```

#### Data Metrics (Over-sized Numerals)
```
Font Family: Fraunces, 800 weight
Font Size: 4rem – 6rem (64px–96px) — THE HERO
Line Height: 1.0 (solid)
Letter Spacing: 0px
Color: Emerald (#6DD799) for safe/primary, Fresh Sky for alerts
Usage: Primary metrics (cancer rate %, flood elevation, safety score)
Principle: "Data is art." Make it BIG. Make it bold.
```

#### Data Labels (Clarification)
```
Font Family: Plus Jakarta Sans, 500–600 weight
Font Size: 0.75rem – 0.875rem (12px–14px)
Text Transform: UPPERCASE
Letter Spacing: 0.05em – 0.1em
Color: Alice Blue (#D6DEE9) at 80% opacity
Usage: Subheaders for metrics, field labels
```

#### Body Text
```
Font Family: Plus Jakarta Sans, 400 weight
Font Size: 1rem (16px)
Line Height: 1.5
Color: Alice Blue (#D6DEE9)
Usage: Descriptions, explanatory paragraphs, body copy
```

#### Navigation & UI Labels
```
Font Family: Plus Jakarta Sans, 600 weight
Font Size: 0.875rem (14px)
Text Transform: UPPERCASE
Letter Spacing: 0.025em
Color: Alice Blue (#D6DEE9)
Hover: Fresh Sky (#3BADF6)
Usage: Navigation items, button text, interactive labels
```

### Typography Rules
1. **Tight Leading on Heroes:** Fraunces headlines must feel like a printed masthead; 0.9–1.0 line-height.
2. **Numerals Are Sacred:** Oversized data metrics are the focal point; use Fraunces 800 weight.
3. **Tracking Precision:** Negative tracking (-1px) on Fraunces, positive (0.05em+) on Plus Jakarta Sans labels.
4. **Never Use:** Inter, Roboto, Arial, system fonts, or default web-safe fonts.

---

## 4. Layout & Composition

### Editorial Balance (Asymmetrical Grid)
- **Not Centered:** Use asymmetrical grid splits (e.g., 1fr 1.5fr or 2fr 1.2fr) to create visual movement.
- **Generous White Space:** Negative space is a feature, not wasted space. Prioritize breathing room.
- **Geographic Framing:** Layouts should suggest spatial hierarchy: map/image as dominant, data sidebars as secondary support.
- **Grid-Breaking:** Allow elements to overlap, break alignment, or span unexpected columns for visual interest.

### Container Patterns

#### Hero Container (Bold Bordered)
- **Border:** 2px solid Sapphire Sky or Twilight Indigo
- **Padding:** 3rem–4rem
- **Background:** Twilight Indigo
- **Structure:** Flex column, generous gap (2rem–3rem)
- **Optional Accent Line:** 1px gradient top border (Emerald fade) for emphasis

#### Property / Data Card (Pill-Shaped)
- **Border Radius:** 999px (full pill shape)
- **Border:** 2px solid Emerald (safe state) or Fresh Sky (interactive)
- **Padding:** 1.5rem–2rem
- **Background:** Dusk Blue
- **Image Crops:** Pill-shaped (border-radius: 999px) for all card imagery
- **Hover State:** Border color shifts, heartbeat pulse animation activates

#### Circular Status Badge (Perfect Circle)
- **Shape:** width = height = 60px–80px, border-radius: 50%
- **Background:** Emerald (safe), yellow/orange (warning), red (danger)
- **Content:** Font-weight 700, Fraunces family, centered text or icon
- **Shadow (Optional):** 0 0 0 4px rgba(emerald, 0.2) for soft outer glow
- **Usage:** Canary status indicator, risk score badge, location marker on maps

#### Navigation / Header
- **Structure:** Flex row, justify-space-between
- **Background:** Twilight Indigo or Dusk Blue
- **Border Bottom:** 2px solid Sapphire Sky or Emerald
- **Text:** Plus Jakarta Sans 600, uppercase, Alice Blue
- **Hover:** Color shifts to Fresh Sky
- **Logo/Brand:** Fraunces 700, Alice Blue, left-aligned

### Geographic / Cartography Layout
- **Map Container:** High-contrast Alice Blue background, 2px Twilight Indigo border
- **Base Tiles:** Desaturated (filter: saturate(0.4) brightness(0.95))
- **Overlay Zones:** Sapphire Sky at 15%–20% opacity for flood zones, health clusters, or risk areas
- **Interaction Points:** Circular badges (Emerald for safe, Fresh Sky for data points)
- **Legend:** Minimal text, bold color blocks; positioned asymmetrically outside the map

---

## 5. Motion & Animation

### Page Load – Staggered Vertical Reveal
Create architectural arrival with sequential slide-up + fade-in:

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal-item {
  animation: slideUp 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* Stagger each child by 100ms */
.reveal-item:nth-child(1) { animation-delay: 0ms; }
.reveal-item:nth-child(2) { animation-delay: 100ms; }
.reveal-item:nth-child(3) { animation-delay: 200ms; }
/* ... etc */
```

**Feeling:** Deliberate, structured, like architectural layers descending into view.

### Heartbeat / Pulse (Hover Accent)
Single-pixel Emerald pulse on hover for low-risk properties or interactive data points:

```css
@keyframes heartbeat {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(109, 215, 153, 0.8);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(109, 215, 153, 0);
  }
}

.property-card:hover {
  border-color: var(--color-emerald);
  animation: heartbeat 1.5s infinite;
}
```

**Feeling:** Subtle, organic, suggests "alive" data or active Canary status.

### Button Interaction (Fresh Sky)
Hover and active states for CTAs:

```css
.btn-primary {
  background: var(--color-fresh-sky);
  color: var(--color-twilight-indigo);
  border: 2px solid var(--color-fresh-sky);
  transition: all 250ms ease;
  border-radius: 0; /* Sharp corners */
}

.btn-primary:hover {
  background: transparent;
  color: var(--color-fresh-sky);
  transform: scale(1.02);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

**Feeling:** Responsive, crisp, high-utility.

### Scroll Trigger (Optional Enhancement)
For longer pages, trigger reveals as sections enter viewport:

```javascript
// Pseudo-code
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
});

document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
```

### Motion Principles
- **No Scatter:** Avoid random micro-interactions; focus on **one well-orchestrated moment** (page load).
- **Purpose:** Motion should emphasize hierarchy, guide attention to data, or signal interactivity.
- **Restraint:** Fintech + editorial = minimal motion. One stagger, one pulse. That's it.

---

## 6. Data Visualization & Cartography

### Minimalist Infographics
- **Flood Zones / Health Clusters:** Render as **abstracted thin-line graphs** or **solid-block histograms**. Strip away axes, gridlines, and legend clutter.
- **Color Coding:** Use the palette (Emerald = safe, Sapphire = risk, Fresh Sky = data point).
- **No Decorative Chart Junk:** Clean, functional, unfussy.

### Map Styling
- **Base Map:** Desaturated Alice Blue background (or light gray).
- **Risk Overlays:** Sapphire Sky (15–20% opacity) for flood zones, cancer prevalence clusters.
- **Interactive Markers:** Circular Emerald or Fresh Sky badges for properties, POIs.
- **Border:** 2px Twilight Indigo frame around entire map container.

### Chart Components
```css
.data-histogram {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 200px;
}

.histogram-bar {
  flex: 1;
  background: var(--color-emerald);
  border: 1px solid var(--color-alice-blue);
  border-radius: 0; /* Sharp corners */
  transition: all 200ms ease;
}

.histogram-bar:hover {
  background: var(--color-fresh-sky);
  box-shadow: 0 0 15px rgba(59, 173, 246, 0.4);
}
```

---

## 7. Implementation Checklist

- [ ] Load **Fraunces (700, 800)** + **Plus Jakarta Sans (400–700)** from Google Fonts
- [ ] Define **6 CSS variables** for the Canary Coast Palette
- [ ] Set **page background** to Twilight Indigo
- [ ] Use **2px borders** on all major sections and containers
- [ ] Create **hero headline** in Fraunces 700+, size 2.5–4rem, line-height 0.9–1.0
- [ ] Implement **oversized data metrics** in Fraunces 800, Emerald color, size 4–6rem
- [ ] Build **asymmetrical grid** layout (not centered, not symmetric)
- [ ] Add **pill-shaped** image crops and **perfect circle** badges
- [ ] Apply **staggered slide-up animation** to page sections on load
- [ ] Add **heartbeat pulse** to property cards on hover
- [ ] Test **contrast** (Alice Blue on Twilight Indigo, Black on Emerald)
- [ ] Verify **no soft shadows** (use hard borders or flat planes only)
- [ ] Confirm **no gradients** (solid color blocking only)

---

## 8. React / Tailwind Integration

### Utility Classes (Tailwind @layer)
```css
@layer components {
  .btn-primary {
    @apply px-6 py-3 bg-fresh-sky text-twilight-indigo font-semibold text-sm uppercase tracking-wider border-2 border-fresh-sky transition-all duration-250 hover:bg-transparent hover:text-fresh-sky cursor-pointer;
  }
  
  .data-metric {
    @apply font-fraunces text-6xl font-black leading-none text-emerald;
  }
  
  .hero-headline {
    @apply font-fraunces text-4xl font-bold text-alice-blue leading-tight -tracking-wide;
  }
  
  .nav-link {
    @apply font-body text-sm font-semibold uppercase tracking-wider text-alice-blue transition-colors duration-200 hover:text-fresh-sky;
  }
}
```

### Component Example: Property Card
```jsx
export function PropertyCard({ address, safetyScore, flood, image }) {
  return (
    <div className="property-card rounded-full border-2 border-emerald p-6 bg-dusk-blue hover:border-fresh-sky transition-all reveal-item">
      <img src={image} alt={address} className="w-full h-48 rounded-full object-cover mb-4" />
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="hero-headline text-xl">{address}</h3>
          <p className="body-text text-xs text-alice-blue opacity-75">{flood}</p>
        </div>
        <div className="canary-badge w-16 h-16 rounded-full flex items-center justify-center bg-emerald text-twilight-indigo font-fraunces font-bold">
          {safetyScore}
        </div>
      </div>
      <div className="data-metric">{safetyScore}%</div>
      <p className="data-label">Safety Score</p>
    </div>
  );
}
```

---

## 9. Real-World Context: Canary Coast / SafeHome Houston

**Canary Coast** is a map-based application overlaying Harris County housing listings with environmental safety scores (cancer prevalence, flood risk). The design system serves:

- **Primary User:** Homebuyers, relocating families, environmental researchers
- **Core Task:** Evaluate properties against health and environmental risk
- **Data Story:** Cancer rates (CDC PLACES), flood zones (FEMA), property details (Harris County records)
- **Visual Strategy:** Make risk/safety instantly legible via oversized metrics, color coding, and geographic framing

The Editorial Minimalism + Fintech aesthetic reinforces trust and precision while rejecting the "AI dashboard" look that users have learned to distrust.

---

## 10. Dos and Don'ts

### ✅ Do
- Use Fraunces for all headlines; Plus Jakarta Sans for everything else
- Make data numerals **BIG** and **bold**
- Apply heavy 2px borders to major sections
- Use asymmetrical layouts and generous white space
- Implement staggered animations on page load
- Pair colors boldly (Emerald + Fresh Sky on Twilight Indigo)
- Build pill-shaped cards and perfect circle badges
- Desaturate maps; overlay with high-contrast zones

### ❌ Don't
- Use Inter, Roboto, Arial, system fonts
- Apply soft shadows or subtle effects
- Center everything or use symmetric grids
- Round corners except for full pills (999px)
- Use gradients; stick to solid color blocks
- Timid color choices; saturate and commit
- Generic SaaS card patterns
- Clutter data viz with axes, grids, legends

---

## 11. Voice & Tone (Design Perspective)

This system speaks in the **voice of precision + editorial flair**:
- **Bold:** Not apologetic. Confident in color, typography, spacing.
- **Geographic:** Spatial relationships matter. Framing (borders, overlays) guides the eye.
- **Magazine First:** Think Wired, The Economist, or high-end editorial photography. Not a SaaS dashboard.
- **Fintech Understated:** High-information density without clutter. Data **is** the art.
- **Harris County Rooted:** Place matters. The design should feel local, specific, grounded in geography.

---

## Reference Implementations

For complete working examples of Canary Coast applied to React components, maps, and dashboards, refer to the **SafeHome Houston** project architecture:
- Property card components with pill-shaped crops and Emerald badging
- Harris County map layer with desaturated base and Sapphire Sky flood overlays
- Data breakdown tables with Fraunces numerals and responsive layout
- Page header with Fraunces masthead and Plus Jakarta Sans navigation

---

**Last Updated:** March 2026  
**Project:** Canary Coast (SafeHome Houston)  
**Design System:** Editorial Minimalism + High-Contrast Fintech
