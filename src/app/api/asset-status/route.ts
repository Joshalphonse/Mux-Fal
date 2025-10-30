import { NextRequest, NextResponse } from "next/server";
import muxClient from "@/lib/mux-client";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    try {
        const asset = await muxClient.video.assets.retrieve(id);
        const status = asset.status;
        const playbackId = asset.playback_ids?.[0]?.id ?? null;

        return NextResponse.json({
            id,
            status,
            ready: status === "ready",
            muxPlaybackId: playbackId,
            videoUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}


