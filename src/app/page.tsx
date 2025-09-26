'use client';

import { MuxBackgroundVideo } from '@mux/mux-background-video/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRef, useState } from 'react';

interface VideoGenerationResponse {
  success: boolean;
  data?: any;
  videoUrl?: string;
  error?: string;
  details?: string;
}

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data: VideoGenerationResponse = await response.json();

      if (data.success && data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
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

  return (
    <div className="relative w-screen h-screen">
      <MuxBackgroundVideo src={`https://stream.mux.com/${process.env.MUX_PLAYBACK_ID}`}>
        <Image
          src={`https://image.mux.com/${process.env.MUX_PLAYBACK_ID}/thumbnail.webp?time=0`}
          alt="Mux Background Video"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="content relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center mb-8">
            <h1 className="text-white text-6xl font-bold mb-4">Mux x Fal.AI</h1>
            <p className="text-white text-xl mb-8">AI Video Generation and Video Playback</p>
          </div>
          
          <div className="flex items-end gap-2 w-full max-w-2xl mb-6">
            <Textarea 
              ref={textareaRef}
              value={prompt}
              placeholder="Enter a prompt to generate video..." 
              className="flex-1 min-h-12 max-h-32 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 resize-none overflow-hidden"
              rows={1}
              onChange={handleInput}
              onKeyPress={handleKeyPress}
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
              <video 
                src={generatedVideo} 
                controls 
                className="w-full rounded-lg"
                autoPlay
                muted
              >
                Your browser does not support the video tag.
              </video>
              <div className="mt-3 text-center">
                <a 
                  href={generatedVideo} 
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
      </MuxBackgroundVideo>
    </div>
  );
}
