export interface DailyHarvestTheme {
  id: string;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const DAILY_HARVEST_THEMES: DailyHarvestTheme[] = [
  { id: 'tomato', label: '小番茄', primaryColor: '#c68a73', secondaryColor: '#7c8363', accentColor: '#e9e8e0' },
  { id: 'leaf', label: '新叶', primaryColor: '#7c8363', secondaryColor: '#d0a460', accentColor: '#f2f6f3' },
  { id: 'shell', label: '贝壳', primaryColor: '#d0a460', secondaryColor: '#7a8e9e', accentColor: '#fdf9f0' },
  { id: 'wave', label: '潮汐', primaryColor: '#7a8e9e', secondaryColor: '#7c8363', accentColor: '#f5f7f9' },
  { id: 'seed', label: '种子', primaryColor: '#4a4a35', secondaryColor: '#c68a73', accentColor: '#e9e8e0' },
  { id: 'sprout', label: '嫩芽', primaryColor: '#7c8363', secondaryColor: '#c68a73', accentColor: '#f2f6f3' },
  { id: 'sun', label: '暖阳', primaryColor: '#d0a460', secondaryColor: '#c68a73', accentColor: '#fdf9f0' },
];

/**
 * Returns the deterministic harvest illustration theme for a local calendar day.
 *
 * @param date local date used for daily rotation
 * @returns one theme from the local Sea Focus theme set
 */
export function getDailyHarvestTheme(date: Date): DailyHarvestTheme {
  const localDayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / ONE_DAY_MS);
  const index = ((localDayNumber % DAILY_HARVEST_THEMES.length) + DAILY_HARVEST_THEMES.length) % DAILY_HARVEST_THEMES.length;
  return DAILY_HARVEST_THEMES[index];
}
