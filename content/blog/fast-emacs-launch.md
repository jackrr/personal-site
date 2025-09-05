---
published_at: 2025-09-05 01:30 PM
---
# Fast Emacs Launch (by cheating)

TIL about the option to run [emacs as a daemon](https://www.gnu.org/software/emacs/manual/html_node/emacs/Emacs-Server.html). It turns out that if you, like me, have sluggish emacs startup times (mine range from 2-3s), you don't have to settle with waiting each time launch your editor. This solution doesn't _actually_ speed up startup time, but it allows you to skip startup at most or all launches. This is particularly impactful if you find yourself frequently opening and closing emacs.

There are a couple of options listed in the documentation linked above. I'm trying out `emacsclient -c --alternate-editor=""` as my emacs launcher command to lazily start the daemon at first "launch" of emacs (note the `-c` flag tells `emacsclient` to launch a new frame instead of opening an existing frame). Alternatively, `systemctl` can be used to launch the daemon at boot to make the first client launch snappy as well.

I believe this should work for emacs running on most Linux distros. I'm unsure how viable this is to help with startup times on MacOS or Windows.

