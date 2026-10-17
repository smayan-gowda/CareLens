import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, Mic, MicOff, Video, VideoOff, SwitchCamera, Send, 
  Sparkles, MessageSquare, Volume2, ShieldAlert, Clock, 
  Trash2, Bot, User, CheckCircle2, Lock, Copy, Check 
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { LensMark, LensMarkBadge } from "@/components/brand/LensMark";

function pcmToBase64(pcmData: Float32Array) {
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcmData.length; i++) {
    let s = Math.max(-1, Math.min(1, pcmData[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(i * 2, s, true);
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToPcm(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const buffer = bytes.buffer;
  const view = new DataView(buffer);
  const pcm = new Float32Array(buffer.byteLength / 2);
  for (let i = 0; i < pcm.length; i++) {
    pcm[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return pcm;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  timestamp: number;
  isPlaceholder?: boolean;
}

const OT_SUGGESTIONS = [
  { label: "Assess rug trip risk", emoji: "🛋️" },
  { label: "Check shower grab bars", emoji: "🚿" },
  { label: "Evaluate stair lighting", emoji: "💡" },
  { label: "Is path wide for walker?", emoji: "🚪" },
  { label: "Check cord hazards", emoji: "⚡" },
  { label: "Inspect transfer safety", emoji: "🛏️" }
];

export function LiveWalkthrough({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [subtitles, setSubtitles] = useState<string>("");
  const [chatInput, setChatInput] = useState<string>("");
  const [showChatLog, setShowChatLog] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  const videoIntervalRef = useRef<number | null>(null);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  useEffect(() => {
    let ws: WebSocket | undefined;
    let isActive = true;

    async function startSession() {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: { facingMode } 
          });
        } catch (e) {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: true 
          });
        }
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const newWs = new WebSocket(`${protocol}//${window.location.host}/api/live-walkthrough`);
        ws = newWs;
        wsRef.current = newWs;

        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        inputAudioCtxRef.current = inputCtx;
        outputAudioCtxRef.current = outputCtx;

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(inputCtx.destination);
        
        stream.getAudioTracks()[0].enabled = !micMuted;
        stream.getVideoTracks()[0].enabled = !videoMuted;

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN && !micMutedRef.current) {
            const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
            ws.send(JSON.stringify({ audio: base64 }));
          }
        };

        ws.onopen = () => {
          if (!isActive) return;

          setIsConnected(true);
          toast.success("CareLens Live Connected", {
            description: "CareLens OT is observing your environment in real-time."
          });
          
          const intervalId = window.setInterval(() => {
            videoIntervalRef.current = intervalId;
            if (isActive && ws.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current && !videoMutedRef.current) {
              const video = videoRef.current;
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                const targetWidth = 640;
                const scale = targetWidth / video.videoWidth;
                const targetHeight = video.videoHeight * scale;
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                const jpegBase64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                ws.send(JSON.stringify({ video: jpegBase64 }));
              }
            }
          }, 1000);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.audio) {
              playAudioChunk(outputCtx, msg.audio);
              setIsAiSpeaking(true);
              if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
              speakingTimeoutRef.current = setTimeout(() => setIsAiSpeaking(false), 2500);

              // Log audio activity in transcript if AI text isn't present yet
              setChatMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (!lastMsg || lastMsg.sender !== 'ai') {
                  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return [
                    ...prev,
                    {
                      id: `ai-voice-${Date.now()}`,
                      sender: 'ai',
                      text: "CareLens OT speaking...",
                      time: timeStr,
                      timestamp: Date.now(),
                      isPlaceholder: true
                    }
                  ];
                }
                return prev;
              });
            }

            if (msg.text) {
              const isUserMsg = !!msg.isUser;
              
              if (isUserMsg) {
                // Show user spoken transcript in live subtitle banner
                setSubtitles(`You: "${msg.text}"`);
                if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
                subtitleTimeoutRef.current = setTimeout(() => setSubtitles(""), 6000);

                // Ensure user message is in chat log
                setChatMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg && lastMsg.sender === 'user' && lastMsg.text === msg.text) {
                    return prev;
                  }
                  return [
                    ...prev,
                    {
                      id: `user-${Date.now()}`,
                      sender: 'user',
                      text: msg.text,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      timestamp: Date.now()
                    }
                  ];
                });
              } else {
                // CareLens AI Response
                const formattedText = msg.text;
                setSubtitles(formattedText);
                if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
                subtitleTimeoutRef.current = setTimeout(() => setSubtitles(""), 8000);

                setChatMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  // If replacing a placeholder or appending to recent AI turn (< 8s)
                  if (lastMsg && lastMsg.sender === 'ai' && (lastMsg.isPlaceholder || (Date.now() - lastMsg.timestamp) < 8000)) {
                    let mergedText = msg.text;
                    if (!lastMsg.isPlaceholder && lastMsg.text) {
                      if (lastMsg.text.includes(msg.text)) {
                        mergedText = lastMsg.text;
                      } else {
                        mergedText = `${lastMsg.text} ${msg.text}`;
                      }
                    }
                    return [
                      ...prev.slice(0, -1),
                      {
                        ...lastMsg,
                        text: mergedText,
                        isPlaceholder: false,
                        timestamp: Date.now()
                      }
                    ];
                  }
                  return [
                    ...prev,
                    {
                      id: `ai-text-${Date.now()}-${Math.random()}`,
                      sender: 'ai',
                      text: msg.text,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      timestamp: Date.now(),
                      isPlaceholder: false
                    }
                  ];
                });
              }
            }

            if (msg.interrupted) {
              nextStartTimeRef.current = outputCtx.currentTime;
              setIsAiSpeaking(false);
            }
          } catch (err) {
            console.error("Error parsing message from server", err);
          }
        };

        ws.onerror = () => {
          toast.error("Live WebSocket Connection Error");
        };

        ws.onclose = (event) => {
          if (!isActive) return;
          if (wsRef.current !== ws) return;
          setIsConnected(false);
          cleanup();
          if (event.code !== 1000) {
            toast.error('Session ended. ' + (event.reason || ''));
          }
        };

      } catch (err) {
        console.error("Error accessing media devices.", err);
        toast.error("Camera/Microphone access denied. Please allow permissions or open the app in a new tab.");
      }
    }
    
    startSession();

    return () => {
      isActive = false;
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    if (showChatLog && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatLog]);
  
  const micMutedRef = useRef(micMuted);
  const videoMutedRef = useRef(videoMuted);
  useEffect(() => { micMutedRef.current = micMuted; }, [micMuted]);
  useEffect(() => { videoMutedRef.current = videoMuted; }, [videoMuted]);

  function playAudioChunk(ctx: AudioContext, base64: string) {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const pcm = base64ToPcm(base64);
    const buffer = ctx.createBuffer(1, pcm.length, 24000);
    buffer.copyToChannel(pcm, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const currTime = ctx.currentTime;
    if (nextStartTimeRef.current < currTime) {
      nextStartTimeRef.current = currTime;
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  }

  function cleanup(specificWs?: WebSocket, specificStream?: MediaStream, specificInterval?: number) {
    if (specificInterval) clearInterval(specificInterval);
    else if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    
    if (specificWs) specificWs.close();
    else if (wsRef.current) wsRef.current.close();
    
    if (specificStream) {
      specificStream.getTracks().forEach(t => t.stop());
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close();
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close();
    }
  }

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);
    
    if (streamRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacingMode }
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        const oldVideoTrack = streamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          streamRef.current.removeTrack(oldVideoTrack);
        }
        
        streamRef.current.addTrack(newVideoTrack);
        newVideoTrack.enabled = !videoMutedRef.current;
        
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(console.error);
        }
      } catch (e) {
        console.error("Failed to switch camera", e);
      }
    }
  };

  const sendTextMessage = (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText) return;

    if (cooldownSeconds > 0) {
      toast.warning(`Please wait ${cooldownSeconds}s before sending another question to prevent spamming.`);
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: cleanText }));
      
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: cleanText,
        time: timeStr,
        timestamp: Date.now()
      };

      setChatMessages((prev) => [...prev, newMsg]);
      setSubtitles(`You: "${cleanText}"`);
      if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
      subtitleTimeoutRef.current = setTimeout(() => setSubtitles(""), 8000);
      setChatInput("");

      // Trigger 3 second anti-spam cooldown
      setCooldownSeconds(3);
    } else {
      toast.error("CareLens live stream connecting... Please try again in a moment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0e12] font-sans text-foreground flex flex-col select-none">
      <div className="flex-1 relative flex flex-col overflow-hidden">
        
        {/* CareLens Ledger Top Navigation Header */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-30 bg-gradient-to-b from-[#0c0e12]/95 via-[#0c0e12]/70 to-transparent border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {/* CareLens Brand reticle badge */}
            <div className="flex items-center gap-2 bg-[#161a22]/90 border border-white/15 px-3 py-1.5 rounded-md backdrop-blur-md shadow-sm">
              <LensMark className="w-4 h-4 text-brand" />
              <span className="font-semibold text-xs tracking-tight text-white uppercase">
                CareLens <span className="text-brand font-normal">Walkthrough</span>
              </span>
              <span className="tabular text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded border border-brand/30 ml-1 font-mono">
                01 · LIVE OT
              </span>
            </div>

            {/* Connection & Encryption badge */}
            <div className="hidden sm:flex items-center gap-2 bg-[#161a22]/70 border border-white/10 px-2.5 py-1.5 rounded-md backdrop-blur text-xs text-slate-300">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-mono">{isConnected ? "AES-256 STREAM" : "Connecting..."}</span>
              <Lock className="w-3 h-3 text-slate-500" />
            </div>

            {/* Audio output active indicator */}
            {isAiSpeaking && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 bg-brand/20 text-brand border border-brand/40 px-2.5 py-1 rounded-md text-xs font-medium backdrop-blur shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-brand" />
                <span className="text-[11px]">OT Speaking...</span>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowChatLog(!showChatLog)} 
              className={`rounded-md text-xs gap-1.5 backdrop-blur-md transition-all shadow-sm h-8 ${
                showChatLog 
                  ? 'bg-brand text-brand-foreground border-brand' 
                  : 'bg-[#161a22]/90 text-white border-white/20 hover:border-brand/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showChatLog ? "Close Ledger" : `Transcript (${chatMessages.length})`}</span>
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="text-slate-300 hover:text-white hover:bg-white/10 rounded-md h-8 w-8 transition-colors"
              title="Close Walkthrough"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Live Camera Viewport with Surveyor Reticles */}
        <div className="flex-1 bg-[#07080a] relative flex items-center justify-center overflow-hidden">
          {/* Surveyor Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:36px_36px] z-10" />

          {/* Surveyor Crosshair Corner Ticks */}
          <div className="absolute top-16 left-6 w-6 h-6 border-t-2 border-l-2 border-brand/70 pointer-events-none z-20" />
          <div className="absolute top-16 right-6 w-6 h-6 border-t-2 border-r-2 border-brand/70 pointer-events-none z-20" />
          <div className="absolute bottom-36 left-6 w-6 h-6 border-b-2 border-l-2 border-brand/70 pointer-events-none z-20" />
          <div className="absolute bottom-36 right-6 w-6 h-6 border-b-2 border-r-2 border-brand/70 pointer-events-none z-20" />

          {/* Telemetry Badge */}
          <div className="absolute top-20 left-8 z-20 pointer-events-none flex items-center gap-2">
            <div className="bg-[#161a22]/80 border border-white/10 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 flex items-center gap-2 backdrop-blur">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
              <span>LENS: {facingMode.toUpperCase()}</span>
              <span className="text-slate-600">|</span>
              <span>1 FPS</span>
            </div>
          </div>

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transition-opacity duration-300 ${videoMuted ? 'opacity-0' : 'opacity-100'}`} 
          />
          
          {videoMuted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 bg-[#0c0e12]">
              <LensMarkBadge size="lg" className="bg-[#161a22] text-slate-400 border border-white/10" />
              <p className="text-xs font-mono text-slate-300 uppercase tracking-wider">Camera Feed Suspended</p>
              <p className="text-xs text-slate-500">Tap camera button below to reactivate feed</p>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Real-time CareLens Subtitle Banner */}
          <AnimatePresence>
            {(subtitles || isAiSpeaking) && !showChatLog && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-40 inset-x-0 px-4 flex justify-center z-20 pointer-events-none"
              >
                 <div className={`px-5 py-3 rounded-md max-w-xl text-center text-xs sm:text-sm backdrop-blur-xl shadow-lg border leading-relaxed font-sans ${
                   subtitles.startsWith('You:') 
                     ? 'bg-[#0f2820]/95 text-emerald-100 border-emerald-500/40' 
                     : 'bg-[#161a22]/95 text-white border-brand/30'
                 }`}>
                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-mono mb-1 tracking-wider">
                      {subtitles.startsWith('You:') ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold"><User className="w-3 h-3" /> User Spoke</span>
                      ) : (
                        <span className="text-brand flex items-center gap-1"><LensMark className="w-3 h-3" /> OT Guidance</span>
                      )}
                    </div>
                    {subtitles ? (
                      subtitles
                    ) : (
                      <span className="inline-flex items-center gap-2 text-brand font-mono text-xs">
                        <Volume2 className="w-3.5 h-3.5 animate-pulse text-brand" />
                        <span>CareLens OT speaking...</span>
                      </span>
                    )}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CareLens Live Transcript Drawer Panel */}
          <AnimatePresence>
            {showChatLog && (
              <motion.div
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 80 }}
                className="absolute right-4 top-16 bottom-36 w-80 sm:w-96 bg-[#161a22]/95 border border-white/15 rounded-lg p-4 backdrop-blur-2xl z-30 flex flex-col shadow-2xl text-slate-100"
              >
                <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand flex items-center gap-1.5 font-mono">
                    <LensMark className="w-4 h-4 text-brand" /> Transcript Ledger
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {chatMessages.length > 0 && (
                      <button 
                        onClick={() => setChatMessages([])} 
                        className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
                        title="Clear log"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                    <button 
                      onClick={() => setShowChatLog(false)} 
                      className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/5"
                    >
                      Close
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm scrollbar-thin scrollbar-thumb-slate-800">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-500 my-auto py-12 text-xs flex flex-col items-center gap-2">
                      <LensMarkBadge size="md" className="bg-[#0c0e12] text-brand border border-white/10" />
                      <p className="font-medium text-slate-300">Transcript ledger empty</p>
                      <p className="text-[11px] text-slate-500 max-w-xs">Speak aloud or tap the OT prompts below to log real-time environmental observations.</p>
                    </div>
                  ) : (
                    chatMessages.map((m) => (
                      <div 
                        key={m.id} 
                        className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1 font-mono">
                          {m.sender === 'user' ? (
                            <>
                              <span className="text-brand font-medium">Surveyor (You)</span>
                              <User className="w-3 h-3 text-brand" />
                            </>
                          ) : (
                            <>
                              <LensMark className="w-3 h-3 text-brand" />
                              <span className="text-white font-medium">CareLens OT Specialist</span>
                            </>
                          )}
                          <span>• {m.time}</span>
                        </div>
                        
                        <div 
                          className={`px-3.5 py-2.5 rounded-md max-w-[88%] text-xs sm:text-sm leading-relaxed ${
                            m.sender === 'user' 
                              ? 'bg-brand/20 text-white border border-brand/30' 
                              : 'bg-[#0c0e12]/90 text-slate-100 border border-white/10'
                          }`}
                        >
                          {m.isPlaceholder ? (
                            <span className="inline-flex items-center gap-2 text-brand text-xs font-mono">
                              <Volume2 className="w-3.5 h-3.5 animate-pulse text-brand" />
                              <span>CareLens OT speaking...</span>
                            </span>
                          ) : (
                            m.text
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatBottomRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom CareLens Control Bar */}
          <div className="absolute bottom-5 inset-x-0 px-4 flex flex-col items-center gap-3 z-20 max-w-2xl mx-auto">
            
            {/* Contextual OT Suggestions Chips */}
            <div className="flex flex-wrap justify-center gap-1.5 px-2">
              {OT_SUGGESTIONS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={cooldownSeconds > 0}
                  onClick={() => sendTextMessage(chip.label)}
                  className={`border rounded-md px-3 py-1.5 text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm ${
                    cooldownSeconds > 0 
                      ? 'bg-[#161a22]/50 text-slate-500 border-white/5 cursor-not-allowed opacity-60' 
                      : 'bg-[#161a22]/90 hover:bg-[#1f2636] text-slate-200 hover:text-white border-white/15 hover:border-brand/50 active:scale-95'
                  }`}
                >
                  <span className="text-xs">{chip.emoji}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Input Form with Anti-Spam Rate Limiter */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                sendTextMessage(chatInput);
              }} 
              className="w-full flex gap-2"
            >
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={chatInput} 
                  disabled={cooldownSeconds > 0}
                  onChange={e => setChatInput(e.target.value)} 
                  placeholder={
                    cooldownSeconds > 0 
                      ? `Rate limit active... wait ${cooldownSeconds}s` 
                      : "Type an observation or ask CareLens OT to inspect a hazard..."
                  } 
                  className={`w-full border text-white placeholder-slate-400 rounded-md px-4 py-2 text-xs sm:text-sm outline-none transition-all backdrop-blur-md shadow-sm ${
                    cooldownSeconds > 0 
                      ? 'bg-[#161a22]/60 border-white/5 text-slate-500 cursor-not-allowed' 
                      : 'bg-[#161a22]/90 border-white/20 focus:border-brand focus:ring-1 focus:ring-brand'
                  }`}
                />
              </div>

              <Button 
                type="submit" 
                disabled={!chatInput.trim() || cooldownSeconds > 0}
                className={`rounded-md px-4 h-9 transition-all shadow-sm font-medium text-xs sm:text-sm ${
                  cooldownSeconds > 0 
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                    : "bg-brand hover:brightness-105 text-brand-foreground"
                }`}
              >
                {cooldownSeconds > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5 sm:mr-1.5 animate-spin text-amber-400" />
                    <span className="hidden sm:inline">Wait {cooldownSeconds}s</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </Button>
            </form>

            {/* Media Action Buttons */}
            <div className="flex justify-center items-center gap-3 mt-0.5">
              <Button
                variant="secondary"
                size="icon"
                className={`w-10 h-10 rounded-md shadow-sm transition-all ${
                  micMuted 
                    ? 'bg-rose-600/90 text-white hover:bg-rose-600 border border-rose-500' 
                    : 'bg-[#161a22]/90 hover:bg-[#1f2636] text-slate-100 border border-white/15'
                }`}
                onClick={toggleMic}
                title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-brand" />}
              </Button>
              
              <Button
                variant="destructive"
                className="h-10 px-5 rounded-md shadow-sm bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs sm:text-sm flex items-center gap-2"
                onClick={onClose}
                title="End Walkthrough Session"
              >
                <X className="w-4 h-4" />
                <span>End Walkthrough</span>
              </Button>

              <Button
                variant="secondary"
                size="icon"
                className={`w-10 h-10 rounded-md shadow-sm transition-all ${
                  videoMuted 
                    ? 'bg-rose-600/90 text-white hover:bg-rose-600 border border-rose-500' 
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-slate-700 backdrop-blur'
                }`}
                onClick={toggleVideo}
                title={videoMuted ? "Turn On Video" : "Turn Off Video"}
              >
                {videoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-brand" />}
              </Button>

              <Button
                variant="secondary"
                size="icon"
                className="w-10 h-10 rounded-md bg-[#161a22]/90 hover:bg-[#1f2636] text-slate-100 border border-white/15 shadow-sm"
                onClick={switchCamera}
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


