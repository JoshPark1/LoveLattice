---
name: LoveLattice Design System
description: Design system rules and visual language for the LoveLattice Instagram tracker dashboard
---

# LoveLattice Design System

Follow these rules whenever creating or modifying UI components in the LoveLattice client app.

## Visual Identity

LoveLattice is an Instagram tracking/monitoring tool with a **dark glassmorphism** aesthetic and a **heartbeat monitor** motif. The design should feel like a premium, futuristic monitoring station — dark, dramatic, but clean and readable.

## Technology

- **Tailwind CSS v4** with utility-first classes
- **React 19** with Vite
- Custom theme tokens defined in `client/src/index.css` via `@theme`

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-primary` | `#0D1117` | Main background |
| `--color-bg-secondary` | `#161B22` | Card backgrounds, panels |
| `--color-bg-tertiary` | `#1A1A2E` | Elevated surfaces |
| `--color-accent` | `#E63946` | Brand red — buttons, heart icon, alerts, EKG line |
| `--color-accent-hover` | `#FF4D5A` | Hover state for red accent |
| `--color-success` | `#4CC9F0` | Active/success indicators, cyan/teal |
| `--color-text-primary` | `#F0F6FC` | Primary text |
| `--color-text-secondary` | `#8B949E` | Secondary/muted text |
| `--color-text-tertiary` | `#6E7681` | Disabled/hint text |
| `--color-border` | `rgba(255, 255, 255, 0.08)` | Card borders, dividers |
| `--color-border-hover` | `rgba(255, 255, 255, 0.15)` | Hover borders |
| `--color-glass` | `rgba(255, 255, 255, 0.03)` | Glassmorphism card fill |
| `--color-glass-hover` | `rgba(255, 255, 255, 0.06)` | Glassmorphism hover fill |

## Typography

- **Font**: `Inter` from Google Fonts, falling back to `system-ui, sans-serif`
- **Headings**: Bold (700), use text-primary color
- **Body**: Regular (400), use text-primary color
- **Labels/Meta**: Regular (400), use text-secondary color, smaller size
- **Stat numbers**: Bold (700) or Extra Bold (800), large size

## Glassmorphism Cards

Cards use a smoky/dark frosted glass effect — NOT white/bright glass. Apply:
- Background: `bg-glass` (very subtle white tint)
- Border: `border border-[color-border]`
- Backdrop blur: `backdrop-blur-xl`
- Border radius: `rounded-2xl` (16px)
- Hover: slightly brighter background + border

```html
<!-- Standard glass card -->
<div class="bg-glass backdrop-blur-xl border border-border rounded-2xl">
```

## Component Patterns

### Stats Bar
- Compact, horizontal row of stat blocks at top of dashboard
- Visually DISTINCT from clickable account cards (smaller, tighter, no hover lift)
- Use a single glass panel with divided sections, or small inline stat pills

### Account Cards
- Larger, clickable glass cards for tracked accounts
- Show: username, note, tracked post count, story tracking status
- Hover: `translateY(-4px)` lift effect + brighter border
- Include delete button (positioned absolute, top-right)

### Buttons
- **Primary** (`btn-primary`): Red accent background with gradient, white text, hover glow
- **Secondary** (`btn-secondary`): Transparent with subtle border, white text, hover fill

### Modals
- Dark overlay with backdrop blur
- Glass panel with darker tint for the content area
- Max-width constrained, vertically centered

### Status Badges
- **Active**: Cyan/teal background at ~20% opacity, cyan text
- **Alert/Missing**: Red accent background at ~20% opacity, red text
- Small, pill-shaped, uppercase text

## EKG Timeline

The heartbeat/EKG line is a **functional data visualization**, NOT a decorative header element:
- Lives in the **Story Logs section**
- X-axis: time (days of week or hours of day)
- Spikes represent story detection events
- Rendered as SVG with red (#E63946) stroke + glow effect
- Flat line = no activity, spike = story detected
- Small dots at each event point

## Layout Rules

- Max width: `max-w-7xl` (1280px), centered
- Use CSS Grid for card layouts: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Account detail view: 2-column layout (main content + sidebar)
- Always add adequate padding: `p-6` or `p-8` for sections

## Do's and Don'ts

### Do
- Use Tailwind utility classes for all styling
- Keep glassmorphism cards dark/smoky, not white
- Use the red accent sparingly — for important actions and the brand identity
- Use Inter font for all text
- Add subtle transitions on interactive elements (`transition-all duration-200`)
- Use `backdrop-blur-xl` for glass effects

### Don't
- Don't use bright/white glassmorphism — keep it dark and moody
- Don't use the EKG line as decoration — it must represent real data
- Don't use inline `style={{}}` objects — use Tailwind classes
- Don't create new CSS files — define custom utilities in `index.css` `@layer components`
- Don't use colors outside the defined palette without good reason
