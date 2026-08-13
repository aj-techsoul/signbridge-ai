'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle2, LoaderCircle, Hand } from 'lucide-react';
import {
  classifyGesture,
  classifyTwoHandGesture,
  Landmark,
  RecognizedSign,
} from '../lib/gestureClassifier';
import { EmojiHandOverlay } from './EmojiHandOverlay';

// ─── MediaPipe type declarations ──────────────────────────────────────────────
interface MediaPipeResults {
  multiHandLandmarks:  Landmark[][];
  multiHandedness?: Array<{ label: string; score: number }>;
}

interface MediaPipeHands {
  setOptions(options: Record<string, number | boolean>): void;
  onResults(listener: (results: MediaPipeResults) => void): void;
  initialize(): Promise<void>;
  send(inputs: { image: HTMLVideoElement }): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    Hands?: new (config: { locateFile: (file: string) => string }) => MediaPipeHands;
  }
}

interface SignToSpeechProps {
  onGestureDetected?: (sign: RecognizedSign) => void;
}

// ─── Hand skeleton connections ─────────────────────────────────────────────────
const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

// ─── Per-hand visual themes ────────────────────────────────────────────────────
// MediaPipe label 'Right' = user's left hand in mirrored view, label 'Left' = user's right
const HAND_THEME = {
  Left:  { line: '#6366f1', dot: '#a5b4fc', label: '🤜 Right Hand', badge: 'bg-indigo-900/70 border-indigo-700 text-indigo-200' },
  Right: { line: '#10b981', dot: '#6ee7b7', label: '🤛 Left Hand',  badge: 'bg-emerald-900/70 border-emerald-700 text-emerald-200' },
};

// ─── Draw one hand's skeleton on canvas ───────────────────────────────────────
function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  w: number, h: number,
  label: 'Left' | 'Right'
) {
  const theme = HAND_THEME[label];

  // Connections
  ctx.strokeStyle = theme.line;
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  HAND_CONNECTIONS.forEach(([from, to]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[from].x * w, landmarks[from].y * h);
    ctx.lineTo(landmarks[to].x   * w, landmarks[to].y   * h);
    ctx.stroke();
  });

  // Finger tip glow rings
  const TIP_INDICES = [4, 8, 12, 16, 20];
  TIP_INDICES.forEach((i) => {
    const x = landmarks[i].x * w;
    const y = landmarks[i].y * h;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = theme.line + '33'; // transparent ring
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = theme.dot;
    ctx.fill();
  });

  // Regular joints
  landmarks.forEach((pt, idx) => {
    if (TIP_INDICES.includes(idx)) return;
    ctx.beginPath();
    ctx.arc(pt.x * w, pt.y * h, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = theme.dot;
    ctx.fill();
  });

  // Wrist label badge on canvas
  const wx = landmarks[0].x * w;
  const wy = landmarks[0].y * h;
  const lText = label === 'Left' ? 'Right Hand' : 'Left Hand';
  ctx.font        = 'bold 11px "Inter", system-ui, sans-serif';
  ctx.textAlign   = 'center';
  const tw        = ctx.measureText(lText).width;
  const bx        = wx - tw / 2 - 8;
  const by        = wy + 12;
  ctx.fillStyle   = label === 'Left' ? 'rgba(99,102,241,0.85)' : 'rgba(16,185,129,0.85)';
  ctx.beginPath();
  ctx.roundRect?.(bx, by, tw + 16, 20, 10);
  if (!ctx.roundRect) ctx.rect(bx, by, tw + 16, 20);
  ctx.fill();
  ctx.fillStyle   = '#ffffff';
  ctx.fillText(lText, wx, by + 14);
  ctx.textAlign   = 'left';
}

export const SignToSpeech: React.FC<SignToSpeechProps> = ({ onGestureDetected }) => {
  const videoRef         = useRef<HTMLVideoElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const handsRef         = useRef<MediaPipeHands | null>(null);
  const animationRef     = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastSignRef      = useRef<string>('');
  const lastSignAtRef    = useRef(0);

  const [isCameraActive, setIsCameraActive]   = useState(false);
  const [isModelLoading, setIsModelLoading]   = useState(false);
  const [handsDetected, setHandsDetected]     = useState<number>(0);
  const [currentSign, setCurrentSign]         = useState<RecognizedSign | null>(null);
  const [leftHandSign, setLeftHandSign]       = useState<RecognizedSign | null>(null);
  const [rightHandSign, setRightHandSign]     = useState<RecognizedSign | null>(null);
  const [twoHandSign, setTwoHandSign]         = useState<RecognizedSign | null>(null);
  const [sentenceHistory, setSentenceHistory] = useState<string[]>([]);
  const [cameraError, setCameraError]         = useState<string | null>(null);
  const [statusMessage, setStatusMessage]     = useState('Camera offline');
  const [rawLandmarks, setRawLandmarks]       = useState<Landmark[][]>([]);
  const [rawHandedness, setRawHandedness]     = useState<Array<{ label: string; score: number }>>([]);

  const drawResults = useCallback(
    (results: MediaPipeResults) => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video) return;

      const allLandmarks  = results.multiHandLandmarks  ?? [];
      const allHandedness = results.multiHandedness      ?? [];
      const count         = allLandmarks.length;

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width  = video.videoWidth  || 640;
          canvas.height = video.videoHeight || 480;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          allLandmarks.forEach((lm, i) => {
            const label = (allHandedness[i]?.label ?? (i === 0 ? 'Left' : 'Right')) as 'Left' | 'Right';
            drawHandSkeleton(ctx, lm, canvas.width, canvas.height, label);
          });
        }
      }
      
      setHandsDetected(count);
      setRawLandmarks(allLandmarks);
      setRawHandedness(allHandedness);

      if (count === 0) {
        setStatusMessage('Show one or both hands to the camera');
        setLeftHandSign(null);
        setRightHandSign(null);
        setTwoHandSign(null);
        setCurrentSign(null);
        return;
      }

      // ── Single-hand classification ────────────────────────────────────
      const perHandSigns: RecognizedSign[] = allLandmarks.map((lm, i) => {
        const label = (allHandedness[i]?.label ?? (i === 0 ? 'Left' : 'Right')) as 'Left' | 'Right';
        return classifyGesture(lm, label);
      }).filter((s): s is RecognizedSign => s !== null);

      const newLeft:  RecognizedSign | null = perHandSigns.find(s => s.hand === 'left')  ?? null;
      const newRight: RecognizedSign | null = perHandSigns.find(s => s.hand === 'right') ?? null;
      const dominantSign: RecognizedSign | null = perHandSigns.reduce(
        (best: RecognizedSign | null, s) => (!best || s.confidence > best.confidence) ? s : best,
        null
      );

      setLeftHandSign(newLeft);
      setRightHandSign(newRight);

      // ── Two-hand classification ───────────────────────────────────────
      let twoSign: RecognizedSign | null = null;
      if (count >= 2) {
        const label0 = (allHandedness[0]?.label ?? 'Left') as 'Left' | 'Right';
        const label1 = (allHandedness[1]?.label ?? 'Right') as 'Left' | 'Right';
        twoSign = classifyTwoHandGesture(
          allLandmarks[0], allLandmarks[1],
          label0, label1
        );
        setTwoHandSign(twoSign);
      } else {
        setTwoHandSign(null);
      }

      // Prefer two-hand sign if detected, else dominant single-hand sign
      const bestSign = twoSign ?? dominantSign;
      setCurrentSign(bestSign);

      if (count === 2) {
        setStatusMessage(
          twoSign
            ? `Two-hand sign: ${twoSign.name} (${Math.round(twoSign.confidence * 100)}%)`
            : 'Both hands detected — form a two-hand sign'
        );
      } else {
        setStatusMessage(
          dominantSign
            ? `Detected: ${dominantSign.name} (${Math.round(dominantSign.confidence * 100)}%)`
            : 'Hand detected — form a supported ASL gesture'
        );
      }

      // Record sign in history (debounced)
      if (bestSign) {
        const now = Date.now();
        if (bestSign.name !== lastSignRef.current || now - lastSignAtRef.current > 1800) {
          lastSignRef.current   = bestSign.name;
          lastSignAtRef.current = now;
          setSentenceHistory((prev) => [...prev, bestSign.name]);
          onGestureDetected?.(bestSign);
        }
      }
    },
    [onGestureDetected]
  );

  // ─── Stop camera ────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    if (handsRef.current) {
      try { handsRef.current.close(); } catch (_) { /* ignore */ }
      handsRef.current = null;
    }
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setHandsDetected(0);
    setCurrentSign(null);
    setLeftHandSign(null);
    setRightHandSign(null);
    setTwoHandSign(null);
    setRawLandmarks([]);
    setRawHandedness([]);
    setStatusMessage('Camera offline');
  }, []);

  // ─── Start camera + load MediaPipe ──────────────────────────────────────
  const startCamera = async () => {
    if (isModelLoading || isCameraActive) return;
    setCameraError(null);
    setIsModelLoading(true);
    setStatusMessage('Loading real-time hand landmark model…');
    try {
      if (videoRef.current?.srcObject) {
        const existing = videoRef.current.srcObject as MediaStream;
        existing.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      setIsCameraActive(true);
      const video = videoRef.current;
      if (!video) throw new Error('Video element unavailable.');
      video.srcObject   = stream;
      video.muted       = true;
      video.playsInline = true;
      await video.play();

      // Load MediaPipe CDN script once
      if (!window.Hands) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>('script[data-mediapipe-hands]');
          if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error('MediaPipe script failed to load.')), { once: true });
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
          script.async = true;
          script.dataset.mediapipeHands = 'true';
          script.onload  = () => resolve();
          script.onerror = () => reject(new Error('MediaPipe script failed to load.'));
          document.head.appendChild(script);
        });
      }
      if (!window.Hands) throw new Error('MediaPipe Hands is unavailable.');

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      // KEY CHANGE: maxNumHands: 2
      hands.setOptions({
        maxNumHands:            2,
        modelComplexity:        1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence:  0.65,
      });
      hands.onResults(drawResults);
      await hands.initialize();
      handsRef.current = hands;
      lastVideoTimeRef.current = -1;
      setStatusMessage('Live model ready — show one or both hands');

      const processFrame = async () => {
        const v = videoRef.current;
        if (handsRef.current && v && !v.paused && !v.ended) {
          if (v.readyState >= 2 && v.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = v.currentTime;
            try { await handsRef.current.send({ image: v }); }
            catch (e) { console.error('Frame error:', e); }
          }
        }
        if (handsRef.current) {
          animationRef.current = requestAnimationFrame(processFrame);
        }
      };
      animationRef.current = requestAnimationFrame(processFrame);
    } catch (error: unknown) {
      console.error('Camera/model error:', error);
      stopCamera();
      const e = error as { name?: string; message?: string };
      let msg = 'Could not start the camera. Check permissions and connection.';
      if (e?.name === 'NotReadableError' || e?.message?.includes('in use'))
        msg = 'Camera is in use by another app. Close other camera tabs and retry.';
      else if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError')
        msg = 'Camera permission denied. Allow camera access in your browser.';
      setCameraError(msg);
    } finally {
      setIsModelLoading(false);
    }
  };

  useEffect(() => stopCamera, [stopCamera]);

  // ─── UI ────────────────────────────────────────────────────────────────────
  const handStatusDot = (active: boolean, color: string) => (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full border-2 border-slate-900 transition-all duration-300 ${
        active ? `${color} animate-pulse shadow-lg` : 'bg-slate-700'
      }`}
    />
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl text-slate-100 shadow-2xl flex flex-col h-full space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">Live Hand Recognition</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 px-2.5 py-1 rounded-full font-medium">
            MediaPipe · Dual Hand
          </span>
        </div>
      </div>

      {/* ── Camera viewport ── */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-inner">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover -scale-x-100 ${isCameraActive ? 'block' : 'hidden'} opacity-50`}
          playsInline muted
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none z-10 ${isCameraActive ? 'block' : 'hidden'}`}
        />

        {/* Offline placeholder */}
        {!isCameraActive && (
          <div className="text-center p-6 space-y-3">
            <CameraOff className="w-10 h-10 mx-auto text-slate-600" />
            {cameraError ? (
              <div className="bg-rose-950/50 border border-rose-800/60 p-3.5 rounded-xl text-rose-200 max-w-sm mx-auto text-xs space-y-2 text-left">
                <p className="font-bold text-rose-400">⚠️ Camera Access Blocked</p>
                <p className="leading-relaxed text-[11px] text-rose-300">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="w-full mt-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-all"
                >
                  🔄 Retry Camera Access
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-300">Both Hands Supported</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Use one or <strong className="text-slate-300">both hands</strong> simultaneously.
                  The camera tracks each hand independently and can recognise two-hand ASL signs.
                </p>
                <div className="flex justify-center gap-4 pt-2 text-[11px]">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    {handStatusDot(false, 'bg-indigo-400')} Right Hand
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    {handStatusDot(false, 'bg-emerald-400')} Left Hand
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live status bar */}
        {isCameraActive && (
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              handsDetected > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <span className="text-slate-200 flex-1 truncate">{statusMessage}</span>
            <span className="text-slate-500 flex-shrink-0">{handsDetected} hand{handsDetected !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Per-hand indicator badges (bottom-left of viewport) */}
        {isCameraActive && (
          <div className="absolute bottom-2.5 left-2.5 flex flex-col gap-1.5">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all duration-300 ${
              rightHandSign
                ? 'bg-indigo-900/80 border-indigo-600 text-indigo-200 shadow-lg shadow-indigo-900/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-600'
            }`}>
              {handStatusDot(!!rightHandSign, 'bg-indigo-400')}
              🤜 Right Hand {rightHandSign ? `· ${rightHandSign.name}` : '· not detected'}
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all duration-300 ${
              leftHandSign
                ? 'bg-emerald-900/80 border-emerald-600 text-emerald-200 shadow-lg shadow-emerald-900/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-600'
            }`}>
              {handStatusDot(!!leftHandSign, 'bg-emerald-400')}
              🤛 Left Hand {leftHandSign ? `· ${leftHandSign.name}` : '· not detected'}
            </div>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={isCameraActive ? stopCamera : startCamera}
          disabled={isModelLoading}
          className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-lg"
        >
          {isModelLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
          {isCameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
        </button>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            {handStatusDot(!!rightHandSign && isCameraActive, 'bg-indigo-400')}
            <span className="text-indigo-400">Right</span>
          </span>
          <span className="flex items-center gap-1">
            {handStatusDot(!!leftHandSign && isCameraActive, 'bg-emerald-400')}
            <span className="text-emerald-400">Left</span>
          </span>
          {twoHandSign && (
            <span className="flex items-center gap-1 text-violet-400 font-medium animate-pulse">
              ✦ Two-hand sign active
            </span>
          )}
        </div>
      </div>

      {/* ── Current sign detail card ── */}
      {currentSign && isCameraActive && (
        <div className={`rounded-2xl border p-3.5 text-xs flex items-start gap-3 transition-all duration-300 ${
          twoHandSign
            ? 'bg-violet-950/60 border-violet-700/60'
            : currentSign.hand === 'right' || !currentSign.hand
              ? 'bg-indigo-950/60 border-indigo-800/60'
              : 'bg-emerald-950/60 border-emerald-800/60'
        }`}>
          <Hand className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
            twoHandSign ? 'text-violet-400' : currentSign.hand === 'left' ? 'text-emerald-400' : 'text-indigo-400'
          }`} />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{currentSign.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                twoHandSign
                  ? 'bg-violet-800/60 text-violet-300'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {twoHandSign ? '🤲 Two-hand' : currentSign.hand === 'left' ? '🤛 Left hand' : '🤜 Right hand'}
              </span>
              <span className="text-[10px] text-slate-500">{Math.round(currentSign.confidence * 100)}% conf.</span>
            </div>
            {currentSign.description && (
              <p className="text-slate-400 leading-relaxed">{currentSign.description}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Live Translation Summary ── */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-3 flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Live English Translation</span>
          {sentenceHistory.length > 0 && (
            <button
              onClick={() => { setSentenceHistory([]); setCurrentSign(null); }}
              className="text-[11px] font-semibold text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 px-2 py-1 rounded-md transition-colors"
            >
              Clear Text
            </button>
          )}
        </div>
        
        <div className="flex-1 min-h-[60px] flex items-center">
          {sentenceHistory.length > 0 ? (
            <p className="text-lg md:text-xl font-medium text-white leading-relaxed tracking-tight">
              {sentenceHistory.join(' ')}
            </p>
          ) : (
            <p className="text-slate-500 text-sm font-medium italic">
              Awaiting signs... your live translation will appear here.
            </p>
          )}
        </div>
        
        {currentSign?.description && (
          <p className="text-xs text-slate-400 pt-3 border-t border-slate-800/60 flex gap-2 items-start">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed">Latest sign detected: {currentSign.description}</span>
          </p>
        )}
      </div>

      <p className="pt-1 border-t border-slate-800 text-[11px] leading-relaxed text-slate-500">
        Real-time hand landmark tracking powered by MediaPipe Hands. Supports one and two simultaneous hands.
        Right hand shown in <span className="text-indigo-400">indigo</span>, left hand in <span className="text-emerald-400">green</span>.
        Two-hand signs are highlighted in <span className="text-violet-400">violet</span>.
      </p>
    </div>
  );
};
