# Debugging iOS Safari on (Fedora) Linux

This is a quick one. I had some issues with this and Google rankings didn't do a great job putting me on the right path, so I figure a quick write up might prove useful to others in this situation.

## Why might you do this?

You have a website you're developing and want to ensure functionality on iPhones. You load it up on an iPhone and find your site just doesn't work. You want to see some logs, maybe inspect some elements, ya know - usual browser debugging stuff. But you don't have a Mac.

## Getting it working

Install the following:

- [ios-safari-remote-debug-kit](https://github.com/HimbeersaftLP/ios-safari-remote-debug-kit) - webkit compiler and static server wrapper
- [ios-webkit-debug-proxy](https://github.com/google/ios-webkit-debug-proxy) (and its dependencies, see installation instructions in the repo's README)
- chromium or webkit based browser

Note that it is not sufficient to install the debug proxy alone. I haven't dug too deeply, but it seems you need some kind of webkit-specific debugger to interpret the debug output exposed by iOS safari. This is why [ios-safari-remote-debug-kit](https://github.com/HimbeersaftLP/ios-safari-remote-debug-kit) is an essential piece of the puzzle here.

On Fedora, I had issues connecting to my iPhone13 mini. Eventually I tracked down a likely root cause within `usbmuxd`, a dependency of `ios-webkit-debug-proxy`. I found the logs with:

```
journalctl -u usbmuxd

```

Searching "lockdown error -5" online led me to [this issue on the repo](https://github.com/libimobiledevice/usbmuxd/issues/207).

Running the following and rebooting got things working for me:
```
sudo update-crypto-policies --set LEGACY
```

# Conclusion

Doing stuff targeting Apple devices with a linux machine just kind of sucks. I was relieved to get this working after looking at a blank browser page served by `ios-webkit-debug-proxy` for a few too many minutes. So, hey, I'm glad there are communities out there trying to keep cross-platform workflows viable!

