import React, { useEffect, useRef, useState } from 'react';
import { TourData } from '../types';
import { Play, Pause, ExternalLink, RefreshCw, Volume2 } from 'lucide-react';

interface ARViewProps {
  imageSrc: string;
  data: TourData;
  onReset: () => void;
}

const ARView: React.FC<ARViewProps> = ({ imageSrc, data, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Initialize Audio Context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const playAudio = () => {
    if (!data.audioBuffer || !audioContextRef.current) return;

    // Create a new source node
    const source = audioContextRef.current.createBufferSource();
    source.buffer = data.audioBuffer;
    source.connect(audioContextRef.current.destination);

    // Calculate start time based on where we paused
    const offset = pausedAtRef.current;
    
    source.start(0, offset);
    startTimeRef.current = audioContextRef.current.currentTime - offset;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
       // Only reset if it finished naturally, not if we stopped it manually to pause
       if (audioContextRef.current && audioContextRef.current.currentTime - startTimeRef.current >= (data.audioBuffer?.duration || 0)) {
          setIsPlaying(false);
          pausedAtRef.current = 0;
       }
    };
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current && audioContextRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      pausedAtRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      setIsPlaying(false);
      sourceNodeRef.current = null;
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  // Auto-play on mount
  useEffect(() => {
    playAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.audioBuffer]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      
      {/* AR Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20">
        <div className="flex flex-col">
           <h1 className="text-4xl md:text-6xl font-mono font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">
             {data.landmark.name}
           </h1>
           <div className="h-1 w-24 bg-ar-cyan mt-2 shadow-[0_0_8px_#00f3ff]"></div>
           <p className="mt-2 text-ar-cyan font-mono text-sm tracking-widest uppercase opacity-80">
             Identified • {new Date().toLocaleTimeString()}
           </p>
        </div>
        
        <button 
          onClick={onReset}
          className="bg-ar-dark/80 backdrop-blur-md border border-ar-cyan/30 text-ar-cyan p-3 rounded-full hover:bg-ar-cyan/20 transition-all hover:scale-110 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
        >
          <RefreshCw size={24} />
        </button>
      </div>

      {/* Main Content Card (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full z-20 p-4 md:p-8">
        <div className="w-full max-w-4xl mx-auto bg-ar-dark/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          
          {/* Decorative Corner lines */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-ar-cyan rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ar-cyan rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ar-cyan rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-ar-cyan rounded-br-lg"></div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left Column: Audio & Description */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-ar-pink">
                      <Volume2 className="animate-pulse" size={20} />
                      <span className="font-mono text-sm tracking-widest uppercase">Audio Guide</span>
                   </div>
                </div>

                {/* Audio Player */}
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <button 
                    onClick={toggleAudio}
                    className="w-14 h-14 flex items-center justify-center rounded-full bg-ar-cyan text-ar-dark hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1"/>}
                  </button>
                  <div className="flex-1">
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden w-full">
                       <div className={`h-full bg-ar-cyan ${isPlaying ? 'animate-pulse' : ''}`} style={{ width: isPlaying ? '100%' : '0%', transition: 'width 20s linear' }}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-mono">AI NARRATION ACTIVE</p>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-lg leading-relaxed text-gray-200 font-light">
                    {data.historyText}
                  </p>
                </div>
              </div>

              {/* Right Column: Sources & Metadata */}
              <div className="w-full md:w-64 space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                <h3 className="font-mono text-ar-cyan text-sm uppercase tracking-wider mb-2">Data Sources</h3>
                <div className="space-y-2">
                  {data.groundingSources.length > 0 ? (
                    data.groundingSources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.web?.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/5 transition-all group"
                      >
                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <span className="truncate pr-2 font-mono">{source.web?.title || 'Unknown Source'}</span>
                          <ExternalLink size={12} className="opacity-50 group-hover:opacity-100" />
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic">No external sources cited.</div>
                  )}
                </div>
                
                <div className="mt-8">
                  <h3 className="font-mono text-ar-cyan text-sm uppercase tracking-wider mb-2">Location Data</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-400">
                     <div className="bg-black/30 p-2 rounded border border-white/5">
                        <span className="block text-gray-600">LAT</span>
                        Unknown
                     </div>
                     <div className="bg-black/30 p-2 rounded border border-white/5">
                        <span className="block text-gray-600">LON</span>
                        Unknown
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARView;
