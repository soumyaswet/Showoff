# Soumya Swet — Portfolio

Personal portfolio of **Soumya Swet**, also known as **AUSMONAUT** — showcasing graphic design, digital artwork, front-end development projects, education, and contact information.


## Overview

This repository contains a responsive, browser-based portfolio built with HTML, CSS, and vanilla JavaScript. It is designed as a visual introduction to Soumya's work as a designer and developer.

### Highlights

- **Personal landing page** with an animated role label and introductory statement.
- **Design gallery** featuring digital illustrations, environment studies, product artwork, character design, and visual studies. Select an artwork to open it in a full-size lightbox.
- **Development gallery** linking to PassCure, QrDrive, and BuildCircuit.
- **Education section** presenting academic history and achievements.
- **Contact section** with email addresses and links to GitHub, LinkedIn, and Instagram.
- **Light and dark themes**, with the selected theme saved in browser local storage.
- **Responsive navigation** with a collapsible mobile menu.
- **Horizontal project galleries** with arrow controls, scrolling, and mouse dragging.
- **Project detail pages** with project descriptions and an optional YouTube walkthrough preview when a video URL is configured.
- **Accessibility touches**, including semantic page sections, descriptive image text, keyboard-friendly controls, and reduced-motion handling for the animated role label.

## Tech stack

- HTML5
- CSS3 (custom responsive styling)
- Vanilla JavaScript using browser APIs and ES modules
- Google Fonts: Cormorant Garamond, DM Mono, DM Sans, and Manrope
- Local browser storage for the theme preference

No frontend framework, package manager, or build step is required for the portfolio website.

## Repository structure

```text
Portfolio-soumyaswet/
├── index.html                 # Main portfolio page
├── portfolio.css              # Main portfolio styles
├── portfolio-interactions.js  # Theme, navigation, galleries, lightbox, and video previews
├── project.html               # Data-driven project detail page
├── project-page.js            # Project detail content and page rendering
├── project-pages.css          # Project detail page styles
├── atlas.html                 # Atlas project concept page
├── form-field.html            # Form & Field identity concept page
├── style.css                  # Additional application styles
├── app.js                     # PassVault application logic
├── Media/                     # Design portfolio artwork and image assets
└── dev/                       # Development project preview images
```

## Run locally

Because this is a static website, you can run it without installing dependencies.

1. Clone the repository:

   ```bash
   git clone https://github.com/soumyaswet/Portfolio-soumyaswet.git
   cd Portfolio-soumyaswet
   ```

2. Open `index.html` in your browser, or start a local static server. For example, with Python:

   ```bash
   python -m http.server 8000
   ```

3. Visit `http://localhost:8000`.

Using a local server is recommended so that browser ES modules and relative assets load consistently.

## Deployment

The site is compatible with GitHub Pages because it is a static HTML/CSS/JavaScript project.

1. Open the repository's **Settings → Pages** on GitHub.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and the repository root (`/`) as the source.
4. Save the settings and wait for GitHub Pages to publish the site.

After deployment, the portfolio is available at the GitHub Pages URL configured for the repository.

## Customization

- **Personal details and page sections:** edit `index.html`.
- **Colors, typography, layout, and responsive behavior:** edit `portfolio.css` and `project-pages.css`.
- **Theme, mobile navigation, artwork lightbox, gallery behavior, and video previews:** edit `portfolio-interactions.js`.
- **Project detail content:** update the `projects` object in `project-page.js`.
- **Artwork and project thumbnails:** replace or add assets in `Media/` and `dev/`, then update their references in the relevant HTML.
- **External project links and social profiles:** update the corresponding anchors in `index.html`.

### Adding a project walkthrough

Project detail pages support an optional YouTube URL through the `data-youtube-url` attribute on a `.walkthrough-frame` element. Add a valid YouTube or youtu.be URL there to enable the embedded preview and the external watch link.

## Notes

- The portfolio loads its fonts from Google Fonts, so an internet connection is needed for those fonts.
- Artwork and project preview images are stored in the repository and referenced using relative paths.
- The repository also includes `app.js`, which contains PassVault password-manager application logic. It is separate from the main portfolio page's script entry point.
- The password-manager script uses browser local storage and a demonstration-only hash function; it should not be treated as a production-secure password vault without a security redesign.

## Connect

- **GitHub:** https://github.com/soumyaswet
- **LinkedIn:** https://www.linkedin.com/in/soumyaswet/
- **Instagram:** https://www.instagram.com/soumyaswet/
- **AUSMONAUT on Instagram:** https://www.instagram.com/ausmonaut/
- **Email:** soumyaswet@gmai.com

---

© 2026 Soumya Swet · AUSMONAUT
