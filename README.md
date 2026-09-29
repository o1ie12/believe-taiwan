# BELIEVE

Website for **BELIEVE**, a Christian streetwear brand from Taiwan, launching the **BELIEVE 01** tee —
a limited run of 40 pieces in black and white, NT$750.
Built with Vite, React and three.js (react-three-fiber).

## Develop

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Build & deploy

```bash
npm run build
```

Outputs a static site in `dist/`. On Netlify: build command `npm run build`, publish directory `dist`.

Set `VITE_SITE_URL` (in `.env` or the host's environment variables) to the live address, e.g.
`https://believetaiwan.com`, so link previews on LINE / Instagram / Facebook find the share image.

## Pages

| URL | Page | File |
| --- | --- | --- |
| `/` | Brand home: hero, faith statement, drop chooser | `src/pages/Home.jsx` |
| `/believe-01` | BELIEVE 01 product page | `src/pages/Believe01.jsx` |
| `/believe-02` | BELIEVE 02 teaser (no details confirmed yet) | `src/pages/Believe02.jsx` |
| `/shop` | Gallery of every product: live 3D tee per card, buy links (`SHOP_ITEMS` in `src/shop.jsx`) | `src/pages/ShopPage.jsx` |

Routing is a small in-house router (`src/router.jsx`) with a curtain transition; `public/_redirects`
makes Netlify serve the app for every URL. Drops shown in the chooser and menu: `src/drops.js`.

## Where things live

| What | Where |
| --- | --- |
| App shell, footer | `src/App.jsx` |
| Shop cards, size guide (Shopee links: `SHOPEE`) | `src/shop.jsx` |
| Loader, info bar, menu, scope overlay, stats | `src/hud.jsx` |
| Lookbook photos and horizontal track (`PHOTOS`, `TRACK`) | `src/Lookbook.jsx` |
| 3D scene, materials, lighting | `src/Scene.jsx` |
| Where the tee sits in each section (desktop and phone) | `src/poses.js` |
| Real 3D model settings (rotation, print placement, credit) | `src/model.js` |
| Built-in fallback tee | `src/tee.js` |
| Logos, lookbook photos, 3D model, share image | `public/` |

## Credits

- 3D model: ["T Shirt"](https://sketchfab.com/3d-models/t-shirt-c1a3e5eb9b5445f4b7d4be82f1127eba) by funlab117,
  licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Colors and prints applied.
- Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978,
  1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.
