export const CATEGORIES = [
  { value: '생필품', emoji: '🧴' },
  { value: '과일/신선식품', emoji: '🍎' },
  { value: '냉동식품', emoji: '🧊' },
  { value: '가공품', emoji: '🥫' },
  { value: '음료', emoji: '🥤' },
  { value: '간식/스낵', emoji: '🍿' },
] as const;

export type CategoryValue = typeof CATEGORIES[number]['value'];

export const getCategoryEmoji = (value: string) => {
  return CATEGORIES.find(cat => cat.value === value)?.emoji || '📦';
};
