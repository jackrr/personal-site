# Making a container host with NixOS on a Raspberry Pi

Tired of deploying all your stuff to cloud services? Clicking through dashboards and proprietary business terms to abstract over basically the same things?

I sure was. So I decided to run my toy projects on my own computer, at home. And expose that computer to the web.

## Equipment

- Raspberry Pi 4 Model B 🍓
- A micro SD card 
- A micro SD card USB adapter (to flash the NixOS image)
- External keyboard
- Monitor w/ HDMI port 🖥
- Micro HDMI cable to HDMI (to connect the Pi to your monitor🖥

🍓 You can use something else, but the NixOS installation instructions will likely vary

🖥 There's probably a way to do this without a monitor, but I felt too new to nix to cross-compile the Pi's nix configuration my x86 laptop to target the arm64 Pi (at least I think this is what one would need to do)

## Putting NixOS on a Pi

I just followed this [nix tutorial page](https://nix.dev/tutorials/nixos/installing-nixos-on-a-raspberry-pi). Do what it says, I have ALMOST nothing to add, except for one small addition:

I was getting a lot of noise in my terminal with the following message:

> brcmfmac: brcmf_set_channel: set chanspec fail, reason -52

I found many others that encountered this issue on [this GitHub issue](https://github.com/raspberrypi/linux/issues/6049#issuecomment-2259734713). To fix, update your `/etc/nixos/configuration.nix` to include the following `environment.etc` attribute set:

```
{ config, pkgs, lib, ... }:
let
  user = "YOUR_USER";
  ... stuff ...
  hostname = "whatever";
in {
  ... stuff ...
  # FIX ON FOLLOWING LINES
  environment.etc = {
    "modprobe.d/brcmfmac.conf" = {
      text = ''
        options brcmfmac feature_disable=0x82000
      '';
    };
  };
```

This will generate a file `/etc/modprobe.d/brcmfmac.conf` with the contents `options brcmfmac feature_disable=0x82000`. This disables a couple of features in the `brcmfmac` kernel module that were not playing nice with newer versions of `wpa_supplicant`.

## Setting up a container runtime

Once the Pi is online and you have a working iteration loop with `nixos-rebuild`, it's time to set up [podman](https://podman.io/). I chose podman instead of [docker](https://www.docker.com/) because it can use systemctl as the daemon to manage running containers, rather than a separate orchestrator like docker's engine. I updated my config following the [nix wiki docs for podman](https://nixos.wiki/wiki/Podman). Let's say you want to host [hello world](https://hub.docker.com/r/crccheck/hello-world/) on your machine, you would want your `/etc/nixos/configuration.nix` to have the following:

```
  virtualisation = {
    containers.enable = true;
    podman = {
      enable = true;

      # docker alias for podman
      dockerCompat = true;

      autoPrune = {
        enable = true;
        flags = [ "--all" ];
      };
    };

    oci-containers = {
      backend = "podman";
      containers = {
        my-container = {
          image = "docker.io/crccheck/hello-world";
          autoStart = true;
          ports = [ "127.0.0.1:8000:8000" ];
        };
      };
    };
  };
```

For more options you can provide to your container config (volumes, environment variables, etc.) check out [search.nixos.org](https://search.nixos.org/options?query=virtualisation.oci-containers).

## Building Docker images for ARM

After a `nixos-rebuild boot` followed by `reboot` with the above settings, I was saddened to find my container was crashing. How did I know? `journalctl` is the way to view logs of daemons managed by `systemctl`. To see the logs for your "my-container" as defined in the above config, you'd run:

```
journalctl -u podman-my-container.service
```

When I ran the above command, I saw a restart loop occurring. The log from the container itself before it crashed wasn't very helpful, but in the bootup logs this line jumped out:

> WARNING: image platform (linux/amd64) does not match the expected platform (linux/arm64)

Some searching around led me to realize I needed to build my app to specifically run on the arm64 CPU architecture. I wanted to avoid adding docker runtime and depending on my Pi as a build machine, so I needed to figure out how to make an arm64-compatible image on my amd64 dev machine.

I still have docker on my main dev machine, so my path to resolution was [docker's "Multi-platform builds"](https://docs.docker.com/build/building/multi-platform/). I installed QEMU on my host (on Fedora linux as simple as running `sudo dnf install qemu-user-static`). I also needed to switch to `containerd` layer caching by following [these instructions](https://docs.docker.com/engine/storage/containerd/). I then watched the paint dry as I rebuilt the container leveraging QEMU eumulation:

```
docker buildx build --platform linux/amd64,linux/arm64 .
```

Be patient, it took a good half hour to build the emulated linux/arm64 on my machine.

## Exposing your Pi and services to the wider web

Now there's a server running on the pi, but it's not exposed to the wider internet.

I'm not a genius at devops, particularly networking stack stuff. Don't get me wrong, I'm good enough to stand things up and be dangerous. But I'm paranoid of introducing massive attack vectors to my home WiFi. But I guess not paranoid enough to scrap this project altogether.

To mitigate these fears and avoid standing up something more robust on my pi (looking at you, [k3s](https://k3s.io/)), I decided to use [cloudflared](https://github.com/cloudflare/cloudflared) to manage all networking through Cloudflare. 💵

💵 This post is not sponsored by Cloudflare. At least not yet...

Getting your domain name is a separate problem space beyond the scope of this blog post. Let's assume you already own a domain and have the ability to manage its DNS rules.

**DISCLAIMER** In what follows all Cloudflare credentials and keys are being stored in plaintext on the Raspberry Pi. This is almost certainly bad, as a malicious actor could probably take over my Cloudflare account if they managed to get read access to the Pi's filesystem. I plan to follow up to figure out an encrypted system for managing these, perhaps using [sops-nix](https://github.com/Mic92/sops-nix). Copy what follows at your own risk!!

### Create a credentials file

First you need a `cert.pem` file to authenticate with your cloudflare account. This command will generate one. I recommend running this on a personal machine with a browser then copying the resulting file over to your Pi:

```
nix-shell -p cloudflared # start a shell with cloudflared installed
cloudflared login
```

Copy the generated `cert.pem` file to your nix configuration directory, then add the following to your nix configuration:

```
  ...

  environment.etc = {
    ... stuff ...

    "cloudflared/cert.pem" = {
      text = builtins.readFile ./cloudflare-cert.pem;
    };
  };
```


### Create a tunnel

Next you can make a tunnel. This can be run either on your pi (once you have your `cert.pem` configured) or another machine.

```
nix-shell -p cloudflared # start a shell with cloudflared installed
cloudflared tunnel create
```

This will result in a file at `/etc/cloudflared/TUNNEL_ID.json`. Copy this file into your nix configuration directory, then add the following to your nix config:

```
let
  user = "YOUR USER NAME";
  ...
  cloudflareTunnelId = "REPLACE_WITH_YOUR_TUNNEL_ID";
in {
  ...
  
  environment.etc = {
    ... stuff ...

    "cloudflared/${cloudflareTunnelId}.json" = {
      text = builtins.readFile "/etc/nixos/${cloudflareTunnelId}.json";
    };
  };
```

### Configure cloudflared

Add the following to the end of your `configuration.nix` to expose your pi to the internet. Be sure to update the ingress domain to match your TLD name.

```
  ...
  services.cloudflared = {
    enable = true;
    tunnels = {
      "${cloudflareTunnelId}" = {
        credentialsFile = "/etc/cloudflared/${cloudflareTunnelId}.json";
        ingress = {
          "hello-world.yourdomain.com" = "http://127.0.0.1:3000";
        };
        default = "http_status:404";
      };
    };
  };
}
```

Then you'll need to create a DNS CNAME record mapping `hello-world.yourdomain.com` to `TUNNEL_ID.cfargotunnel.com`.

### ssh from Anywhere

You can also use cloudflared to expose ssh access. Update `configuration.nix` to expose ssh through cloudflared:

```
  ...
  services.cloudflared = {
    enable = true;
    tunnels = {
      "${cloudflareTunnelId}" = {
        credentialsFile = "/etc/cloudflared/${cloudflareTunnelId}.json";
        ingress = {
          "mypi.yourdomain.com" = "ssh://localhost:22"; # add this line
          "hello-world.yourdomain.com" = "http://127.0.0.1:3000";
        };
        default = "http_status:404";
      };
    };
  };
}
```

You'll need to add another CNAME record mapping `mypi.yourdomain.com` to `TUNNEL_ID.cfargotunnel.com`.

There are a variety of ways to [establish a ssh connection from your client](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/use-cases/ssh/) (your dev machnine). Most seemed rather boilerplate-y, so I settled on [the classic workflow documented here](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/use-cases/ssh/ssh-cloudflared-authentication/).

### Increase network memory limits

Cloudflared uses the [`quic`](https://en.wikipedia.org/wiki/QUIC) protocol to communicate with Cloudflare's servers. The memory requirements to use it exceed the default limits configured with NixOS (at least at the time of this writing). If you see warnings about memory limits in the cloudflared logs (use `journalctl -u cloudflared-{STUFF}.service` -- use tab completion or run `systemctl | grep cloudflared` to find the exact service), add the following to your nix configuration to increase these limits:

```
  ...

  environment.etc = {
    ... stuff ...

    # fix cloudflared "failed to sufficiently increase receive buffer size" errors
    "sysctl.d/70-cloudflared.conf" = {
      text = ''
        net.core.rmem_max=8000000
        net.core.wmem_max=8000000
      '';
    };
  };
```


## Feedback

I'm quite new to nix and NixOS and it's very likely I've done at least some things in less-than-ideal ways. Have feedback? Reach out on my social links I'd love to hear from you!
