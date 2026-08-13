'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface HandSignRendererProps {
  sign: string;
  isAnimating: boolean;
  width?: number;
  height?: number;
}

// ─── ASL Sign Configurations ────────────────────────────────────────────────
// Each finger: [MCP_bend, PIP_bend, DIP_bend] in degrees  (0 = straight, 90 = fully curled)
// Thumb: [CMC_rotation, MCP_bend] — rotation = how far thumb splays
// wristAngle: overall hand rotation in degrees

interface HandPose {
  wristAngle: number;      // degrees, 0 = fingers pointing up
  thumbSplay: number;      // degrees left (positive) or right
  thumbBend: number;       // degrees, 0 = straight
  index: [number, number, number];
  middle: [number, number, number];
  ring: [number, number, number];
  pinky: [number, number, number];
}

interface SignConfig extends HandPose {
  label: string;
  description: string;
  twoHands?: boolean;
  leftHand?: HandPose;
  rightHand?: HandPose;
}

const ASL_SIGNS: Record<string, SignConfig> = {
  HELLO: {
    label: 'Hello', description: 'Open palm wave — all fingers extended, palm facing out',
    wristAngle: 0, thumbSplay: 30, thumbBend: 0,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
  },
  THANK: {
    label: 'Thank You', description: 'Flat hand from chin extending outward',
    wristAngle: -20, thumbSplay: 25, thumbBend: 0,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
  },
  THANKS: {
    label: 'Thank You', description: 'Flat hand from chin extending outward',
    wristAngle: -20, thumbSplay: 25, thumbBend: 0,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
  },
  LOVE: {
    label: 'I Love You ðŸ¤Ÿ', description: 'Thumb + Index + Pinky out, Middle + Ring curled',
    wristAngle: 10, thumbSplay: 40, thumbBend: 0,
    index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [0, 0, 0],
  },
  YES: {
    label: 'Yes', description: 'Closed fist nodding (S/A hand)',
    wristAngle: -10, thumbSplay: 15, thumbBend: 60,
    index: [85, 75, 50], middle: [85, 75, 50], ring: [85, 75, 50], pinky: [85, 75, 50],
  },
  NO: {
    label: 'No', description: 'Index + Middle snap to thumb',
    wristAngle: 0, thumbSplay: 15, thumbBend: 40,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 75, 50], pinky: [90, 75, 50],
  },
  HELP: {
    label: 'Help', description: 'Thumbs up — A hand lifted on flat palm',
    wristAngle: 0, thumbSplay: 0, thumbBend: 0,
    index: [90, 75, 55], middle: [90, 75, 55], ring: [90, 75, 55], pinky: [90, 75, 55],
  },
  WATER: {
    label: 'Water', description: 'W-shape — Index, Middle, Ring up, others curled',
    wristAngle: 0, thumbSplay: 0, thumbBend: 70,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [90, 75, 55],
  },
  PEACE: {
    label: 'Peace / V', description: 'Index and Middle extended in V',
    wristAngle: 0, thumbSplay: 10, thumbBend: 50,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 75, 55], pinky: [90, 75, 55],
  },
  PLEASE: {
    label: 'Please', description: 'Flat open palm facing viewer, circular motion on chest',
    wristAngle: 15, thumbSplay: 20, thumbBend: 0,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
  },
  SORRY: {
    label: 'Sorry', description: 'Closed fist — S hand, circular on chest',
    wristAngle: 0, thumbSplay: 0, thumbBend: 70,
    index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  MORE: {
    label: 'More', description: 'Fingertips bunched (O/flat-O shape), tap together',
    wristAngle: 10, thumbSplay: 20, thumbBend: 50,
    index: [60, 55, 40], middle: [60, 55, 40], ring: [60, 55, 40], pinky: [60, 55, 40],
  },
  GOOD: {
    label: 'Good', description: 'Flat palm, fingers together, moving forward',
    wristAngle: -15, thumbSplay: 18, thumbBend: 0,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
  },
  STOP: {
    label: 'Stop', description: 'Flat palm facing sideways like a karate chop',
    wristAngle: 90, thumbSplay: 15, thumbBend: 0,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
  },
  WANT: {
    label: 'Want', description: 'Both hands bent, claw-like pulling toward body',
    wristAngle: -30, thumbSplay: 15, thumbBend: 30,
    index: [45, 50, 30], middle: [45, 50, 30], ring: [45, 50, 30], pinky: [45, 50, 30],
  },
  COME: {
    label: 'Come', description: 'Index finger beckons inward',
    wristAngle: -20, thumbSplay: 20, thumbBend: 50,
    index: [0, 60, 40], middle: [90, 75, 55], ring: [90, 75, 55], pinky: [90, 75, 55],
  },
  FOOD: {
    label: 'Food / Eat', description: 'Fingertips bunched tapping lips',
    wristAngle: 20, thumbSplay: 20, thumbBend: 40,
    index: [55, 50, 35], middle: [55, 50, 35], ring: [55, 50, 35], pinky: [55, 50, 35],
  },
  EAT: {
    label: 'Eat', description: 'Fingertips bunched tapping lips',
    wristAngle: 20, thumbSplay: 20, thumbBend: 40,
    index: [55, 50, 35], middle: [55, 50, 35], ring: [55, 50, 35], pinky: [55, 50, 35],
  },
  BAD: {
    label: 'Bad', description: 'Flat hand flips downward from face',
    wristAngle: 30, thumbSplay: 20, thumbBend: 0,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
  },

  // ─── ASL Alphabet Aâ€“Z ─────────────────────────────────────────────────────
  A: {
    label: 'A', description: 'Fist with thumb alongside — ASL A',
    wristAngle: -5, thumbSplay: 10, thumbBend: 20,
    index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55],
  },
  B: {
    label: 'B', description: 'All fingers straight up, thumb bent across palm — ASL B',
    wristAngle: 0, thumbSplay: 5, thumbBend: 80,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
  },
  C: {
    label: 'C', description: 'All fingers curved in C shape — ASL C',
    wristAngle: 5, thumbSplay: 30, thumbBend: 30,
    index: [45, 30, 20], middle: [45, 30, 20], ring: [45, 30, 20], pinky: [45, 30, 20],
  },
  D: {
    label: 'D', description: 'Index up, middle/ring/pinky curl to touch thumb — ASL D',
    wristAngle: 0, thumbSplay: 20, thumbBend: 40,
    index: [0, 0, 0], middle: [80, 70, 50], ring: [80, 70, 50], pinky: [80, 70, 50],
  },
  E: {
    label: 'E', description: 'All fingers curled at tips, thumb tucked — ASL E',
    wristAngle: 0, thumbSplay: 5, thumbBend: 65,
    index: [70, 55, 45], middle: [70, 55, 45], ring: [70, 55, 45], pinky: [70, 55, 45],
  },
  F: {
    label: 'F', description: 'Index + thumb form O, other 3 fingers straight up — ASL F',
    wristAngle: 0, thumbSplay: 10, thumbBend: 55,
    index: [70, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
  },
  G: {
    label: 'G', description: 'Index and thumb pointing horizontally — ASL G',
    wristAngle: 80, thumbSplay: 35, thumbBend: 0,
    index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  H: {
    label: 'H', description: 'Index + middle pointing sideways, thumb up — ASL H',
    wristAngle: 80, thumbSplay: 15, thumbBend: 60,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  I: {
    label: 'I', description: 'Pinky raised, others fisted — ASL I',
    wristAngle: 0, thumbSplay: 5, thumbBend: 60,
    index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [0, 0, 0],
  },
  J: {
    label: 'J', description: 'Pinky up (I-hand) — ASL J',
    wristAngle: -5, thumbSplay: 5, thumbBend: 60,
    index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [0, 0, 0],
  },
  K: {
    label: 'K', description: 'Index + middle up with thumb between — ASL K',
    wristAngle: 5, thumbSplay: 15, thumbBend: 30,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  L: {
    label: 'L', description: 'Index up, thumb out — L-shape — ASL L',
    wristAngle: 5, thumbSplay: 60, thumbBend: 0,
    index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  M: {
    label: 'M', description: 'Three fingers fold over thumb — ASL M',
    wristAngle: 0, thumbSplay: 0, thumbBend: 40,
    index: [80, 70, 55], middle: [80, 70, 55], ring: [80, 70, 55], pinky: [90, 80, 60],
  },
  N: {
    label: 'N', description: 'Two fingers fold over thumb — ASL N',
    wristAngle: 0, thumbSplay: 0, thumbBend: 40,
    index: [80, 70, 55], middle: [80, 70, 55], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  O: {
    label: 'O', description: 'All fingers curve to form O with thumb — ASL O',
    wristAngle: 0, thumbSplay: 20, thumbBend: 50,
    index: [60, 50, 35], middle: [60, 50, 35], ring: [60, 50, 35], pinky: [60, 50, 35],
  },
  P: {
    label: 'P', description: 'Middle finger points down, index/thumb out — ASL P',
    wristAngle: -30, thumbSplay: 30, thumbBend: 10,
    index: [30, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  Q: {
    label: 'Q', description: 'G shape pointing downward — ASL Q',
    wristAngle: -60, thumbSplay: 35, thumbBend: 0,
    index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  R: {
    label: 'R', description: 'Index and middle crossed, others curled — ASL R',
    wristAngle: 0, thumbSplay: 10, thumbBend: 55,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  S: {
    label: 'S', description: 'Fist, thumb wraps over fingers — ASL S',
    wristAngle: 0, thumbSplay: 5, thumbBend: 30,
    index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55],
  },
  T: {
    label: 'T', description: 'Fist with thumb between index and middle — ASL T',
    wristAngle: 0, thumbSplay: 10, thumbBend: 20,
    index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55],
  },
  U: {
    label: 'U', description: 'Index + middle up together — ASL U',
    wristAngle: 0, thumbSplay: 10, thumbBend: 55,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  V: {
    label: 'V', description: 'Index + middle spread in V — ASL V',
    wristAngle: 0, thumbSplay: 10, thumbBend: 55,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  W: {
    label: 'W', description: 'Index, middle, ring up spread — ASL W',
    wristAngle: 0, thumbSplay: 5, thumbBend: 60,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [90, 80, 60],
  },
  X: {
    label: 'X', description: 'Index finger hooked — ASL X',
    wristAngle: 0, thumbSplay: 10, thumbBend: 55,
    index: [50, 70, 45], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60],
  },
  Y: {
    label: 'Y', description: 'Thumb + pinky out, others curled — ASL Y',
    wristAngle: 5, thumbSplay: 45, thumbBend: 0,
    index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [0, 0, 0],
  },
  Z: {
    label: 'Z', description: 'Index traces Z in air — ASL Z',
    wristAngle: 0, thumbSplay: 10, thumbBend: 55,
    index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60],
  },

  // ─── Numbers ─────────────────────────────────────────────────────────────
  '1': { label: '1', description: 'Index up — number 1', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  ONE: { label: '1', description: 'Index up — number 1', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  '2': { label: '2', description: 'Index + middle up — number 2', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60] },
  TWO: { label: '2', description: 'Index + middle up — number 2', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60] },
  '3': { label: '3', description: 'Index + middle + ring — number 3', wristAngle: 0, thumbSplay: 5, thumbBend: 60, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [90, 80, 60] },
  THREE: { label: '3', description: 'Three fingers — number 3', wristAngle: 0, thumbSplay: 5, thumbBend: 60, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [90, 80, 60] },
  '4': { label: '4', description: 'Four fingers up — number 4', wristAngle: 0, thumbSplay: 5, thumbBend: 70, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  FOUR: { label: '4', description: 'Four fingers up — number 4', wristAngle: 0, thumbSplay: 5, thumbBend: 70, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  '5': { label: '5', description: 'All five spread open — number 5', wristAngle: 0, thumbSplay: 40, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  FIVE: { label: '5', description: 'All five spread open — number 5', wristAngle: 0, thumbSplay: 40, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  '6': { label: '6', description: 'Pinky + thumb touch — number 6', wristAngle: 5, thumbSplay: 35, thumbBend: 20, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  SIX: { label: '6', description: 'Pinky + thumb touch — number 6', wristAngle: 5, thumbSplay: 35, thumbBend: 20, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  '7': { label: '7', description: 'Ring + thumb touch — number 7', wristAngle: 5, thumbSplay: 25, thumbBend: 30, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  SEVEN: { label: '7', description: 'Ring + thumb touch — number 7', wristAngle: 5, thumbSplay: 25, thumbBend: 30, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  '8': { label: '8', description: 'Middle + thumb touch — number 8', wristAngle: 5, thumbSplay: 15, thumbBend: 40, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  EIGHT: { label: '8', description: 'Middle + thumb touch — number 8', wristAngle: 5, thumbSplay: 15, thumbBend: 40, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  '9': { label: '9', description: 'Index + thumb touch (loop) — number 9', wristAngle: 5, thumbSplay: 10, thumbBend: 50, index: [60, 50, 35], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  NINE: { label: '9', description: 'Index + thumb touch — number 9', wristAngle: 5, thumbSplay: 10, thumbBend: 50, index: [60, 50, 35], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  '10': { label: '10', description: 'Thumb up, shaking (A-hand + shake)', wristAngle: -5, thumbSplay: 5, thumbBend: 0, index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  TEN: { label: '10', description: 'Thumb up, shaking (A-hand + shake)', wristAngle: -5, thumbSplay: 5, thumbBend: 0, index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },

  // ─── Emotions ─────────────────────────────────────────────────────────────
  HAPPY: { label: 'Happy ðŸ˜Š', description: 'Flat hand brushes upward on chest', wristAngle: -10, thumbSplay: 20, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  SAD: { label: 'Sad ðŸ˜¢', description: 'Both hands drop from face', wristAngle: -25, thumbSplay: 20, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  ANGRY: { label: 'Angry ðŸ˜ ', description: 'Claw shape pulled from face', wristAngle: -15, thumbSplay: 20, thumbBend: 20, index: [45, 50, 35], middle: [45, 50, 35], ring: [45, 50, 35], pinky: [45, 50, 35] },
  SCARED: { label: 'Scared ðŸ˜¨', description: 'Fingers splay inward toward chest', wristAngle: 10, thumbSplay: 30, thumbBend: 15, index: [30, 20, 10], middle: [30, 20, 10], ring: [30, 20, 10], pinky: [30, 20, 10] },
  SURPRISE: { label: 'Surprise ðŸ˜²', description: 'Fists open outward quickly', wristAngle: 5, thumbSplay: 35, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  TIRED: { label: 'Tired ðŸ˜´', description: 'Bent hands drop at wrists', wristAngle: 40, thumbSplay: 20, thumbBend: 10, index: [20, 15, 10], middle: [20, 15, 10], ring: [20, 15, 10], pinky: [20, 15, 10] },
  SICK: { label: 'Sick ðŸ¤’', description: 'Middle finger touches forehead', wristAngle: -5, thumbSplay: 20, thumbBend: 20, index: [70, 60, 45], middle: [0, 0, 0], ring: [70, 60, 45], pinky: [70, 60, 45] },
  PAIN: { label: 'Pain ðŸ˜£', description: 'Index fingers point at each other (hurt)', wristAngle: 0, thumbSplay: 15, thumbBend: 50, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  EXCITED: { label: 'Excited ðŸŽ‰', description: 'Bent middle fingers brush upward', wristAngle: -15, thumbSplay: 25, thumbBend: 10, index: [20, 15, 10], middle: [0, 50, 35], ring: [20, 15, 10], pinky: [20, 15, 10] },
  BORED: { label: 'Bored ðŸ˜‘', description: 'Index finger rotates at nose', wristAngle: -5, thumbSplay: 10, thumbBend: 50, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  FINE: { label: 'Fine ðŸ‘Œ', description: 'F-hand on chest', wristAngle: 5, thumbSplay: 10, thumbBend: 50, index: [60, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },

  // ─── Family ─────────────────────────────────────────────────────────────
  MOM: { label: 'Mom', description: 'A-hand with thumb on chin', wristAngle: -5, thumbSplay: 25, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  MOTHER: { label: 'Mother', description: 'A-hand with thumb on chin', wristAngle: -5, thumbSplay: 25, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  DAD: { label: 'Dad', description: 'A-hand with thumb on forehead', wristAngle: -5, thumbSplay: 25, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  FATHER: { label: 'Father', description: 'A-hand with thumb on forehead', wristAngle: -5, thumbSplay: 25, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  SISTER: { label: 'Sister', description: 'L-shape from jaw down', wristAngle: 5, thumbSplay: 55, thumbBend: 0, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  BROTHER: { label: 'Brother', description: 'L-shape from forehead down', wristAngle: 5, thumbSplay: 55, thumbBend: 0, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  FRIEND: { label: 'Friend', description: 'Index fingers hooked (linked)', wristAngle: 0, thumbSplay: 10, thumbBend: 50, index: [50, 65, 45], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  BABY: { label: 'Baby', description: 'Arms cradle rocking', wristAngle: -20, thumbSplay: 20, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },

  // ─── Greetings ─────────────────────────────────────────────────────────────
  GOODBYE: { label: 'Goodbye ðŸ‘‹', description: 'Open hand waves side to side', wristAngle: 5, thumbSplay: 30, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  BYE: { label: 'Bye ðŸ‘‹', description: 'Open hand waves side to side', wristAngle: 5, thumbSplay: 30, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  MORNING: { label: 'Good Morning', description: 'Arm rises like the sun', wristAngle: -20, thumbSplay: 20, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  NIGHT: { label: 'Good Night', description: 'Bent hand arcs over arm', wristAngle: 30, thumbSplay: 20, thumbBend: 20, index: [30, 20, 10], middle: [30, 20, 10], ring: [30, 20, 10], pinky: [30, 20, 10] },

  // ─── Questions ─────────────────────────────────────────────────────────────
  WHAT: { label: 'What?', description: 'Flat hands, palms up, shrug', wristAngle: -35, thumbSplay: 20, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  WHERE: { label: 'Where?', description: 'Index finger shakes side to side', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  WHO: { label: 'Who?', description: 'L-shape circles at mouth', wristAngle: 5, thumbSplay: 55, thumbBend: 0, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  HOW: { label: 'How?', description: 'Knuckles touch, open outward', wristAngle: -10, thumbSplay: 15, thumbBend: 20, index: [60, 55, 40], middle: [60, 55, 40], ring: [60, 55, 40], pinky: [60, 55, 40] },
  WHICH: { label: 'Which?', description: 'A-hands alternate up and down', wristAngle: 0, thumbSplay: 10, thumbBend: 20, index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55] },

  // ─── Common Words ─────────────────────────────────────────────────────────
  NAME: { label: 'Name', description: 'U-hand taps on other U-hand', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60] },
  HOME: { label: 'Home', description: 'O-hand taps cheek', wristAngle: 5, thumbSplay: 20, thumbBend: 50, index: [55, 50, 35], middle: [55, 50, 35], ring: [55, 50, 35], pinky: [55, 50, 35] },
  SCHOOL: { label: 'School', description: 'Flat hands clap twice', wristAngle: -15, thumbSplay: 18, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  TIME: { label: 'Time â°', description: 'Index taps wrist', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  DAY: { label: 'Day', description: 'Index points up, arm circles', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  NOW: { label: 'Now', description: 'Bent hands drop simultaneously', wristAngle: -40, thumbSplay: 20, thumbBend: 15, index: [30, 25, 15], middle: [30, 25, 15], ring: [30, 25, 15], pinky: [30, 25, 15] },
  LATER: { label: 'Later', description: 'L-hand tilts forward', wristAngle: 20, thumbSplay: 55, thumbBend: 0, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },

  // ─── Colors ─────────────────────────────────────────────────────────────
  RED: { label: 'Red ðŸ”´', description: 'Index strokes lips downward', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  BLUE: { label: 'Blue ðŸ”µ', description: 'B-hand twists at wrist', wristAngle: 5, thumbSplay: 5, thumbBend: 80, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  GREEN: { label: 'Green ðŸŸ¢', description: 'G-hand twists at wrist', wristAngle: 80, thumbSplay: 35, thumbBend: 0, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  YELLOW: { label: 'Yellow ðŸŸ¡', description: 'Y-hand shakes', wristAngle: 5, thumbSplay: 45, thumbBend: 0, index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [0, 0, 0] },
  WHITE: { label: 'White â¬œ', description: 'Bent-5 pulls from chest', wristAngle: -10, thumbSplay: 30, thumbBend: 10, index: [30, 20, 10], middle: [30, 20, 10], ring: [30, 20, 10], pinky: [30, 20, 10] },
  BLACK: { label: 'Black â¬›', description: 'Index swipes across forehead', wristAngle: 0, thumbSplay: 10, thumbBend: 55, index: [0, 0, 0], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  ORANGE: { label: 'Orange ðŸŸ ', description: 'C-hand squeezes (like orange)', wristAngle: 5, thumbSplay: 30, thumbBend: 30, index: [45, 30, 20], middle: [45, 30, 20], ring: [45, 30, 20], pinky: [45, 30, 20] },
  PURPLE: { label: 'Purple ðŸŸ£', description: 'P-hand shakes', wristAngle: -30, thumbSplay: 30, thumbBend: 10, index: [30, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60] },
  PINK: { label: 'Pink ðŸ©·', description: 'P-hand brushes lips', wristAngle: -25, thumbSplay: 25, thumbBend: 10, index: [30, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60] },

  // ─── Medical / Safety ─────────────────────────────────────────────────────
  DOCTOR: { label: 'Doctor', description: 'D-hand taps wrist pulse', wristAngle: 0, thumbSplay: 20, thumbBend: 40, index: [0, 0, 0], middle: [80, 70, 50], ring: [80, 70, 50], pinky: [80, 70, 50] },
  HOSPITAL: { label: 'Hospital', description: 'H drawn on upper arm', wristAngle: 80, thumbSplay: 15, thumbBend: 60, index: [0, 0, 0], middle: [0, 0, 0], ring: [90, 80, 60], pinky: [90, 80, 60] },
  MEDICINE: { label: 'Medicine', description: 'Middle finger stirs palm', wristAngle: -5, thumbSplay: 20, thumbBend: 20, index: [70, 60, 45], middle: [0, 0, 0], ring: [70, 60, 45], pinky: [70, 60, 45] },
  EMERGENCY: { label: 'Emergency ðŸš¨', description: 'E-hand shakes urgently', wristAngle: 0, thumbSplay: 5, thumbBend: 65, index: [70, 55, 45], middle: [70, 55, 45], ring: [70, 55, 45], pinky: [70, 55, 45] },
  CALL: { label: 'Call ðŸ“ž', description: 'Y-hand at ear', wristAngle: 5, thumbSplay: 45, thumbBend: 0, index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [0, 0, 0] },
  POLICE: { label: 'Police', description: 'C-hand on shoulder/badge', wristAngle: 5, thumbSplay: 30, thumbBend: 30, index: [45, 30, 20], middle: [45, 30, 20], ring: [45, 30, 20], pinky: [45, 30, 20] },

  // ─── Weather ─────────────────────────────────────────────────────────────
  RAIN: { label: 'Rain ðŸŒ§ï¸', description: 'Curved fingers wiggle downward', wristAngle: -30, thumbSplay: 20, thumbBend: 20, index: [40, 35, 25], middle: [40, 35, 25], ring: [40, 35, 25], pinky: [40, 35, 25] },
  SUN: { label: 'Sun â˜€ï¸', description: 'C-hand twists outward from face', wristAngle: 5, thumbSplay: 30, thumbBend: 30, index: [45, 30, 20], middle: [45, 30, 20], ring: [45, 30, 20], pinky: [45, 30, 20] },
  COLD: { label: 'Cold ðŸ¥¶', description: 'A-hands shake', wristAngle: 0, thumbSplay: 10, thumbBend: 20, index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55] },
  HOT: { label: 'Hot ðŸ”¥', description: 'Bent hand twists outward', wristAngle: -10, thumbSplay: 20, thumbBend: 20, index: [40, 35, 25], middle: [40, 35, 25], ring: [40, 35, 25], pinky: [40, 35, 25] },
  WIND: { label: 'Wind ðŸŒ¬ï¸', description: 'Both hands wave side to side', wristAngle: 5, thumbSplay: 25, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },

  // ─── Miscellaneous ─────────────────────────────────────────────────────────
  BATHROOM: { label: 'Bathroom', description: 'T-hand shakes', wristAngle: 0, thumbSplay: 10, thumbBend: 20, index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55] },
  TOILET: { label: 'Toilet', description: 'T-hand shakes', wristAngle: 0, thumbSplay: 10, thumbBend: 20, index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55] },
  BOOK: { label: 'Book ðŸ“š', description: 'Flat palms open like a book', wristAngle: -25, thumbSplay: 20, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  CAR: { label: 'Car ðŸš—', description: 'A-hands drive a steering wheel', wristAngle: 0, thumbSplay: 15, thumbBend: 20, index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55] },
  HOUSE: { label: 'House', description: 'Fingertips touch for roof, then sides for walls', wristAngle: 0, thumbSplay: 20, thumbBend: 45, index: [55, 50, 35], middle: [55, 50, 35], ring: [55, 50, 35], pinky: [55, 50, 35] },
  MONEY: { label: 'Money ðŸ’°', description: 'Flat-O hand taps palm', wristAngle: 5, thumbSplay: 20, thumbBend: 45, index: [55, 50, 35], middle: [55, 50, 35], ring: [55, 50, 35], pinky: [55, 50, 35] },
  MUSIC: { label: 'Music ðŸŽµ', description: 'Flat hand waves over arm in rhythm', wristAngle: -10, thumbSplay: 20, thumbBend: 5, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  // ─── Two-Hand Signs ──────────────────────────────────────────────────────
  FRIEND_2H: {
    label: 'Friend 🤝', description: 'Both index fingers hook together and flip',
    twoHands: true,
    wristAngle: 0, thumbSplay: 10, thumbBend: 50,
    index: [50, 65, 45], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60],
    rightHand: { wristAngle: 0, thumbSplay: 10, thumbBend: 50, index: [50, 65, 45], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
    leftHand:  { wristAngle: 0, thumbSplay: 10, thumbBend: 50, index: [50, 65, 45], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
  },
  HELP_2H: {
    label: 'Help 🆘', description: 'Fist with thumb up rests on open palm',
    twoHands: true,
    wristAngle: 0, thumbSplay: 5, thumbBend: 0,
    index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60],
    rightHand: { wristAngle: 0, thumbSplay: 5, thumbBend: 0, index: [90, 80, 60], middle: [90, 80, 60], ring: [90, 80, 60], pinky: [90, 80, 60] },
    leftHand:  { wristAngle: -15, thumbSplay: 18, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  },
  BOOK_2H: {
    label: 'Book 📖', description: 'Flat palms open like pages of a book',
    twoHands: true,
    wristAngle: -25, thumbSplay: 20, thumbBend: 0,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
    rightHand: { wristAngle: -25, thumbSplay: 20, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
    leftHand:  { wristAngle: 25, thumbSplay: 20, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  },
  FAMILY_2H: {
    label: 'Family 👨‍👩‍👧', description: 'F-hands circle from thumbs to pinkies',
    twoHands: true,
    wristAngle: 5, thumbSplay: 10, thumbBend: 50,
    index: [60, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
    rightHand: { wristAngle: 5, thumbSplay: 10, thumbBend: 50, index: [60, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
    leftHand:  { wristAngle: -5, thumbSplay: 10, thumbBend: 50, index: [60, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  },
  SCHOOL_2H: {
    label: 'School 🏫', description: 'Both flat palms clap together twice',
    twoHands: true,
    wristAngle: -15, thumbSplay: 18, thumbBend: 0,
    index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0],
    rightHand: { wristAngle: -15, thumbSplay: 18, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
    leftHand:  { wristAngle: 15, thumbSplay: 18, thumbBend: 0, index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] },
  },
  MORE_2H: {
    label: 'More ➕', description: 'Both flat-O hands tap fingertips together',
    twoHands: true,
    wristAngle: 10, thumbSplay: 20, thumbBend: 50,
    index: [60, 55, 40], middle: [60, 55, 40], ring: [60, 55, 40], pinky: [60, 55, 40],
    rightHand: { wristAngle: 10, thumbSplay: 20, thumbBend: 50, index: [60, 55, 40], middle: [60, 55, 40], ring: [60, 55, 40], pinky: [60, 55, 40] },
    leftHand:  { wristAngle: -10, thumbSplay: 20, thumbBend: 50, index: [60, 55, 40], middle: [60, 55, 40], ring: [60, 55, 40], pinky: [60, 55, 40] },
  },
  TOGETHER_2H: {
    label: 'Together 🤲', description: 'Both fists come together side by side',
    twoHands: true,
    wristAngle: 0, thumbSplay: 5, thumbBend: 30,
    index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55],
    rightHand: { wristAngle: 0, thumbSplay: 5, thumbBend: 30, index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55] },
    leftHand:  { wristAngle: 0, thumbSplay: 5, thumbBend: 30, index: [85, 75, 55], middle: [85, 75, 55], ring: [85, 75, 55], pinky: [85, 75, 55] },
  },

  DEFAULT: {
    label: 'Ready', description: 'Natural relaxed hand position',
    wristAngle: -5, thumbSplay: 15, thumbBend: 15,
    index: [10, 5, 5], middle: [12, 6, 5], ring: [14, 7, 5], pinky: [16, 8, 5],
  },
};

const TWO_HAND_ALIASES: Record<string, string> = {
  FRIEND: 'FRIEND_2H', FRIENDS: 'FRIEND_2H',
  BOOK: 'BOOK_2H', BOOKS: 'BOOK_2H',
  FAMILY: 'FAMILY_2H',
  SCHOOL: 'SCHOOL_2H',
  MORE: 'MORE_2H',
  TOGETHER: 'TOGETHER_2H',
  HELP: 'HELP_2H',
};

function lookupSignConfig(word: string): SignConfig {
  const key = word.toUpperCase().trim();
  if (TWO_HAND_ALIASES[key] && ASL_SIGNS[TWO_HAND_ALIASES[key]]) {
    return ASL_SIGNS[TWO_HAND_ALIASES[key]];
  }
  if (ASL_SIGNS[key]) return ASL_SIGNS[key];
  if (key.length === 1 && ASL_SIGNS[key]) return ASL_SIGNS[key];
  for (const k of Object.keys(ASL_SIGNS)) {
    if (key.startsWith(k) || k.startsWith(key)) return ASL_SIGNS[k];
  }
  for (const k of Object.keys(ASL_SIGNS)) {
    if (key.includes(k) || k.includes(key)) return ASL_SIGNS[k];
  }
  if (key.length > 0 && ASL_SIGNS[key[0]]) return ASL_SIGNS[key[0]];
  return ASL_SIGNS.DEFAULT;
}

function drawHand(ctx: CanvasRenderingContext2D, w: number, h: number, config: SignConfig, t: number, mirror: boolean = false) {
  ctx.clearRect(0, 0, w, h);
  const bgGrad = ctx.createRadialGradient(w * 0.38, h * 0.32, 8, w * 0.5, h * 0.5, w * 0.75);
  bgGrad.addColorStop(0,   '#1a1f2e');
  bgGrad.addColorStop(0.55,'#111522');
  bgGrad.addColorStop(1,   '#080b14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.22, w / 2, h / 2, h * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.50)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  const cx    = w * 0.50;
  const cy    = h * 0.875;
  const scale = Math.min(w, h) * 0.00500;
  ctx.save();
  ctx.translate(cx, cy);
  if (mirror) {
    ctx.scale(-1, 1);
  }
  ctx.rotate(toRad(config.wristAngle));
  // ── DROP SHADOW ────────────────────────────────────────────────────────────
  drawHandShadow(ctx, palmW, palmH);

  // ── 1. WRIST / FOREARM BASE ───────────────────────────────────────────────
  const wristW = palmW * 0.86;
  const wristH = 28 * scale;
  ctx.save();
  const wg = ctx.createLinearGradient(-wristW / 2, 0, wristW / 2, 0);
  wg.addColorStop(0,    SK.skinEdge);
  wg.addColorStop(0.12, SK.skinShadow);
  wg.addColorStop(0.38, SK.skinDark);
  wg.addColorStop(0.52, SK.skinMid);
  wg.addColorStop(0.65, SK.skinLight);
  wg.addColorStop(0.82, SK.skinBase);
  wg.addColorStop(1,    SK.skinEdge);
  ctx.fillStyle = wg;
  ctx.beginPath();
  ctx.moveTo(-wristW / 2, -2 * scale);
  ctx.bezierCurveTo(-wristW / 2 - 2.5 * scale, wristH * 0.4, -wristW / 2 + 2.5 * scale, wristH, 0, wristH);
  ctx.bezierCurveTo(wristW / 2 - 2.5 * scale, wristH, wristW / 2 + 2.5 * scale, wristH * 0.4, wristW / 2, -2 * scale);
  ctx.closePath();
  ctx.fill();

  // Wrist tendon lines
  ctx.strokeStyle = SK.crease;
  ctx.lineWidth   = 0.7;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * wristW * 0.20, 0);
    ctx.bezierCurveTo(i * wristW * 0.17, wristH * 0.5, i * wristW * 0.14, wristH * 0.8, i * wristW * 0.12, wristH);
    ctx.stroke();
  }
  ctx.restore();

  // ── 2. FINGERS (drawn first, so palm naturally overlaps their bases) ───────
  const fs  = 14.8 * scale;
  const fby = -palmH + 3 * scale;

  // Index finger
  drawRealisticFinger(ctx,
    -fs * 1.48, fby,
    toRad(-4),
    { mcp: config.index[0], pip: config.index[1], dip: config.index[2] },
    [35 * scale, 26 * scale, 20 * scale],
    [7.2 * scale, 6.2 * scale, 5.2 * scale],
    scale
  );

  // Middle finger (tallest)
  drawRealisticFinger(ctx,
    -fs * 0.30, fby - 3 * scale,
    toRad(0),
    { mcp: config.middle[0], pip: config.middle[1], dip: config.middle[2] },
    [39 * scale, 29 * scale, 23 * scale],
    [7.6 * scale, 6.6 * scale, 5.6 * scale],
    scale
  );

  // Ring finger
  drawRealisticFinger(ctx,
    fs * 0.90, fby,
    toRad(2.5),
    { mcp: config.ring[0], pip: config.ring[1], dip: config.ring[2] },
    [36 * scale, 27 * scale, 21 * scale],
    [7.2 * scale, 6.2 * scale, 5.2 * scale],
    scale
  );

  // Pinky
  drawRealisticFinger(ctx,
    fs * 2.08, fby + 7 * scale,
    toRad(6),
    { mcp: config.pinky[0], pip: config.pinky[1], dip: config.pinky[2] },
    [29 * scale, 21 * scale, 16 * scale],
    [6.0 * scale, 5.0 * scale, 4.2 * scale],
    scale
  );

  // ── 3. PALM ──────────────────────────────────────────────────────────────
  ctx.save();
  const palmGrad = ctx.createRadialGradient(
    -palmW * 0.18, -palmH * 0.45, palmH * 0.05,
     palmW * 0.12, -palmH * 0.20, palmH * 1.10
  );
  palmGrad.addColorStop(0,    SK.skinLight);
  palmGrad.addColorStop(0.20, SK.skinMid);
  palmGrad.addColorStop(0.50, SK.skinBase);
  palmGrad.addColorStop(0.78, SK.skinDark);
  palmGrad.addColorStop(1,    SK.skinShadow);
  ctx.fillStyle = palmGrad;

  ctx.beginPath();
  ctx.moveTo(-palmW / 2, 0);
  ctx.bezierCurveTo(
    -palmW / 2 - 6 * scale, -palmH * 0.35,
    -palmW / 2 - 3 * scale, -palmH * 0.88,
    -palmW * 0.09, -palmH
  );
  ctx.bezierCurveTo(
     palmW * 0.08, -palmH - 2 * scale,
     palmW * 0.24, -palmH - 2 * scale,
     palmW * 0.40, -palmH
  );
  ctx.bezierCurveTo(
     palmW / 2 + 5 * scale, -palmH * 0.84,
     palmW / 2 + 7 * scale, -palmH * 0.35,
     palmW / 2, 0
  );
  ctx.bezierCurveTo(palmW * 0.40, 8 * scale, -palmW * 0.40, 8 * scale, -palmW / 2, 0);
  ctx.fill();

  // Palm outline
  ctx.strokeStyle = SK.skinEdge;
  ctx.lineWidth   = 0.8;
  ctx.globalAlpha = 0.50;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Palm specular highlight (upper-left zone)
  const pHL = ctx.createRadialGradient(-palmW * 0.20, -palmH * 0.65, 0, -palmW * 0.08, -palmH * 0.48, palmW * 0.62);
  pHL.addColorStop(0,   'rgba(255,248,235,0.40)');
  pHL.addColorStop(0.4, 'rgba(255,248,235,0.10)');
  pHL.addColorStop(1,   'rgba(255,248,235,0)');
  ctx.fillStyle = pHL;
  ctx.fill();
  ctx.restore();

  // ── 4. THUMB ─────────────────────────────────────────────────────────────
  drawRealisticFinger(ctx,
    -palmW * 0.35, -palmH * 0.35,
    toRad(config.thumbSplay - 30),
    { mcp: config.thumbBend, pip: config.thumbBend * 0.6, dip: 0 },
    [28 * scale, 22 * scale, 18 * scale],
    [8.5 * scale, 7.5 * scale, 6.5 * scale],
    scale
  );

  ctx.restore(); // undo wrist rotation

  // ── 5. LABEL ─────────────────────────────────────────────────────────────
  const labelText = config.label;
  if (labelText) {
    const fs2 = Math.max(11, Math.round(13 * scale));
    ctx.font = `600 ${fs2}px "Inter", "Segoe UI", system-ui, sans-serif`;
    const tm  = ctx.measureText(labelText);
    const lw  = tm.width + 24;
    const lh  = 24;
    const lx  = w / 2 - lw / 2;
    const ly  = h - lh - 10;

    const pillG = ctx.createLinearGradient(lx, ly, lx + lw, ly + lh);
    pillG.addColorStop(0, 'rgba(99,102,241,0.90)');
    pillG.addColorStop(1, 'rgba(139,92,246,0.90)');
    ctx.fillStyle = pillG;
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(lx, ly, lw, lh, lh / 2); } else { ctx.rect(lx, ly, lw, lh); }
    ctx.fill();

    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, w / 2, ly + lh / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign    = 'left';
  }
}

// ─── Helper constants & functions ─────────────────────────────────────────────
const toRad = (deg: number) => (deg * Math.PI) / 180;
const palmW = 60;
const palmH = 80;

const SK = {
  skinEdge:   '#a97d64',
  skinShadow: '#bc8a6f',
  skinDark:   '#d29d7d',
  skinMid:    '#e4b395',
  skinLight:  '#f3c7ae',
  skinBase:   '#e8bc9e',
  crease:     '#b38266',
};

function drawHandShadow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(4, 6, w * 0.55, h * 0.9, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawRealisticFinger(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  baseAngle: number,
  bends: { mcp: number; pip: number; dip: number },
  lengths: [number, number, number],
  widths: [number, number, number],
  scale: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(baseAngle);

  const segments = [
    { bend: bends.mcp, len: lengths[0], w: widths[0] },
    { bend: bends.pip, len: lengths[1], w: widths[1] },
    { bend: bends.dip, len: lengths[2], w: widths[2] },
  ];

  for (const seg of segments) {
    ctx.rotate(toRad(-seg.bend));

    // Segment body
    const grad = ctx.createLinearGradient(-seg.w, 0, seg.w, 0);
    grad.addColorStop(0,    SK.skinEdge);
    grad.addColorStop(0.2,  SK.skinDark);
    grad.addColorStop(0.5,  SK.skinLight);
    grad.addColorStop(0.8,  SK.skinBase);
    grad.addColorStop(1,    SK.skinEdge);
    ctx.fillStyle = grad;

    ctx.beginPath();
    const hw = seg.w / 2;
    ctx.moveTo(-hw, 0);
    ctx.bezierCurveTo(-hw - 0.5 * scale, -seg.len * 0.3, -hw + 0.5 * scale, -seg.len * 0.9, -hw * 0.85, -seg.len);
    ctx.lineTo(hw * 0.85, -seg.len);
    ctx.bezierCurveTo(hw - 0.5 * scale, -seg.len * 0.9, hw + 0.5 * scale, -seg.len * 0.3, hw, 0);
    ctx.closePath();
    ctx.fill();

    // Joint crease
    ctx.strokeStyle = SK.crease;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth   = 0.6;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.7, -1);
    ctx.lineTo(hw * 0.7, -1);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.translate(0, -seg.len);
  }

  // Fingertip rounded cap
  const tipW = widths[2] / 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, tipW * 0.85, tipW * 0.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = SK.skinMid;
  ctx.fill();

  // Nail
  ctx.beginPath();
  ctx.ellipse(0, -tipW * 0.15, tipW * 0.55, tipW * 0.45, 0, Math.PI, Math.PI * 2);
  ctx.fillStyle = '#f5e1d0';
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,140,120,0.4)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function lerpPose(cur: HandPose, tgt: HandPose, speed: number): void {
  cur.wristAngle = lerp(cur.wristAngle, tgt.wristAngle, speed);
  cur.thumbSplay = lerp(cur.thumbSplay, tgt.thumbSplay, speed);
  cur.thumbBend  = lerp(cur.thumbBend,  tgt.thumbBend,  speed);
  cur.index  = [lerp(cur.index[0],  tgt.index[0],  speed), lerp(cur.index[1],  tgt.index[1],  speed), lerp(cur.index[2],  tgt.index[2],  speed)];
  cur.middle = [lerp(cur.middle[0], tgt.middle[0], speed), lerp(cur.middle[1], tgt.middle[1], speed), lerp(cur.middle[2], tgt.middle[2], speed)];
  cur.ring   = [lerp(cur.ring[0],   tgt.ring[0],   speed), lerp(cur.ring[1],   tgt.ring[1],   speed), lerp(cur.ring[2],   tgt.ring[2],   speed)];
  cur.pinky  = [lerp(cur.pinky[0],  tgt.pinky[0],  speed), lerp(cur.pinky[1],  tgt.pinky[1],  speed), lerp(cur.pinky[2],  tgt.pinky[2],  speed)];
}

const DEFAULT_POSE: HandPose = {
  wristAngle: -5, thumbSplay: 15, thumbBend: 15,
  index: [10, 5, 5], middle: [12, 6, 5], ring: [14, 7, 5], pinky: [16, 8, 5],
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const HandSignRenderer: React.FC<HandSignRendererProps> = ({
  sign,
  isAnimating,
  width = 380,
  height = 420,
}) => {
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const currentConfigRef = useRef<SignConfig>({ ...ASL_SIGNS.DEFAULT });
  const targetConfigRef  = useRef<SignConfig>({ ...ASL_SIGNS.DEFAULT });
  const curLeftRef       = useRef<HandPose>({ ...DEFAULT_POSE });
  const curRightRef      = useRef<HandPose>({ ...DEFAULT_POSE });
  const animRef          = useRef<number>(0);

  useEffect(() => {
    targetConfigRef.current = lookupSignConfig(sign || 'DEFAULT');
  }, [sign]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const cur   = currentConfigRef.current;
      const tgt   = targetConfigRef.current;
      const speed = 0.08;

      lerpPose(cur, tgt, speed);
      cur.twoHands   = tgt.twoHands;
      cur.label       = tgt.label;
      cur.description = tgt.description;

      if (tgt.twoHands) {
        const rightPose = tgt.rightHand || tgt;
        const leftPose  = tgt.leftHand  || tgt;
        lerpPose(curRightRef.current, rightPose, speed);
        lerpPose(curLeftRef.current, leftPose, speed);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        const bgGrad = ctx.createRadialGradient(canvas.width * 0.38, canvas.height * 0.32, 8, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.75);
        bgGrad.addColorStop(0,    '#1a1f2e');
        bgGrad.addColorStop(0.55, '#111522');
        bgGrad.addColorStop(1,    '#080b14');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const halfW = canvas.width / 2;

        // Right hand
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, halfW, canvas.height);
        ctx.clip();
        const rc: SignConfig = { ...cur, ...curRightRef.current, label: '', description: '', twoHands: false };
        drawHand(ctx, halfW, canvas.height, rc, Date.now() / 1000, false);
        ctx.restore();

        // Left hand mirrored
        ctx.save();
        ctx.beginPath();
        ctx.rect(halfW, 0, halfW, canvas.height);
        ctx.clip();
        ctx.translate(halfW, 0);
        const lc: SignConfig = { ...cur, ...curLeftRef.current, label: '', description: '', twoHands: false };
        drawHand(ctx, halfW, canvas.height, lc, Date.now() / 1000, true);
        ctx.restore();

        // Two-hand label
        const labelText = tgt.label || '';
        if (labelText) {
          const fs2 = Math.max(11, Math.round(13 * Math.min(canvas.width, canvas.height) * 0.005));
          ctx.font = `600 ${fs2}px "Inter", "Segoe UI", system-ui, sans-serif`;
          const tm = ctx.measureText(labelText);
          const lw = tm.width + 24;
          const lh = 24;
          const lx = canvas.width / 2 - lw / 2;
          const ly = canvas.height - lh - 10;
          const pillG = ctx.createLinearGradient(lx, ly, lx + lw, ly + lh);
          pillG.addColorStop(0, 'rgba(99,102,241,0.90)');
          pillG.addColorStop(1, 'rgba(139,92,246,0.90)');
          ctx.fillStyle = pillG;
          ctx.beginPath();
          if (ctx.roundRect) { ctx.roundRect(lx, ly, lw, lh, lh / 2); } else { ctx.rect(lx, ly, lw, lh); }
          ctx.fill();
          ctx.fillStyle    = '#ffffff';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, canvas.width / 2, ly + lh / 2 + 1);
          ctx.textBaseline = 'alphabetic';
          ctx.textAlign    = 'left';
        }
      } else {
        drawHand(ctx, canvas.width, canvas.height, cur, Date.now() / 1000);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  );
};
