import React from 'react';

export const EMOJI_MAP: Record<string, string> = {
  HELLO: '👋',
  THANK: '🙏',
  THANKS: '🙏',
  LOVE: '🤟',
  YES: '👍',
  NO: '👎',
  HELP: '🤝',
  WATER: '💧',
  PEACE: '✌️',
  PLEASE: '🙏',
  SORRY: '😔',
  GOOD: '👍',
  STOP: '✋',
  WANT: '🤲',
  COME: '🫴',
  FOOD: '🍽️',
  EAT: '🍽️',
  BAD: '👎',
  OK: '👌',
  CALL: '🤙',
  PERFECT: '👌',
  UP: '👆',
  DOWN: '👇',
  LEFT: '👈',
  RIGHT: '👉',
  CLAP: '👏',
  FIST: '✊',
  RAISE: '✋',
  DEFAULT: '👋',
  // Pronouns
  YOU: '🫵',
  I: '🙋',
  ME: '🙋',
  WE: '🤝',
  THEY: '👉',
  HE: '👉',
  SHE: '👉',
  // Numbers
  '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣', '5': '5️⃣', 
  '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣', '10': '🔟',
  ONE: '1️⃣', TWO: '2️⃣', THREE: '3️⃣', FOUR: '4️⃣', FIVE: '5️⃣',
  SIX: '6️⃣', SEVEN: '7️⃣', EIGHT: '8️⃣', NINE: '9️⃣', TEN: '🔟',
  // Family
  MOM: '👩', MOTHER: '👩', DAD: '👨', FATHER: '👨',
  SISTER: '👧', BROTHER: '👦', BABY: '👶', FAMILY: '👨‍👩‍👧',
  FRIEND: '🤝', FRIENDS: '🤝',
  // Emotions
  HAPPY: '😊', SAD: '😢', ANGRY: '😠', SCARED: '😨',
  SURPRISE: '😲', TIRED: '🥱', SICK: '🤢', PAIN: '😣',
  EXCITED: '🤩', BORED: '😒', FINE: '👌',
  // Greetings / Time
  GOODBYE: '👋', BYE: '👋', MORNING: '🌅', NIGHT: '🌃',
  DAY: '☀️', NOW: '👇', LATER: '🕒', TIME: '⌚',
  // Questions
  WHAT: '🤷', WHERE: '🗺️', WHO: '👤', HOW: '❓', WHICH: '❓',
  // Places & Things
  HOME: '🏠', SCHOOL: '🏫', BOOK: '📖', CAR: '🚗', HOUSE: '🏠',
  MONEY: '💵', MUSIC: '🎵', FOOD: '🍽️', WATER: '💧',
  // Colors
  RED: '🔴', BLUE: '🔵', GREEN: '🟢', YELLOW: '🟡',
  WHITE: '⚪', BLACK: '⚫', ORANGE: '🟠', PURPLE: '🟣', PINK: '🩷',
  // Medical / Emergency
  DOCTOR: '🩺', HOSPITAL: '🏥', MEDICINE: '💊', EMERGENCY: '🚨',
  POLICE: '👮', CALL: '📱',
  // Weather
  RAIN: '🌧️', SUN: '☀️', COLD: '🥶', HOT: '🥵', WIND: '🌬️',
  // Misc
  BATHROOM: '🚽', TOILET: '🚽', TOGETHER: '🤲', MORE: '➕',
  NAME: '📛'
};

interface EmojiSignRendererProps {
  sign: string;
  isAnimating?: boolean;
}

export const EmojiSignRenderer: React.FC<EmojiSignRendererProps> = ({ sign, isAnimating }) => {
  const key = sign.toUpperCase().trim();
  let emoji = EMOJI_MAP[key];
  
  if (!emoji) {
    if (key.length === 1) {
      emoji = key; // Just show the letter
    } else {
      // Fallback: try to find a partial match
      const match = Object.keys(EMOJI_MAP).find(k => key.includes(k));
      emoji = match ? EMOJI_MAP[match] : key;
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center transition-all duration-300 w-full h-full`}>
       <img 
          src={`/dataset-images/${sign.toLowerCase().trim()}.jpg`}
          alt={sign}
          className={`max-h-full max-w-full object-contain filter invert brightness-125 contrast-125 mix-blend-screen transition-transform duration-300 ${isAnimating ? 'scale-110 -translate-y-4' : 'scale-100 translate-y-0'}`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'inline';
            }
          }}
       />
       <span className={`text-[12rem] font-black drop-shadow-2xl transition-transform duration-300 ${isAnimating ? 'scale-110 -translate-y-4 text-indigo-400' : 'scale-100 translate-y-0 text-slate-100'}`} style={{ display: 'none' }}>
         {emoji}
       </span>
    </div>
  );
};
