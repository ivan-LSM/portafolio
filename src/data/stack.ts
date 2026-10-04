import type { TKey } from '../i18n/utils';

export interface StackGroup {
  titleKey: TKey;
  items: string[];
}

export const STACK: StackGroup[] = [
  { titleKey: 'stack.languages', items: ['Dart', 'JavaScript', 'TypeScript', 'SQL', 'Python'] },
  {
    titleKey: 'stack.backend',
    items: ['REST APIs', 'Shelf', 'NestJS', 'JWT', 'RBAC', 'PostgreSQL', 'PostGIS', 'Redis', 'Relational modeling'],
  },
  { titleKey: 'stack.frontend', items: ['Flutter', 'Astro', 'Tailwind CSS', 'HTML', 'CSS'] },
  {
    titleKey: 'stack.devops',
    items: ['Linux', 'Bash', 'Docker', 'Docker Compose', 'Nginx', 'Git', 'GitHub Actions', 'Railway', 'Cloudflare Pages'],
  },
  { titleKey: 'stack.other', items: ['YOLOv11', 'Cisco Packet Tracer', 'LaTeX', 'UML', 'BPMN'] },
];
