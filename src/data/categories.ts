export const CATEGORIES = ['work', 'freelance', 'academic', 'personal'] as const;
export const STATUSES = ['completed', 'in-progress'] as const;
export type Category = (typeof CATEGORIES)[number];
