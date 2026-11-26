# CLAUDE.md — TWRVision

WebOS IPTV app for LG TVs by Bensal. JavaScript/HTML web app. Public repo. Write docs and changelog for users, not about development history.

## Repo layout

```
/
├── app/                   ← webOS app package
│   ├── index.html         ← main app (all JS/CSS)
│   ├── appinfo.json       ← app ID, version, title
│   ├── icon.png / largeIcon.png / splashBackground.png
│   └── ...
├── build_ipk.py           ← packages the app into an IPK file
├── .github/workflows/build.yml  ← CI build + release
├── CHANGELOG.md, INSTALL.md, LICENSE
└── README.md
```

## Build and release

- Every push to `main` builds an IPK on GitHub Actions and publishes a GitHub Release.
- **Packaging: always use `build_ipk.py`**, never `ares-package`. The GNU `ar` format used by ares-package produces an IPK that fails with error -5 on LG TVs. `build_ipk.py` uses Python's tarfile module and a custom ar writer that the TV accepts correctly.
- **On every user-visible change bump `version`** in `app/appinfo.json` and add an entry at the top of `CHANGELOG.md`.
- Current version: 0.4.36. App ID: `com.bensal.twrvision`.
- Commit identity: `343577983+Bensalk@users.noreply.github.com`. Never a personal email.
- `main` is protected (no force push, no deletion). Private vulnerability reporting is on.

## App facts

- App ID: `com.bensal.twrvision`
- WebOS "web" type app. Runs in the TV's web engine.
- Current version: 0.4.36
- Settings stored in localStorage on the TV.

## Working style

- Bensal installs the IPK using LG's Developer Mode app. He doesn't use an IDE.
- Suggest changes and wait for his approval before implementing.
- Keep explanations short and non-technical.
- Start every reply with a `Model:` line (Sonnet for routine/support, Opus for hard coding or design decisions) and a one-line reason; Bensal can't judge difficulty himself.
