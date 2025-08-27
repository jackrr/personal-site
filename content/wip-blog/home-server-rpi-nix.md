# Making a home server with NixOS on a Raspberry Pi

Tired of deploying all your stuff to cloud services? Clicking through dashboards and proprietary business terms to abstract over basically the same things?

I sure was. So I decided to run my toy projects on my own computer, at home. And expose that computer to the web.

## A note on networking

So I'm not that great at devops, particularly networking stack stuff. Don't get me wrong, I'm good enough to stand things up and be dangerous. But probably not good enough to know when I'm introducing massive attack vectors to my home WiFi.

To mitigate these issues and avoid standing up something more robust on my pi (looking at you, [k3s](https://k3s.io/)), I decided to use [cloudflared](https://github.com/cloudflare/cloudflared) to manage all networking through Cloudflare\*.

\*This post is sponsored by Cloudflare\**

\**Just kidding, this isn't sponsored by Cloudflare. YET.

## Equipment

- Raspberry Pi 4 Model B\*

\* You can use something else, but the NixOS installation instructions will likely vary

## 

## Building Docker images for ARM
