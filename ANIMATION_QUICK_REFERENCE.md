# FarmDirect Animation Classes & Components - Quick Reference

## Quick Start with Animations

### 1. Page Transitions (Recommended for all pages)
```jsx
import PageTransition from '../components/common/PageTransition';

export default function MyPage() {
  return (
    <PageTransition delay={0}>
      <div className="min-h-screen">
        {/* Your page content */}
      </div>
    </PageTransition>
  );
}
```

### 2. Scroll-Based Animations
```jsx
import ScrollAnimation from '../components/common/ScrollAnimation';

<ScrollAnimation className="scroll-slide">
  <h2>Section Title</h2>
  <p>Content appears when scrolled into view</p>
</ScrollAnimation>
```

### 3. Loading Spinners
```jsx
import LoadingSpinner from '../components/common/LoadingSpinner';

<LoadingSpinner size="md" text="Loading..." />
// Sizes: sm, md, lg
```

---

## CSS Animation Classes

### Entrance Animations (0.6s)
```html
<!-- Fade in -->
<div className="animate-fade-in">Content</div>

<!-- Slide from left -->
<div className="animate-slide-in-left">Content</div>

<!-- Slide from right -->
<div className="animate-slide-in-right">Content</div>

<!-- Slide from top -->
<div className="animate-slide-in-down">Content</div>

<!-- Slide from bottom -->
<div className="animate-slide-in-up">Content</div>

<!-- Scale in -->
<div className="animate-scale-in">Content</div>
```

### Continuous Motion Animations
```html
<!-- Bouncing effect (2s) -->
<div className="animate-bounce-soft">Content</div>

<!-- Pulsing effect (2s) -->
<div className="animate-pulse-soft">Content</div>

<!-- Floating effect (3s) -->
<div className="animate-float">Content</div>

<!-- Rotating effect (3s) -->
<div className="animate-rotate-slow">Content</div>

<!-- Glowing effect (2s) -->
<div className="animate-glow">Content</div>
```

### Page Load Animation
```html
<!-- Smooth page entrance -->
<div className="animate-page-load">Page content</div>
```

### Stagger Animations (Sequential Reveal)
```html
<!-- Each item animates in sequence with 0.1-0.3s delays -->
<div className="grid">
  <div className="stagger-item">Item 1</div>  <!-- Delay: 0.1s -->
  <div className="stagger-item">Item 2</div>  <!-- Delay: 0.2s -->
  <div className="stagger-item">Item 3</div>  <!-- Delay: 0.3s -->
  {/* Up to 10 items supported */}
</div>
```

### Hover Effects
```html
<!-- Scale on hover -->
<div className="hover-scale">Scales 105% on hover</div>

<!-- Lift on hover -->
<div className="hover-lift">Lifts up with shadow</div>

<!-- Glow on hover -->
<div className="hover-glow">Adds glow effect</div>

<!-- Combined hover effect -->
<button className="hover-scale hover-lift hover-glow">Button</button>
```

### Transitions
```html
<!-- Smooth transitions (0.3s) -->
<div className="transition-smooth">Content</div>

<!-- Fast transitions (0.15s) -->
<div className="transition-fast">Content</div>

<!-- Slow transitions (0.5s) -->
<div className="transition-slow">Content</div>
```

### Scroll Animations
```html
<!-- Fade on scroll -->
<div className="scroll-fade">Fades in when scrolled into view</div>

<!-- Slide on scroll -->
<div className="scroll-slide">Slides in when scrolled into view</div>
```

### Loading Animation
```html
<!-- Shimmer effect for skeleton loading -->
<div className="loading-shimmer">Skeleton placeholder</div>
```

---

## Animation Delays

Add custom delays using inline style:
```jsx
<div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
  Appears 0.2s after trigger
</div>

<div className="stagger-item" style={{ animationDelay: '0.5s' }}>
  Custom stagger delay
</div>
```

---

## Enhanced Components

### Card Component
```jsx
<Card 
  hover={true}           // Enables hover effect
  animated={true}        // Enables stagger animation
  className="custom-class"
>
  Card content
</Card>
```

### Button Component
```jsx
<Button
  variant="primary"      // primary, secondary, danger, outline
  size="md"              // sm, md, lg
  animated={true}        // Enables hover/active animations
  disabled={false}
>
  Click me
</Button>
```

---

## Real-World Examples

### Hero Section with Staggered Elements
```jsx
<div className="animate-slide-in-left" style={{ animationDelay: '0s' }}>
  <h1>Main Headline</h1>
</div>
<div className="animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
  <p>Subheadline</p>
</div>
<div className="animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
  <Button>Call to Action</Button>
</div>
```

### Grid of Cards with Stagger Effect
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {items.map((item, i) => (
    <Card key={i} animated={true}>
      {/* Each card animates in sequence */}
    </Card>
  ))}
</div>
```

### Form with Cascading Field Animations
```jsx
<form className="space-y-4">
  <div className="animate-slide-in-down" style={{ animationDelay: '0s' }}>
    <Input label="Name" />
  </div>
  <div className="animate-slide-in-down" style={{ animationDelay: '0.1s' }}>
    <Input label="Email" />
  </div>
  <div className="animate-slide-in-down" style={{ animationDelay: '0.2s' }}>
    <Input label="Password" />
  </div>
</form>
```

### Scroll-Triggered Section
```jsx
<ScrollAnimation className="scroll-slide">
  <section>
    <h2>This Section Animates</h2>
    <p>When it scrolls into view</p>
  </section>
</ScrollAnimation>
```

---

## Performance Tips

1. **Use CSS Animations**: They're GPU-accelerated and more performant
2. **Limit Simultaneous Animations**: Don't animate everything at once
3. **Use transform & opacity**: These don't trigger layout reflows
4. **Avoid Animating Heavy Elements**: Keep animation targets lightweight
5. **Test on Mobile**: Ensure smooth 60fps on low-end devices

---

## Accessibility & Preferences

For users who prefer reduced motion, add to your CSS:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Common Patterns

### Fade In + Lift On Load
```jsx
<div className="animate-fade-in hover-lift">Content</div>
```

### Slide + Scale on Hover
```jsx
<div className="animate-slide-in-down hover-scale">Content</div>
```

### Stagger Grid with Glow on Hover
```jsx
<div className="grid">
  {items.map((item, i) => (
    <div key={i} className="stagger-item hover-glow">
      {item}
    </div>
  ))}
</div>
```

---

## Troubleshooting

**Animation not showing?**
- Check if class name is correct
- Ensure element is visible (not hidden)
- Check browser DevTools for animation in Elements panel

**Animation too fast/slow?**
- Add custom animation duration: `style={{ animationDuration: '1s' }}`
- Check CSS animation-duration value

**Performance issues?**
- Reduce number of simultaneous animations
- Use `will-change` CSS property sparingly
- Test on actual mobile device

---

**Happy Animating! 🎨✨**
