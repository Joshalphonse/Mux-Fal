import muxClient from "@/lib/mux-client";
import { resolveAssetEvent, SimpleAssetEvent } from "@/lib/mux-asset-tracker";
import { NextRequest, NextResponse } from "next/server";

type BasicMuxWebhookEvent = {
  type?: string;
  data?: {
    id?: string;
    status?: string;
    playback_ids?: Array<{ id: string }>;
  };
};

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Mux webhook secret is not configured.");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();

  let event: BasicMuxWebhookEvent;
  try {
    event = muxClient.webhooks.unwrap(rawBody, request.headers, webhookSecret) as BasicMuxWebhookEvent;
  } catch (error) {
    console.error("Failed to verify Mux webhook signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event?.type === "video.asset.ready" || event?.type === "video.asset.errored") {
    const assetId = event.data?.id;
    if (!assetId) {
      console.warn("Received Mux asset event without an asset id", { type: event.type });
      return NextResponse.json({ received: true });
    }

    const simplifiedEvent: SimpleAssetEvent = {
      type: event.type,
      data: {
        id: assetId,
        status: event.data?.status,
        playback_ids: event.data?.playback_ids,
      },
    };

    resolveAssetEvent(simplifiedEvent);
  }

  return NextResponse.json({ received: true });
}
