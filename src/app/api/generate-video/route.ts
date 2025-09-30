import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import muxClient from "@/lib/mux-client";
import { waitForAssetReady } from "@/lib/mux-asset-tracker";


fal.config({
    credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const result = await fal.subscribe("fal-ai/veo3", {
            input: {
                prompt: prompt,
                aspect_ratio: "16:9",
            }
        });

        const asset = await muxClient.video.assets.create({
            inputs: [{ url: result.data?.video?.url }],
            playback_policy: ['public'],
            video_quality: 'basic',
        });

        const readyEvent = await waitForAssetReady(asset.id);
        const playbackId = readyEvent.data.playback_ids?.[0]?.id || asset.playback_ids?.[0]?.id;

        return NextResponse.json({
            success: true,
            data: result,
            videoUrl: result.data?.video?.url,
            muxPlaybackId: playbackId,
            muxAssetId: asset.id,
        });

    } catch (error) {
        console.error("Error generating video:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        const status = message.includes("Timed out") ? 504 : 500;
        return NextResponse.json(
            {
                error: "Failed to generate video",
                details: message
            },
            { status }
        );
    }
}
