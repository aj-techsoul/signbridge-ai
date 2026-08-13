'use client';

import React, { useState } from 'react';
import { SignToSpeech } from '@/components/SignToSpeech';
import { SpeechToSign } from '@/components/SpeechToSign';
import { SignDictionary } from '@/components/SignDictionary';
import { AudioControl } from '@/components/AudioControl';
import { RecognizedSign } from '@/lib/gestureClassifier';
import { Hand, ShieldAlert, Sparkles } from 'lucide-react';

export default function Home() {
  const [apiKey, setApiKey] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('Hello! Welcome to SignBridge.');
  const [activeTab, setActiveTab] = useState<'translator' | 'dictionary'>('translator');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('signbridge_api_key');
      if (savedKey) setTimeout(() => setApiKey(savedKey), 0);
    }
  }, []);

  const handleGestureDetected = (sign: RecognizedSign) => {
    setTranslatedText(sign.name);
  };

  const handleSelectDictionarySign = (word: string) => {
    setTranslatedText(word);
    setActiveTab('translator');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <Hand className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                SignBridge AI
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Live Two-Way Sign Language & Speech Translator
              </p>
            </div>
          </div>

          {/* Navigation Pill */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl shrink-0">
            <button
              onClick={() => setActiveTab('translator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'translator'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Translator
            </button>
            <button
              onClick={() => setActiveTab('dictionary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'dictionary'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Library
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Global Audio Controller Bar */}
        <AudioControl
          textToSpeak={translatedText}
          autoSpeak={true}
          apiKey={apiKey}
          onApiKeyChange={(key) => setApiKey(key)}
        />

        {activeTab === 'translator' ? (
          /* Dual Translator Dashboard Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[580px]">
            {/* Left Side: Sign Language -> Speech/Text */}
            <SignToSpeech
              onGestureDetected={handleGestureDetected}
            />

            {/* Right Side: Speech/Text -> Sign Language */}
            <SpeechToSign />
          </div>
        ) : (
          /* Sign Reference Library */
          <div className="min-h-[580px]">
            <SignDictionary onSelectSign={handleSelectDictionarySign} />
          </div>
        )}

        {/* Emergency Quick Action Cards */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold">Quick Emergency & Essential Phrase Triggers</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Help / Assistance', sign: 'Help' },
              { label: 'Call Medical / Emergency', sign: 'Emergency' },
              { label: 'Need Water', sign: 'Water' },
              { label: 'Thank You', sign: 'Thank You' },
              { label: 'Yes', sign: 'Yes' },
              { label: 'No', sign: 'No' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setTranslatedText(item.sign);
                  setActiveTab('translator');
                }}
                className="bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-indigo-300 transition-all"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accessible Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>SignBridge AI • Autonomous Standalone Accessibility Application</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Powered by MediaPipe Vision & Gemini Multimodal API
          </span>
        </div>
      </footer>
    </main>
  );
}
