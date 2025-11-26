import React, { useState, useCallback } from 'react';
import { AppState, TourData } from './types';
import { identifyLandmark, getLandmarkHistory, generateSpeech } from './services/geminiService';
import { decodeBase64, decodeAudioData } from './services/audioUtils';
import Loading from './components/Loading';
import ARView from './components/ARView';
import { Camera, Upload, AlertCircle } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [tourData, setTourData] = useState<TourData | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setAppState(AppState.ANALYZING_IMAGE);
    setError(null);
    setTourData(null);

    try {
      // 1. Convert File to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setCapturedImage(base64String);
        
        // Remove header for API
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        try {
          // 2. Identify Landmark
          const landmarkInfo = await identifyLandmark(base64Data, mimeType);
          
          if (landmarkInfo.name === "Unknown") {
            throw new Error("Could not identify a landmark. Please try a clearer photo.");
          }

          // 3. Fetch History (Search Grounding)
          setAppState(AppState.FETCHING_HISTORY);
          const { text, sources } = await getLandmarkHistory(landmarkInfo.name);

          // 4. Generate Audio (TTS)
          setAppState(AppState.GENERATING_AUDIO);
          const audioBase64 = await generateSpeech(text);
          
          // Decode Audio for Playback
          const audioBytes = decodeBase64(audioBase64);
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await decodeAudioData(audioBytes, audioContext);

          // 5. Complete
          setTourData({
            landmark: landmarkInfo,
            historyText: text,
            groundingSources: sources,
            audioBuffer: audioBuffer
          });
          setAppState(AppState.SHOWING_RESULT);

        } catch (err: any) {
          console.error(err);
          setError(err.message || "Something went wrong during analysis.");
          setAppState(AppState.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError("Failed to process image.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = useCallback(() => {
    setAppState(AppState.IDLE);
    setCapturedImage(null);
    setTourData(null);
    setError(null);
  }, []);

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden font-sans relative">
      
      {/* Background with tech grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,20,40,0.9),rgba(5,10,20,1)),url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-30 pointer-events-none"></div>
      
      {/* State: IDLE (Home Screen) */}
      {appState === AppState.IDLE && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="mb-8 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-ar-cyan to-ar-pink rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-black rounded-full p-6 border border-white/10">
              <Camera size={48} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-mono tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            GEONARRATOR
          </h1>
          <p className="text-ar-cyan text-lg md:text-xl font-mono tracking-widest uppercase mb-12">
            AI-Powered AR Tourism Guide
          </p>

          <div className="w-full max-w-xs relative">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <button className="w-full py-4 px-8 bg-ar-cyan/10 hover:bg-ar-cyan/20 border border-ar-cyan text-ar-cyan rounded-xl font-mono text-lg font-bold tracking-wider transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,243,255,0.2)] flex items-center justify-center gap-3">
              <Camera size={20} />
              <span>START SCAN</span>
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-xs font-mono">
               <Upload size={12} />
               <span>SUPPORTS JPG, PNG • CAMERA ACCESS REQUIRED</span>
            </div>
          </div>
        </div>
      )}

      {/* State: LOADING (Various Stages) */}
      {(appState === AppState.ANALYZING_IMAGE || 
        appState === AppState.FETCHING_HISTORY || 
        appState === AppState.GENERATING_AUDIO) && (
        <Loading state={appState} />
      )}

      {/* State: RESULT (AR View) */}
      {appState === AppState.SHOWING_RESULT && tourData && capturedImage && (
        <ARView 
          imageSrc={capturedImage} 
          data={tourData} 
          onReset={resetApp} 
        />
      )}

      {/* State: ERROR */}
      {appState === AppState.ERROR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-8">
          <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-2xl max-w-md w-full text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-mono text-white mb-2">SYSTEM ERROR</h3>
            <p className="text-red-200 mb-6 font-mono text-sm">{error}</p>
            <button 
              onClick={resetApp}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-mono rounded-lg transition-colors"
            >
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
