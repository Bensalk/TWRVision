# Security

## Reporting a problem

If you find a security issue in TWRVision, please **do not open a public issue**.
Use GitHub's private reporting instead: **Security → Report a vulnerability** on this repository.
You'll get a reply as soon as possible, and a fix will be released before the details are made public.

## What the app can and cannot do

- The app runs on LG webOS TVs and requires network access to stream live TV channels and load M3U playlists.
- No data is sent to any server operated by the app: all network requests go to the M3U sources and stream URLs you configure.
- Playlists, favourites and settings are stored in the TV's localStorage only and do not leave the TV.

## Release packaging

- IPK packages are built by GitHub Actions and are not signed. Install using LG's Developer Mode app.
