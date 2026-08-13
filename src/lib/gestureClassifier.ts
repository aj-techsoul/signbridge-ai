export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandLandmarks {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
}

export interface RecognizedSign {
  name: string;
  category: 'alphabet' | 'word' | 'phrase' | 'two-hand';
  confidence: number;
  description?: string;
  hand?: 'left' | 'right' | 'both';
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

export function getDistance(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

export function getDistance2D(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2)
  );
}

export function getAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y + ab.z * ab.z);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y + cb.z * cb.z);
  if (magAB * magCB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function isFingerExtended(
  landmarks: Landmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number
): boolean {
  const wrist = landmarks[0];
  const distTip = getDistance(landmarks[tipIdx], wrist);
  const distPip = getDistance(landmarks[pipIdx], wrist);
  const distMcp = getDistance(landmarks[mcpIdx], wrist);
  return distTip > distPip && distPip > distMcp;
}

// Shorthand finger state extractor
function fingerStates(lm: Landmark[]) {
  return {
    index:  isFingerExtended(lm, 8,  6,  5),
    middle: isFingerExtended(lm, 12, 10, 9),
    ring:   isFingerExtended(lm, 16, 14, 13),
    pinky:  isFingerExtended(lm, 20, 18, 17),
    thumbUp: lm[4].y < lm[3].y && lm[3].y < lm[2].y,
    thumbLeft: lm[4].x < lm[3].x,
    thumbTipToIndex: getDistance2D(lm[4], lm[8]),
    thumbTipToMiddle: getDistance2D(lm[4], lm[12]),
  };
}

// ─── Single-hand Gesture Classifier ──────────────────────────────────────────
export function classifyGesture(
  landmarks: Landmark[],
  handLabel?: 'Left' | 'Right'
): RecognizedSign | null {
  if (!landmarks || landmarks.length < 21) return null;

  const f = fingerStates(landmarks);
  const hand = handLabel === 'Left' ? 'left' : 'right';

  // I Love You 🤟
  if (f.index && f.pinky && !f.middle && !f.ring && f.thumbLeft) {
    return { name: 'I Love You', category: 'phrase', confidence: 0.94, hand,
      description: 'ASL sign for I Love You (🤟)' };
  }

  // Peace / V / U
  if (f.index && f.middle && !f.ring && !f.pinky) {
    const gap = getDistance2D(landmarks[8], landmarks[12]);
    if (gap > 0.05) {
      return { name: 'Peace / V', category: 'alphabet', confidence: 0.92, hand,
        description: 'Letter V or Peace Gesture (✌️)' };
    }
    return { name: 'Letter U', category: 'alphabet', confidence: 0.88, hand,
      description: 'ASL letter U (two fingers together)' };
  }

  // All fingers curled
  if (!f.index && !f.middle && !f.ring && !f.pinky) {
    if (f.thumbUp) {
      return { name: 'Yes / Good', category: 'word', confidence: 0.95, hand,
        description: 'Thumbs Up / Affirmative (👍)' };
    }
    if (landmarks[4].x > landmarks[6].x) {
      return { name: 'Letter S', category: 'alphabet', confidence: 0.85, hand,
        description: 'ASL Letter S (Fist with thumb across)' };
    }
    return { name: 'Letter A', category: 'alphabet', confidence: 0.85, hand,
      description: 'ASL Letter A (Fist with thumb at side)' };
  }

  // Open Hand / Hello / 5
  if (f.index && f.middle && f.ring && f.pinky) {
    const gap1 = getDistance2D(landmarks[8], landmarks[12]);
    const gap2 = getDistance2D(landmarks[12], landmarks[16]);
    if (gap1 < 0.04 && gap2 < 0.04) {
      return { name: 'Letter B', category: 'alphabet', confidence: 0.89, hand,
        description: 'ASL Letter B (Flat hand, fingers together)' };
    }
    return { name: 'Hello / Open Hand', category: 'word', confidence: 0.96, hand,
      description: 'Open Hand / Waves / Hello (🖐️)' };
  }

  // Point / D / 1
  if (f.index && !f.middle && !f.ring && !f.pinky) {
    const angle = getAngle(landmarks[8], landmarks[5], landmarks[4]);
    if (angle > 60 && angle < 120) {
      return { name: 'Letter L', category: 'alphabet', confidence: 0.92, hand,
        description: 'ASL Letter L (right angle)' };
    }
    return { name: 'Point / Letter D', category: 'alphabet', confidence: 0.90, hand,
      description: 'Pointing / ASL Letter D (☝️)' };
  }

  // OK / Fine
  if (f.thumbTipToIndex < 0.06 && f.middle && f.ring && f.pinky) {
    return { name: 'OK / Fine', category: 'phrase', confidence: 0.93, hand,
      description: 'OK Sign / Perfect (👌)' };
  }

  // Rock / Horns — I Love You without thumb
  if (f.index && f.pinky && !f.middle && !f.ring && !f.thumbLeft) {
    return { name: 'Rock / Horns', category: 'phrase', confidence: 0.91, hand,
      description: 'Rock Horns (🤘)' };
  }

  // Call Me / Water / Y
  if (!f.index && !f.middle && !f.ring && f.pinky && f.thumbUp) {
    return { name: 'Call Me / Y', category: 'word', confidence: 0.91, hand,
      description: 'Call Me / Shaka / ASL Y (🤙)' };
  }

  // W / 3
  if (f.index && f.middle && f.ring && !f.pinky) {
    return { name: 'Letter W / 3', category: 'alphabet', confidence: 0.88, hand,
      description: 'ASL Letter W or number 3 (🖖)' };
  }

  // I / Pinky only
  if (!f.index && !f.middle && !f.ring && f.pinky) {
    return { name: 'Letter I', category: 'alphabet', confidence: 0.87, hand,
      description: 'ASL Letter I (pinky up)' };
  }

  // Letter C — curved hand / Sun / Moon
  const isCurved = landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y;
  if (isCurved && f.thumbTipToIndex > 0.08 && f.thumbTipToIndex < 0.22) {
    return { name: 'Sun / Moon / C', category: 'word', confidence: 0.85, hand,
      description: 'C-shape hand indicating Sun, Moon, or Letter C/O' };
  }

  // K / P — index + middle up with thumb between
  if (f.index && f.middle && !f.ring && !f.pinky) {
    return { name: 'Letter K / U', category: 'alphabet', confidence: 0.83, hand,
      description: 'ASL Letter K or U' };
  }

  return null;
}

// ─── Two-Hand Gesture Classifier ─────────────────────────────────────────────
/**
 * Classifies signs that inherently require two hands, based on the relative
 * positions, shapes, and movements of both detected hands.
 *
 * MediaPipe returns handedness as seen in the mirror — so the label 'Left'
 * in the callback is typically the user's RIGHT hand in mirrored mode.
 * We handle both orderings here.
 */
export function classifyTwoHandGesture(
  hand1Landmarks: Landmark[],
  hand2Landmarks: Landmark[],
  hand1Label: 'Left' | 'Right',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _hand2Label: 'Left' | 'Right'
): RecognizedSign | null {
  if (
    !hand1Landmarks || hand1Landmarks.length < 21 ||
    !hand2Landmarks || hand2Landmarks.length < 21
  ) return null;

  // Identify which hand is which (mirror-corrected)
  const leftLm  = hand1Label === 'Right' ? hand1Landmarks : hand2Landmarks;
  const rightLm = hand1Label === 'Right' ? hand2Landmarks : hand1Landmarks;

  const lf = fingerStates(leftLm);
  const rf = fingerStates(rightLm);

  // Wrist positions for spatial reasoning
  const lWrist = leftLm[0];
  const rWrist = rightLm[0];
  const wristDist = getDistance2D(lWrist, rWrist);

  // Tip-to-tip distances for touch detection
  const indexTipDist  = getDistance2D(leftLm[8],  rightLm[8]);
  const thumbTipDist  = getDistance2D(leftLm[4],  rightLm[4]);

  // ── Two-hand sign library ──────────────────────────────────────────────────

  // MOTHER / MOM — dominant A-hand thumb taps chin (simulated by thumb-up near top)
  // FRIEND — Index fingers hook together (both index up, tips close)
  if (rf.index && !rf.middle && !rf.ring && !rf.pinky &&
      lf.index && !lf.middle && !lf.ring && !lf.pinky &&
      indexTipDist < 0.10) {
    return { name: 'Friend', category: 'two-hand', confidence: 0.90, hand: 'both',
      description: 'Friend — both index fingers link together' };
  }

  // SAME / ALSO — both index fingers parallel and pointing same direction, close together
  if (rf.index && lf.index && indexTipDist < 0.12 && wristDist < 0.25) {
    return { name: 'Same / Also', category: 'two-hand', confidence: 0.87, hand: 'both',
      description: 'Same/Also — both index fingers pointing together' };
  }

  // HELP — dominant A-hand (fist) placed on flat open other hand, thumb up
  if (
    (!rf.index && !rf.middle && !rf.ring && !rf.pinky && rf.thumbUp) &&
    (lf.index && lf.middle && lf.ring && lf.pinky)
  ) {
    return { name: 'Help', category: 'two-hand', confidence: 0.91, hand: 'both',
      description: 'Help — fist with thumb up rests on open palm' };
  }
  if (
    (!lf.index && !lf.middle && !lf.ring && !lf.pinky && lf.thumbUp) &&
    (rf.index && rf.middle && rf.ring && rf.pinky)
  ) {
    return { name: 'Help', category: 'two-hand', confidence: 0.91, hand: 'both',
      description: 'Help — fist with thumb up rests on open palm' };
  }

  // PLEASE / THANK YOU — flat hand from chin (open palm, tilted outward)
  // Simplified: both palms open and roughly face level
  if (rf.index && rf.middle && rf.ring && rf.pinky &&
      lf.index && lf.middle && lf.ring && lf.pinky &&
      wristDist > 0.30) {
    return { name: 'Hello / Open Both', category: 'two-hand', confidence: 0.89, hand: 'both',
      description: 'Both hands open and spread wide — Hello or enthusiastic greeting' };
  }

  // APPLAUSE / CLAP — both open palms facing each other, close together
  if (rf.index && rf.middle && rf.ring && rf.pinky &&
      lf.index && lf.middle && lf.ring && lf.pinky &&
      wristDist < 0.20) {
    return { name: 'Clap / Applause', category: 'two-hand', confidence: 0.88, hand: 'both',
      description: 'Clap — both open palms coming together' };
  }

  // MORE — both flat-O hands tapping fingertips together
  const allCurledRight = !rf.index && !rf.middle && !rf.ring && !rf.pinky;
  const allCurledLeft  = !lf.index && !lf.middle && !lf.ring && !lf.pinky;
  if (allCurledRight && allCurledLeft && indexTipDist < 0.14) {
    return { name: 'More', category: 'two-hand', confidence: 0.90, hand: 'both',
      description: 'More — bunched fingertips tap together' };
  }

  // SORRY — closed fist circling on chest (single hand dominant)
  // When both fists are present it could mean BOTH / TOGETHER
  if (allCurledRight && allCurledLeft && wristDist > 0.15) {
    return { name: 'Together / Both', category: 'two-hand', confidence: 0.86, hand: 'both',
      description: 'Together/Both — both fists side by side' };
  }

  // BOOK — flat palms open like opening a book (both open, side by side)
  if (rf.index && rf.middle && rf.ring && rf.pinky &&
      lf.index && lf.middle && lf.ring && lf.pinky &&
      wristDist > 0.15 && wristDist < 0.35) {
    return { name: 'Book', category: 'two-hand', confidence: 0.85, hand: 'both',
      description: 'Book — flat palms open like pages of a book' };
  }

  // KNOW vs DON'T KNOW — dominant flat hand taps forehead
  // (classified as single-hand above, so here: if both hands are flat)

  // STOP — one flat chop onto other flat palm
  if (
    (rf.index && rf.middle && rf.ring && rf.pinky) &&
    (lf.index && lf.middle && lf.ring && lf.pinky) &&
    Math.abs(lWrist.y - rWrist.y) > 0.15
  ) {
    return { name: 'Stop', category: 'two-hand', confidence: 0.89, hand: 'both',
      description: 'Stop — one hand chops into the other flat palm' };
  }

  // NO — index + middle snap to thumb on dominant hand
  if (rf.index && rf.middle && !rf.ring && !rf.pinky &&
      allCurledLeft) {
    return { name: 'No', category: 'two-hand', confidence: 0.84, hand: 'both',
      description: 'No — two fingers snap closed like scissors' };
  }

  // WAIT — both hands open, fingers spread, palms facing viewer
  if (rf.index && rf.middle && rf.ring && rf.pinky &&
      lf.index && lf.middle && lf.ring && lf.pinky &&
      wristDist > 0.20 && wristDist < 0.40) {
    return { name: 'Wait', category: 'two-hand', confidence: 0.83, hand: 'both',
      description: 'Wait — both open palms facing outward' };
  }

  // HOME / HOUSE — fingertips form a roof shape (both hands meet overhead)
  const lIndexTip = leftLm[8];
  const rIndexTip = rightLm[8];
  if (indexTipDist < 0.12 && lIndexTip.y < lWrist.y - 0.15 && rIndexTip.y < rWrist.y - 0.15) {
    return { name: 'House / Home', category: 'two-hand', confidence: 0.88, hand: 'both',
      description: 'House — fingertips meet to form a roof peak' };
  }

  // WHAT — both palms up, shrug position (wrists lower than fingers)
  if (rf.index && rf.middle && rf.ring && rf.pinky &&
      lf.index && lf.middle && lf.ring && lf.pinky &&
      rightLm[9].y > rWrist.y && leftLm[9].y > lWrist.y) {
    return { name: 'What?', category: 'two-hand', confidence: 0.82, hand: 'both',
      description: 'What — both palms shrug upward in question' };
  }

  // LOVE — crossed arms on chest (wrists cross in center)
  if (thumbTipDist < 0.20 && Math.abs(lWrist.x - rWrist.x) < 0.15) {
    return { name: 'Love / Hug', category: 'two-hand', confidence: 0.85, hand: 'both',
      description: 'Love/Hug — arms crossed over chest' };
  }

  return null;
}
