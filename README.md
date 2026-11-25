# TWRVision

IPTV app for LG Smart TVs (webOS). Play live TV channels from an M3U playlist directly on your TV.

## Features

- Live TV from any M3U/M3U8 playlist
- Channel list with search
- HLS stream playback

## Install

See [INSTALL.md](INSTALL.md) for step-by-step instructions.

**Short version:**
1. Enable Developer Mode on your LG TV (free LG developer account required).
2. Download the `.ipk` from [Releases](../../releases).
3. Install it using LG's Device Manager tool.

## Usage

Open TWRVision from the TV's app list. Enter your M3U playlist URL in settings.

## Build from source

Requires Python 3.

```
python build_ipk.py
```

> **Note:** Use `build_ipk.py`, not `ares-package`. The ares tool produces an IPK that fails with error -5 on LG TVs.

The IPK will be created in the `out/` folder.
