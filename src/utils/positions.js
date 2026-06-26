const POSITION_MAP = {
  11: { label: 'GK', category: 'GK' },
  32: { label: 'RB', category: 'DEF' },
  33: { label: 'CB', category: 'DEF' },
  34: { label: 'CB', category: 'DEF' },
  35: { label: 'LB', category: 'DEF' },
  36: { label: 'CB', category: 'DEF' },
  37: { label: 'CB', category: 'DEF' },
  38: { label: 'LB', category: 'DEF' },
  59: { label: 'CB', category: 'DEF' },
  62: { label: 'RB', category: 'DEF' },
  64: { label: 'DMF', category: 'MID' },
  65: { label: 'DMF', category: 'MID' },
  66: { label: 'CMF', category: 'MID' },
  68: { label: 'LB', category: 'DEF' },
  71: { label: 'RB', category: 'DEF' },
  72: { label: 'RWF', category: 'FWD' },
  73: { label: 'CAM', category: 'MID' },
  74: { label: 'CAM', category: 'MID' },
  75: { label: 'CMF', category: 'MID' },
  76: { label: 'DMF', category: 'MID' },
  77: { label: 'CMF', category: 'MID' },
  78: { label: 'LWF', category: 'FWD' },
  79: { label: 'LB', category: 'DEF' },
  82: { label: 'RWF', category: 'FWD' },
  83: { label: 'RWF', category: 'FWD' },
  84: { label: 'CAM', category: 'MID' },
  85: { label: 'CAM', category: 'MID' },
  86: { label: 'CAM', category: 'MID' },
  87: { label: 'LWF', category: 'FWD' },
  88: { label: 'RWF', category: 'FWD' },
  95: { label: 'CF', category: 'FWD' },
  103: { label: 'CF', category: 'FWD' },
  104: { label: 'CF', category: 'FWD' },
  105: { label: 'RWF', category: 'FWD' },
  106: { label: 'CF', category: 'FWD' },
  107: { label: 'LWF', category: 'FWD' },
  115: { label: 'CF', category: 'FWD' },
};

export function getPositionLabel(code) {
  return POSITION_MAP[code]?.label || 'N/A';
}

export function getPositionCategory(code) {
  return POSITION_MAP[code]?.category || 'N/A';
}

const POSITION_STR_TO_CODE = {
  'Keeper': 11,
  'Goalkeeper': 11,
  'GK': 11,
  'Right Back': 32,
  'RB': 32,
  'Center Back': 33,
  'CB': 33,
  'Left Back': 35,
  'LB': 35,
  'defender': 36,
  'Defensive Midfielder': 64,
  'DMF': 64,
  'Central Midfielder': 66,
  'CMF': 66,
  'Right Midfielder': 62,
  'Left Midfielder': 68,
  'Right Wing-Back': 71,
  'Left Wing-Back': 79,
  'Right Winger': 72,
  'RWF': 72,
  'Attacking Midfielder': 73,
  'CAM': 73,
  'Left Winger': 78,
  'LWF': 78,
  'Striker': 95,
  'CF': 95,
  'forward': 95,
  'midfielder': 66,
};

export function normalizePosition(pos) {
  if (pos == null) return null;
  if (POSITION_MAP[pos]) return pos;
  return POSITION_STR_TO_CODE[pos] || null;
}

export const POSITION_CATEGORIES = ['GK', 'DEF', 'MID', 'FWD'];

export function getCategoryColor(category) {
  const colors = {
    GK: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    DEF: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    MID: 'bg-brand-neon/15 text-brand-neon border-brand-neon/30',
    FWD: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };
  return colors[category] || 'bg-slate-800 text-slate-400 border-slate-700';
}
