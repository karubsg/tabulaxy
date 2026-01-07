
export enum GameMode {
  CLASSIC = 'KLASİK',
  SILENT = 'SESSİZLİK',
  MARATHON = '15 KELİME MARATONU',
  JOURNEY = 'BÜYÜK TABU TURU' // New Map Mode
}

export enum GameState {
  MENU = 'MENU',
  SETUP = 'SETUP',
  TRANSITION = 'TRANSITION', // Between turns
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface TabuCard {
  target: string;
  forbidden: string[];
  category?: string;
}

export interface GameSettings {
  team1Name: string;
  team2Name: string;
  targetScore: number;
  turnDuration: number; // in seconds
  enableJokers: boolean;
  enableChallenges: boolean;
  enableSabotage: boolean; // Yeni özellik
}

// --- JOKERLER ---
export enum JokerType {
  TIME_FREEZE = 'ZAMAN_DURDUR', // +15 sn
  REMOVE_FORBIDDEN = 'YASAK_KALDIR', // Yasaklı kelimeleri gizle/kaldır
  EXTRA_PASS = 'EKSTRA_PAS' // Pas hakkını fulle
}

export interface TeamStats {
  score: number;
  name: string;
  jokers: Record<JokerType, number>; // Her jokerden kaç tane kaldığı
  usedSabotage: boolean; // Takım sabotaj hakkını kullandı mı? (Oyun başı 1 hak)
}

// --- ŞANS KARTLARI (CHALLENGES) ---
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'BONUS' | 'PENALTY' | 'NEUTRAL';
  effect: (session: GameSession) => Partial<GameSession>;
}

// --- HARİTA MODU YAPILARI ---
export interface MapNode {
  id: number;
  type: GameMode.CLASSIC | GameMode.SILENT | GameMode.MARATHON;
  isSpecial?: boolean; // Belki ilerde boss fight vs.
}

export interface MapState {
  nodes: MapNode[];
  team1Pos: number; // Current node index
  team2Pos: number; // Current node index
  totalLength: number;
}

export interface GameSession {
  mode: GameMode;
  settings: GameSettings;
  currentTeam: 1 | 2;
  team1: TeamStats;
  team2: TeamStats;
  
  // Turn specific data (resets every turn)
  timeLeft: number;
  wordBudget?: number;   // Only for Marathon
  passBudget: number;
  
  // Active modifiers
  activeChallenge: Challenge | null; // Şu anki tur için geçerli şans kartı
  activeModifiers: {
    forbiddenWordsHidden: boolean; // Joker etkisi
    scoreMultiplier: number; // Şans kartı etkisi
    sabotageEffect?: 'HALF_TIME' | 'NO_PASS'; // Sabotaj etkisi
  };

  // Map Mode State
  mapState?: MapState;

  history: {
    team: 1 | 2;
    word: string;
    result: 'CORRECT' | 'TABOO' | 'PASS';
  }[];
}