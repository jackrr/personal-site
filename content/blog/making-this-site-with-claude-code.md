# Making this site with Claude Code

## Why

- I feel I'm being left behind by all this AI hype.
-

## What I did

### 1. Made a thorough set of instructions

## Problems

### Imagemagick resize

Imagemagick script was failing. Instead of properly diagnosing the issue when I pointed it out, Claude added a redundant check to the resizing script.

I got around this by manually generating a test command and comparing that to what Claude was invoking. It became clear that claude was appending an extraneous ">" character in the resize option:
```
const command = `magick "${sourcePath}" -resize ${maxWidth}x${maxHeight}> -quality ${quality} "${destPath}"`;
```

When I pointed that out to Claude, it strangely added an escape sequence `-resize ${maxWidth}x${maxHeight}\\>`:
![Escape sequence wut]("./claude-resize-escape-wut.png")

### Vertical centering icons

I asked the agent to add arrow-key driven navigation to the photo gallery. Amazingly it added a working version with minimal prompting. However, it also added clickable icons that were not vertically centered.

It's a good reminder that Claude Code can't "see" the page and make aesthetic judgements. Pixel pushing is Claude is a rough feedback cycle and you're better off diving into the codebase for this sort of tweak.
