# Aurora Landing V2

A premium, cinematic landing page for VouchEdge following Aurora design principles.

## Architecture

- **Foundation**: Design tokens, typography, and base styles in `styles/foundation.css`
- **Motion**: Ken Burns effect and transitions in `motion/animations.css`
- **Components**: Reusable UI components in `components/`
- **Sections**: Page sections in `sections/`
- **Composition**: Main page composition in `LandingPage.tsx`

## Design Principles

- Cinematic MLB stadium photography
- Deep obsidian backgrounds
- Cyan data accents
- Gold trust indicators
- Glass surfaces
- Dense information
- Beautiful whitespace

## Typography

- Display: General Sans
- UI: Geist Sans
- Numbers/Tables: Geist Mono

## Motion

- Maximum duration: 200-350ms
- 60 FPS
- No bouncing
- Purposeful animations only
- Reduced motion support

## Integration

The landing page uses the existing section navigation system (`useSectionNavigation`) and integrates with the VouchEdge app shell.

## Assets Required

- `/stadium-hero.jpg` - Cinematic stadium background image for hero section
