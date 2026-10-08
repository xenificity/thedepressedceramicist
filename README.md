# thedepressedceramicist.com

Static site for The Depressed Ceramicist (Sedalia, MO). Plain HTML/CSS, hosted on GitHub Pages.

## Adding photos
Drop images into `images/` with these names. Any missing photo shows a colored placeholder.

| File | Where it shows |
|---|---|
| `piece-1.jpg` … `piece-6.jpg` | Gallery tiles (edit captions in `index.html`) |
| `india.jpg` | Round photo in the About section |

Square or 4:5 portrait photos work best. Keep each under ~500 KB.

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
