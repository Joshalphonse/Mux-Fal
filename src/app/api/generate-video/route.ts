import { createFalClient } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import muxClient from "@/lib/mux-client";

export const runtime = 'nodejs';

function parseBooleanEnv(value: string | undefined) {
    return /^\s*(true|1)\s*$/i.test(value ?? "");
}


type FalErrorLike = {
    status?: number;
    error?: unknown;
    response?: {
        status?: number;
        data?: unknown;
    };
};

const DEMO_MODE_ENABLED = parseBooleanEnv(process.env.DEMO_MODE);
const DEMO_ASSET_ID = process.env.DEMO_MUX_ASSET_ID;

async function resolveDemoAsset() {
    if (!DEMO_ASSET_ID) {
        throw new Error("Demo mode is enabled but DEMO_MUX_ASSET_ID is not configured...");
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

        console.log(
            "generate-video: demoMode=%s demoAssetIdSet=%s userFalKeyPresent=%s shouldUseDemo=%s",
            DEMO_MODE_ENABLED,
            Boolean(DEMO_ASSET_ID),
            Boolean(userFalKey),
            shouldUseDemo
        );

        if (shouldUseDemo) {
            const { assetId, playbackId } = await resolveDemoAsset();

            console.log("generate-video: returning demo asset %s", assetId);

            return NextResponse.json({
                success: true,
                demoMode: true,
                notice: "Demo mode is active. Returning a pre-generated Mux video asset.",
                muxPlaybackId: playbackId,
                muxAssetId: assetId,
                videoUrl: `https://stream.mux.com/${playbackId}.m3u8`,
            });
        }

        if (!userFalKey) {
            return NextResponse.json(
                { error: "Fal.ai API key is required when demo mode is disabled." },
                { status: 400 }
            );
        }

        const credentials = userFalKey;

        const source = "user";
        const fingerprint = credentials.length > 8
            ? `${credentials.slice(0, 4)}...${credentials.slice(-4)}`
            : "short";
        console.log("generate-video: using Fal credentials from %s key %s", source, fingerprint);

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

        const sourceUrl = result.data?.video?.url;
        if (typeof sourceUrl !== "string" || !sourceUrl) {
            throw new Error("fal.ai response did not include a video URL to ingest into Mux.");
        }

        const asset = await muxClient.video.assets.create({
            inputs: [{ url: sourceUrl }],
            playback_policy: ['public'],
            video_quality: 'basic',
        });

        return NextResponse.json({
            success: true,
            data: result,
            muxAssetId: asset.id,
            status: asset.status,
            sourceUrl,
            demoMode: false,
            notice: userFalKey
                ? "Demo mode bypassed."
                : undefined,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const err = error as FalErrorLike;
        const falStatus: number | undefined = err?.status ?? err?.response?.status;
        const falError = err?.error ?? err?.response?.data ?? null;
        const status = typeof falStatus === "number" ? falStatus : (message.includes("Timed out") ? 504 : 500);

        console.error("generate-video: error", { message, falStatus, falError });

        return NextResponse.json(
            {
                error: "Failed to generate video",
                details: message,
                falStatus: falStatus ?? null,
                falError,
            },
            { status }
        );
    }
}
