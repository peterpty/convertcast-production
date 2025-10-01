# ConvertCast Design System

## Color Palette

### Primary Colors
- **Dark Base**: `from-slate-900 via-slate-800 to-indigo-950`
- **Section Backgrounds**: `from-slate-900 via-purple-950 to-indigo-950`
- **Card Backgrounds**: `from-slate-800/40 to-slate-900/40` with `backdrop-blur-xl`

### Purple Gradients (Brand Primary)
- **Text Headlines**: `from-purple-400 via-purple-300 to-indigo-300`
- **Accent Text**: `from-purple-400 via-violet-400 to-fuchsia-400`
- **Buttons**: `from-purple-600 via-purple-500 to-indigo-600`
- **Button Hover**: `from-purple-700 via-purple-600 to-indigo-700`
- **Logo Icon**: `from-purple-500 via-purple-600 to-indigo-600`

### Accent Colors
- **Success Green**: `from-green-400 via-emerald-400 to-teal-400`
- **Error Red**: `from-red-400 via-pink-400 to-rose-400`
- **Warning Yellow**: `text-yellow-400`
- **Info Blue**: `text-blue-400`

### Text Colors
- **Primary White**: `text-white`
- **Secondary**: `text-purple-100/90`
- **Muted**: `text-purple-200/80`
- **Subtle**: `text-gray-400`

### Borders
- **Primary**: `border-purple-500/20`
- **Focused**: `border-purple-400`
- **Subtle**: `border-purple-500/30`

## Typography

### Font Stack
- **Primary**: `font-sans` (system fonts)
- **Weights**: `font-medium`, `font-semibold`, `font-bold`

### Text Sizes
- **Hero**: `text-5xl lg:text-7xl`
- **Section Headers**: `text-4xl lg:text-5xl` or `text-5xl lg:text-6xl`
- **Card Titles**: `text-xl` or `text-2xl`
- **Body**: `text-lg` or `text-xl`
- **Small**: `text-sm`
- **Tiny**: `text-xs`

## Spacing System

### Padding
- **Container**: `px-4 py-20` or `px-4 py-16`
- **Card**: `p-8` or `p-6`
- **Button**: `px-8 py-4` (large), `px-6 py-3` (medium), `px-4 py-2` (small)

### Margins
- **Section**: `mb-16` or `mb-20`
- **Element**: `mb-8`, `mb-6`, `mb-4`
- **Grid Gap**: `gap-8`, `gap-6`, `gap-4`

### Grid Systems
- **Two Column**: `lg:grid-cols-2 gap-16`
- **Three Column**: `md:grid-cols-3 gap-8`
- **Four Column**: `md:grid-cols-4 gap-8`

## Card Styles

### Primary Cards
```css
bg-gradient-to-br from-slate-800/40 to-slate-900/40
backdrop-blur-xl
border border-purple-500/20
rounded-3xl
p-8
shadow-2xl
```

### Hover Effects
```css
hover:scale-1.02
transition-all duration-300
group-hover:opacity-100
```

### Feature Cards
```css
bg-gradient-to-br from-purple-500 to-purple-600
rounded-3xl
p-8
text-center
shadow-2xl
border border-white/10
backdrop-blur-sm
```

## Button Styles

### Primary Button
```css
bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600
hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700
text-white font-semibold
px-8 py-4 rounded-xl text-lg
shadow-2xl hover:shadow-purple-500/30
transition-all duration-300
```

### Secondary Button
```css
border border-purple-400/50
text-white hover:bg-purple-500/10
px-8 py-4 rounded-xl text-lg
backdrop-blur-sm
```

### Ghost Button
```css
text-white hover:bg-white/10
px-4 py-2
transition-colors duration-200
```

## Icons & Logo

### Logo Specifications
- **Size**: 40px x 40px (medium), 32px (small), 48px (large)
- **Style**: Rounded square with play button icon
- **Gradient**: `from-purple-500 via-purple-600 to-indigo-600`
- **Animation**: Hover scale 1.05, shine effect

### Icon Guidelines
- **Size**: `w-5 h-5` (small), `w-6 h-6` (medium), `w-8 h-8` (large)
- **Color**: Match text color or use purple accent
- **Style**: Lucide React icons preferred

## Animations & Motion

### Framer Motion Patterns
```javascript
// Page entrance
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8 }}

// Staggered children
transition={{ duration: 0.6, delay: index * 0.2 }}

// Hover interactions
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}

// Background elements
animate={{
  x: [0, 50, 0],
  y: [0, -30, 0],
  scale: [1, 1.1, 1],
}}
transition={{
  duration: 8,
  repeat: Infinity,
  ease: "easeInOut"
}}
```

## Layout Patterns

### Full-Width Sections
```css
relative min-h-screen
bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950
overflow-hidden
```

### Container
```css
container mx-auto px-4 py-20
relative z-10
```

### Two-Column Layout
```css
grid lg:grid-cols-2 gap-16 items-center w-full
```

## Glassmorphism Effects

### Primary Glass
```css
bg-gradient-to-br from-slate-800/40 to-slate-900/40
backdrop-blur-xl
border border-purple-500/20
```

### Subtle Glass
```css
bg-black/50 backdrop-blur-sm
border border-purple-500/10
```

## Shadow System

### Card Shadows
- **Standard**: `shadow-2xl`
- **Hover**: `hover:shadow-purple-500/25`
- **Prominent**: `shadow-2xl hover:shadow-purple-500/30`

### Glow Effects
```css
w-72 h-72 bg-purple-500/20 rounded-full blur-3xl
absolute top-20 left-10
```

## Usage Guidelines

### Do's
- Use purple gradients for primary brand elements
- Apply consistent spacing using the spacing system
- Use backdrop blur for modern glass effects
- Implement smooth transitions and hover states
- Maintain contrast ratios for accessibility

### Don'ts
- Don't use colors outside the defined palette
- Don't mix different gradient directions inconsistently
- Don't use solid colors where gradients are expected
- Don't skip hover states on interactive elements
- Don't use text smaller than 14px for body content

## Responsive Breakpoints

- **Mobile**: Default styles
- **Tablet**: `md:` prefix (768px+)
- **Desktop**: `lg:` prefix (1024px+)
- **Large**: `xl:` prefix (1280px+)