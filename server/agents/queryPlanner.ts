import { GoogleGenAI, Type } from '@google/genai';

export interface PlannedQueryPlan {
  missionName: string;
  code: string;
  targetEntities: Array<{ name: string; ticker?: string; role: string }>;
  searchVectors: string[];
  focusAreas: string[];
  queries: {
    arxiv: string[];
    patents: string[];
    news: string[];
    industry: string[];
  };
}

export interface MissionContextInput {
  name?: string;
  topic?: string;
  description?: string;
  companies?: string[];
  competitors?: string[];
  keywords?: string[];
  researchInterests?: string[];
  preferredSources?: string[];
  objective?: string;
}

export async function expandObjectiveIntoQueries(
  input: string | MissionContextInput
): Promise<PlannedQueryPlan> {
  const apiKey = process.env.GEMINI_API_KEY;

  const missionName = typeof input === 'string' ? '' : input.name || '';
  const topic = typeof input === 'string' ? input : input.topic || input.objective || '';
  const description = typeof input === 'string' ? input : input.description || input.objective || '';
  const companies = typeof input === 'string' ? [] : input.companies || [];
  const competitors = typeof input === 'string' ? [] : input.competitors || [];
  const keywords = typeof input === 'string' ? [] : input.keywords || [];
  const researchInterests = typeof input === 'string' ? [] : input.researchInterests || [];
  const preferredSources = typeof input === 'string' ? [] : input.preferredSources || [];

  const combinedObjective = `${missionName ? `Mission: ${missionName}. ` : ''}Topic: ${topic}. ${description ? `Description: ${description}. ` : ''}${companies.length ? `Companies: ${companies.join(', ')}. ` : ''}${competitors.length ? `Competitors: ${competitors.join(', ')}. ` : ''}${keywords.length ? `Keywords: ${keywords.join(', ')}. ` : ''}${researchInterests.length ? `Interests: ${researchInterests.join(', ')}.` : ''}`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `You are the Principal AI Architect of Hackverse Autonomous Competitive Intelligence Tracker.
Analyze this Tracking Mission configuration:
- Mission Name: ${missionName || 'Auto'}
- Main Topic: ${topic}
- Description: ${description}
- Target Companies: ${companies.join(', ') || 'N/A'}
- Direct Competitors: ${competitors.join(', ') || 'N/A'}
- Core Keywords: ${keywords.join(', ') || 'N/A'}
- Research Interests: ${researchInterests.join(', ') || 'N/A'}
- Preferred Sources: ${preferredSources.join(', ') || 'arxiv, patent, news, sec_filing, github, web'}

Generate a structured query expansion plan for multi-source intelligence gathering across academic papers (ArXiv), patent databases (USPTO/WIPO), trade news (Reuters/Bloomberg/SemiAnalysis), and GitHub/industry benchmarks. Ensure target entities include both the companies and competitors with specific market roles.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              missionName: { type: Type.STRING, description: 'Clean title for the mission' },
              code: { type: Type.STRING, description: 'Uppercase short identifier like AI_SEMICON_01' },
              targetEntities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ticker: { type: Type.STRING },
                    role: { type: Type.STRING }
                  },
                  required: ['name', 'role']
                }
              },
              searchVectors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              focusAreas: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              queries: {
                type: Type.OBJECT,
                properties: {
                  arxiv: { type: Type.ARRAY, items: { type: Type.STRING } },
                  patents: { type: Type.ARRAY, items: { type: Type.STRING } },
                  news: { type: Type.ARRAY, items: { type: Type.STRING } },
                  industry: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['arxiv', 'patents', 'news', 'industry']
              }
            },
            required: ['missionName', 'code', 'targetEntities', 'searchVectors', 'focusAreas', 'queries']
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini query expansion timeout')), 5000)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return {
          ...parsed,
          missionName: missionName || parsed.missionName
        } as PlannedQueryPlan;
      }
    } catch (err) {
      console.warn('Gemini query expansion fallback triggered:', err);
    }
  }

  // Robust structured fallback using provided mission parameters
  const codePrefix = (missionName || topic || 'INTEL')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .slice(0, 12);
  const code = `${codePrefix}_${Math.floor(Math.random() * 90 + 10)}`;

  const entities: Array<{ name: string; ticker?: string; role: string }> = [];
  companies.forEach((c) => entities.push({ name: c, role: 'Primary Monitored Company' }));
  competitors.forEach((c) => entities.push({ name: c, role: 'Direct Market Competitor' }));

  if (entities.length === 0) {
    const words = (topic + ' ' + description).split(' ').filter((w) => w.length > 3 && !/^(the|and|for|with|about|research|find|track|recent|latest)$/i.test(w)).slice(0, 3);
    entities.push(
      { name: words[0] || topic || 'Core Subject', role: 'Primary Research Focus' },
      { name: words[1] || 'Comparative Entity', role: 'Context / Benchmark Entity' }
    );
  }

  const vectors = preferredSources.length > 0
    ? preferredSources.map((s) => s.toUpperCase())
    : ['ArXiv Preprints', 'GitHub Repositories', 'Technical Disclosures', 'Global News', 'Industry Reports'];

  const focal = researchInterests.length > 0
    ? researchInterests
    : keywords.length > 0
    ? keywords.map((k) => `${k} Advancements`)
    : [`${topic || 'Core Subject'} Breakthroughs`, `${topic || 'Core Subject'} Benchmarks & Metrics`, `${topic || 'Core Subject'} Industry Trends`];

  const kwQuery = keywords.slice(0, 3).join(' ') || topic;
  const companyQuery = companies[0] || entities[0]?.name || topic;

  return {
    missionName: missionName || topic || 'Custom Intelligence Tracker',
    code,
    targetEntities: entities,
    searchVectors: vectors,
    focusAreas: focal,
    queries: {
      arxiv: [
        `${kwQuery}`,
        `"${topic}"`
      ],
      patents: [
        `"${companyQuery}" AND (${kwQuery})`,
        `"${topic}"`
      ],
      news: [
        `${companyQuery} ${keywords[0] || topic}`,
        `${topic} developments and benchmarks`
      ],
      industry: [
        `${topic} roadmap`,
        `${companyQuery} strategic positioning`
      ]
    }
  };
}
