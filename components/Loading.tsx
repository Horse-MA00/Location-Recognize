import React from 'react';
import { AppState } from '../types';
import { Loader2, Zap, Search, Mic } from 'lucide-react';

interface LoadingProps {
  state: AppState;
}

const Loading: React.FC<LoadingProps> = ({ state }) => {
  const getMessage = () => {
    switch (state) {
      case AppState.ANALYZING_IMAGE:
        return { text: "ANALYZING STRUCTURE", sub: "Gemini 3 Pro Vision Processing...", icon: <Zap className="animate-pulse text-ar-pink" size={32} /> };
      case AppState.FETCHING_HISTORY:
        return { text: "RETRIEVING DATA", sub: "Accessing Global Archives...", icon: <Search className="animate-bounce text-ar-cyan" size={32} /> };
      case AppState.GENERATING_AUDIO:
        return { text: "SYNTHESIZING VOICE", sub: "Generating Neural Speech...", icon: <Mic className="animate-pulse text-white" size={32} /> };
      default:
        return { text: "PROCESSING", sub: "Please wait...", icon: <Loader2 className="animate-spin" size={32} /> };
    }
  };

  const { text, sub, icon } = getMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative flex flex-col items-center justify-center p-12 max-w-md w-full">
        {/* Animated Rings */}
        <div className="absolute inset-0 border-4 border-ar-cyan/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
        <div className="absolute inset-0 border-t-4 border-ar-cyan rounded-full animate-[spin_3s_linear_infinite]"></div>
        <div className="absolute inset-4 border-b-4 border-ar-pink rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 bg-black/50 p-8 rounded-2xl border border-white/10 backdrop-blur-md">
           <div className="p-4 bg-white/5 rounded-full border border-white/10 shadow-[0_0_20px_rgba(0,243,255,0.3)]">
             {icon}
           </div>
           <div>
             <h2 className="text-2xl font-mono font-bold text-white tracking-widest">{text}</h2>
             <p className="text-ar-cyan font-mono text-sm mt-2 animate-pulse">{sub}</p>
           </div>
           
           {/* Fake progress bars */}
           <div className="w-full space-y-2">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-ar-cyan animate-[width_2s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                 <span>CPU: 34%</span>
                 <span>NET: 120ms</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
