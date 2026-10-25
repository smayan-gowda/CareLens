import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, Mic, MicOff, Video, VideoOff, SwitchCamera, Send, 
  Volume2, ShieldAlert, Clock, Trash2, User, Copy, Check,
  Camera, Sparkles, CheckCircle2, ChevronRight, Layers
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { LensMark } from "@/components/brand/LensMark";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStagingStore } from "@/stores/useStagingStore";
import { RoomType } from "@/types/home";

function resampleTo16k(audioData: Float32Array, origSampleRate: number): Float32Array {
  if (origSampleRate === 16000) return audioData;
  const ratio = origSampleRate / 16000;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const origIndex = i * ratio;
    const indexFloor = Math.floor(origIndex);
    const indexCeil = Math.min(audioData.length - 1, Math.ceil(origIndex));
    const fraction = origIndex - indexFloor;
    result[i] = audioData[indexFloor] * (1 - fraction) + audioData[indexCeil] * fraction;
  }
  return result;
}

function pcmToBase64(pcmData: Float32Array): string {
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcmData.length; i++) {
    let s = Math.max(-1, Math.min(1, pcmData[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(i * 2, s, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 1024;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
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

interface FlaggedSnapshot {
  id: string;
  imageUrl: string;
  timestamp: string;
  title: string;
  stagedId?: string;
}

const CLINICAL_OBSERVATION_PROMPTS = [
  { label: "Assess grab bar needs", emoji: "🚿" },
  { label: "Check rug trip hazard", emoji: "🛋️" },
  { label: "Inspect step lighting", emoji: "💡" },
  { label: "Measure walker clearance", emoji: "🚪" },
  { label: "Check trailing cables", emoji: "⚡" },
  { label: "Evaluate bed transfer safety", emoji: "🛏️" }
];

interface LiveWalkthroughProps {
  onClose: () => void;
  homeId?: string;
  roomId?: string;
  roomType?: RoomType;
  onSnapshotSaved?: (photoUrl: string) => void;
}

export function LiveWalkthrough({ 
  onClose, 
  homeId, 
  roomId, 
  roomType = 'living',
  onSnapshotSaved
}: LiveWalkthroughProps) {
  const { user } = useAuthStore();
  const { addPhoto } = useStagingStore();

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
  
  // Real-time audio & camera telemetry
  const [micLevel, setMicLevel] = useState<number>(0);
  const [cameraResolution, setCameraResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [flaggedSnapshots, setFlaggedSnapshots] = useState<FlaggedSnapshot[]>([]);
  const [showSnapshotsDrawer, setShowSnapshotsDrawer] = useState<boolean>(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState<boolean>(false);
  const [hasCopiedTranscript, setHasCopiedTranscript] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const muteGainRef = useRef<GainNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  const videoIntervalRef = useRef<number | null>(null);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const micMutedRef = useRef(micMuted);
  const videoMutedRef = useRef(videoMuted);
  useEffect(() => { micMutedRef.current = micMuted; }, [micMuted]);
  useEffect(() => { videoMutedRef.current = videoMuted; }, [videoMuted]);

  // AudioContext auto-resumer for browser autoplay policies
  const resumeAudioContexts = useCallback(() => {
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state === 'suspended') {
      inputAudioCtxRef.current.resume().catch(console.error);
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state === 'suspended') {
      outputAudioCtxRef.current.resume().catch(console.error);
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Main session lifecycle
  useEffect(() => {
    let ws: WebSocket | undefined;
    let isActive = true;

    async function startSession() {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }, 
            video: { 
              facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
        } catch (e) {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: true 
          });
        }
        
        if (!isActive) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              setCameraResolution({
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight
              });
            }
          };
        }

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const newWs = new WebSocket(`${protocol}//${window.location.host}/api/live-walkthrough`);
        ws = newWs;
        wsRef.current = newWs;

        // Setup 16kHz audio input context for Gemini Live API
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        const outputCtx = new AudioContextClass({ sampleRate: 24000 });
        
        inputAudioCtxRef.current = inputCtx;
        outputAudioCtxRef.current = outputCtx;

        // Resume audio context immediately if possible
        if (inputCtx.state === 'suspended') {
          inputCtx.resume().catch(() => {});
        }
        if (outputCtx.state === 'suspended') {
          outputCtx.resume().catch(() => {});
        }

        const source = inputCtx.createMediaStreamSource(stream);

        // Setup real-time AnalyserNode for live decibel volume wave
        const analyser = inputCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.3;
        analyserRef.current = analyser;
        source.connect(analyser);

        // Metering loop
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioMeter = () => {
          if (!isActive) return;
          if (analyserRef.current && !micMutedRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            // Scale to 0-100 range
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            setMicLevel(normalized);
          } else {
            setMicLevel(0);
          }
          animFrameRef.current = requestAnimationFrame(updateAudioMeter);
        };
        animFrameRef.current = requestAnimationFrame(updateAudioMeter);

        sourceRef.current = source;

        // ScriptProcessor to capture audio with resampler to guarantee exact 16kHz
        const processor = inputCtx.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;
        source.connect(processor);

        // Mute gain node to prevent mic echoing into speakers while keeping processing loop active
        const muteGain = inputCtx.createGain();
        muteGain.gain.value = 0;
        muteGainRef.current = muteGain;
        processor.connect(muteGain);
        muteGain.connect(inputCtx.destination);
        
        const audioTracks = stream.getAudioTracks();
        if (audioTracks[0]) audioTracks[0].enabled = !micMuted;
        const videoTracks = stream.getVideoTracks();
        if (videoTracks[0]) videoTracks[0].enabled = !videoMuted;

        processor.onaudioprocess = (e) => {
          if (ws?.readyState === WebSocket.OPEN && !micMutedRef.current) {
            const rawPcm = e.inputBuffer.getChannelData(0);
            const actualRate = e.inputBuffer.sampleRate || inputCtx.sampleRate || 48000;
            const resampled16k = resampleTo16k(rawPcm, actualRate);
            const base64 = pcmToBase64(resampled16k);
            ws.send(JSON.stringify({ audio: base64 }));
          }
        };

        // Native SpeechRecognition for instant, zero-latency voice recognition
        const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecClass) {
          try {
            const recognition = new SpeechRecClass();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
              let interimText = '';
              let finalText = '';

              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  finalText += event.results[i][0].transcript;
                } else {
                  interimText += event.results[i][0].transcript;
                }
              }

              if (interimText && !micMutedRef.current) {
                setSubtitles(`You: "${interimText}..."`);
              }

              if (finalText.trim() && !micMutedRef.current) {
                const cleanSpeech = finalText.trim();
                setSubtitles(`You: "${cleanSpeech}"`);
                
                setChatMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.sender === 'user' && last.text === cleanSpeech) return prev;
                  return [
                    ...prev,
                    {
                      id: `user-speech-${Date.now()}`,
                      sender: 'user',
                      text: cleanSpeech,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      timestamp: Date.now()
                    }
                  ];
                });

                if (ws?.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ text: cleanSpeech, isUserSpeech: true }));
                }
              }
            };

            recognition.onerror = (e: any) => {
              if (e?.error !== 'no-speech') {
                console.warn("SpeechRecognition notice:", e?.error);
              }
            };

            recognition.onend = () => {
              if (isActive && !micMutedRef.current) {
                try { recognition.start(); } catch (_) {}
              }
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (recErr) {
            console.warn("SpeechRecognition init error:", recErr);
          }
        }

        ws.onopen = () => {
          if (!isActive) return;

          setIsConnected(true);
          toast.success("CareLens Live Connected", {
            description: "Occupational Therapist live voice & camera stream active."
          });
          
          // Stream camera frames at 1 FPS to avoid saturating Gemini vision limits
          const intervalId = window.setInterval(() => {
            videoIntervalRef.current = intervalId;
            if (isActive && ws?.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current && !videoMutedRef.current) {
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
                const jpegBase64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
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
                setSubtitles(`You: "${msg.text}"`);
                if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
                subtitleTimeoutRef.current = setTimeout(() => setSubtitles(""), 6000);

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
                const formattedText = msg.text;
                setSubtitles(formattedText);
                if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
                subtitleTimeoutRef.current = setTimeout(() => setSubtitles(""), 8000);

                setChatMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
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
        toast.error("Camera or microphone permission was blocked. Please allow browser permissions to use live walkthrough.");
      }
    }
    
    startSession();

    return () => {
      isActive = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (ws) ws.close();
      cleanup();
    };
  }, [facingMode]);

  useEffect(() => {
    if (showChatLog && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatLog]);

  function playAudioChunk(ctx: AudioContext, base64: string) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(console.error);
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

  function cleanup() {
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    if (wsRef.current) wsRef.current.close();
    
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (_) {}
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (_) {}
    }
    if (muteGainRef.current) {
      try { muteGainRef.current.disconnect(); } catch (_) {}
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close().catch(() => {});
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close().catch(() => {});
    }
  }

  const toggleMic = () => {
    resumeAudioContexts();
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuted = !audioTrack.enabled;
        setMicMuted(newMuted);

        if (recognitionRef.current) {
          try {
            if (newMuted) {
              recognitionRef.current.stop();
            } else {
              recognitionRef.current.start();
            }
          } catch (_) {}
        }

        toast.info(!newMuted ? "Microphone active · Speak aloud" : "Microphone muted");
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoMuted(!videoTrack.enabled);
        toast.info(!videoTrack.enabled ? "Camera feed active" : "Camera feed paused");
      }
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);
    toast.info(`Switched to ${newFacingMode === 'environment' ? 'rear surveyor' : 'front'} camera`);
  };

  // One-tap Hazard Snapshot Capturer
  const captureHazardSnapshot = async () => {
    resumeAudioContexts();
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
      toast.error("Camera feed not ready to capture");
      return;
    }

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    try {
      setIsSavingSnapshot(true);
      const video = videoRef.current;
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = video.videoWidth;
      offscreenCanvas.height = video.videoHeight;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");
      
      ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
      const photoDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.85);

      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const formattedRoom = roomType ? roomType.charAt(0).toUpperCase() + roomType.slice(1) : 'Room';
      const snapshotTitle = `${formattedRoom} Hazard · ${timestampStr}`;

      let stagedId: string | undefined;

      // Save to Staging Vault if user is logged in
      if (user?.uid) {
        try {
          stagedId = await addPhoto(user.uid, {
            fileOrUrl: photoDataUrl,
            homeId: homeId || 'unassigned-property',
            roomId: roomId || undefined,
            roomType: roomType,
            title: snapshotTitle,
            notes: "Flagged during live CareLens OT walkthrough.",
            capturedFrom: 'mobile'
          });
        } catch (saveErr) {
          console.warn("Could not persist to Staging Vault in Firestore:", saveErr);
        }
      }

      const newSnapshot: FlaggedSnapshot = {
        id: `snap-${Date.now()}`,
        imageUrl: photoDataUrl,
        timestamp: timestampStr,
        title: snapshotTitle,
        stagedId
      };

      setFlaggedSnapshots(prev => [newSnapshot, ...prev]);

      // Inform parent ScanPage so it can queue it up for the visual safety report
      if (onSnapshotSaved) {
        onSnapshotSaved(photoDataUrl);
      }

      // Proactively notify CareLens OT via live stream to assess the captured hazard
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          text: `I just captured and flagged a physical hazard in this ${roomType}. Please assess what you observe in the frame and advise on what modification or safety equipment is needed.`
        }));

        setChatMessages(prev => [
          ...prev,
          {
            id: `snap-msg-${Date.now()}`,
            sender: 'user',
            text: `[Flagged Hazard Snapshot #${flaggedSnapshots.length + 1} captured in ${roomType}]`,
            time: timestampStr,
            timestamp: Date.now()
          }
        ]);
      }

      toast.success(`Hazard Flagged #${flaggedSnapshots.length + 1}`, {
        description: `Snapshot stored in Photo Library. CareLens OT is evaluating this area.`
      });

    } catch (err: any) {
      console.error("Failed to capture snapshot:", err);
      toast.error("Failed to capture frame: " + (err.message || 'Unknown error'));
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const sendTextMessage = (textToSend: string) => {
    resumeAudioContexts();
    const cleanText = textToSend.trim();
    if (!cleanText) return;

    if (cooldownSeconds > 0) {
      toast.warning(`Please wait ${cooldownSeconds}s before sending another prompt.`);
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
      setCooldownSeconds(3);
    } else {
      toast.error("CareLens live stream connecting... Please wait a moment");
    }
  };

  const copyTranscript = () => {
    if (chatMessages.length === 0) return;
    const text = chatMessages
      .map(m => `[${m.time}] ${m.sender === 'user' ? 'Surveyor' : 'CareLens OT'}: ${m.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setHasCopiedTranscript(true);
    toast.success("Transcript copied to clipboard");
    setTimeout(() => setHasCopiedTranscript(false), 2000);
  };

  return (
    <div 
      onClick={resumeAudioContexts}
      className="fixed inset-0 z-50 bg-[#07080b] font-sans text-slate-100 flex flex-col select-none overflow-hidden"
    >
      {/* Visual Shutter Flash on Snapshot */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div 
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        
        {/* Top Clinical Header Bar */}
        <header className="absolute top-0 left-0 w-full px-4 py-3.5 flex justify-between items-center z-30 bg-gradient-to-b from-[#07080b]/95 via-[#07080b]/75 to-transparent border-b border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Identity */}
            <div className="flex items-center gap-2 bg-[#12161f] border border-white/15 px-3 py-1.5 rounded-lg shadow-sm">
              <LensMark className="w-4 h-4 text-brand shrink-0" />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-white tracking-tight">CareLens</span>
                <span className="text-slate-400 font-normal">Live Walkthrough</span>
                <span className="text-slate-600 font-mono">·</span>
                <span className="text-brand font-medium text-[11px] capitalize">{roomType}</span>
              </div>
            </div>

            {/* Live Audio Input Activity & Decibel Indicator */}
            <div className={`hidden sm:flex items-center gap-2 border px-2.5 py-1 rounded-lg text-xs transition-colors backdrop-blur ${
              micMuted 
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300' 
                : micLevel > 12 
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 shadow-xs shadow-emerald-500/20' 
                  : 'bg-[#12161f]/80 border-white/10 text-slate-300'
            }`}>
              {micMuted ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px] font-mono">Mic Muted</span>
                </>
              ) : (
                <>
                  <div className="flex items-end gap-0.5 h-3.5 w-4" title="Microphone volume activity">
                    <span 
                      className={`w-0.5 rounded-xs transition-all duration-75 ${micLevel > 15 ? 'bg-emerald-400' : 'bg-slate-500'}`} 
                      style={{ height: `${Math.max(20, Math.min(100, micLevel * 1.5))}%` }} 
                    />
                    <span 
                      className={`w-0.5 rounded-xs transition-all duration-75 ${micLevel > 25 ? 'bg-emerald-400' : 'bg-slate-500'}`} 
                      style={{ height: `${Math.max(30, Math.min(100, micLevel * 2.2))}%` }} 
                    />
                    <span 
                      className={`w-0.5 rounded-xs transition-all duration-75 ${micLevel > 35 ? 'bg-emerald-400' : 'bg-slate-500'}`} 
                      style={{ height: `${Math.max(15, Math.min(100, micLevel * 1.8))}%` }} 
                    />
                    <span 
                      className={`w-0.5 rounded-xs transition-all duration-75 ${micLevel > 50 ? 'bg-emerald-400' : 'bg-slate-500'}`} 
                      style={{ height: `${Math.max(20, Math.min(100, micLevel * 2.6))}%` }} 
                    />
                  </div>
                  <span className="text-[11px] font-mono">
                    {micLevel > 12 ? `Voice Active (${micLevel}%)` : 'Listening...'}
                  </span>
                </>
              )}
            </div>

            {/* AI Voice Output Indicator */}
            {isAiSpeaking && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span className="text-[11px]">OT Voice Streaming</span>
              </motion.div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Flagged Hazards Pill */}
            {flaggedSnapshots.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSnapshotsDrawer(!showSnapshotsDrawer)}
                className="rounded-lg text-xs gap-1.5 bg-[#12161f] border-amber-500/40 text-amber-300 hover:bg-[#1a2130] h-8"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Hazards Flagged ({flaggedSnapshots.length})</span>
              </Button>
            )}

            {/* Transcript Ledger Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowChatLog(!showChatLog)} 
              className={`rounded-lg text-xs gap-1.5 backdrop-blur-md transition-all shadow-sm h-8 ${
                showChatLog 
                  ? 'bg-brand text-brand-foreground border-brand' 
                  : 'bg-[#12161f] text-slate-200 border-white/15 hover:border-brand/60'
              }`}
            >
              <span>Transcript</span>
              <span className="text-[10px] font-mono text-slate-400">({chatMessages.length})</span>
            </Button>

            {/* Exit Session Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="text-slate-300 hover:text-white hover:bg-white/10 rounded-lg h-8 w-8 transition-colors"
              title="Close Walkthrough"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Viewport & Surveyor Video Canvas */}
        <div className="flex-1 bg-[#06070a] relative flex items-center justify-center overflow-hidden">
          
          {/* Subtle Grid Reticle Texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px] z-10" />

          {/* Clinical Reticle Corner Brackets */}
          <div className="absolute top-16 left-6 w-8 h-8 border-t-2 border-l-2 border-brand/60 pointer-events-none z-20" />
          <div className="absolute top-16 right-6 w-8 h-8 border-t-2 border-r-2 border-brand/60 pointer-events-none z-20" />
          <div className="absolute bottom-32 left-6 w-8 h-8 border-b-2 border-l-2 border-brand/60 pointer-events-none z-20" />
          <div className="absolute bottom-32 right-6 w-8 h-8 border-b-2 border-r-2 border-brand/60 pointer-events-none z-20" />

          {/* Center Surveyor Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 opacity-40">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full border border-brand/80" />
              <div className="absolute top-0 w-0.5 h-3 bg-brand/80" />
              <div className="absolute bottom-0 w-0.5 h-3 bg-brand/80" />
              <div className="absolute left-0 h-0.5 w-3 bg-brand/80" />
              <div className="absolute right-0 h-0.5 w-3 bg-brand/80" />
            </div>
          </div>

          {/* Real Telemetry Bar */}
          <div className="absolute top-18 left-8 z-20 pointer-events-none flex items-center gap-2">
            <div className="bg-[#0f131a]/85 border border-white/10 px-3 py-1 rounded-md text-[11px] font-mono text-slate-300 flex items-center gap-2.5 backdrop-blur shadow-sm">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isConnected ? "LIVE STREAM ACTIVE" : "CONNECTING..."}</span>
              <span className="text-slate-600">·</span>
              <span>{cameraResolution.width > 0 ? `${cameraResolution.width}x${cameraResolution.height}` : '720p'}</span>
              <span className="text-slate-600">·</span>
              <span>1 FPS VISION</span>
              <span className="text-slate-600">·</span>
              <span>16kHz PCM</span>
            </div>
          </div>

          {/* Main Video Surface */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transition-opacity duration-300 ${videoMuted ? 'opacity-0' : 'opacity-100'}`} 
          />
          
          {videoMuted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 bg-[#0a0d13]">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <VideoOff className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-white tracking-wide">Camera Feed Paused</p>
              <p className="text-xs text-slate-400">Click the video button below to reactivate camera</p>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Real-time Subtitle & Voice Banner */}
          <AnimatePresence>
            {(subtitles || isAiSpeaking) && !showChatLog && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-36 inset-x-0 px-4 flex justify-center z-20 pointer-events-none"
              >
                 <div className={`px-5 py-3 rounded-xl max-w-xl text-center text-xs sm:text-sm backdrop-blur-xl shadow-xl border leading-relaxed font-sans ${
                   subtitles.startsWith('You:') 
                     ? 'bg-[#0b1f18]/95 text-emerald-100 border-emerald-500/40 shadow-emerald-950/40' 
                     : 'bg-[#12161f]/95 text-white border-brand/40 shadow-brand/10'
                 }`}>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-mono mb-1 tracking-wider">
                      {subtitles.startsWith('You:') ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <User className="w-3 h-3" /> Voice Recognized
                        </span>
                      ) : (
                        <span className="text-brand flex items-center gap-1 font-semibold">
                          <LensMark className="w-3 h-3" /> CareLens OT Specialist
                        </span>
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

          {/* Flagged Hazard Snapshots Drawer */}
          <AnimatePresence>
            {showSnapshotsDrawer && (
              <motion.aside
                initial={{ opacity: 0, x: -80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                className="absolute left-4 top-16 bottom-32 w-80 sm:w-88 bg-[#0f131a]/95 border border-white/15 rounded-xl p-4 backdrop-blur-2xl z-30 flex flex-col shadow-2xl text-slate-100"
              >
                <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">
                      Flagged Hazards ({flaggedSnapshots.length})
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowSnapshotsDrawer(false)}
                    className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/5"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm scrollbar-thin scrollbar-thumb-slate-800">
                  {flaggedSnapshots.length === 0 ? (
                    <div className="text-center text-slate-500 py-12 text-xs">
                      No hazards flagged yet. Tap the shutter button below when you see an obstacle or fall hazard.
                    </div>
                  ) : (
                    flaggedSnapshots.map((snap, idx) => (
                      <div 
                        key={snap.id}
                        className="p-2.5 rounded-lg border border-white/10 bg-[#07090e] hover:border-brand/40 transition-all flex gap-3 items-center"
                      >
                        <div className="w-16 h-12 rounded bg-black overflow-hidden shrink-0 border border-white/10">
                          <img src={snap.imageUrl} alt={snap.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{snap.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{snap.timestamp}</p>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Saved to Photo Library
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Transcript Ledger Drawer */}
          <AnimatePresence>
            {showChatLog && (
              <motion.aside
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 80 }}
                className="absolute right-4 top-16 bottom-32 w-80 sm:w-96 bg-[#0f131a]/95 border border-white/15 rounded-xl p-4 backdrop-blur-2xl z-30 flex flex-col shadow-2xl text-slate-100"
              >
                <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-1.5">
                    <LensMark className="w-4 h-4 text-brand" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">
                      Live Transcript Ledger
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {chatMessages.length > 0 && (
                      <>
                        <button 
                          onClick={copyTranscript}
                          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
                          title="Copy transcript"
                        >
                          {hasCopiedTranscript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{hasCopiedTranscript ? "Copied" : "Copy"}</span>
                        </button>
                        <button 
                          onClick={() => setChatMessages([])} 
                          className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
                          title="Clear transcript"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </>
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
                    <div className="text-center text-slate-400 my-auto py-12 text-xs flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-brand" />
                      </div>
                      <p className="font-semibold text-white">Transcript Ledger Empty</p>
                      <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                        Speak aloud into your microphone or tap the clinical prompts below. Both your spoken questions and CareLens OT guidance are logged in real time.
                      </p>
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
                              <span className="text-emerald-400 font-medium">Surveyor (You)</span>
                              <User className="w-3 h-3 text-emerald-400" />
                            </>
                          ) : (
                            <>
                              <LensMark className="w-3 h-3 text-brand" />
                              <span className="text-white font-medium">CareLens OT</span>
                            </>
                          )}
                          <span>· {m.time}</span>
                        </div>
                        
                        <div 
                          className={`px-3.5 py-2.5 rounded-lg max-w-[88%] text-xs sm:text-sm leading-relaxed ${
                            m.sender === 'user' 
                              ? 'bg-emerald-950/40 text-emerald-100 border border-emerald-500/30' 
                              : 'bg-[#07090e] text-slate-100 border border-white/10'
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
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Bottom Clinical Control Console */}
          <div className="absolute bottom-4 inset-x-0 px-4 flex flex-col items-center gap-2.5 z-20 max-w-3xl mx-auto">
            
            {/* Quick Clinical Observation Prompts */}
            <div className="flex flex-wrap justify-center gap-1.5 px-2">
              {CLINICAL_OBSERVATION_PROMPTS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={cooldownSeconds > 0}
                  onClick={() => sendTextMessage(chip.label)}
                  className={`border rounded-lg px-2.5 py-1 text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow-xs ${
                    cooldownSeconds > 0 
                      ? 'bg-[#12161f]/50 text-slate-500 border-white/5 cursor-not-allowed opacity-60' 
                      : 'bg-[#12161f]/90 hover:bg-[#1a2130] text-slate-200 hover:text-white border-white/15 hover:border-brand/50 active:scale-95'
                  }`}
                >
                  <span className="text-xs">{chip.emoji}</span>
                  <span className="font-medium text-[11px]">{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Observation Text Input Bar */}
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
                      : "Type an environmental question or speak into your microphone..."
                  } 
                  className={`w-full border text-white placeholder-slate-400 rounded-xl px-4 py-2 text-xs sm:text-sm outline-none transition-all backdrop-blur-md shadow-sm ${
                    cooldownSeconds > 0 
                      ? 'bg-[#12161f]/60 border-white/5 text-slate-500 cursor-not-allowed' 
                      : 'bg-[#12161f]/90 border-white/15 focus:border-brand focus:ring-1 focus:ring-brand'
                  }`}
                />
              </div>

              <Button 
                type="submit" 
                disabled={!chatInput.trim() || cooldownSeconds > 0}
                className={`rounded-xl px-4 h-9.5 transition-all shadow-sm font-semibold text-xs sm:text-sm ${
                  cooldownSeconds > 0 
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                    : "bg-brand hover:brightness-105 text-brand-foreground cursor-pointer"
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
                    <span className="hidden sm:inline">Ask OT</span>
                  </>
                )}
              </Button>
            </form>

            {/* Primary Shutter & Media Controls Bar */}
            <div className="flex justify-center items-center gap-4 mt-0.5">
              
              {/* Mic Toggle Button with Real Decibel Feedback */}
              <button
                type="button"
                onClick={toggleMic}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md relative ${
                  micMuted 
                    ? 'bg-rose-600/90 text-white hover:bg-rose-600 border border-rose-400' 
                    : micLevel > 15
                      ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                      : 'bg-[#161c28] hover:bg-[#202738] text-slate-200 border border-white/20'
                }`}
                title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              {/* Central ONE-TAP HAZARD SNAPSHOT Shutter Button */}
              <button
                type="button"
                disabled={isSavingSnapshot || videoMuted}
                onClick={captureHazardSnapshot}
                className={`h-12 px-6 rounded-full shadow-lg transition-all flex items-center gap-2.5 font-semibold text-xs sm:text-sm border ${
                  videoMuted
                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black border-amber-300/80 active:scale-95 shadow-amber-500/20'
                }`}
                title="Flag this hazard and capture snapshot"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-black/80 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                </div>
                <Camera className="w-4 h-4 text-black" strokeWidth={2.2} />
                <span>Flag Hazard Photo</span>
              </button>

              {/* Video Pause / Resume Button */}
              <button
                type="button"
                onClick={toggleVideo}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md ${
                  videoMuted 
                    ? 'bg-rose-600/90 text-white hover:bg-rose-600 border border-rose-400' 
                    : 'bg-[#161c28] hover:bg-[#202738] text-slate-200 border border-white/20'
                }`}
                title={videoMuted ? "Turn On Camera" : "Pause Camera"}
              >
                {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* Camera Switcher Button */}
              <button
                type="button"
                onClick={switchCamera}
                className="w-11 h-11 rounded-full bg-[#161c28] hover:bg-[#202738] text-slate-200 border border-white/20 flex items-center justify-center transition-all shadow-md active:rotate-180 duration-300"
                title="Switch Camera (Front / Rear)"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {/* End Session Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-rose-600/80 text-slate-300 hover:text-white border border-white/15 flex items-center justify-center transition-all shadow-md ml-1"
                title="End Walkthrough"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
