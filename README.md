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

## Deploy to GitHub Pages

The workflow at .github/workflows/deploy.yml builds and deploys dist/ whenever main is updated. The repository should be pulkitsinghdev.github.io, with main as its default branch.

1. Push the project to https://github.com/pulkitsinghdev/pulkitsinghdev.github.io on main.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** under **Build and deployment**.
3. Check the **Actions** tab. After the deployment workflow finishes, the site will be available at https://pulkitsinghdev.github.io.

### Connect pulkitsingh.tech

Verify ownership before connecting the domain. On GitHub, open your profile **Settings → Pages → Add a domain**, enter pulkitsingh.tech, then add the TXT record GitHub provides in Namify. Keep this TXT record after verification. Namify's DNS editor is under **Manage → DNS**; if DNS is managed by custom nameservers, make the changes at that DNS provider instead.

After GitHub marks the domain verified, open this repository's **Settings → Pages**, select **GitHub Actions** as the publishing source, and enter pulkitsingh.tech as the custom domain. Then add these records in the active DNS editor:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | pulkitsinghdev.github.io |

Remove only conflicting parking records and A/AAAA records for @ or a conflicting www record. Keep MX/TXT records used for email or domain verification. Wait for GitHub's DNS check and HTTPS certificate, then turn on **Enforce HTTPS**. DNS changes can take up to 24 hours to propagate. This Actions workflow does not require a CNAME file in the repository. See [GitHub's domain verification guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages) and [Namify's DNS guide](https://helpdesk.namify.tech/en/articles/10353226-how-to-add-edit-or-delete-dns-records).

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

