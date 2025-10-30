'use client';

import { MuxBackgroundVideo } from '@mux/mux-background-video/react';
import MuxPlayer from '@mux/mux-player-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRef, useState } from 'react';


interface VideoGenerationResponse {
  success: boolean;
  data?: Record<string, unknown>;
  videoUrl?: string;
  muxPlaybackId?: string;
  muxAssetId?: string;
  error?: string;
  details?: string;
  demoMode?: boolean;
  notice?: string;
}

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [falKey, setFalKey] = useState('');
  const [isDemoResult, setIsDemoResult] = useState(false);
  const [resultNotice, setResultNotice] = useState<string | null>(null);
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const demoModeEnabled = process.env.DEMO_MODE === 'true';
  const [demoNoticeVisible, setDemoNoticeVisible] = useState(demoModeEnabled);
  const backgroundPlaybackId = process.env.MUX_PLAYBACK_ID;
  const backgroundStreamUrl = backgroundPlaybackId
    ? `https://stream.mux.com/${backgroundPlaybackId}.m3u8`
    : null;
  const backgroundPosterUrl = backgroundPlaybackId
    ? `https://image.mux.com/${backgroundPlaybackId}/thumbnail.webp?time=0`
    : undefined;
  const generatedPosterUrl = generatedVideo
    ? `https://image.mux.com/${generatedVideo}/thumbnail.webp?time=0`
    : undefined;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setPrompt(e.target.value);
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedVideo(null);
    setGeneratedVideoUrl(null);
    setResultNotice(null);
    setIsDemoResult(false);

    try {
      const payload: Record<string, string> = { prompt: prompt.trim() };
      const trimmedFalKey = falKey.trim();
      if (trimmedFalKey) {
        payload.falKey = trimmedFalKey;
      }

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: VideoGenerationResponse = await response.json();

      if (data.success && data.muxPlaybackId) {
        setGeneratedVideo(data.muxPlaybackId);
        setGeneratedVideoUrl(data.videoUrl || `https://stream.mux.com/${data.muxPlaybackId}.m3u8`);
        setIsDemoResult(Boolean(data.demoMode));
        setResultNotice(data.notice ?? null);
        setDemoNoticeVisible(Boolean(data.demoMode));
      } else {
        setError(data.error || 'Failed to generate video');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const mainContent = (
    <div className="content relative z-10 flex min-h-screen w-full flex-col items-center justify-start gap-6 px-4 py-12 sm:gap-8 sm:py-16 md:justify-center">
      <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-4">
        <Image
          src="/Mux-Logo-Small-Putty.png"
          alt="mux logo"
          width={100}
          height={100}
          className="h-10 w-auto sm:h-12"
          priority
        />
        <span className="text-white text-2xl font-bold sm:text-3xl">+</span>
        <div className="flex w-full items-center justify-center sm:w-auto">
          <Image
            src="/Fal-logo-C1.png"
            alt="fal.ai logo"
            width={500}
            height={500}
            className="h-12 w-auto origin-center scale-[1.6] sm:scale-200"
            priority
          />
        </div>
      </div>
      <span className="text-center text-white text-lg font-bold sm:text-xl">
        Generate AI Videos with fal.ai and play them back with Mux
      </span>

      {demoNoticeVisible && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 text-white/90 w-full max-w-2xl">
          <p className="font-medium">Demo mode is active.</p>
          <p className="text-sm text-white/80 mt-1">
            Requests will return a pre-generated Mux video unless you enter a Fal.ai API key to run live generations.
          </p>
        </div>
      )}
      <div className="w-full max-w-2xl">
        <label className="block text-xs font-medium text-white/80 mb-2 sm:text-sm" htmlFor="fal-key">
          Fal.ai API key (optional)
        </label>
        <Input
          id="fal-key"
          type="password"
          value={falKey}
          onChange={(event) => setFalKey(event.target.value)}
          placeholder="Enter your Fal.ai API key to bypass demo mode"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          disabled={isLoading}
          autoComplete="off"
        />
        {falKey && (
          <p className="text-xs text-white/70 mt-2 text-center sm:text-left">
            Your key stays in this session only and is sent directly to the server for this request.
          </p>
        )}
      </div>


      <div className="flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:items-end">
        <Textarea
          ref={textareaRef}
          value={prompt}
          placeholder="Enter a prompt to generate video..."
          className="min-h-12 w-full max-h-32 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 resize-none overflow-hidden sm:flex-1"
          rows={1}
          onChange={handleInput}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          className="h-12 w-full bg-white px-6 text-black hover:bg-white/90 font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </Button>
      </div>


      {/* Loading State */}
      {isLoading && (
        <div className="w-full max-w-2xl text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Generating your video...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 w-full max-w-2xl">
          <p className="text-red-200 text-center">{error}</p>
        </div>
      )}

      {/* Success State - Generated Video */}
      {generatedVideo && (
        <div className="bg-white/10 border border-white/20 rounded-lg p-4 max-w-2xl w-full">
          <h3 className="text-white text-lg font-semibold mb-3 text-center">Generated Video</h3>
          {(isDemoResult || resultNotice) && (
            <div className="bg-black/40 border border-white/20 rounded-md px-3 py-2 text-sm text-white/80 mb-3 text-center">
              {resultNotice || (isDemoResult && 'Demo result returned.')}
            </div>
          )}
          <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16 / 9' }}>
            <MuxPlayer
              playbackId={generatedVideo}
              poster={generatedPosterUrl}
              className="h-full w-full"
              autoPlay
              muted
            />
          </div>
          <div className="mt-3 text-center">
            <a
              href={generatedVideoUrl || `https://stream.mux.com/${generatedVideo}.m3u8`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white underline text-sm"
            >
              Open in new tab
            </a>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {backgroundStreamUrl && !backgroundFailed ? (
        <MuxBackgroundVideo
          src={backgroundStreamUrl}
          onError={() => setBackgroundFailed(true)}
          className="relative flex min-h-screen w-full"
        >
          {backgroundPosterUrl && (
            <Image
              src={backgroundPosterUrl}
              alt="Mux Background Video"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          )}
          {mainContent}
        </MuxBackgroundVideo>
      ) : (
        <div className="relative flex min-h-screen w-full">
          {backgroundPosterUrl ? (
            <Image
              src={backgroundPosterUrl}
              alt="Mux Background Poster"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-black" />
          )}
          {mainContent}
        </div>
      )}
    </div>
  );
}
