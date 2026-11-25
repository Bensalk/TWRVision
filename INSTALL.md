# TWRVision: install and renew guide

## A. One-time setup on the TV
1. Make a free account at https://webostv.developer.lge.com and sign in.
2. On the TV, open the LG Content Store, search "Developer Mode", install it.
3. Open the Developer Mode app, sign in with your LG developer account.
4. Turn "Dev Mode Status" ON. The TV restarts. Open Developer Mode again.
5. Turn "Key Server" ON. Write down the passphrase shown, and the TV's IP address.
6. Note the time remaining (about 50 hours). See section C.

## B. Install TWRVision
1. Download the .ipk file from this repo's Releases page.
2. Install "Device Manager for webOS" (from the LG developer site) on your computer.
3. In it, add the TV (its IP address, the passphrase) and install the .ipk.
4. TWRVision appears in the TV's app list.

## C. Renew (every ~50 hours)
Open the Developer Mode app on the TV and press "Extend Session". If it already expired, turn Dev Mode on again and reinstall if needed.
