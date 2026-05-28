import { supabase } from './supabase';
import type { BrewingRule, BeanContext } from './types';

// ── Static equipment feature lookup (Option A) ────────────────────────────────
// Maps equipment model names → graph EquipmentType node names.
// Case-insensitive fuzzy matching is applied at runtime.

const MACHINE_FEATURES: Record<string, string[]> = {
  'Lelit Anna PID':          ['PID'],
  'Lelit Anna':              ['No PID'],
  'Lelit Mara X':            ['PID'],
  'Lelit Mara':              ['No PID'],
  'Lelit Bianca':            ['PID'],
  'Lelit Victoria':          ['PID'],
  'Gaggia Classic Pro':      ['No PID'],
  'Gaggia Classic':          ['No PID'],
  'Breville Barista Express':['PID'],
  'Breville Barista Pro':    ['PID'],
  'Breville Barista Touch':  ['PID'],
  'Breville Bambino Plus':   ['PID'],
  'Breville Bambino':        ['No PID'],
  'Rancilio Silvia Pro':     ['PID'],
  'Rancilio Silvia':         ['No PID'],
  'La Marzocco Linea Mini':  ['PID'],
  'La Marzocco GS3':         ['PID'],
  'Profitec Pro 300':        ['PID'],
  'Profitec Pro 400':        ['PID'],
  'ECM Synchronika':         ['PID'],
  'Rocket Mozzafiato':       ['PID'],
  'Rocket Appartamento':     ['No PID'],
  "De'Longhi Dedica Style":  ['No PID'],
  "De'Longhi Dedica":        ['No PID'],
  'Flair 58':                ['No PID'],
  'Flair Pro 2':             ['No PID'],
  'Rok EspressoGC':          ['No PID'],
};

const GRINDER_FEATURES: Record<string, string[]> = {
  'Niche Zero':              ['Conical Burr'],
  'Niche Duo':               ['Conical Burr'],
  'DF64 Gen 2':              ['Flat Burr'],
  'DF64':                    ['Flat Burr'],
  'DF83':                    ['Flat Burr'],
  'Comandante C40':          ['Conical Burr'],
  'Timemore Chestnut C2':    ['Conical Burr'],
  'Timemore C2':             ['Conical Burr'],
  'Timemore Chestnut X':     ['Conical Burr'],
  '1Zpresso JX-Pro':         ['Conical Burr'],
  '1Zpresso JX':             ['Conical Burr'],
  '1Zpresso J-Max':          ['Conical Burr'],
  'Kinu M47 Phoenix':        ['Conical Burr'],
  'Kinu M47':                ['Conical Burr'],
  'Fellow Ode Gen 2':        ['Flat Burr'],
  'Fellow Ode':              ['Flat Burr'],
  'Eureka Mignon Specialita':['Flat Burr'],
  'Eureka Mignon Silenzio':  ['Flat Burr'],
  'Eureka Mignon':           ['Flat Burr'],
  'Mazzer Major':            ['Flat Burr'],
  'Mazzer Mini':             ['Flat Burr'],
  'Baratza Vario':           ['Flat Burr'],
  'Baratza Encore':          ['Conical Burr'],
  'Baratza Sette':           ['Conical Burr'],
  'K6':                      ['Conical Burr'],
};

const BURR_TO_GRIND_PROFILE: Record<string, string> = {
  'Conical Burr': 'Bimodal',
  'Flat Burr':    'Unimodal',
};

function matchFeatures(input: string, map: Record<string, string[]>): string[] {
  const normalized = input.toLowerCase().trim();
  const exact = Object.entries(map).find(([k]) => k.toLowerCase() === normalized);
  if (exact) return exact[1];
  const partial = Object.entries(map).find(
    ([k]) => normalized.includes(k.toLowerCase()) || k.toLowerCase().includes(normalized),
  );
  return partial ? partial[1] : [];
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getOriginFlavors(origin: string): Promise<string[]> {
  if (!origin) return [];

  const { data: originNodes } = await supabase
    .from('knowledge_nodes')
    .select('id, name')
    .eq('node_type', 'Origin');

  if (!originNodes?.length) return [];

  const originLower = origin.toLowerCase();
  const match = originNodes.find(
    (n) => originLower.includes(n.name.toLowerCase()) || n.name.toLowerCase().includes(originLower),
  );
  if (!match) return [];

  const { data: edges } = await supabase
    .from('knowledge_edges')
    .select('target_id')
    .eq('source_id', match.id)
    .eq('relationship_type', 'TYPICAL_FLAVOR');

  if (!edges?.length) return [];

  const targetIds = edges.map((e) => e.target_id);
  const { data: flavorNodes } = await supabase
    .from('knowledge_nodes')
    .select('name')
    .in('id', targetIds)
    .eq('node_type', 'FlavorNote');

  return flavorNodes?.map((n) => n.name) ?? [];
}

export async function getProcessFlavors(process: string): Promise<string[]> {
  if (!process) return [];

  const { data: processNodes } = await supabase
    .from('knowledge_nodes')
    .select('id, name')
    .eq('node_type', 'ProcessMethod');

  if (!processNodes?.length) return [];

  const processLower = process.toLowerCase();
  const match = processNodes.find(
    (n) => processLower.includes(n.name.toLowerCase()) || n.name.toLowerCase().includes(processLower),
  );
  if (!match) return [];

  const { data: edges } = await supabase
    .from('knowledge_edges')
    .select('target_id')
    .eq('source_id', match.id)
    .eq('relationship_type', 'PRODUCES_FLAVOR');

  if (!edges?.length) return [];

  const targetIds = edges.map((e) => e.target_id);
  const { data: flavorNodes } = await supabase
    .from('knowledge_nodes')
    .select('name')
    .in('id', targetIds)
    .eq('node_type', 'FlavorNote');

  return flavorNodes?.map((n) => n.name) ?? [];
}

export interface RuleConditions {
  origin?:         string;
  process?:        string;
  roast?:          string;
  equipmentTypes?: string[];
  grindProfile?:   string;
}

export async function getApplicableRules(conditions: RuleConditions): Promise<BrewingRule[]> {
  const conditionFilters: { node_type: string; name: string }[] = [];
  if (conditions.origin)       conditionFilters.push({ node_type: 'Origin',        name: conditions.origin });
  if (conditions.process)      conditionFilters.push({ node_type: 'ProcessMethod', name: conditions.process });
  if (conditions.roast)        conditionFilters.push({ node_type: 'RoastLevel',    name: conditions.roast });
  if (conditions.grindProfile) conditionFilters.push({ node_type: 'GrindProfile',  name: conditions.grindProfile });
  for (const et of conditions.equipmentTypes ?? []) {
    conditionFilters.push({ node_type: 'EquipmentType', name: et });
  }
  if (!conditionFilters.length) return [];

  // Fetch all nodes matching any condition filter
  const nodeTypes = [...new Set(conditionFilters.map((f) => f.node_type))];
  const nodeNames = [...new Set(conditionFilters.map((f) => f.name))];

  const { data: conditionNodes } = await supabase
    .from('knowledge_nodes')
    .select('id, node_type, name')
    .in('node_type', nodeTypes)
    .in('name', nodeNames);

  if (!conditionNodes?.length) return [];

  // Build set of valid node IDs — only exact type+name matches
  const validNodeIds = new Set<string>();
  for (const node of conditionNodes) {
    if (conditionFilters.some((f) => f.node_type === node.node_type && f.name === node.name)) {
      validNodeIds.add(node.id);
    }
  }

  // Fetch all BrewingRule nodes
  const { data: ruleNodes } = await supabase
    .from('knowledge_nodes')
    .select('id, name, properties')
    .eq('node_type', 'BrewingRule');

  if (!ruleNodes?.length) return [];

  const ruleIds = ruleNodes.map((r) => r.id);

  // Fetch all APPLIES_TO edges from these rules
  const { data: appliesToEdges } = await supabase
    .from('knowledge_edges')
    .select('source_id, target_id')
    .in('source_id', ruleIds)
    .eq('relationship_type', 'APPLIES_TO');

  if (!appliesToEdges) return [];

  // Group: ruleId → required condition node IDs
  const ruleConditions = new Map<string, string[]>();
  for (const edge of appliesToEdges) {
    const arr = ruleConditions.get(edge.source_id) ?? [];
    arr.push(edge.target_id);
    ruleConditions.set(edge.source_id, arr);
  }

  // Keep rules where ALL required conditions are satisfied
  const applicable: BrewingRule[] = [];
  for (const rule of ruleNodes) {
    const required = ruleConditions.get(rule.id) ?? [];
    if (!required.length) continue;
    if (!required.every((id) => validNodeIds.has(id))) continue;

    type RuleProps = {
      description?: string;
      dictates?: { parameter: string; direction: string; value_range: string; unit: string };
      pid_specificity?: { requires_pid: boolean | null; reason: string | null; non_pid_alternative: string | null };
      confidence?: number;
      source?: string;
    };

    const p = (rule.properties ?? {}) as RuleProps;
    applicable.push({
      rule_id:          rule.name,
      description:      p.description ?? rule.name,
      dictates:         p.dictates ?? { parameter: '', direction: '', value_range: '', unit: '' },
      pid_specificity:  p.pid_specificity ?? { requires_pid: null, reason: null, non_pid_alternative: null },
      confidence:       p.confidence ?? 0.8,
      source:           p.source ?? '',
    });
  }

  return applicable;
}

export async function resolveEquipmentFeatures(
  machineName: string,
  grinderName: string,
): Promise<{ equipmentTypes: string[]; grindProfile: string | null }> {
  const machineFeatures  = machineName ? matchFeatures(machineName, MACHINE_FEATURES)  : [];
  const grinderFeatures  = grinderName ? matchFeatures(grinderName, GRINDER_FEATURES)  : [];
  const equipmentTypes   = [...new Set([...machineFeatures, ...grinderFeatures])];

  const burrType   = grinderFeatures.find((f) => f in BURR_TO_GRIND_PROFILE) ?? null;
  const grindProfile = burrType ? BURR_TO_GRIND_PROFILE[burrType] : null;

  return { equipmentTypes, grindProfile };
}

export async function getBeanContext(params: {
  origin?:      string;
  process?:     string;
  roast?:       string;
  machineName?: string;
  grinderName?: string;
}): Promise<BeanContext> {
  const { origin, process, roast, machineName, grinderName } = params;

  const [originFlavors, processFlavors, equipmentResult] = await Promise.all([
    origin  ? getOriginFlavors(origin)                                  : Promise.resolve([]),
    process ? getProcessFlavors(process)                                : Promise.resolve([]),
    resolveEquipmentFeatures(machineName ?? '', grinderName ?? ''),
  ]);

  const { equipmentTypes, grindProfile } = equipmentResult;
  const expected_flavors = [...new Set([...originFlavors, ...processFlavors])];

  const applicable_rules = await getApplicableRules({
    origin,
    process,
    roast,
    equipmentTypes,
    grindProfile: grindProfile ?? undefined,
  });

  const parts: string[] = [];
  if (expected_flavors.length)   parts.push(`Flavors: ${expected_flavors.join(', ')}`);
  if (equipmentTypes.length)     parts.push(`Equipment: ${equipmentTypes.join(', ')}`);
  if (grindProfile)              parts.push(`Grind: ${grindProfile}`);
  if (applicable_rules.length)   parts.push(`${applicable_rules.length} rule(s) apply`);

  return {
    expected_flavors,
    applicable_rules,
    equipment_features: equipmentTypes,
    grind_profile:      grindProfile,
    reasoning:          parts.join(' | '),
  };
}

// ── Prompt formatting ─────────────────────────────────────────────────────────

export function formatGraphContextBlock(ctx: BeanContext): string {
  if (!ctx.expected_flavors.length && !ctx.applicable_rules.length && !ctx.equipment_features.length) {
    return '';
  }

  const lines: string[] = ['\nKNOWLEDGE GRAPH CONTEXT:'];

  if (ctx.expected_flavors.length) {
    lines.push(`Expected flavors from this bean's origin/process: ${ctx.expected_flavors.join(', ')}`);
  }

  if (ctx.equipment_features.length) {
    const grindNote = ctx.grind_profile ? ` → ${ctx.grind_profile} grind` : '';
    lines.push(`Equipment features: ${ctx.equipment_features.join(', ')}${grindNote}`);
  }

  if (ctx.applicable_rules.length) {
    const hasPid = ctx.equipment_features.includes('PID');
    lines.push('Applicable brewing rules:');
    for (const rule of ctx.applicable_rules) {
      const needsPid = rule.pid_specificity.requires_pid;
      if (needsPid && !hasPid && rule.pid_specificity.non_pid_alternative) {
        lines.push(`- ${rule.description} — no PID: ${rule.pid_specificity.non_pid_alternative}`);
      } else {
        lines.push(`- ${rule.description}`);
      }
    }
  }

  return lines.join('\n');
}
