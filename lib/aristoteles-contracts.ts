export type RoadmapCheckpointState = "supports" | "caution" | "blocks" | "unknown";
export type DecisionPathStatus = "recommended" | "alternative" | "review";

export interface DecisionCriterion {
  key: string;
  label: string;
  weight: number;
}

export interface RoadmapCheckpoint {
  criterion_key: string;
  label: string;
  value: string | null;
  state: RoadmapCheckpointState;
  evidence_ids: string[];
}

export interface DecisionPath {
  option_id: string;
  label: string;
  status: DecisionPathStatus;
  score: number;
  checkpoints: RoadmapCheckpoint[];
  risks: string[];
  next_action: string;
}

export interface DecisionRoadmapData {
  objective: string;
  criteria: DecisionCriterion[];
  paths: DecisionPath[];
  recommended_option_id: string | null;
  resolution: string;
  evidence_count: number;
}
