import type { DecisionRoadmapData } from "@/lib/aristoteles-contracts";

export type AgentResult = {
  mode?: "web" | "documents" | "hybrid";
  answer?: string;
  citations?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  stages?: string[];
  needs_review?: boolean;
  document?: {
    filename: string;
    pages: number;
    quality_score: number;
    previews: Array<{
      document?: string;
      page_number: number;
      method: string;
      preview: string;
    }>;
  };
  research?: {
    evidence: Array<{ id: string; document: string; page: number; quote: string }>;
  };
  comparison?: Array<{
    provider_id: string;
    weighted_score?: number;
    advantages: string[];
    disadvantages: string[];
  }>;
  decision?: {
    outcome: "recommendation" | "needs_review";
    recommended_provider_id: string | null;
    summary: string;
    risk_items: string[];
    confidence: {
      score: number;
      band: "high" | "medium" | "low";
    };
  };
  roadmap?: DecisionRoadmapData;
};
