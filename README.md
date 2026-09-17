# Jackstand

Static site. The root domain is the landing page, and `/<slug>` is a demo site built
for a prospect before Johnny walks in the door.

The internet side of trades and auto businesses: website, Google, reviews, and missed
calls texted back in seconds. From $250 a month, flat.

## Layout

```
public/index.html          -> the landing page (Johnny's design, hand-maintained)
public/<slug>/index.html   -> a prospect's demo site (generated, do not hand-edit)
templates/<name>/index.html   one template per vertical, {{TOKENS}} for business info
demos/<slug>.json             the business info for one prospect  <- this is what you edit
scripts/demo.mjs              renders demos/*.json through a template into public/
```

`demos/<slug>.json` is the source of truth for a prospect. `public/<slug>/` is build
output. Improve a template, run `node scripts/demo.mjs build`, and every demo using it
is regenerated. That is the whole point: 40 prospects, one template fix.

## Adding a prospect

```bash
node scripts/demo.mjs init auto-shop joes-garage   # creates demos/joes-garage.json
# fill in the fields, or ask Claude to from the business's Google listing
node scripts/demo.mjs build joes-garage        # renders public/joes-garage/
git add -A && git commit -m "Add joes-garage demo" && git push
```

Live about 30 seconds after the push.

## Local preview

```bash
npx serve public
```

Not `open index.html`: demo pages link to `/` for the root, which only resolves over http.

## The three styles

Johnny can see the same business in three designs, so pick by changing `_template`
in that prospect's JSON and rebuilding. All three share an identical token set, so
nothing else has to change.

| `_template` | Look |
|---|---|
| `auto-prospect` | **Workshop.** Dark hero photo, condensed uppercase type, industrial. |
| `auto-editorial` | **Editorial.** Cream, serif headlines, full-bleed photography, airy. |
| `auto-bold` | **Bold.** Blocky, high contrast, offset shadows, colour-blocked header. |

`auto-shop` is the original and is for the fictional sample only. **Do not point a
real business at it**: it has slots for a star rating, review count, years in
business and three named testimonials, and filling those for a shop we have not
spoken to puts invented customers on a page carrying their name.

## The About section and team names

Each prospect page has an About block: a photo of a workshop, a paragraph of verified
facts about that business, and three team cards.

**Never pair a real person's name with a stock photo of a stranger.** That is the one
mistake on these pages an owner spots in a second. Team cards therefore use a monogram
avatar, never a face.

Where a name is published by the business itself, it is used. Where it is not, the card
is an explicit placeholder reading "Your name here", which is a better prompt than a
made-up Mike and gives Johnny something to fill in at the counter.

Names currently on the pages, with where each came from:

| Shop | Name | Source | Confidence |
|---|---|---|---|
| Vince's | Vince (Owner) | Business name + review on their own site | good |
| Vince's | Edward (Customer service) | Review on their own site | confirm role |
| A.G. Automotive | Tammy, Chuck, Abraham | Review on their own site, roles unstated | confirm roles |
| 26 Auto Body | Jason (Estimates) | Their published contact address | confirm role |
| Valley Discount | Robert Hussain | Directory listing him as contact | confirm |

Deliberately **not** used, and why:

- **A1 Transmission**: reviews call the owner both "Mr. Young" and "Mr. Lee". Two
  surnames for one person means we do not know it.
- **Brake Land**: a single Yelp review mentions "Mike". One review is not a source.
- **L.A. Sam's, John's**: "Sam" and "John" are in the business names, but nothing
  confirms either is still there. A shop named after a founder who retired in 2004 is
  a common thing.

## Photography

Hero and service images are Unsplash URLs in each prospect's JSON (`HERO_IMG`,
`IMG_1`..`IMG_3`), hotlinked from their CDN. They are stock, chosen to match the
shop's actual trade: tires for tire shops, panel and paint work for body shops.

Replace them with the shop's own photos as soon as they are a client. Stock imagery
is fine for a draft the preview bar already labels as ours, but a real shop's own
bay is worth more than any stock photo, and owners notice.

## Rules

- Slugs are lowercase-with-hyphens and permanent once sent to a prospect.
- Demo pages carry `noindex`, set in `netlify.toml` and in each template's `<head>`.
  A demo must never compete with the prospect's real site in Google.
- **Never invent reviews, ratings or credentials for a real business.** Pull their actual
  Google reviews or leave the block out. A page branded with their name carrying made-up
  testimonials is the fastest way to lose the room.
- Each demo is self-contained: one `index.html`, CSS inline, assets from a CDN. No build
  step and no shared stylesheet to break across 40 pages at once.
- The bar at the top of a demo ("Preview site built for X") is what sends a prospect to
  the root domain. Only remove it when the site moves to the client's own domain.
