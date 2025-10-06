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
DEMO_MODE=true
DEMO_MUX_ASSET_ID=pre_generated_mux_asset_id
```

`MUX_PLAYBACK_ID` is only used for the looping background video on the landing page.

`DEMO_MODE` is optional. When set to `true`, the app skips live generation and returns the Mux asset referenced by `DEMO_MUX_ASSET_ID` unless a Fal.ai API key is supplied with the request.

### Demo mode

- When demo mode is active, the `/api/generate-video` route responds immediately with the configured Mux asset and adds a notice to the UI.
- Visitors can bypass demo mode by providing their own Fal.ai API key in the UI field (“Fal.ai API key (optional)”), which is used only for that request.
- Ensure the asset referenced by `DEMO_MUX_ASSET_ID` has a public playback policy. The API will create one automatically if needed.

## Running Locally

1. Install dependencies: `pnpm install`
2. Start the dev server: `pnpm run dev`
3. Open `http://localhost:3000`


## Webhook Setup with ngrok

Mux webhooks notify the app when a generated asset is ready to stream. For local development:

1. Start ngrok: `ngrok http 3000`
2. In the Mux dashboard, create a webhook pointing to `https://YOUR_NGROK_DOMAIN/api/mux-webhook`
3. Copy the webhook signing secret into `MUX_WEBHOOK_SECRET`

## Test the app

Paste your fal.ai API key in the input box then press generate to leave Demo Mode.

***NOTE*** Before generating a video through a prompt make sure that you you run ngrok http 3000 (or whatver port you choose). fal.ai is expensive so make the API call worth it!


Once configured, the `POST /api/generate-video` route will wait for the `video.asset.ready` webhook before returning the `muxPlaybackId`, ensuring the asset can play immediately in the UI.

[Watch a demo video](https://player.mux.com/E01jAxtF2Nl3CO3QxGFcmFBoZH0100yS6NAcdC46PafkQQ)
