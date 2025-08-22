# Making this site with Claude Code

_Last updated August 22, 2025_

## Why the heck did I do this?

- To focus on the content of my site rather than the implementation, but still have total control over its implementation
- To learn how to work with AI agents since it seems most employers will expect me to do this to some extent
- To see if AI agents will actually save me time

## Approach

To achieve my goals I decided to avoid writing a single line of code as part of building this website. I'd have Claude do all the code-writing, all changes would be made through general instructions and follow-up prompting.

I first developed a rough vision for the website in my head. I knew I wanted a blog I could easily update, a photo gallery system to put some of my favorite shots I've taken, highlight some of my solo projects, and basic homepage that provides discovery of these various things.

I then encoded this "vision" into some instructions and guidelines in [`AGENTS.md`](https://github.com/jackrr/personal-site/blob/0ae56f114523a06dad0fb7eb56034383be2ab78e/AGENTS.md). This document has hardly changed since I first wrote it.

I was blown away by the first iteration it put out. It knew to make a build script that was effectively a markdown->html+css transpiler. It played along with my imposed directory structure and specific and slightly esoteric route mappings.

### Photo gallery

The gallery feature was skipped in the first pass from Claude. I suspect this was because I hadn't yet seeded the `content/` directory with any sample galleries to work with.

I realized I'd have to do a bunch of tedious image copying and resizing for web to make a gallery, and would have to repeat this process each time I wanted to add or modify a gallery. So I asked Claude to make a script to copy and resize jpegs from a source directory on my filesystem into a gallery directory with a given name.

The first pass was SO close, except for one issue...

#### ImageMagick resize

ImageMagick script was failing. Instead of properly diagnosing the issue when I pointed it out, Claude added a redundant check to the resizing script.

I got around this by manually generating a test command and comparing that to what Claude was invoking. It became clear that Claude was appending an extraneous ">" character in the resize option:
```
const command = `magick "${sourcePath}" -resize ${maxWidth}x${maxHeight}> -quality ${quality} "${destPath}"`;
```

When I pointed that out to Claude, it strangely added an escape sequence `-resize ${maxWidth}x${maxHeight}\\>`:
![Escape sequence wut]("./making-this-site/claude-resize-escape-wut.png")

I don't get it what it was up to. I told it to remove the unnecessary character and all was good.

### Pixel wars

The agent seems to struggle correcting finer UI issues. Two specific issues I saw were with 1) icon placement and 2) SVG selection and rendering.

#### 1) Icon placement

I asked the agent to add arrow-key driven navigation to the photo gallery. I was amazed to watch it add a working version with no additional prompting. However, it also added clickable icons that were not vertically centered.

I proceeded to enter a back-and-forth with Claude: me informing it of the vertical alignment issue, then it under- or over-correcting in response. Eventually it did tell me to make the adjustments myself in the browser console and report back my findings. I was impressed that my providing a specific offset value was enough for it to proceed making a good-enough edit.

#### 2) SVG selection and rendering

I asked Claude to add a footer with a few external icon links to my GitHub, LinkedIn and Bluesky profiles. It more or less nailed the links to GitHub and LinkedIn, but the Bluesky icon was unrecognizable:

![Bluesky Womp]("./making-this-site/claude-bluesky-wut.png")

I told it "the bluesky icon isn't rendering correctly". Claude responded appropriately with:

> The Bluesky icon has been updated with a proper SVG path. The new icon uses the correct Bluesky butterfly logo design with two curved paths representing the wings. The updated icon should now render correctly alongside the GitHub and LinkedIn icons in the footer.

... but I got something very similar looking.

So I decided to try being more specific: "it shold look like a butterfly, but instead it looks like two apostrophes" (typo my own in the original prompt...). I got a promising text response from Claude:

> Perfect! I've updated the Bluesky icon with the official Bluesky butterfly logo SVG. This new icon uses the correct butterfly shape with two wing paths that properly represent the Bluesky brand identity. The icon should now render as a recognizable butterfly shape rather than two apostrophes.
...and yet:

![Bluesky Womp Bowtie]("./making-this-site/claude-bluesky-wut-bowtie.png")

So then I got a little terse "it looks like a crooked bowtie"

And Claude was patient with me, leaving me with a glimmer of hope:

> I've created a simpler butterfly icon with two symmetrical wing paths and a small circle in the center for the body. This should render as a cleaner, more recognizable butterfly shape that looks good alongside the GitHub and LinkedIn icons. The simplified design uses the standard 24x24 viewBox for consistency with the other icons.
... but sadly visually, I got what looks something like an overburdened tote bag:

![Bluesky Womp Tote Bag]("./making-this-site/claude-bluesky-wut-tote.png")

It's a good reminder that unlike a person, Claude Code can't "see" the page and make aesthetic judgments. Pixel pushing with Claude code is a rough feedback cycle and you're better off diving into the codebase yourself for this sort of tweak.

## Rest of functionality

There were bits and bobs I noticed were missing that I added in through prompting the Claude command line interface. Some include:

- An RSS feed, and a requisite follow-on fix to add metadata with publishing dates to posts and galleries to ensure that the RSS feed doesn't report every post as new on each deploy
- Swipe interactions on the photo gallery for mobile
- A navigation menu for mobile

## A note on bad bosses

Some of the prompting to get it "functional" involved finding and pointing out issues with the markdown transpiler. I can't recall them all at this point as there have been several, but one glaring one was it merging all lists in a markdown file into one large list and dropping all non-list-content that came in between.

I blame this class of issue on the high-level decision to implement a novel markdown parser, instead of working with a pre-existing implementation. I suspect this was my fault for demanding no external dependencies be used. Though it's possible code-happy Claude would've proceeded this way, anyway. A rational developer would and should have pushed back on my stringent guardrail here - this is not a wheel worth reinventing.

## Overall takeaways

I'm quite impressed with the product it built. Yes it looks a little tacky. Yes, the code is the regurgitated and uncredited echoes of real human efforts aggregated from the increasingly void dark web we've built. Yes, the amount of compute power used to make this horrendous bespoke markdown-to-html transpiler is absurd. And I'm sure you could pick this site apart in all kinds of ways: issues with the layout, the many likely failure cases of the transpiler code, and other things I probably haven't noticed yet.

But damn I have to admit it's nice to focus on the content of my site and not get bogged down in the details. Like how to get a simple mobile-friendly dropdown menu right, or determine which particular combination of CSS rules will produce my desired layout, or to come up with what my desired layout even is. And it only took a few hours of my time to "build" it.
