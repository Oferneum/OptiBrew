export type FlavorTag = 'Sour' | 'Bitter' | 'Balanced' | 'Dry';

export interface Shot {
  id: string;
  created_at: string;
  dose: number;
  yield: number;
  brew_ratio: number;
  extraction_time: number;
  brew_temp?: number | null;
  flavor_tags: FlavorTag[];
  overall_score?: number | null;
  notes?: string | null;
  bean_id?: string | null;
  equipment_id?: string | null;
  grind_setting?: string | null;
}

export interface Bean {
  id: string;
  created_at: string;
  origin: string;
  roaster: string;
  roast_date: string;
  notes?: string | null;
  is_active: boolean;
}

export interface EquipmentProfile {
  id: string;
  created_at: string;
  machine_name: string;
  basket_type?: string | null;
  grinder_name?: string | null;
  grinder_setting?: string | null;
  notes?: string | null;
}

export interface Recommendation {
  type: 'under-extracted' | 'over-extracted' | 'balanced' | 'neutral';
  title: string;
  adjustments: string[];
  isTrend: boolean;
}

export interface BaristaBrain {
  type: 'under-extracted' | 'over-extracted' | 'balanced' | 'neutral';
  title: string;
  diagnosis: string;
  primaryFix: string;
  secondaryFix?: string;
  baseline?: string;
  isTrend: boolean;
}

export interface SuccessZone {
  timeMin: number;
  timeMax: number;
  ratioMin: number;
  ratioMax: number;
  isCalibrated: boolean;
}

export interface FuzzyBeanMatch {
  id: string;
  origin: string;
  roaster: string;
  roast_date: string;
  similarity: number;
}

export interface FuzzyEquipmentMatch {
  id: string;
  machine_name: string;
  grinder_name?: string | null;
  similarity: number;
}
