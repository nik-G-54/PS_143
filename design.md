# NAUKA — Maritime Intelligence Design System

This document outlines the official design system, typography scales, color tokens, and layout guidelines for **NAUKA — Maritime Intelligence**.

---

## 1. Brand Identity & Design Philosophy

- **Application Name**: NAUKA — Maritime Intelligence
- **Design Philosophy**: High-contrast, tactical maritime GIS interface balancing high-density data visualization with clean aesthetics.
- **Dual Aesthetic**:
  - **Light Mode**: Warm Cream & Soft Earth tones (`#faf9f5` base) reducing eye fatigue during daytime monitoring.
  - **Dark Mode**: Dark Obsidian & Slate (`#262624` base) designed for night shifts, command centers, and map overlay contrast.
- **Tactical Features**: Glassmorphism (`backdrop-blur`), crisp border tokens, micro-telemetry data fields, and smooth theme switching.

---

## 2. Color Palette & Token System

### 2.1 Primary Brand Color (Averra Amber)

The brand primary color is **Averra Amber**, used for interactive controls, active states, focus rings, and tactical accents.

| State / Variant | Light Mode | Dark Mode | CSS Token / Utility |
|---|---|---|---|
| Primary Default | `#c96442` | `#d97757` | `var(--primary)` / `bg-primary` |
| Primary Hover | `#b05730` | `#b05730` | `averra.amber.hover` |
| Focus Ring | `#c96442` | `#d97757` | `var(--ring)` |

---

### 2.2 Surface & Layout Color Tokens

All background and border colors adapt dynamically via CSS Custom Properties.

| Token | Light Mode | Dark Mode | Usage Description |
|---|---|---|---|
| `--background` | `#faf9f5` *(Warm Cream)* | `#262624` *(Dark Obsidian)* | Main view/page background |
| `--card` | `#f5f4ef` *(Soft Paper)* | `#2c2c2b` *(Charcoal Slate)* | Dashboard cards, popups, panel containers |
| `--popover` | `#ffffff` *(Pure White)* | `#30302e` *(Dark Popover)* | Tooltips, dropdowns, modal windows |
| `--sidebar` | `#f5f4ee` *(Warm Surface)* | `#1f1e1d` *(Midnight Black)* | Navigation sidebar container |
| `--muted` | `#ede9de` | `#1b1b19` | Quiet areas, disabled button surfaces |
| `--accent` | `#e9e6dc` | `#1a1915` | Hover backgrounds, active tab pills |
| `--border` | `#dad9d4` | `#3e3e38` | Container borders, table dividers |
| `--input` | `#b4b2a7` | `#52514a` | Form field outlines, search borders |

---

### 2.3 Typography & Foreground Colors

Text colors maintain WCAG AA contrast standards across both light and dark backgrounds.

| Token | Light Mode | Dark Mode | Usage Description |
|---|---|---|---|
| `--foreground` | `#3d3929` *(Dark Earth)* | `#f1f1ef` *(Off-White)* | Main body text, primary titles |
| `--card-foreground` | `#141413` | `#faf9f5` | Card titles, widget body copy |
| `--muted-foreground` | `#6e6d68` | `#b7b5a9` | Labels, subtitles, table headers |
| `--accent-foreground` | `#28261b` | `#f5f4ee` | Highlighted text in active states |
| `--primary-foreground` | `#ffffff` | `#141413` | Text on active primary buttons |

---

### 2.4 Data Visualization & Chart Palette

Chart colors are tuned for multi-layered series, satellite radar plots, and trend analytics.

| Chart Token | Color Code | Purpose / Usage |
|---|---|---|
| `var(--chart-1)` | `#b05730` *(Deep Amber)* | Primary metric line, high severity trends |
| `var(--chart-2)` | `#9c87f5` *(Purple Blue)* | AIS vessel tracks, secondary dataset |
| `var(--chart-3)` | `#ded8c4` / `#1a1915` | Baseline / Neutral reference lines |
| `var(--chart-4)` | `#dbd3f0` / `#2f2b48` | Area chart fills, historical ranges |
| `var(--chart-5)` | `#b4552d` *(Rust Red)* | Spill radius thresholds, critical alerts |

---

## 3. Typography System

### 3.1 Font Families

1. **Primary Sans-Serif (`Outfit`)**:
   - CSS Variable: `var(--font-sans)`
   - Used for: Headers, navigation, cards, UI controls, body text.
   - Google Font: `'Outfit', sans-serif`

2. **Monospace (`Geist Mono`)**:
   - CSS Variable: `var(--font-mono)`
   - Used for: Lat/Lng coordinates, timestamps, incident IDs, telemetry HUD, map scale.
   - Google Font: `'Geist Mono', ui-monospace, monospace`

---

### 3.2 Type Scale & Hierarchy

| Typography Role | Size | Font Weight | Line Height | Font Family | Example Usage |
|---|---|---|---|---|---|
| **Display Title** | `28px / 1.75rem` | Bold (700) | `1.2` | Outfit | Dashboard & Incident titles |
| **Card Header** | `20px / 1.25rem` | SemiBold (600) | `1.3` | Outfit | Panel headers, modal titles |
| **Section Header** | `16px / 1.00rem` | SemiBold (600) | `1.4` | Outfit | Sidebar headers, form labels |
| **Body Regular** | `14px / 0.875rem` | Regular (400/500) | `1.5` | Outfit | Table rows, general copy |
| **Micro Caption** | `12px / 0.75rem` | Regular (400) | `1.4` | Outfit | Timestamps, metadata |
| **Telemetry Main** | `14px / 0.875rem` | Medium (500) | `1.2` | Geist Mono | Coordinates `13.08° N, 80.18° E` |
| **Telemetry Micro** | `10px / 0.625rem` | Medium (500) | `1.0` | Geist Mono | Map scale, badge numbers |

---

## 4. Component Specifications

### 4.1 Cards & Containers
- **Border Radius**: `var(--radius)` = `1rem` (`16px`).
- **Border**: `1px solid var(--border)`
- **Background**: `var(--card)`
- **Shadow**: `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)` (Light) / `rgba(0, 0, 0, 0.3)` (Dark).

### 4.2 Buttons
- **Primary Button**: `bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-4 py-2 font-medium`
- **Secondary Button**: `bg-secondary text-secondary-foreground hover:bg-accent border border-border rounded-lg`
- **Ghost/Icon Button**: `bg-transparent hover:bg-accent text-foreground rounded-lg p-2`

### 4.3 Status & Severity Badges
- **Active / High Alert**: Red badge (`bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20`)
- **Investigating / Medium**: Amber badge (`bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`)
- **Resolved / Low**: Emerald badge (`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`)
- **Shape**: Full pill (`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider`)

---

## 5. Map & GIS UI Elements (MapLibre GL)

Custom MapLibre controls match the application design system:

```css
/* MapLibre Scale Control */
.maplibregl-ctrl-scale {
  background-color: var(--card) !important;
  border: 1px solid var(--border) !important;
  color: var(--muted-foreground) !important;
  border-radius: 6px !important;
  font-family: var(--font-mono) !important;
  font-size: 10px !important;
  padding: 3px 10px !important;
  backdrop-filter: blur(4px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

/* MapLibre Control Group Buttons */
.maplibregl-ctrl-group {
  background-color: var(--card) !important;
  border: 1px solid var(--border) !important;
  border-radius: 8px !important;
  backdrop-filter: blur(4px) !important;
}

/* Compass Needle Pointer Accent */
.maplibregl-ctrl-compass-pointer {
  fill: var(--primary) !important;
}
```

---

## 6. Micro-Interactions & Animation Guidelines

- **Theme Transition**: Smooth color updates across all elements using `transition-colors duration-150`.
- **Live Marker Pulse**:
  ```css
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
  }
  ```
- **Ping Radar Alert**:
  ```css
  @keyframes ping {
    75%, 100% { transform: scale(2); opacity: 0; }
  }
  ```
