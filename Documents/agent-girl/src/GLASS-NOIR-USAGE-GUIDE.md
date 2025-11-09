# Glass Noir Design System - Usage Guide

## Overview

Glass Noir is an Apple-level dark mode design system that brings macOS Sonoma quality glassmorphism to your React productivity app. This guide shows how to implement the sophisticated dark mode across all components.

## 🎯 Design Principles

- **Deep Navy Foundation**: `#0E111A → #090B10` gradient backgrounds
- **Glass Panels**: Translucent surfaces with `rgba(20,25,35,0.6–0.7)` and 20-30px blur
- **Desaturated Accents**: Calm blues like `#4C8BFF` instead of electric blues
- **Native macOS Feel**: Premium depth, smooth animations, and Apple-quality typography

## 🏗️ Architecture

### Core Files
- `/src/glass-noir-design-system.css` - Complete design system
- `/src/index.css` - Main imports and coordination
- `/src/glass-noir-extensions.css` - Advanced animations and utilities
- `tailwind.config.js` - Tailwind integration with custom utilities

### Design Tokens
All design tokens are available via CSS custom properties and Tailwind utilities.

## 🎨 Implementation Guide

### 1. Basic Usage

The Glass Noir system automatically applies when `dark` class is present:

```jsx
// Theme is automatically handled by ThemeContext
// No special class application needed
<div className="card">
  {/* Will automatically use Glass Noir styling in dark mode */}
</div>
```

### 2. Tailwind Utilities

Use the custom Glass Noir utilities:

```jsx
<div className="glass-noir-surface">
  {/* Premium glass surface */}
</div>

<div className="glass-noir-elevated glass-noir-interactive">
  {/* Elevated surface with hover effects */}
</div>
```

### 3. Color System

#### Typography
```jsx
<h1 className="text-glass-noir-text-primary">Primary Text</h1>
<p className="text-glass-noir-text-secondary">Body Text</p>
<span className="text-glass-noir-text-muted">Muted Text</span>
```

#### Backgrounds & Panels
```jsx
<div className="bg-glass-noir-panel">Standard Panel</div>
<div className="bg-glass-noir-panel-strong">Strong Panel</div>
<div className="bg-glass-noir-sidebar">Sidebar Background</div>
```

#### Accents & Interactions
```jsx
<button className="bg-glass-noir-accent-primary hover:bg-glass-noir-accent-hover">
  Primary Action
</button>

<div className="bg-glass-noir-accent-subtle">Subtle Accent</div>
```

### 4. Borders & Shadows

```jsx
<div className="border border-glass-noir-border shadow-glass-noir">
  Card with border and shadow
</div>

<div className="border border-glass-noir-border-glow shadow-glass-noir-accent">
  Accent glow effect
</div>
```

### 5. Typography & Fonts

```jsx
<div className="font-glass-noir text-glass-noir-text-primary">
  Apple-quality text rendering
</div>
```

### 6. Animations

```jsx
<div className="animate-glass-noir-entrance">
  Entrance animation
</div>

<button className="hover:animate-lit-from-above">
  Hover animation
</button>
```

### 7. Backdrop Blur Effects

```jsx
<div className="backdrop-blur-glass-noir">
  Premium blur effect
</div>

<div className="backdrop-blur-glass-noir-max">
  Maximum blur depth
</div>
```

## 🧩 Component Examples

### Sidebar Navigation
```jsx
<nav className="glass-noir-elevated">
  <a href="#" className="text-glass-noir-text-nav hover:text-glass-noir-text-primary hover:bg-glass-noir-glass-light">
    Dashboard
  </a>
  <a href="#" className="text-glass-noir-text-primary bg-glass-noir-accent-subtle border-l-2 border-glass-noir-accent-primary">
    Active Page
  </a>
</nav>
```

### Cards & Panels
```jsx
<div className="glass-noir-card p-6">
  <h2 className="text-glass-noir-text-primary font-semibold mb-4">Premium Card</h2>
  <p className="text-glass-noir-text-secondary">Content with glassmorphism effect</p>
  <button className="mt-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
    Action Button
  </button>
</div>
```

### Input Fields
```jsx
<input
  type="text"
  className="bg-glass-noir-glass-light border border-glass-noir-border focus:border-glass-noir-accent-primary focus:ring-2 focus:ring-glass-noir-accent-subtle"
  placeholder="Glass input field"
/>
```

### AI Insights Section
```jsx
<div className="glass-noir-elevated border border-glass-noir-border-glow">
  <div className="p-6">
    <h3 className="text-glass-noir-text-primary font-semibold mb-4">AI Insights</h3>
    <div className="space-y-4">
      <div className="glass-noir-surface p-4">
        <p className="text-glass-noir-text-secondary">Insight content</p>
      </div>
    </div>
  </div>
</div>
```

### Modals
```jsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
  <div className="glass-noir-elevated max-w-md w-full p-6 border border-glass-noir-border-medium">
    <h2 className="text-glass-noir-text-primary text-xl font-semibold mb-4">Modal Title</h2>
    <p className="text-glass-noir-text-secondary mb-6">Modal content</p>
    <div className="flex gap-3">
      <button className="bg-glass-noir-accent-primary hover:bg-glass-noir-accent-hover">
        Confirm
      </button>
      <button className="bg-glass-noir-glass-medium hover:bg-glass-noir-glass-strong">
        Cancel
      </button>
    </div>
  </div>
</div>
```

## 🔧 Advanced Usage

### Custom CSS Variables

You can access design tokens directly:

```css
.custom-component {
  background: var(--glass-noir-panel);
  backdrop-filter: var(--glass-noir-blur-medium);
  border: 1px solid var(--glass-noir-border);
  color: var(--glass-noir-text-primary);
}
```

### Responsive Adjustments

The system includes responsive optimizations:

```jsx
<div className="glass-noir-card md:backdrop-blur-glass-noir-sm">
  {/* Adjusted blur for mobile */}
</div>
```

### Performance Optimizations

Hardware acceleration is automatically applied to interactive elements:

```jsx
<div className="glass-noir-interactive">
  {/* Hardware accelerated animations */}
</div>
```

## 🎯 Best Practices

### 1. Consistent Hierarchy
- Use `text-glass-noir-text-primary` for headings
- Use `text-glass-noir-text-secondary` for body content
- Use `text-glass-noir-text-muted` for metadata

### 2. Surface Depth
- `glass-noir-surface` for standard panels
- `glass-noir-elevated` for elevated content
- `glass-noir-card` for cards and interactive elements

### 3. Interactive States
- Always include hover states with `hover:` prefix
- Use `glass-noir-interactive` for clickables
- Add focus states for accessibility

### 4. Animation Timing
- Use `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion
- Keep transitions under 0.3s for responsiveness
- Use `transform: translateY(-2px)` for hover lift

## 🚀 Migration Checklist

### ✅ Existing Components
- [ ] Replace `bg-gray-800` with `bg-glass-noir-panel`
- [ ] Update text colors to Glass Noir variants
- [ ] Add `backdrop-blur-glass-noir` to transparent elements
- [ ] Replace sharp borders with `border-glass-noir-*`
- [ ] Update shadows to `shadow-glass-noir-*`

### ✅ New Components
- [ ] Use Glass Noir utilities from start
- [ ] Apply proper typography hierarchy
- [ ] Implement hover and focus states
- [ ] Test in both light and dark modes

### ✅ Testing
- [ ] Verify all dark mode elements
- [ ] Check contrast ratios
- [ ] Test animations on different devices
- [ ] Validate accessibility

## 🔍 Troubleshooting

### Common Issues

**Blur not working?**
- Ensure browser supports `backdrop-filter`
- Check for `-webkit-backdrop-filter` prefix (included automatically)

**Text not visible?**
- Verify proper color hierarchy
- Check `!important` declarations in CSS

**Performance issues?**
- Reduce number of blur effects on mobile
- Use `will-change: transform` sparingly

## 🎨 Color Reference

### Backgrounds
- Primary: `#0E111A → #090B10` (gradient)
- Panel: `rgba(20, 25, 35, 0.65)`
- Strong: `rgba(22, 27, 35, 0.7)`

### Text
- Primary: `#EAEAEA`
- Secondary: `#B8BCC6`
- Muted: `#7D8492`

### Accents
- Primary: `#4C8BFF`
- Hover: `#3D7BFF`
- Active: `#2B63F8`

### Borders
- Subtle: `rgba(255, 255, 255, 0.04)`
- Standard: `rgba(255, 255, 255, 0.06)`
- Strong: `rgba(255, 255, 255, 0.12)`

## 📱 Responsive Notes

- Mobile: Reduced blur intensity for performance
- Tablet: Full glass effects enabled
- Desktop: Maximum blur and animations

---

This Glass Noir design system transforms your app into a premium, Apple-quality experience with sophisticated glassmorphism and smooth interactions.