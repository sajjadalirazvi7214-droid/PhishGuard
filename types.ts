export enum RiskLevel {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  MALICIOUS = 'MALICIOUS',
}

export enum ScanType {
  URL = 'URL',
  TEXT = 'TEXT',
  FILE = 'FILE',
}

export interface AnalysisResult {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  summary: string;
  redFlags: string[];
  recommendation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}