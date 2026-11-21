# Pulkit Singh — Portfolio

A personal portfolio for Pulkit Singh, built as an editorial field archive. It brings together software projects, open-source and community work, writing, talks, education, and recognition in one responsive site.

## The site

- Navy, cyan, and red visual system with DM Serif Display and Poppins typography.
- Opening wordmark that writes “PULKIT” and expands into the cover headline.
- Pointer-responsive web background on the cover, with motion reduced when requested by the device.
- Scroll-led experience and writing cards that move forward and fade through the archive, in chronological order.
- Project case studies, articles, talks, community roles, education, skills, and recognition.
- Music starts automatically when the browser allows it; visitors can pause, resume, seek, and set the volume. If browser autoplay is blocked, the player invites a tap to start.
- Keyboard-friendly section navigation.
- Layouts adapted for desktop, tablet, and mobile.

## Built with

React, TypeScript, Vite, GSAP, and Lenis.

## Run locally

Use Node.js 22.12 or newer and npm.

    npm ci
    npm run dev

Open the local address printed by Vite, usually http://localhost:5173.

Create and preview a production build:

    npm run build
    npm run preview

The built site is written to the dist/ folder.

## Project map

- src/App.tsx — site configuration and portfolio content.
- src/components/portfolio/PulkitPortfolio.tsx — page sections, projects, archives, navigation, and interactions.
- src/components/PortfolioIntro.tsx — animated wordmark-to-headline opening.
- src/components/portfolio/SpiderParticles.tsx — responsive cover web background.
- src/components/FloatingMusicPlayer.tsx — music player.
- public/ — images, video, audio, and other site assets.
- .github/workflows/deploy.yml — GitHub Pages build and deployment.

## Before publishing

Review role descriptions, dates, project attributions, external links, image rights, and public contact details. Keep personal contact information and CV links private until you intend to publish them.

## Design attribution

The original editorial layout is adapted from the Marginalia Portfolio design by Kedhareswer Naidu. See docs/ATTRIBUTION.md and retain the listed license and attribution when redistributing derived work.

