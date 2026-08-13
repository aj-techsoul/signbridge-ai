'use client';

import React, { useState, useEffect } from 'react';
import { SIGN_DICTIONARY, ASL_ALPHABET } from '../lib/signData';
import { Search, Sparkles, BookOpen, Layers } from 'lucide-react';
import { HandSignRenderer } from './HandSignRenderer';

interface SignDictionaryProps {
  onSelectSign?: (word: string) => void;
}

export const SignDictionary: React.FC<SignDictionaryProps> = ({ onSelectSign }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'common' | 'emergency' | 'alphabet'>('all');
  const [activeTab, setActiveTab] = useState<'dictionary' | 'alphabet'>('dictionary');

  const filteredSigns = SIGN_DICTIONARY.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl text-slate-100 shadow-2xl flex flex-col h-full">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">Sign Language Reference</h2>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'dictionary'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dictionary
          </button>
          <button
            onClick={() => setActiveTab('alphabet')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'alphabet'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            A-Z Alphabet
          </button>
        </div>
      </div>

      {activeTab === 'dictionary' ? (
        <>
          {/* Search & Filter */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search sign phrases or words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 text-xs overflow-x-auto pb-1">
              {(['all', 'common', 'emergency'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg capitalize border transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[380px] pr-1">
            {filteredSigns.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectSign && onSelectSign(item.word)}
                className="bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-12 flex items-center justify-start overflow-hidden">
                      <img 
                        src={`/dataset-images/${item.word.toLowerCase()}.jpg`} 
                        alt={item.word}
                        className="max-h-[200%] max-w-[200%] object-cover filter invert brightness-125 contrast-125 mix-blend-screen"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'inline';
                          }
                        }}
                      />
                      <span className="text-2xl" style={{ display: 'none' }}>{item.emoji}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {item.word}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-500 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  <span className="truncate">{item.handsDescription}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Alphabet Reference Grid matching ASL chart */
        <div className="overflow-y-auto max-h-[460px] pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {ASL_ALPHABET.map((char) => (
              <button
                key={char}
                onClick={() => onSelectSign && onSelectSign(char)}
                className="bg-slate-950/90 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/40 rounded-2xl p-2 flex flex-col items-center justify-between group transition-all shadow-md hover:scale-105"
              >
                <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 relative flex items-center justify-center">
                  <HandSignRenderer sign={char} isAnimating={false} width={140} height={150} />
                </div>
                <div className="mt-2 flex items-center justify-between w-full px-1">
                  <span className="text-xl font-black text-white group-hover:text-indigo-400 font-mono">
                    {char}
                  </span>
                  <span className="text-[10px] font-semibold bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 px-2 py-0.5 rounded-full">
                    ASL
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
