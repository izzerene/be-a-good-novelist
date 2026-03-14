
export enum AppSection {
  DASHBOARD = 'DASHBOARD',
  PROJECT_STUDIO = 'PROJECT_STUDIO',
  STORY_BIBLE = 'STORY_BIBLE',
  CREATIVE_LAB = 'CREATIVE_LAB',
  INSPIRATION_VAULT = 'INSPIRATION_VAULT'
}

// Added 'daily', 'gallery', 'slice', 'magic', 'blindbox' to ProjectNodeType
export type ProjectNodeType = 'book' | 'volume' | 'chapter' | 'scene' | 'daily' | 'gallery' | 'slice' | 'magic' | 'blindbox';

export interface ProjectNode {
  id: string;
  type: ProjectNodeType;
  title: string;
  content?: string;
  articleIntro?: string;
  children?: ProjectNode[];
  isOpen?: boolean;
}

export interface LibraryItem {
  id: string;
  type: 'image' | 'video' | 'text' | 'link';
  title: string;
  content: string; // URL or text snippet
  tags: string[];
  category: string;
  createdAt: number;
  coverUrl?: string;
}

export interface CreativeExercise {
  id: string;
  type: 'daily' | 'image' | 'video' | 'three_word' | 'random';
  title: string;
  prompt: string;
  contextData?: any;
}

export interface CharacterNode {
  id: string;
  name: string;
  role: string;
  faction?: string; // New field: Camp/Faction
  bio?: string;     // New field: Biography
  avatar: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  color: string;
}

export interface CharacterLink {
  id: string;
  source: string;
  target: string;
  label: string;
  contextId?: string; // Links to a BibleNode (e.g. specific book)
}

export interface TimelineEvent {
  id: string;
  time: string;
  location: string;
  summary: string;
  isDrafted: boolean;
  type: 'major' | 'minor';
  duration?: number; // New field for Gantt chart (arbitrary units or days)
  associatedCharacterIds?: string[];
  contextId?: string; // Links to a BibleNode (e.g. specific book)
}

export interface BibleNode {
  id: string;
  type: 'book' | 'folder';
  title: string;
  content?: string;
  children?: BibleNode[];
  isOpen?: boolean;
}
