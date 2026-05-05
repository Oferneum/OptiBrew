export type FlavorTag = 'Sour' | 'Bitter' | 'Balanced' | 'Dry';
export type BrewMethod = 'Espresso' | 'MokaPot' | 'FrenchPress' | 'V60' | 'Aeropress';

export interface BagScanResult {
  roaster:       string;
  bag_name:      string;
  origin:        string;
  process?:      string;
  notes?:        string;
  tasting_notes?: string;
}

export interface CommunityMethodResult {
  brew_method: BrewMethod;
  avg_score:   number;
  shot_count:  number;
}

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
  brew_method?: BrewMethod | null;
  has_milk?: boolean | null;
  recommendation?: string | null;
  beans?: { roaster: string; origin: string; bag_name?: string | null } | null;
}

export interface Bean {
  id: string;
  created_at: string;
  origin: string;
  roaster: string;
  bag_name?: string | null;
  roast_date: string;
  notes?: string | null;
  is_active: boolean;
  price_paid?: number | null;
  weight_grams?: number | null;
  is_finished?: boolean | null;
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
