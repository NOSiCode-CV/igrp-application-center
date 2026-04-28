# IGRP Theming & CSS Setup

## CSS Setup (globals.css)

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

/* Scan app and design system for Tailwind classes */
@source "../**/*.{ts,tsx,js,jsx}";
@source "../../node_modules/@igrp/igrp-framework-react-design-system/dist/**/*.{js,jsx,ts,tsx,mjs,cjs}";

/* Import design tokens (CSS variables) */
@import '@igrp/igrp-framework-react-design-system/tokens';

/* Optional: your theme overrides */
@import './themes.css';
```

> **Do NOT** import `@igrp/*/styles.css` — only tokens.

## Core CSS Tokens

```css
:root {
  /* Backgrounds & Text */
  --background: ...;
  --foreground: ...;

  /* Component colors */
  --primary: ...;
  --primary-foreground: ...;
  --secondary: ...;
  --secondary-foreground: ...;
  --muted: ...;
  --muted-foreground: ...;
  --accent: ...;
  --accent-foreground: ...;
  --destructive: ...;

  /* Borders & Focus */
  --border: ...;
  --input: ...;
  --ring: ...;

  /* Radius */
  --radius: 0.5rem;

  /* Charts */
  --chart-1: ...;
  --chart-2: ...;
  --chart-3: ...;
  --chart-4: ...;
  --chart-5: ...;

  /* Sidebar */
  --sidebar: ...;
  --sidebar-foreground: ...;
  --sidebar-primary: ...;
  --sidebar-accent: ...;
  --sidebar-border: ...;
  --sidebar-ring: ...;

  /* Process / Stepper */
  --process-completed: ...;
  --process-active: ...;
}

.dark {
  /* All tokens above are overridden for dark mode */
}
```

## Custom Theme (themes.css)

Override tokens after the `@import '@igrp/.../tokens'` line:

```css
/* Custom primary color */
:root {
  --primary: oklch(0.35 0.2 250);
  --primary-foreground: oklch(0.98 0 0);
}

.dark {
  --primary: oklch(0.7 0.15 250);
  --primary-foreground: oklch(0.1 0 0);
}
```

## Theme Variants (color schemes)

```css
/* Blue theme */
.theme-blue {
  --primary: var(--color-blue-600);
  --primary-foreground: var(--color-blue-50);
}

.theme-blue.dark {
  --primary: var(--color-blue-400);
  --primary-foreground: var(--color-blue-950);
}

/* Green theme */
.theme-green {
  --primary: var(--color-green-600);
  --primary-foreground: var(--color-green-50);
}
```

Apply in HTML: `<html class="theme-blue">` or `<html class="theme-blue dark">`.

## Dark Mode Setup (next-themes)

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Meta Theme Color (mobile browser chrome)

```tsx
// In root layout or _app
import { useIGRPMetaColor, IGRP_META_THEME_COLORS } from '@igrp/igrp-framework-react-design-system';

function MetaColor() {
  useIGRPMetaColor();   // syncs <meta name="theme-color"> with current theme
  return null;
}
```

## IGRPColors Utility

```tsx
import { IGRPColors, IGRPColorObjectVariants, igrpColorText } from '@igrp/igrp-framework-react-design-system';

// Color palette constants
console.log(IGRPColors);             // { primary: '#...', ... }

// Color variant objects
console.log(IGRPColorObjectVariants); // { success: { bg: '...', text: '...' }, ... }

// Get text class for a color
const textClass = igrpColorText('success');  // 'text-green-600'
```

## Radius Customization

```css
:root {
  --radius: 0.375rem;   /* sm: tight UI */
  /* or */
  --radius: 0.75rem;    /* lg: rounded UI */
  /* or */
  --radius: 0px;        /* no rounding: sharp UI */
}
```
