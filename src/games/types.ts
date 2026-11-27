import React from "react";
import { UserProgress } from "../types";

export type GameStatus = "ready" | "testing" | "draft";

export type GameBadgeType = "Team Battle" | "Strategy" | "Speed" | "Memory" | "Sandbox" | "Action Roguelike";

export type GameArtTheme =
  | "pixel-vanguard"
  | "ink-siege"
  | "pool-party"
  | "lucky-claw"
  | "tower-defense"
  | "home-run"
  | "pirate-treasure"
  | "fox-academy"
  | "dragon-kingdom"
  | "astro-coder"
  | "english-pop"
  | "su-ca";

export interface GameFolder {
  id: string;
  name: string;
  folderPath: string;
  description: string;
  subjectTag: string;
  iconName: "calculator" | "languages" | "grid" | "flask" | "folder";
}

export interface GameRewardPayload {
  xp: number;
  coins: number;
  reason: string;
}

export interface GameTestLogEntry {
  id: string;
  timestamp: string;
  type: "state" | "score" | "reward" | "debug";
  message: string;
}

export interface GameComponentProps {
  gameId: string;
  isTestMode: boolean;
  highScore: number;
  onSaveHighScore: (newScore: number) => void;
  onAwardReward: (payload: GameRewardPayload) => void;
  onLogEvent: (type: GameTestLogEntry["type"], message: string) => void;
  onExit: () => void;
  progress?: UserProgress;
  onUpdateProgress?: (updates: Partial<UserProgress>) => void;
  onNavigateTab?: (tab: string) => void;
  onTriggerSuccess?: (msg: string) => void;
  onOpenRewardShop?: (subTab?: string, heroId?: string) => void;
}

export interface GameManifest {
  id: string;
  folderId: string;
  title: string;
  vietnameseTitle: string;
  subtitle: string;
  description: string;
  sourcePath: string;
  version: string;
  status: GameStatus;
  difficulty: "Cơ bản" | "Vận dụng" | "Thử nghiệm";
  estimatedMinutes: number;
  rewardXp: number;
  rewardCoins: number;
  tags: string[];
  /** Subjects the game practises (game hub filter); 3 or more = "Đa môn". */
  subjectGroups?: GameSubjectGroup[];
  section: "new" | "popular";
  isNew?: boolean;
  isPro?: boolean;
  teamsLabel: string;
  modeBadge: GameBadgeType;
  artTheme: GameArtTheme;
  /** What the game asks of the player, shown as chips so a student who needs support picks a game that fits. */
  access: GameAccess;
  component: React.ComponentType<GameComponentProps>;
}

export interface GameAccess {
  /** Right / wrong also shown as a frame + ✓ ✗ (signalFeedback); false = the game is built on listening. */
  noHearing: boolean;
  /** No countdown at all, or one that follows the "Thời gian làm bài" support setting. */
  clock: "none" | "adjustable";
  /** What the hands must do: answer at own pace, react fast (action), or aim precisely (claw, map). */
  hands: "slow" | "fast" | "precise";
}

export type GameSubjectGroup = "toan" | "tieng-anh" | "lich-su-dia-ly" | "khtn";
