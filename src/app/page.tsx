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
    <div className="content relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center mb-8">
        <h1 className="text-white text-6xl font-bold mb-4">Slop Social</h1>
        <p className="text-white text-xl mb-8">Generate AI Slop Videos</p>
      </div>

      {demoNoticeVisible && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 text-white/90 mb-6 w-full max-w-2xl">
          <p className="font-medium">Demo mode is active.</p>
          <p className="text-sm text-white/80 mt-1">
            Requests will return a pre-generated Mux video unless you enter a Fal.ai API key to run live generations.
          </p>
        </div>
      )}
      <div className="w-full max-w-2xl mb-6">
        <label className="block text-sm font-medium text-white/80 mb-2" htmlFor="fal-key">
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
          <p className="text-xs text-white/70 mt-2">
            Your key stays in this session only and is sent directly to the server for this request.
          </p>
        )}
      </div>

      
      <div className="flex items-end gap-2 w-full max-w-2xl mb-6">
        <Textarea 
          ref={textareaRef}
          value={prompt}
          placeholder="Enter a prompt to generate video..." 
          className="flex-1 min-h-12 max-h-32 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 resize-none overflow-hidden"
          rows={1}
          onChange={handleInput}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
        />
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          className="h-12 px-6 bg-white text-black hover:bg-white/90 font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </Button>
      </div>

      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Generating your video...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 max-w-2xl w-full">
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
          <MuxPlayer 
            playbackId={generatedVideo}
            className="w-full rounded-lg"
            autoPlay
            muted
          />
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
    <div className="relative w-screen h-screen">
      {backgroundStreamUrl && !backgroundFailed ? (
        <MuxBackgroundVideo
          src={backgroundStreamUrl}
          onError={() => setBackgroundFailed(true)}
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
        <div className="relative w-full h-full">
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
