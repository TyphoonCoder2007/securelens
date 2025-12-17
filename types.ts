export interface RedFlag {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ExternalReference {
  title: string;
  uri: string;
}

export interface AnalysisResult {
  riskScore: number; // 0 to 100
  riskLevel: 'Safe' | 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical';
  confidenceScore: number; // 0 to 100
  scamType: string;
  isSafe: boolean;
  summary: string;
  redFlags: RedFlag[];
  technicalDetails: {
    domainAnalysis: string;
    sslAnalysis?: string;
    grammarAnalysis: string;
    urgencyAnalysis: string;
    senderAnalysis: string;
  };
  recommendations: string[];
  externalReferences?: ExternalReference[];
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  snippet: string;
  result: AnalysisResult;
}

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  initialRiskLabel?: 'Safe' | 'Suspicious' | 'High Risk'; // For the mock inbox view
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  joinedDate: number;
}