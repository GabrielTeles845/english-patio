# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

English Patio is an institutional website for an English language school built with React, TypeScript, and Tailwind CSS. The site showcases the school's courses, methodology, infrastructure, and provides information about their unique teaching approach focused on children and teenagers.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Architecture

### Routing Structure

The application uses React Router v6 with a nested route structure defined in `src/routes/index.tsx`:

- **RootLayout**: Wraps all routes with `ScrollToTop` component that scrolls to top on route changes
- **Base path**: `/english-patio` (configured for GitHub Pages deployment)
- **Routes**:
  - `/` - Home page
  - `/nossas-aulas` - Our Classes page
  - `/foco-e-acao` - Focus and Action methodology page
  - `/vacation-classes` - Vacation Classes information page

### Component Organization

Each page is composed of smaller, reusable components:

- **Pages** (`src/pages/`): Top-level route components that compose sections
- **Components** (`src/components/`): Reusable UI components organized by function:
  - Navigation: `Navbar.tsx`, `Footer.tsx`
  - Hero sections: `HeroSection.tsx`, `ClassesHero.tsx`, `FocusHero.tsx`, `VacationHero.tsx`
  - Content sections: `AboutSection.tsx`, `CoursesSection.tsx`, `TestimonialsSection.tsx`, `ContactSection.tsx`
  - Utility components: `Modal.tsx`, `Logo.tsx`, `WaveDecoration.tsx`, `LearningPyramid.tsx`

### Path Aliases

The project uses path aliases configured in both `vite.config.ts` and `tsconfig.json`:

```typescript
@/ → src/
@components/ → src/components/
@pages/ → src/pages/
@types/ → src/types/
@services/ → src/services/
@utils/ → src/utils/
@assets/ → src/assets/
```

### Styling System

**Tailwind CSS** with custom design tokens:

**Colors**:
- `primary`: #1E3765 (Dark Blue) - main brand color
- `secondary`: #F5B700 (Yellow) - accent color
- `background`: #FFFFFF (White)

**Fonts**:
- Body: 'Comic Neue' (cursive)
- Headings: 'Fredoka One' (cursive)

**Custom CSS Classes** (defined in `src/index.css`):
- `.btn-primary`, `.btn-secondary` - Styled buttons with hover effects
- `.card` - Rounded white cards with shadows
- `.pattern-bg` - Gradient background pattern
- `.section-title`, `.section-subtitle` - Consistent section headings
- `.glass-effect` - Glassmorphism backdrop blur
- `.gradient-text` - Gradient text effect
- Animation classes for navbar: `.mobile-menu-enter`, `.mobile-menu-exit`, `.submenu-item-enter`

### Navigation Features

The `Navbar` component includes:
- Fixed position with backdrop blur
- Desktop dropdown submenu on hover for "Início" (Home)
- Mobile hamburger menu with smooth slide animations
- Smooth scroll to sections within the homepage
- Modal system for "in development" features (currently showing for Login)
- Global event listener for `showDevelopmentModal` custom event

### Modal System

`Modal.tsx` is a reusable modal component used throughout the application for notifications and temporary content display. It can be triggered:
- Directly via component state
- Via custom event: `new CustomEvent('showDevelopmentModal', { detail: { feature: 'Feature Name' } })`

### Assets Organization

Images are organized by feature:
- `src/assets/` - Main images (logo, hero images)
- `src/assets/our-classes/` - Classroom photos
- `src/assets/testimonials/` - Student testimonial images
- `src/assets/foco-e-acao/` - Focus and Action methodology images
- `src/assets/vacation-classes/` - Vacation classes photos

## Deployment

The site is configured for GitHub Pages deployment:
- **Homepage**: https://GabrielTeles845.github.io/english-patio
- **Base path**: `/english-patio/` (configured in vite.config.ts and router)
- **Deploy command**: `npm run deploy` (builds and pushes to gh-pages branch)

## Important Notes

1. **textos.txt**: Contains Portuguese notes about pending changes and new content requirements for the site. Reference this file when making content updates.

2. **TypeScript Configuration**: Uses strict mode with additional linting rules (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)

3. **Scroll Behavior**: The application implements smooth scrolling through:
   - Global CSS (`scroll-behavior: smooth`)
   - `ScrollToTop` component in routes
   - Manual `scrollIntoView` for section navigation

4. **Mobile-First Design**: The site uses responsive design with mobile menu animations and adaptive spacing (`pt-16 md:pt-8` pattern).

5. **ESLint**: TypeScript-ESLint with React-specific plugins configured for code quality.
