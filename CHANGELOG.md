# Changelog

## 0.4.31
- Fix: arrow key navigation now reaches Reload Playlist button (Down from Search → Reload → channels; Up from first channel → Reload → Search)

## 0.4.30
- Settings → Security: App Lock toggle — when ON, PIN is required every time the app opens; can be disabled from the same toggle

## 0.4.29
- Settings: new "Change PIN" option — enter current PIN, then set a new 4-digit PIN; saved securely to TV storage

## 0.4.28
- Reload button moved to its own full-width row below the filter box — clearly visible and reachable with arrow keys on remote

## 0.4.27
- New app icon: forest night scene (pine trees, crescent moon, stars) matching The Woods Resorts theme

## 0.4.26
- PIN overlay: "← Go Back" button moved to top; cursor lands on it when overlay opens so guests can easily dismiss

## 0.4.25
- PIN overlay: added "← Go Back" button (navigate with arrows + press OK to dismiss)
- PIN overlay: temporary keycode display to identify Back key on this TV model

## 0.4.24
- PIN overlay: Back button now closes it (press Back on remote to dismiss without entering PIN)
- PIN overlay: pressing Back/⌫ when no digits are entered also closes the overlay

## 0.4.23
- PIN lock: correct PIN now opens Settings/About properly (loop bug fixed)
- PIN lock: wrong PIN shows "Wrong PIN. Try again." in red with red dots, resets after 1.5s so user can retry without closing

## 0.4.22
- Indian Genre now shows only Indian channels — Sports, Movies, Music, etc. each filtered to India only
- International section in Library unchanged (all global category playlists kept)

## 0.2.0
- Live TV screen with HLS/M3U8 player (hls.js v0.14.17)
- Channel list panel with filter search
- Library screen: 60+ pre-loaded iptv-org playlists (Popular, Indian Languages, Categories, International, Countries)
- Search screen: search across loaded channels
- Settings: 10 themes (Midnight, AMOLED, Neon, Sunset, Ocean, Forest, Crimson, Gold, Mint, Slate)
- Settings: add/remove custom M3U/M3U8 URLs
- Persistent state: last loaded playlist, theme choice, custom URLs (localStorage)
- Now-playing bar on Home screen
- ES5 / Chromium 53 compatible throughout

## 0.1.0
- First "Hello TV" skeleton: sidebar, cards, remote navigation, About screen, build workflow.
