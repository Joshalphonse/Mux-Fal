# Mux x Fal.AI

This project uses [fal.ai](https://fal.ai/) to generate videos from prompts and [Mux](https://mux.com/) to host and play them back in a Next.js front-end.

## Prerequisites

- Node.js 18+
- pnpm
- Mux account with API access (token ID/secret and a webhook signing secret)
- fal.ai API key
- Optional: [ngrok](https://ngrok.com/) for exposing the local development server to receive webhooks

## Environment Variables

Create a `.env.local` (or equivalent) file with the following variables:

```
FAL_KEY=your_fal_api_key
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_mux_webhook_secret
MUX_PLAYBACK_ID=background_asset_playback_id
```

`MUX_PLAYBACK_ID` is only used for the looping background video on the landing page.

## Running Locally

1. Install dependencies: `pnpm install`
2. Start the dev server: `pnpm dev`
3. Open `http://localhost:3000`

## Webhook Setup with ngrok

Mux webhooks notify the app when a generated asset is ready to stream. For local development:

1. Start ngrok: `ngrok http 3000`
2. In the Mux dashboard, create a webhook pointing to `https://YOUR_NGROK_DOMAIN/api/mux-webhook`
3. Copy the webhook signing secret into `MUX_WEBHOOK_SECRET`

Once configured, the `POST /api/generate-video` route will wait for the `video.asset.ready` webhook before returning the `muxPlaybackId`, ensuring the asset can play immediately in the UI.

[Watch a demo video](https://player.mux.com/E01jAxtF2Nl3CO3QxGFcmFBoZH0100yS6NAcdC46PafkQQ)