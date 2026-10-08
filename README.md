# thedepressedceramicist.com

Static site for The Depressed Ceramicist (Sedalia, MO). Plain HTML/CSS, hosted on GitHub Pages.

## Files
- `index.html`: all page content (text, hours, links)
- `styles.css`: design
- `main.js`: animations (GSAP + Lenis from CDN), rain effect, open-now badge, photo viewer, mobile menu
- `images/`: photos from The Depressed Ceramicist Facebook page and artroomusa.com

To change hours, edit the hours list in `index.html` **and** the `HOURS` object at the top of `main.js` (it drives the "Open now" badge).

To add a gallery photo, put it in `images/` and copy one of the `<a class="g-item">` lines in the Art Room gallery.

## Deploying (GitHub Pages)
1. Push this folder to a public GitHub repo.
2. In the repo, go to **Settings → Pages**, set Source to **Deploy from a branch**, pick `main` / `(root)`, and save.
3. Under **Custom domain**, enter `thedepressedceramicist.com`. The `CNAME` file already contains it.
4. Once DNS works, tick **Enforce HTTPS**.

## GoDaddy DNS
In GoDaddy, go to **My Products → thedepressedceramicist.com → DNS**. Delete any existing `A` record for `@` (the "Parked" one) and the `CNAME` for `www`, then add:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `<your-github-username>.github.io` |

DNS can take anywhere from a few minutes to a few hours to update.
