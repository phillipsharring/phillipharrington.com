# Improve the blog

A content review of `/blog` as of Nov 26, 2026, after the IA and mastermind passes (Nielsen, Tufte, Greenspun). The site itself is in good shape; this is about what's written on it.

## What's there

8 published posts in three clusters, plus one music post:

| Cluster | Posts |
|---|---|
| Dev craft | Everybody Knows Alice, Did You Run This Code?! |
| Things I built | HTML is Fun Again, A 20-Year Side Project, How in the Hell Does My Static Site Have Comments? |
| Inner life | Say It Once, You Are Not Your Brain |
| Music | "Smile Big" by MaShanda (2022, mostly a video embed) |

Drafts live in `drafts/` (the build only reads `content/pages/`, so nothing there is published): My Trick for Managing ADHD.

## What's working

- **Voice.** Funny, direct, practical, consistently mine. TL;DRs up top, $2 tips. Posts like these get finished.
- **The personal-rules posts** (Say It Once, You Are Not Your Brain, Did You Run This Code) are the most distinctive: short, opinionated, useful to people who'll never read my code.
- **Open source.** The whole site is on GitHub, and posts link straight to the code behind them (Steal This boxes).
- **Momentum.** Three posts in November, two in the spring, after long gaps.

## The gaps

1. **Nothing backs up the home page pitch.** Home says I upgrade legacy PHP applications; no post is about PHP, legacy code or modernization. Biggest gap, for search and for business.
2. **Music is nearly absent.** The tagline promises "playing music" and the Music page is the richest on the site, but the only music post is a 2022 video embed.
3. **A lot of self-reference.** Three of eight posts are about building my own things, and two plug Reuse Lists. Fine one at a time; together the blog leans "here's my thing". Posts about other people's problems balance it.
4. **Nothing on leading teams.** I'm a team lead; code review, mentoring and onboarding are all fair game, and Did You Run This Code? proves the format works.

## Queue, in order

1. **A PHP post**, then the **PHP series** as a `/php` section, one lesson per page (from my syllabus outline). Even one "what actually breaks from PHP 7 to 8" post helps.
2. **Gig how-to:** tips and tricks for gigging drummers, with Reuse Lists where it naturally fits.
3. **The mastermind group:** the site review through each member's eyes, fixes sorted by member.
4. **The AI collaboration:** what reworking the site with an AI was actually like. Separate from #3.
5. **Music:** the Baby Drum Set story; "Stacy The Waitress" and meeting Janis Ian.
6. **Leading teams:** code review, mentoring, onboarding.
7. **Mental health:** on my terms, at my pace.
8. **Finish or drop** My Trick for Managing ADHD (in `drafts/`).

## Next mastermind members

Saved for a future pass, not applied yet:

- **Brian Clark** (Copyblogger): copywriting. Headlines, first lines, the one-line summaries on `/blog`, the calls to action in the callouts.
- **Seth Godin:** marketing and point of view. Who each post is for, and what the site is the best at for them.

## Every new post gets

- A square image at the top (600px, `-400`, `-full` behind the tap) and a 1200x630 share image with `og:image:width`/`height`
- `<comment-count />` under the byline and `<inject-comments />` at the end
- An entry on `/blog` with a one-line summary and `<comment-count path="/slug" />` (the newest month sits beside the photo)
- A Steal This box when there's code to link
