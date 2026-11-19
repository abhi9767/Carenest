import { useEffect, useRef, useState } from 'react';
import {
  AudioLines,
  Bot,
  Check,
  Copy,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { PortalView } from '../types';

type ChatMode = 'fast' | 'general' | 'interactive' | 'deep';
type StudioTab = 'chat' | 'live';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelLabel?: string;
  timestamp: string;
}

interface LiveTranscriptItem {
  id: string;
  speaker: 'you' | 'advisor';
  text: string;
}

interface GeminiStudioDrawerProps {
  activePortal: PortalView;
}

const MODE_OPTIONS: Array<{
  id: ChatMode;
  label: string;
  modelId: string;
  caption: string;
}> = [
  {
    id: 'fast',
    label: 'Fast',
    modelId: 'gemini-3.1-flash-lite',
    caption: 'Quick FAQ & instant prices',
  },
  {
    id: 'general',
    label: 'General',
    modelId: 'gemini-4-hydrogen',
    caption: 'SkinAid Q&A & order help',
  },
  {
    id: 'interactive',
    label: 'Planner',
    modelId: 'gemini-4-hydrogen · High',
    caption: 'Multi-step routines & campaigns',
  },
  {
    id: 'deep',
    label: 'Deep Audit',
    modelId: 'gemini-4-hydrogen · XHigh',
    caption: 'HPLC chemistry & margin logic',
  },
];

const STARTER_PROMPTS: Record<PortalView, Array<{ label: string; mode: ChatMode; prompt: string }>> = {
  store: [
    {
      label: 'AM/PM UV Routine',
      mode: 'interactive',
      prompt: 'Build a complete AM/PM SkinAid routine for Kathmandu UV and melasma under NPR 4,500 using an affiliate discount.',
    },
    {
      label: 'Quick Cleanser Pick',
      mode: 'fast',
      prompt: 'Quick comparison: Herbal Foaming Face Wash vs Cleansing Milk — price and who should use each?',
    },
    {
      label: 'Ingredient Audit',
      mode: 'deep',
      prompt: 'Audit the phytochemistry and pH compatibility of SkinAid Tinted Sunscreen SPF 50+ layered over Skin Repairing Toner.',
    },
  ],
  shopper: [
    {
      label: 'My AM/PM Routine',
      mode: 'interactive',
      prompt: 'Suggest the ideal morning and night SkinAid layering sequence using Tinted Sunscreen SPF 50+, Skin Repairing Toner, and Anti Ageing Night Cream.',
    },
    {
      label: 'Bundle & Savings',
      mode: 'fast',
      prompt: 'Which Skin AID by CareNest curated routine bundles offer the best value for Kathmandu delivery via eSewa or Khalti?',
    },
    {
      label: 'Verify Bottle COA',
      mode: 'deep',
      prompt: 'Explain what Phytomax Care tests on batch SA-26-501 and why heavy metals < 0.01 ppm and pH 5.5 matter for sensitive skin.',
    },
  ],
  creator: [
    {
      label: '30s TikTok Hook',
      mode: 'interactive',
      prompt: 'Draft a 30-second Nepali-English TikTok hook and shot list for SkinAid Tinted Sunscreen SPF 50+ with code AAYUSHA5.',
    },
    {
      label: 'Commission Check',
      mode: 'fast',
      prompt: 'How much commission does a 5% max-tier creator earn per Daily Barrier & UV Shield Kit sold with 10% shopper benefit?',
    },
    {
      label: 'Conversion Strategy',
      mode: 'deep',
      prompt: 'Analyze why creator deep links convert best on 3-step bundles vs single SKUs and recommend a 7-day launch sequence.',
    },
  ],
  admin: [
    {
      label: 'Batch SA-26-501 Audit',
      mode: 'deep',
      prompt: 'Perform a phytochemical stability and heavy-metal safety verification review for Chitwan batch SA-26-501.',
    },
    {
      label: 'Hydra Facial Plan',
      mode: 'interactive',
      prompt: 'Outline a salon onboarding and affiliate rollout plan for the SkinAid Hydra Facial 4-Serum Pro Set (NPR 6,800).',
    },
    {
      label: 'Restock Priority',
      mode: 'fast',
      prompt: 'Which SkinAid SKUs carry the highest creator commission tier and clinical margin priority for dispatch?',
    },
  ],
};

function floatToInt16Base64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64PcmToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function formatNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function GeminiStudioDrawer({ activePortal }: GeminiStudioDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<StudioTab>('chat');

  // Chat state
  const [chatMode, setChatMode] = useState<ChatMode>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Audio transcription state (gemini-3.5-transcribe)
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Live voice state (gemini-3.8-live)
  const [liveStatus, setLiveStatus] = useState<
    'idle' | 'connecting' | 'active' | 'error'
  >('idle');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isAdvisorSpeaking, setIsAdvisorSpeaking] = useState(false);
  const [liveTranscripts, setLiveTranscripts] = useState<LiveTranscriptItem[]>(
    []
  );
  const [liveNudgeText, setLiveNudgeText] = useState('');

  // Mutable refs for live audio callbacks (prevent stale closures)
  const liveWsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const liveMicStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMicMutedRef = useRef<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const liveEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSendingChat]);

  useEffect(() => {
    liveEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscripts]);

  const stopNoteRecordingCleanup = () => {
    if (recordTimerRef.current !== null) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    setIsRecordingNote(false);
  };

  const stopAllOutputAudio = () => {
    activeAudioSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        // Ignore already-stopped nodes
      }
    });
    activeAudioSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    setIsAdvisorSpeaking(false);
  };

  const stopLiveSession = () => {
    stopAllOutputAudio();

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {
        // Ignore
      }
      processorRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignore
      }
      sourceNodeRef.current = null;
    }

    liveMicStreamRef.current?.getTracks().forEach((t) => t.stop());
    liveMicStreamRef.current = null;

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (liveWsRef.current) {
      try {
        if (
          liveWsRef.current.readyState === WebSocket.OPEN ||
          liveWsRef.current.readyState === WebSocket.CONNECTING
        ) {
          liveWsRef.current.close();
        }
      } catch {
        // Ignore
      }
      liveWsRef.current = null;
    }

    setLiveStatus('idle');
    setIsMicMuted(false);
    setIsAdvisorSpeaking(false);
  };

  useEffect(() => {
    return () => {
      stopNoteRecordingCleanup();
      stopLiveSession();
    };
  }, []);

  const portalSubtitle: Record<PortalView, string> = {
    store: 'Storefront Formulation Advisor',
    shopper: 'Personal Shopper & Routine Care',
    creator: 'Creator Growth Strategist',
    admin: 'Lab & Operations Analyst',
  };

  const sendChatMessage = async (
    overridePrompt?: string,
    overrideMode?: ChatMode
  ) => {
    const textToSend = (overridePrompt ?? inputText).trim();
    const targetMode = overrideMode ?? chatMode;
    if (!textToSend || isSendingChat) return;

    if (overrideMode) {
      setChatMode(overrideMode);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: formatNow(),
    };

    const historyPayload = messages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    if (!overridePrompt) {
      setInputText('');
    }
    setChatError(null);
    setIsSendingChat(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          mode: targetMode,
          portalContext: activePortal,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        model?: string;
        error?: string;
      };

      if (!response.ok || !data.reply) {
        throw new Error(
          data.error || `Request failed with status ${response.status}`
        );
      }

      const modeMeta = MODE_OPTIONS.find((m) => m.id === targetMode);
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.reply ?? '',
          modelLabel: `${modeMeta?.label ?? targetMode} · ${data.model ?? ''}`,
          timestamp: formatNow(),
        },
      ]);
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : 'Unable to reach Gemini service.'
      );
    } finally {
      setIsSendingChat(false);
    }
  };

  const toggleVoiceNoteRecording = async () => {
    if (isRecordingNote) {
      mediaRecorderRef.current?.stop();
      return;
    }

    setChatError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      recordedChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        stopNoteRecordingCleanup();

        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const buf = await audioBlob.arrayBuffer();
          const audioBase64 = arrayBufferToBase64(buf);
          const res = await fetch('/api/gemini/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64, mimeType }),
          });
          const data = (await res.json()) as {
            transcript?: string;
            error?: string;
          };
          if (!res.ok) {
            throw new Error(data.error || `Transcription failed (${res.status})`);
          }
          const cleanTranscript = (data.transcript ?? '').trim();
          if (cleanTranscript) {
            setLastTranscript(cleanTranscript);
            setInputText((prev) =>
              prev.trim() ? `${prev.trim()} ${cleanTranscript}` : cleanTranscript
            );
          } else {
            setChatError('No clear speech detected in recording. Please try again.');
          }
        } catch (err) {
          setChatError(
            err instanceof Error ? err.message : 'Audio transcription failed.'
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      setRecordingSeconds(0);
      setIsRecordingNote(true);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      recorder.start();
    } catch (err) {
      stopNoteRecordingCleanup();
      setChatError(
        err instanceof Error
          ? `Microphone error: ${err.message}`
          : 'Microphone access is required for audio transcription.'
      );
    }
  };

  const appendLiveTranscript = (
    speaker: 'you' | 'advisor',
    chunkText: string
  ) => {
    const clean = chunkText;
    if (!clean) return;
    setLiveTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker) {
        return [
          ...prev.slice(0, -1),
          { ...last, text: `${last.text}${clean}` },
        ];
      }
      return [
        ...prev,
        { id: `live-${Date.now()}-${Math.random()}`, speaker, text: clean },
      ];
    });
  };

  const playPcm24kChunk = (base64Audio: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const floatSamples = base64PcmToFloat32(base64Audio);
    if (floatSamples.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, floatSamples.length, 24000);
    audioBuffer.copyToChannel(new Float32Array(floatSamples), 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
    setIsAdvisorSpeaking(true);

    activeAudioSourcesRef.current.push(source);
    source.onended = () => {
      activeAudioSourcesRef.current = activeAudioSourcesRef.current.filter(
        (s) => s !== source
      );
      if (activeAudioSourcesRef.current.length === 0) {
        setIsAdvisorSpeaking(false);
      }
    };
  };

  const startLiveSession = async () => {
    if (liveStatus === 'connecting' || liveStatus === 'active') return;
    setLiveError(null);
    setLiveStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      liveMicStreamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const wsProtocol =
        window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(
        `${wsProtocol}//${window.location.host}/live?portal=${activePortal}`
      );
      liveWsRef.current = ws;

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        sourceNodeRef.current = source;
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (
            isMicMutedRef.current ||
            liveWsRef.current?.readyState !== WebSocket.OPEN
          ) {
            return;
          }
          const pcmFloat = event.inputBuffer.getChannelData(0);
          const audioBase64 = floatToInt16Base64(pcmFloat);
          liveWsRef.current.send(JSON.stringify({ audio: audioBase64 }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data) as {
          ready?: boolean;
          audio?: string;
          inputTranscript?: string;
          outputTranscript?: string;
          interrupted?: boolean;
          error?: string;
          closed?: boolean;
        };

        if (msg.ready) {
          setLiveStatus('active');
        }
        if (msg.audio) {
          playPcm24kChunk(msg.audio);
        }
        if (msg.inputTranscript) {
          appendLiveTranscript('you', msg.inputTranscript);
        }
        if (msg.outputTranscript) {
          appendLiveTranscript('advisor', msg.outputTranscript);
        }
        if (msg.interrupted) {
          stopAllOutputAudio();
        }
        if (msg.error) {
          setLiveError(msg.error);
          setLiveStatus('error');
        }
        if (msg.closed) {
          stopLiveSession();
        }
      };

      ws.onerror = () => {
        setLiveError(
          'WebSocket connection to Live Voice service encountered an error.'
        );
        setLiveStatus('error');
      };

      ws.onclose = () => {
        if (liveWsRef.current === ws) {
          stopLiveSession();
        }
      };
    } catch (err) {
      stopLiveSession();
      setLiveError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize microphone or Live audio session.'
      );
      setLiveStatus('error');
    }
  };

  const sendLiveTextNudge = () => {
    const txt = liveNudgeText.trim();
    if (!txt || liveWsRef.current?.readyState !== WebSocket.OPEN) return;
    liveWsRef.current.send(JSON.stringify({ text: txt }));
    appendLiveTranscript('you', `${txt} `);
    setLiveNudgeText('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open CareNest Botanical Assistant"
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#153B24] text-white shadow-lg border border-white/15 hover:bg-[#102e1c] transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-[#C6E4D1]" />
        <span className="text-xs font-semibold tracking-wide">
          Skin AID Concierge
        </span>
        {liveStatus === 'active' && (
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#12141C]/45 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="CareNest Botanical Concierge"
        >
          <div className="w-full max-w-xl bg-[#FAF8F5] h-full flex flex-col border-l border-[#12141C]/12 shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 bg-[#12141C] text-white flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-300" />
                  <h2 className="font-serif text-lg font-medium">
                    Skin AID by CareNest Concierge
                  </h2>
                </div>
                <p className="text-[11px] text-white/65 mt-0.5">
                  {portalSubtitle[activePortal]} · Multi-Model Gemini 4 &amp; Live Voice
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'chat' && messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setChatError(null);
                    }}
                    title="Clear conversation history"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close concierge drawer"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Studio Tabs */}
            <div className="px-5 pt-3 pb-2 bg-white border-b border-[#12141C]/10 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-[#153B24] text-white'
                    : 'bg-[#FAF8F5] text-[#12141C]/70 hover:text-[#12141C]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Chat &amp; Audio Transcribe
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'live'
                    ? 'bg-[#9E1B24] text-white'
                    : 'bg-[#FAF8F5] text-[#12141C]/70 hover:text-[#12141C]'
                }`}
              >
                <AudioLines className="w-3.5 h-3.5" />
                Live Voice Call
                {liveStatus === 'active' && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            </div>

            {activeTab === 'chat' ? (
              <>
                {/* Model Mode Selector */}
                <div className="px-5 py-3 bg-[#FAF8F5] border-b border-[#12141C]/10">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MODE_OPTIONS.map((opt) => {
                      const active = chatMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setChatMode(opt.id)}
                          className={`text-left px-2.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#153B24] text-white border-[#153B24]'
                              : 'bg-white text-[#12141C] border-[#12141C]/12 hover:border-[#153B24]/40'
                          }`}
                        >
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div
                            className={`text-[10px] font-mono truncate mt-0.5 ${
                              active ? 'text-emerald-200' : 'text-[#12141C]/50'
                            }`}
                          >
                            {opt.modelId}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[#12141C]/60 mt-2">
                    Active route:{' '}
                    <span className="font-semibold text-[#12141C]">
                      {MODE_OPTIONS.find((m) => m.id === chatMode)?.caption}
                    </span>
                  </p>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="space-y-4 py-4">
                      <div className="bg-white border border-[#12141C]/10 rounded-xl p-4">
                        <p className="font-serif text-base font-medium text-[#12141C]">
                          Ask about SkinAid formulations, routines, batch safety, or affiliate strategy.
                        </p>
                        <p className="text-xs text-[#12141C]/65 mt-1.5 leading-relaxed">
                          Multi-turn memory stays active across messages. Tap the microphone in the bar below to transcribe spoken Nepali-English voice notes using{' '}
                          <span className="font-mono text-[11px]">gemini-3.5-transcribe</span>.
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-[#12141C]/50 mb-2">
                          Suggested Prompts ({activePortal})
                        </p>
                        <div className="space-y-2">
                          {STARTER_PROMPTS[activePortal].map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => sendChatMessage(item.prompt, item.mode)}
                              className="w-full text-left bg-white hover:bg-[#153B24]/5 border border-[#12141C]/10 rounded-xl px-3.5 py-2.5 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-[#153B24]">
                                  {item.label}
                                </span>
                                <span className="text-[10px] font-mono text-[#12141C]/50">
                                  {
                                    MODE_OPTIONS.find((m) => m.id === item.mode)
                                      ?.modelId
                                  }
                                </span>
                              </div>
                              <p className="text-xs text-[#12141C]/70 mt-1 line-clamp-2">
                                {item.prompt}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[88%] rounded-xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-[#153B24] text-white'
                              : 'bg-white border border-[#12141C]/10 text-[#12141C]'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-[#12141C]/45 mt-1 px-1 font-mono">
                          {msg.role === 'user' ? 'You' : msg.modelLabel} ·{' '}
                          {msg.timestamp}
                        </span>
                      </div>
                    ))
                  )}

                  {isSendingChat && (
                    <div className="flex items-start">
                      <div className="bg-white border border-[#12141C]/10 rounded-xl px-4 py-3 text-xs text-[#12141C]/65">
                        Synthesizing botanical response...
                      </div>
                    </div>
                  )}

                  {chatError && (
                    <div className="bg-[#9E1B24]/8 border border-[#9E1B24]/30 rounded-xl p-3 text-xs text-[#9E1B24]">
                      {chatError}
                    </div>
                  )}

                  {lastTranscript && (
                    <div className="bg-emerald-950/5 border border-[#153B24]/20 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#153B24] font-semibold">
                          Voice Note Transcribed (gemini-3.5-transcribe)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(lastTranscript);
                            setCopiedTranscript(true);
                            window.setTimeout(() => setCopiedTranscript(false), 1800);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#153B24] hover:underline cursor-pointer"
                        >
                          {copiedTranscript ? (
                            <>
                              <Check className="w-3 h-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-[#12141C]/80 mt-1">
                        {lastTranscript}
                      </p>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Composer */}
                <div className="p-4 bg-white border-t border-[#12141C]/10 space-y-2.5">
                  {isRecordingNote && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#9E1B24]/10 border border-[#9E1B24]/25 text-xs text-[#9E1B24]">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#9E1B24] animate-pulse" />
                        Recording voice note ({recordingSeconds}s) — tap Stop to transcribe
                      </span>
                    </div>
                  )}
                  {isTranscribing && (
                    <div className="px-3 py-2 rounded-lg bg-[#153B24]/10 text-xs text-[#153B24] font-medium">
                      Transcribing audio via gemini-3.5-transcribe...
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={toggleVoiceNoteRecording}
                      disabled={isTranscribing}
                      title={
                        isRecordingNote
                          ? 'Stop recording & transcribe'
                          : 'Record voice note (gemini-3.5-transcribe)'
                      }
                      className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                        isRecordingNote
                          ? 'bg-[#9E1B24] text-white border-[#9E1B24]'
                          : 'bg-[#FAF8F5] text-[#12141C] border-[#12141C]/15 hover:border-[#153B24]'
                      }`}
                    >
                      {isRecordingNote ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-[#153B24]" />
                        </>
                      )}
                    </button>

                    <textarea
                      rows={2}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendChatMessage();
                        }
                      }}
                      placeholder="Ask about SkinAid routines, COA batches, or creator payouts..."
                      className="flex-1 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-[#12141C] placeholder:text-[#12141C]/40 focus:outline-none focus:border-[#153B24] resize-none"
                    />

                    <button
                      type="button"
                      onClick={() => sendChatMessage()}
                      disabled={isSendingChat || !inputText.trim()}
                      aria-label="Send message"
                      className="h-11 px-4 rounded-xl bg-[#153B24] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#102e1c] disabled:opacity-45 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Live Voice Tab (gemini-3.8-live) */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-5 py-4 bg-[#FAF8F5] border-b border-[#12141C]/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          liveStatus === 'active'
                            ? 'bg-emerald-500 animate-pulse'
                            : liveStatus === 'connecting'
                              ? 'bg-amber-500 animate-pulse'
                              : liveStatus === 'error'
                                ? 'bg-[#9E1B24]'
                                : 'bg-[#12141C]/25'
                        }`}
                      />
                      <span className="text-xs font-semibold text-[#12141C]">
                        {liveStatus === 'active'
                          ? isAdvisorSpeaking
                            ? 'Advisor Speaking (24kHz PCM)'
                            : 'Listening Live (16kHz PCM)'
                          : liveStatus === 'connecting'
                            ? 'Connecting Live Voice Bridge...'
                            : liveStatus === 'error'
                              ? 'Voice Session Error'
                              : 'Ready for Live Voice Consultation'}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[#12141C]/50 mt-0.5">
                      gemini-3.8-live · Zephyr Voice · Bidirectional Audio
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {liveStatus === 'active' && (
                      <button
                        type="button"
                        onClick={() => setIsMicMuted((m) => !m)}
                        className={`h-10 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                          isMicMuted
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-[#12141C]/15 text-[#12141C]'
                        }`}
                      >
                        {isMicMuted ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" /> Muted
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-[#153B24]" /> Mic On
                          </>
                        )}
                      </button>
                    )}

                    {liveStatus === 'active' || liveStatus === 'connecting' ? (
                      <button
                        type="button"
                        onClick={stopLiveSession}
                        className="h-10 px-4 rounded-lg bg-[#9E1B24] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#7d151c] cursor-pointer"
                      >
                        <PhoneOff className="w-3.5 h-3.5" />
                        End Call
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startLiveSession}
                        className="h-10 px-4 rounded-lg bg-[#153B24] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#102e1c] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Start Voice
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Transcript Stream */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {liveTranscripts.length === 0 ? (
                    <div className="bg-white border border-[#12141C]/10 rounded-xl p-5 text-center space-y-2.5 mt-4">
                      <div className="w-12 h-12 rounded-xl bg-[#153B24]/10 text-[#153B24] flex items-center justify-center mx-auto">
                        <AudioLines className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif text-base font-medium text-[#12141C]">
                        Real-Time SkinAid Voice Consultation
                      </h3>
                      <p className="text-xs text-[#12141C]/65 max-w-sm mx-auto leading-relaxed">
                        Press <span className="font-semibold">Start Voice</span> to speak directly with CareNest’s live advisor about sun protection, barrier repair, batch COAs, or creator affiliate commissions. You can interrupt naturally mid-sentence.
                      </p>
                    </div>
                  ) : (
                    liveTranscripts.map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex flex-col ${
                          entry.speaker === 'you' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                            entry.speaker === 'you'
                              ? 'bg-[#153B24] text-white'
                              : 'bg-white border border-[#12141C]/10 text-[#12141C]'
                          }`}
                        >
                          {entry.text}
                        </div>
                        <span className="text-[10px] font-mono text-[#12141C]/45 mt-1 px-1">
                          {entry.speaker === 'you' ? 'You (Live Mic)' : 'SkinAid Voice'}
                        </span>
                      </div>
                    ))
                  )}

                  {liveError && (
                    <div className="bg-[#9E1B24]/8 border border-[#9E1B24]/30 rounded-xl p-3 text-xs text-[#9E1B24]">
                      {liveError}
                    </div>
                  )}

                  <div ref={liveEndRef} />
                </div>

                {/* Live text nudge input */}
                <div className="p-4 bg-white border-t border-[#12141C]/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={liveNudgeText}
                    onChange={(e) => setLiveNudgeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendLiveTextNudge();
                      }
                    }}
                    disabled={liveStatus !== 'active'}
                    placeholder={
                      liveStatus === 'active'
                        ? 'Optionally type a batch code or SKU while speaking...'
                        : 'Start a live voice session to talk or send live nudges'
                    }
                    className="flex-1 h-11 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] px-3.5 text-xs text-[#12141C] placeholder:text-[#12141C]/40 focus:outline-none focus:border-[#153B24] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={sendLiveTextNudge}
                    disabled={liveStatus !== 'active' || !liveNudgeText.trim()}
                    className="h-11 px-4 rounded-xl bg-[#153B24] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
