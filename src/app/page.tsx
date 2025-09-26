'use client';

import { MuxBackgroundVideo } from '@mux/mux-background-video/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRef } from 'react';

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
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
          
          <div className="flex items-end gap-2 w-full max-w-2xl">
            <Textarea 
              ref={textareaRef}
              placeholder="Enter a prompt to generate video..." 
              className="flex-1 min-h-12 max-h-32 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 resize-none overflow-hidden"
              rows={1}
              onChange={handleInput}
            />
            <Button className="h-12 px-6 bg-white text-black hover:bg-white/90 font-medium shrink-0">
              Generate
            </Button>
          </div>
        </div>
      </MuxBackgroundVideo>
    </div>
  );
}
