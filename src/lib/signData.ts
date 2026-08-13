import { DATASET_DICTIONARY } from './datasetDictionary';

export interface SignDictionaryItem {
  id: string;
  word: string;
  category: 'alphabet' | 'numbers' | 'common' | 'emergency';
  description: string;
  handsDescription: string;
  emoji: string;
  fingerSpelling: string[];
}

export const SIGN_DICTIONARY: SignDictionaryItem[] = [
  // ─── GREETINGS & BASICS ──────────────────────────────────────────────────
  {
    id: 'hello',
    word: 'Hello / Hi',
    category: 'common',
    description: 'A friendly greeting wave or palm extension',
    handsDescription: 'Open hand with palm facing forward, fingers extended upwards',
    emoji: '🖐️',
    fingerSpelling: ['H', 'E', 'L', 'L', 'O']
  },
  {
    id: 'thank-you',
    word: 'Thank You',
    category: 'common',
    description: 'Expressing gratitude',
    handsDescription: 'Flat hand touches chin/lips then moves outwards towards recipient',
    emoji: '🙏',
    fingerSpelling: ['T', 'H', 'A', 'N', 'K', 'S']
  },
  {
    id: 'please',
    word: 'Please',
    category: 'common',
    description: 'Polite request',
    handsDescription: 'Flat open hand rubs in circular motion on center of chest',
    emoji: '🤲',
    fingerSpelling: ['P', 'L', 'E', 'A', 'S', 'E']
  },
  {
    id: 'sorry',
    word: 'Sorry / Apology',
    category: 'common',
    description: 'Apologizing or expressing regret',
    handsDescription: 'S-hand (fist with thumb over fingers) rubs circular on chest',
    emoji: '😔',
    fingerSpelling: ['S', 'O', 'R', 'R', 'Y']
  },
  {
    id: 'yes',
    word: 'Yes',
    category: 'common',
    description: 'Affirmation or agreement',
    handsDescription: 'Closed fist (Letter S shape) nodding up and down like a head',
    emoji: '👍',
    fingerSpelling: ['Y', 'E', 'S']
  },
  {
    id: 'no',
    word: 'No',
    category: 'common',
    description: 'Negation or refusal',
    handsDescription: 'Index and middle finger snap down to meet the extended thumb',
    emoji: '👎',
    fingerSpelling: ['N', 'O']
  },
  {
    id: 'i-love-you',
    word: 'I Love You',
    category: 'common',
    description: 'Universal ASL sign of affection',
    handsDescription: 'Thumb, Index, and Pinky fingers extended; Middle and Ring folded',
    emoji: '🤟',
    fingerSpelling: ['L', 'O', 'V', 'E']
  },
  {
    id: 'more',
    word: 'More',
    category: 'common',
    description: 'Asking for additional items or continuation',
    handsDescription: 'Both flat-O hands tap fingertips together in front',
    emoji: '➕',
    fingerSpelling: ['M', 'O', 'R', 'E']
  },
  {
    id: 'good',
    word: 'Good',
    category: 'common',
    description: 'Positive quality or approval',
    handsDescription: 'Flat palm touches chin then drops onto opposite palm facing up',
    emoji: '✨',
    fingerSpelling: ['G', 'O', 'O', 'D']
  },
  {
    id: 'bad',
    word: 'Bad',
    category: 'common',
    description: 'Disapproval or negative condition',
    handsDescription: 'Flat palm touches chin then turns palm downward quickly',
    emoji: '👎',
    fingerSpelling: ['B', 'A', 'D']
  },

  // ─── NUMBERS 1–10 ────────────────────────────────────────────────────────
  {
    id: 'one',
    word: '1 / One',
    category: 'numbers',
    description: 'Counting number one',
    handsDescription: 'Index finger extended straight up, back of hand facing out',
    emoji: '1️⃣',
    fingerSpelling: ['O', 'N', 'E']
  },
  {
    id: 'two',
    word: '2 / Two',
    category: 'numbers',
    description: 'Counting number two',
    handsDescription: 'Index and middle finger extended up (V-shape)',
    emoji: '2️⃣',
    fingerSpelling: ['T', 'W', 'O']
  },
  {
    id: 'three',
    word: '3 / Three',
    category: 'numbers',
    description: 'Counting number three (ASL 3)',
    handsDescription: 'Thumb, index, and middle finger extended up',
    emoji: '3️⃣',
    fingerSpelling: ['T', 'H', 'R', 'E', 'E']
  },
  {
    id: 'four',
    word: '4 / Four',
    category: 'numbers',
    description: 'Counting number four',
    handsDescription: 'Four fingers up spread apart, thumb tucked inside palm',
    emoji: '4️⃣',
    fingerSpelling: ['F', 'O', 'U', 'R']
  },
  {
    id: 'five',
    word: '5 / Five',
    category: 'numbers',
    description: 'Counting number five',
    handsDescription: 'All five fingers extended and spread wide',
    emoji: '5️⃣',
    fingerSpelling: ['F', 'I', 'V', 'E']
  },
  {
    id: 'six',
    word: '6 / Six',
    category: 'numbers',
    description: 'Counting number six (ASL 6)',
    handsDescription: 'Thumb tip touches pinky tip, other 3 fingers straight up',
    emoji: '6️⃣',
    fingerSpelling: ['S', 'I', 'X']
  },
  {
    id: 'seven',
    word: '7 / Seven',
    category: 'numbers',
    description: 'Counting number seven (ASL 7)',
    handsDescription: 'Thumb tip touches ring finger tip, other 3 fingers straight up',
    emoji: '7️⃣',
    fingerSpelling: ['S', 'E', 'V', 'E', 'N']
  },
  {
    id: 'eight',
    word: '8 / Eight',
    category: 'numbers',
    description: 'Counting number eight (ASL 8)',
    handsDescription: 'Thumb tip touches middle finger tip, others up',
    emoji: '8️⃣',
    fingerSpelling: ['E', 'I', 'G', 'H', 'T']
  },
  {
    id: 'nine',
    word: '9 / Nine',
    category: 'numbers',
    description: 'Counting number nine (ASL 9)',
    handsDescription: 'Thumb tip touches index finger tip (F shape), others up',
    emoji: '9️⃣',
    fingerSpelling: ['N', 'I', 'N', 'E']
  },
  {
    id: 'ten',
    word: '10 / Ten',
    category: 'numbers',
    description: 'Counting number ten',
    handsDescription: 'A-hand thumb pointing up, shaking side to side',
    emoji: '🔟',
    fingerSpelling: ['T', 'E', 'N']
  },

  // ─── EMERGENCY & HEALTH ──────────────────────────────────────────────────
  {
    id: 'help',
    word: 'Help / Assistance',
    category: 'emergency',
    description: 'Asking for assistance or urgent help',
    handsDescription: 'Thumbs up resting on a flat opposite palm, lifted together upwards',
    emoji: '🆘',
    fingerSpelling: ['H', 'E', 'L', 'P']
  },
  {
    id: 'emergency',
    word: 'Emergency',
    category: 'emergency',
    description: 'Urgent danger or critical situation',
    handsDescription: 'Letter E hand shape shaking rapidly back and forth in air',
    emoji: '🚨',
    fingerSpelling: ['E', 'M', 'E', 'R', 'G', 'E', 'N', 'C', 'Y']
  },
  {
    id: 'doctor',
    word: 'Doctor / Medical',
    category: 'emergency',
    description: 'Requesting a physician or medical officer',
    handsDescription: 'Dominant curved hand taps pulse point on non-dominant wrist',
    emoji: '👨‍⚕️',
    fingerSpelling: ['D', 'O', 'C', 'T', 'O', 'R']
  },
  {
    id: 'hospital',
    word: 'Hospital',
    category: 'emergency',
    description: 'Medical center location',
    handsDescription: 'H-hand draws a cross symbol (+) on non-dominant upper arm',
    emoji: '🏥',
    fingerSpelling: ['H', 'O', 'S', 'P', 'I', 'T', 'A', 'L']
  },
  {
    id: 'sick',
    word: 'Sick / Unwell',
    category: 'emergency',
    description: 'Feeling ill or unhealthy',
    handsDescription: 'Middle finger touches forehead while other middle touches stomach',
    emoji: '🤒',
    fingerSpelling: ['S', 'I', 'C', 'K']
  },
  {
    id: 'pain',
    word: 'Pain / Hurt',
    category: 'emergency',
    description: 'Expressing bodily pain or injury',
    handsDescription: 'Both index fingers point toward each other and twist in opposition',
    emoji: '⚡',
    fingerSpelling: ['P', 'A', 'I', 'N']
  },

  // ─── DAILY NEEDS & FOOD ──────────────────────────────────────────────────
  {
    id: 'water',
    word: 'Water',
    category: 'common',
    description: 'Requesting drinkable water',
    handsDescription: 'Letter W shape (index, middle, ring up) tapping index against chin',
    emoji: '💧',
    fingerSpelling: ['W', 'A', 'T', 'E', 'R']
  },
  {
    id: 'food',
    word: 'Food / Eat',
    category: 'common',
    description: 'Requesting food or meal time',
    handsDescription: 'Flattened O-hand fingertips tap repeatedly against lips',
    emoji: '🍞',
    fingerSpelling: ['F', 'O', 'O', 'D']
  },
  {
    id: 'drink',
    word: 'Drink',
    category: 'common',
    description: 'Drinking a beverage',
    handsDescription: 'C-hand shaped like a cup tilts toward mouth',
    emoji: '🥤',
    fingerSpelling: ['D', 'R', 'I', 'N', 'K']
  },
  {
    id: 'bathroom',
    word: 'Bathroom / Toilet',
    category: 'common',
    description: 'Asking for restroom facility',
    handsDescription: 'T-hand (thumb tucked under index) shakes side to side',
    emoji: '🚻',
    fingerSpelling: ['T', 'O', 'I', 'L', 'E', 'T']
  },
  {
    id: 'sleep',
    word: 'Sleep',
    category: 'common',
    description: 'Resting or bedtime',
    handsDescription: 'Open hand slides down face closing fingers into flat-O',
    emoji: '😴',
    fingerSpelling: ['S', 'L', 'E', 'E', 'P']
  },

  // ─── QUESTIONS & EXPRESSIONS ─────────────────────────────────────────────
  {
    id: 'what',
    word: 'What?',
    category: 'common',
    description: 'Asking for clarification or info',
    handsDescription: 'Both open hands held palms-up shaking back and forth',
    emoji: '❓',
    fingerSpelling: ['W', 'H', 'A', 'T']
  },
  {
    id: 'where',
    word: 'Where?',
    category: 'common',
    description: 'Asking for location',
    handsDescription: 'Index finger pointing up moves side to side like a pendulum',
    emoji: '📍',
    fingerSpelling: ['W', 'H', 'E', 'R', 'E']
  },
  {
    id: 'why',
    word: 'Why?',
    category: 'common',
    description: 'Asking for reason',
    handsDescription: 'Hand touches forehead then drops into Y-hand shape',
    emoji: '🤔',
    fingerSpelling: ['W', 'H', 'Y']
  },
  {
    id: 'friend',
    word: 'Friend',
    category: 'common',
    description: 'Friendship or companion',
    handsDescription: 'Hooked index fingers link together, flip and link again',
    emoji: '🤝',
    fingerSpelling: ['F', 'R', 'I', 'E', 'N', 'D']
  },
  {
    id: 'family',
    word: 'Family',
    category: 'common',
    description: 'Relatives or home members',
    handsDescription: 'F-hands start with thumbs touching and circle around to pinkies',
    emoji: '👨‍👩‍👧',
    fingerSpelling: ['F', 'A', 'M', 'I', 'L', 'Y']
  },
  ...DATASET_DICTIONARY
];

export const ASL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
