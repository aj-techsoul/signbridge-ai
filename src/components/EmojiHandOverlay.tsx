import React from 'react';
import { Landmark } from '@mediapipe/tasks-vision';
import { EMOJI_MAP } from './EmojiSignRenderer';

interface EmojiHandOverlayProps {
  multiHandLandmarks: Landmark[][];
  sign: string;
}

export const EmojiHandOverlay: React.FC<EmojiHandOverlayProps> = ({ multiHandLandmarks, sign }) => {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) return null;

  const key = sign.toUpperCase().trim();
  let emoji = EMOJI_MAP[key];
  if (!emoji) {
    if (key.length === 1) emoji = key;
    else {
      const match = Object.keys(EMOJI_MAP).find(k => key.includes(k));
      emoji = match ? EMOJI_MAP[match] : key;
    }
  }

  // Find the average center of all detected hands to place the emoji
  let cx = 0;
  let cy = 0;
  let totalPoints = 0;

  multiHandLandmarks.forEach(landmarks => {
    // Specifically use the palm center landmarks (0 = wrist, 9 = middle base)
    const wrist = landmarks[0];
    const middleBase = landmarks[9];
    if (wrist && middleBase) {
      cx += (wrist.x + middleBase.x) / 2;
      cy += (wrist.y + middleBase.y) / 2;
      totalPoints++;
    }
  });

  if (totalPoints === 0) return null;

  cx /= totalPoints;
  cy /= totalPoints;

  // The video element is mirrored horizontally, and landmarks map 0-1
  // We need to match the mirroring: MediaPipe x=0 is left of camera, but right side of mirrored screen
  const leftPos = (1 - cx) * 100;
  const topPos = cy * 100;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out"
        style={{ left: `${leftPos}%`, top: `${topPos}%` }}
      >
        <div className="relative">
          {/* Glowing background behind emoji */}
          <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full scale-150 animate-pulse"></div>
          {/* Emoji */}
          <span className="text-[8rem] font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            {emoji}
          </span>
        </div>
      </div>
    </div>
  );
};
