/** Estadísticas de repos públicos de GitHub obtenidas en build. Falla en silencio (devuelve null). */
export interface RepoStats {
  owner: string;
  repo: string;
  url: string;
  stars: number;
  forks: number;
  pushedAt: string;
  /** Top lenguajes con porcentaje (suma ~100). */
  languages: { name: string; percent: number }[];
}

const cache = new Map<string, Promise<RepoStats | null>>();

export function parseRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
  const m = /github\.com[/:]([^/\s]+)\/([^/\s#?]+?)(?:\.git)?\/?$/i.exec(repoUrl.trim());
  return m ? { owner: m[1]!, repo: m[2]! } : null;
}

async function getJson(url: string): Promise<any> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'portfolio-build',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function load(repoUrl: string): Promise<RepoStats | null> {
  try {
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) return null;
    const { owner, repo } = parsed;
    const base = `https://api.github.com/repos/${owner}/${repo}`;
    const [info, langs] = await Promise.all([getJson(base), getJson(`${base}/languages`).catch(() => ({}))]);
    const entries = Object.entries(langs as Record<string, number>).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((n, [, v]) => n + v, 0);
    const languages = total
      ? entries.slice(0, 5).map(([name, v]) => ({ name, percent: Math.round((v / total) * 1000) / 10 }))
      : [];
    return {
      owner,
      repo,
      url: info.html_url ?? `https://github.com/${owner}/${repo}`,
      stars: Number(info.stargazers_count) || 0,
      forks: Number(info.forks_count) || 0,
      pushedAt: String(info.pushed_at ?? ''),
      languages,
    };
  } catch (e) {
    console.warn(`[github] stats unavailable for ${repoUrl}: ${(e as Error).message}`);
    return null;
  }
}

/** Devuelve stats del repo o null si no hay red / rate limit / repo privado. Cacheado por build. */
export function getRepoStats(repoUrl: string | undefined | null): Promise<RepoStats | null> {
  if (!repoUrl) return Promise.resolve(null);
  let p = cache.get(repoUrl);
  if (!p) {
    p = load(repoUrl);
    cache.set(repoUrl, p);
  }
  return p;
}

/** Colores aproximados de GitHub para lenguajes comunes. */
export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Java: '#b07219',
  Kotlin: '#a97bff',
  Go: '#00add8',
  Rust: '#dea584',
  PHP: '#4f5d95',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Shell: '#89e051',
  PLpgSQL: '#336790',
  Dockerfile: '#384d54',
  Vue: '#41b883',
};
