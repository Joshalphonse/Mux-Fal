import { fal } from "@fal-ai/client";
import Mux from '@mux/mux-node';
import { NextRequest, NextResponse } from "next/server";


fal.config({
    credentials: process.env.FAL_KEY,
});

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
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

        const asset = await mux.video.assets.create({
            inputs: [{ url: result.data?.video?.url }],
            playback_policy: ['public'],
            video_quality: 'basic',
        });

        return NextResponse.json({
            success: true,
            data: result,
            videoUrl: result.data?.video?.url,
            muxPlaybackId: asset.playback_ids?.[0]?.id,
            muxAssetId: asset.id,
        });

    } catch (error) {
        console.error("Error generating video:", error);
        return NextResponse.json(
            {
                error: "Failed to generate video",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
