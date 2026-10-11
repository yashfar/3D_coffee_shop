# Zeytin Cafe — Next.js source

Exported from source commit 8208aef0677a27d86d047132b987edefcbc8a8d6.
Includes all cafe photographs, forward/reverse tour videos, drink photos and dessert photos.

## Local development (Windows, macOS, Linux)

Install Node.js 22.13 or newer. Open a terminal in this folder.

```sh
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:5173. No API keys or database are needed for the cafe tour.

## Production static export

```sh
pnpm build
```

The result is in `out/`. This project uses `output: "export"`; serve `out/` with a static file server rather than `next start`.

## Main files

- app/page.tsx: tour scenes and navigation
- app/globals.css: page layout and responsive styles
- components/ProductCarousel.tsx: horizontal drink/dessert menus
- lib/drinks.ts and lib/desserts.ts: menu item names and images
- public/: all photo and video assets

The archive excludes node_modules, build caches, Git credentials and hosting account metadata.
