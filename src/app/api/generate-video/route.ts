import { createFalClient } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import muxClient from "@/lib/mux-client";
import { waitForAssetReady } from "@/lib/mux-asset-tracker";

export const runtime = 'nodejs';

function parseBooleanEnv(value: string | undefined) {
    return /^\s*(true|1)\s*$/i.test(value ?? "");
}

const DEMO_MODE_ENABLED = parseBooleanEnv(process.env.DEMO_MODE);
const DEMO_ASSET_ID = process.env.DEMO_MUX_ASSET_ID;

async function resolveDemoAsset() {
    if (!DEMO_ASSET_ID) {
        throw new Error("Demo mode is enabled but DEMO_MUX_ASSET_ID is not configured.");
    }

    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
        throw new Error("Demo mode requires MUX_TOKEN_ID and MUX_TOKEN_SECRET to retrieve the demo asset.");
    }

    const asset = await muxClient.video.assets.retrieve(DEMO_ASSET_ID);
    let playbackId = asset.playback_ids?.[0]?.id;

    if (!playbackId) {
        const playback = await muxClient.video.assets.createPlaybackId(asset.id, {
            policy: "public",
        });
        playbackId = playback.id;
    }

    if (!playbackId) {
        throw new Error(`Demo asset ${asset.id} does not have a playable public playback ID.`);
    }

    return { assetId: asset.id, playbackId };
}

export async function POST(request: NextRequest) {
    try {
        const { prompt, falKey } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
        if (!trimmedPrompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const userFalKey = typeof falKey === "string" ? falKey.trim() : "";
        const shouldUseDemo = DEMO_MODE_ENABLED && !userFalKey;

        if (shouldUseDemo) {
            const { assetId, playbackId } = await resolveDemoAsset();

            return NextResponse.json({
                success: true,
                demoMode: true,
                notice: "Demo mode is active. Returning a pre-generated Mux video asset.",
                muxPlaybackId: playbackId,
                muxAssetId: assetId,
                videoUrl: `https://stream.mux.com/${playbackId}.m3u8`,
            });
        }

        const credentials = userFalKey || process.env.FAL_KEY;

        if (!credentials) {
            return NextResponse.json(
                { error: "Fal credentials are not configured." },
                { status: 500 }
            );
        }

        const falClient = createFalClient({
            credentials,
        });

        const result = await falClient.subscribe("fal-ai/veo3", {
            input: {
                prompt: trimmedPrompt,
                aspect_ratio: "16:9",
                duration: "8s",
                generate_audio: false,
                

            }
        });

        const asset = await muxClient.video.assets.create({
            inputs: [{ url: result.data?.video?.url }],
            playback_policy: ['public'],
            video_quality: 'basic',
        });

        return NextResponse.json({
            success: true,
            data: result,
            videoUrl: result.data?.video?.url,
            muxAssetId: asset.id,
            demoMode: false,
            notice: userFalKey
                ? "Demo mode bypassed. Using provided Fal.ai API key for live generation."
                : undefined,
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
