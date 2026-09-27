# FerretHood website

## Quick deploy
This is a static website. No server or paid hosting is required.

### Local test
Open `index.html` in a browser, or use any static-file server.

### Free hosting
Upload this folder to GitHub Pages, Cloudflare Pages, Netlify, or Vercel.

## Contract
Address: 0x39008E8f6Eb9a36C6864f95FBBaC75101e842f08
Chain ID: 4663 (Robinhood Chain)
Mint price is read from the deployed contract.
Max mint per transaction is read from the deployed contract.

## Important
The site only requests a wallet connection and a native ETH payment for minting. Never ask users for seed phrases or private keys.

Whitelist support:
The deployed contract requires a Merkle proof for whitelistMint(). This first version prepares the public mint flow. To enable whitelist minting on the site, add the whitelist address/proof data to the frontend after the final whitelist is available.


## Live social + OpenSea
The site now includes an official X timeline for @FerrethoodNFT, which updates through X's widget service.

The OpenSea panel uses a secure serverless proxy at `/api/opensea`. Do NOT put an OpenSea API key in `app.js` or any browser-visible file.

For Cloudflare Pages:
1. Deploy this folder as a Pages project.
2. Add an environment variable named `OPENSEA_API_KEY` in the Pages project settings.
3. Redeploy.
4. The site will call `/api/opensea`, and the function keeps the key server-side.

OpenSea's API requires an API key and supports fetching NFTs by contract/collection. API keys should not be exposed in client-side code.
