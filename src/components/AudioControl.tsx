'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings2, Sliders, Play, Pause } from 'lucide-react';

interface AudioControlProps {
  textToSpeak?: string;
  autoSpeak?: boolean;
  onApiKeyChange?: (key: string) => void;
  apiKey?: string;
}

export const AudioControl: React.FC<AudioControlProps> = ({
  textToSpeak = '',
  autoSpeak = false,
  onApiKeyChange,
  apiKey = '',
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);

  // Load persisted audio persona & API key from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRate = localStorage.getItem('signbridge_rate');
      if (savedRate) setTimeout(() => setRate(parseFloat(savedRate)), 0);

      const savedPitch = localStorage.getItem('signbridge_pitch');
      if (savedPitch) setTimeout(() => setPitch(parseFloat(savedPitch)), 0);

      const savedKey = localStorage.getItem('signbridge_api_key');
      if (savedKey) {
        setTimeout(() => setTempApiKey(savedKey), 0);
        onApiKeyChange?.(savedKey);
      }
    }
  }, [onApiKeyChange]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        if (availableVoices.length > 0) {
          const savedVoice = localStorage.getItem('signbridge_voice');
          if (savedVoice && availableVoices.some(v => v.name === savedVoice)) {
            setSelectedVoice(savedVoice);
          } else if (!selectedVoice) {
            const defaultVoice = availableVoices.find(v => v.lang.includes('en')) || availableVoices[0];
            setSelectedVoice(defaultVoice.name);
          }
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoice]);

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('signbridge_voice', voiceName);
    }
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (typeof window !== 'undefined') {
      localStorage.setItem('signbridge_rate', newRate.toString());
    }
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    if (typeof window !== 'undefined') {
      localStorage.setItem('signbridge_pitch', newPitch.toString());
    }
  };

  const speak = React.useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted || !text) return;

    window.speechSynthesis.cancel(); // stop previous speak

    const utterance = new SpeechSynthesisUtterance(text);
    const voiceObj = voices.find(v => v.name === selectedVoice);
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isMuted, voices, selectedVoice, rate, pitch]);

  useEffect(() => {
    if (autoSpeak && textToSpeak && !isMuted) {
      speak(textToSpeak);
    }
  }, [textToSpeak, autoSpeak, isMuted, speak]);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('signbridge_api_key', tempApiKey);
    }
    if (onApiKeyChange) {
      onApiKeyChange(tempApiKey);
    }
    setShowSettings(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 border border-slate-800 backdrop-blur-md p-3 rounded-2xl shadow-lg text-slate-200">
      {/* Play / Stop Button */}
      <button
        onClick={() => (isSpeaking ? stopSpeaking() : speak(textToSpeak))}
        disabled={!textToSpeak}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          isSpeaking
            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50 shadow-md animate-pulse'
            : textToSpeak
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50 shadow-md'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }`}
      >
        {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isSpeaking ? 'Stop Audio' : 'Speak Text'}
      </button>

      {/* Mute Toggle */}
      <button
        onClick={() => {
          if (!isMuted && isSpeaking) stopSpeaking();
          setIsMuted(!isMuted);
        }}
        className={`p-2 rounded-xl border transition-all ${
          isMuted
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
        }`}
        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Speech Voice Selector */}
      {voices.length > 0 && (
        <select
          value={selectedVoice}
          onChange={(e) => handleVoiceChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all max-w-[160px] truncate"
        >
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      )}

      {/* Settings Modal Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all ml-auto"
        title="Audio & AI Settings"
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {/* Settings Modal overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
                <Sliders className="w-5 h-5" /> Audio & AI Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Voice Pitch & Speed */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Speaking Speed (Rate: {rate.toFixed(1)}x)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Voice Pitch ({pitch.toFixed(1)})
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Gemini API Key Configuration */}
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <label className="block text-xs font-semibold text-indigo-300">
                Gemini API Key (Optional for Multimodal Vision AI)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-400 leading-tight">
                MediaPipe rule recognition operates offline automatically. Adding a Gemini API key enables continuous deep vision AI sign translation.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-900/50"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
