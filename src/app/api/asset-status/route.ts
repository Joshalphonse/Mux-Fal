import { NextRequest, NextResponse } from "next/server";
import muxClient from "@/lib/mux-client";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const assetId = searchParams.get('assetId');

        if (!assetId) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        
        if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
            return NextResponse.json(
                { 
                    error: "Mux credentials not configured",
                    details: "MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set in environment variables"
                },
                { status: 500 }
            );
        }

        const asset = await muxClient.video.assets.retrieve(assetId);
        
        let playbackId = asset.playback_ids?.[0]?.id;

        if (asset.status === "ready" && !playbackId) {
            const playback = await muxClient.video.assets.createPlaybackId(asset.id, {
                policy: "public",
            });
            playbackId = playback.id;
        }
        
        return NextResponse.json({
            assetId: asset.id,
            status: asset.status,
            playbackId: playbackId ?? null,
            errors: asset.errors,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json(
            {
                error: "Failed to retrieve asset status",
                details: message,
            },
            { status: 500 }
        );
    }
}

