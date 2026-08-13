'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, RotateCcw, UserCheck, Hand } from 'lucide-react';
import { EmojiSignRenderer } from './EmojiSignRenderer';

interface SpeechToSignProps {
  onSpeakSign?: (phrase: string) => void;
}

export const SpeechToSign: React.FC<SpeechToSignProps> = () => {
  const [inputText, setInputText] = useState('');
  const [activeTokens, setActiveTokens] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const tokenizeAndPlay = (text: string) => {
    if (!text.trim()) return;
    const tokens = text.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    setActiveTokens(tokens);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(transcript);
          tokenizeAndPlay(transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not supported. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (!isPlaying || activeTokens.length === 0) return;
    if (currentIndex < 0 || currentIndex >= activeTokens.length) {
      setTimeout(() => setIsPlaying(false), 0);
      return;
    }
    const timer = setTimeout(() => {
      const next = currentIndex + 1;
      if (next < activeTokens.length) {
        setCurrentIndex(next);
      } else {
        setIsPlaying(false);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, activeTokens]);

  const currentWord = currentIndex >= 0 && currentIndex < activeTokens.length
    ? activeTokens[currentIndex]
    : '';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl text-slate-100 shadow-2xl flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">Sign Language Hand Interpreter</h2>
        </div>
        <span className="text-xs bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 px-3 py-1 rounded-full font-medium flex items-center gap-1">
          <Hand className="w-3 h-3" /> Live Animated Hand
        </span>
      </div>

      {/* Input Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type or speak a sentence..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && tokenizeAndPlay(inputText)}
          className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
        />
        <button
          onClick={toggleListening}
          className={`p-3 rounded-2xl border transition-all ${
            isListening
              ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
          }`}
          title={isListening ? 'Stop' : 'Speak'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={() => tokenizeAndPlay(inputText)}
          disabled={!inputText.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 px-5 rounded-2xl font-semibold text-sm transition-all flex items-center gap-1"
        >
          <Send className="w-4 h-4" /> Sign
        </button>
      </div>

      {/* Live Hand Canvas */}
      <div className="flex-1 bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative flex flex-col items-center justify-center min-h-[320px] shadow-inner">
        <EmojiSignRenderer
          sign={currentWord || 'DEFAULT'}
          isAnimating={isPlaying}
        />

        {/* Status HUD */}
        <div className="absolute top-3 left-3 bg-slate-950/90 border border-indigo-500/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-mono text-indigo-300 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-indigo-400'}`} />
          {isPlaying
            ? <>Now signing: <strong className="text-white ml-1">{currentWord}</strong></>
            : 'Hand Interpreter Ready'}
        </div>
      </div>

      {/* Quick Signs */}
      {!isPlaying && activeTokens.length === 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Quick sign examples:</p>
          <div className="flex flex-wrap gap-2">
            {['Hello', 'Thank You', 'I Love You', 'Yes', 'No', 'Help', 'Water', 'Please', 'Sorry', 'Peace'].map(phrase => (
              <button
                key={phrase}
                onClick={() => { setInputText(phrase); tokenizeAndPlay(phrase); }}
                className="bg-slate-950 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-indigo-300 px-3 py-1.5 rounded-xl text-xs transition-all"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Token Progress Bar */}
      {activeTokens.length > 0 && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 py-1">
            {activeTokens.map((token, idx) => (
              <button
                key={idx}
                onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition-all shrink-0 ${
                  idx === currentIndex
                    ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400 scale-105'
                    : idx < currentIndex
                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                    : 'bg-slate-950 text-slate-600 border border-slate-900'
                }`}
              >
                {token}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setCurrentIndex(0); setIsPlaying(true); }}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all shrink-0"
            title="Replay"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
