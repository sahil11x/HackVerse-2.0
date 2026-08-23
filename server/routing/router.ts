import { GoogleGenAI, Type } from '@google/genai';
import { SourceType, ToolName, ResearchContext, Mission } from '../../src/types';
import { store } from '../store';

export type RecognizedDomain =
  | 'AI'
  | 'Semiconductors'
  | 'Quantum'
  | 'Robotics'
  | 'Cybersecurity'
  | 'Biotechnology'
  | 'Pharmaceuticals'
  | 'Energy'
  | 'Automotive'
  | 'Finance'
  | 'Business'
  | 'Startups'
  | 'Science'
  | 'Entertainment'
  | 'Movies'
  | 'Sports'
  | 'Education'
  | 'Consumer topics'
  | 'General/Custom';

export type RecognizedIntent =
  | 'General research'
  | 'Comparison'
  | 'Academic papers'
  | 'Competitive intelligence'
  | 'Company research'
  | 'Technology analysis'
  | 'News/current developments'
  | 'Public reaction/sentiment'
  | 'Patent research'
  | 'Code/implementation research'
  | 'Market/industry research';

export interface QueryRoutingResult {
  query: string;
  detectedDomain: string;
  detectedIntent: RecognizedIntent;
  confidence: number;
  missionTitle: string;
  suggestedCode: string;
  description: string;
  targetEntities: Array<{ name: string; ticker?: string; role: string; type?: string }>;
  keywords: string[];
  researchAreas: string[];
  preferredSources: SourceType[];
  selectedTools: ToolName[];
  toolQueries: {
    search_arxiv?: string;
    search_github?: string;
  };
  intentType: 'comparative' | 'academic_only' | 'opensource_only' | 'exploratory';
  rationale: string;
}

/**
 * Generate a clean, context-appropriate mission title without automatically appending "Intelligence".
 */
export function generateCleanMissionTitle(query: string, detectedDomain: string, detectedIntent: string): string {
  let clean = query.trim();

  // Strip leading action verbs
  clean = clean.replace(/^(please\s+)?(research|investigate|track|monitor|analyze|find|search\s+for|look\s+up|explore|examine|study)\s+/i, '');
  clean = clean.replace(/^(recent\s+research\s+papers\s+on|papers\s+on|academic\s+papers\s+about|articles\s+about)\s+/i, '');
  clean = clean.replace(/^(open-source\s+code\s+for|open-source\s+implementations\s+of|code\s+for|github\s+repos\s+for)\s+/i, '');

  // Strip trailing qualifiers
  clean = clean.replace(/\s*\((arxiv\s+only|papers\s+only|code\s+only|github\s+only|web\s+only)\)\s*$/i, '');
  clean = clean.replace(/\s*(on\s+github|on\s+arxiv|in\s+arxiv|in\s+github)\s*$/i, '');

  clean = clean.trim();
  if (!clean) {
    return `${detectedDomain} Research`;
  }

  // Capitalize words
  const words = clean.split(/\s+/).map((w) => {
    if (/^(vs|and|or|of|in|for|on|the|a|an)$/i.test(w)) return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  const baseTitle = words.join(' ');

  // Suffix selection based on intent
  if (detectedIntent === 'Comparison' && !/vs|versus|comparison/i.test(baseTitle)) {
    return `${baseTitle} Comparison`;
  }
  if (detectedIntent === 'Public reaction/sentiment' && !/reaction|sentiment|public/i.test(baseTitle)) {
    return `${baseTitle} Public Reaction Research`;
  }
  if (detectedIntent === 'Patent research' && !/patent/i.test(baseTitle)) {
    return `${baseTitle} Patent Landscape`;
  }
  if (detectedIntent === 'Code/implementation research' && !/implementation|code|libraries/i.test(baseTitle)) {
    return `${baseTitle} Code & Implementation`;
  }

  // General or topic-specific default suffix if not already present
  if (!/research|analysis|comparison|landscape|overview|benchmark|study|tracking/i.test(baseTitle)) {
    return `${baseTitle} Research`;
  }

  return baseTitle;
}

/**
 * Generate a concise uppercase mission code (e.g., "DHURANDHAR_01", "NVIDIA_AMD_01").
 */
export function generateMissionCode(title: string): string {
  const words = title
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => !['THE', 'AND', 'OR', 'FOR', 'OF', 'IN', 'ON', 'A', 'AN', 'RESEARCH', 'INTELLIGENCE'].includes(w));

  const prefix = words.slice(0, 2).join('_') || 'MISSION';
  const cleanPrefix = prefix.slice(0, 14);
  const num = Math.floor(10 + Math.random() * 89);
  return `${cleanPrefix}_${num}`;
}

/**
 * Fast deterministic domain and intent inference engine.
 * Covers all required domains and intents with intelligent fallback for custom/unknown topics.
 */
export function inferDomainAndIntentDeterministically(
  query: string,
  context?: ResearchContext | null
): {
  domain: string;
  intent: RecognizedIntent;
  preferredSources: SourceType[];
  selectedTools: ToolName[];
  intentType: 'comparative' | 'academic_only' | 'opensource_only' | 'exploratory';
  keywords: string[];
  entities: Array<{ name: string; role: string }>;
  rationale: string;
} {
  const q = query.toLowerCase();

  // Negative constraints check
  const hasNoArxiv = /\b(no|not|without|exclude|skip)\s+arxiv\b/i.test(q) || /\b(github|code|repos?)\s+only\b/i.test(q);
  const hasNoGithub = /\b(no|not|without|exclude|skip)\s+github\b/i.test(q) || /\b(arxiv|papers?|academic)\s+only\b/i.test(q);

  // 1. Intent Detection
  let intent: RecognizedIntent = 'General research';
  let intentType: 'comparative' | 'academic_only' | 'opensource_only' | 'exploratory' = 'exploratory';

  if (/\b(compare|comparison|vs\.?|versus|against|benchmark(ing)?|differences? between)\b/i.test(q)) {
    intent = 'Comparison';
    intentType = 'comparative';
  } else if (/\b(paper|papers|arxiv|academic|literature|journal|study|preprints?|peer-reviewed|theory|theoretical)\b/i.test(q)) {
    intent = 'Academic papers';
    intentType = 'academic_only';
  } else if (/\b(code|github|implementation|repo|repos|repository|repositories|library|libraries|open-source|kernel|benchmarks?)\b/i.test(q)) {
    intent = 'Code/implementation research';
    intentType = 'opensource_only';
  } else if (/\b(reaction|sentiment|public opinion|buzz|audience|reception|reviews?|social media|twitter|reddit)\b/i.test(q)) {
    intent = 'Public reaction/sentiment';
    intentType = 'exploratory';
  } else if (/\b(patent|patents|uspto|wipo|claims|intellectual property)\b/i.test(q)) {
    intent = 'Patent research';
    intentType = 'exploratory';
  } else if (/\b(competitor|competitors|competitive|market share|landscape|rivals?)\b/i.test(q)) {
    intent = 'Competitive intelligence';
    intentType = 'exploratory';
  } else if (/\b(company|firm|enterprise|financials|earnings|leadership|sec filing|10-k|10-q)\b/i.test(q)) {
    intent = 'Company research';
    intentType = 'exploratory';
  } else if (/\b(news|recent|latest|breaking|announcement|press release|updates?)\b/i.test(q)) {
    intent = 'News/current developments';
    intentType = 'exploratory';
  } else if (/\b(architecture|specs|specifications|hardware|microarchitecture|silicon|technology analysis)\b/i.test(q)) {
    intent = 'Technology analysis';
    intentType = 'exploratory';
  } else if (/\b(market|industry|forecast|cagr|tam|valuation|growth)\b/i.test(q)) {
    intent = 'Market/industry research';
    intentType = 'exploratory';
  }

  // 2. Domain Detection
  let domain = 'General/Custom';

  if (/\b(semiconductor|chip|chips|gpu|tpu|npu|hbm|wafer|fab|foundry|tsmc|nvidia|amd|intel|qualcomm|arm|asic|interconnect|transistor|node)\b/i.test(q)) {
    domain = 'Semiconductors';
  } else if (/\b(quantum|qubit|superconducting|neutral atom|ion trap|qpu|error correction|quantum computing)\b/i.test(q)) {
    domain = 'Quantum';
  } else if (/\b(robot|robotics|humanoid|actuator|bipedal|manipulator|end-effector|drone|autonomy|figure ai|boston dynamics|optimus)\b/i.test(q)) {
    domain = 'Robotics';
  } else if (/\b(cybersecurity|vulnerability|zero-day|cve|malware|ransomware|exploit|threat|infosec|security|firewall|pentest)\b/i.test(q)) {
    domain = 'Cybersecurity';
  } else if (/\b(crispr|gene|genomics|mrna|biotech|biotechnology|protein|dna|rna|synthetic biology)\b/i.test(q)) {
    domain = 'Biotechnology';
  } else if (/\b(pharma|pharmaceutical|drug|clinical trial|therapeutic|vaccine|fda|oncology|small molecule)\b/i.test(q)) {
    domain = 'Pharmaceuticals';
  } else if (/\b(battery|solid-state|solar|renewable|nuclear|fusion|grid|energy storage|clean energy|photovoltaic)\b/i.test(q)) {
    domain = 'Energy';
  } else if (/\b(automotive|ev|electric vehicle|autonomous driving|tesla|waymo|car|vehicle|powertrain|adas)\b/i.test(q)) {
    domain = 'Automotive';
  } else if (/\b(finance|banking|fintech|stock|stocks|trading|hedge fund|crypto|defi|options|yield|sec)\b/i.test(q)) {
    domain = 'Finance';
  } else if (/\b(startup|startups|venture capital|vc|seed round|series a|founder|valuation|saas)\b/i.test(q)) {
    domain = 'Startups';
  } else if (/\b(movie|movies|film|films|cinema|dhurandhar|netflix|disney|box office|actor|director|hollywood|bollywood|streaming)\b/i.test(q)) {
    domain = 'Movies';
  } else if (/\b(entertainment|music|gaming|game|games|esports|media|content creator|streaming platform)\b/i.test(q)) {
    domain = 'Entertainment';
  } else if (/\b(sports|football|basketball|soccer|nfl|nba|athlete|championship|olympics|fifa)\b/i.test(q)) {
    domain = 'Sports';
  } else if (/\b(education|edtech|curriculum|pedagogy|university|school|learning|k-12|higher ed)\b/i.test(q)) {
    domain = 'Education';
  } else if (/\b(food|cake|recipe|preservation|preservative|cooking|baking|culinary|shelf life|consumer|cosmetics|apparel)\b/i.test(q)) {
    domain = 'Consumer topics';
  } else if (/\b(physics|chemistry|astronomy|astrophysics|materials science|geology|mathematics)\b/i.test(q)) {
    domain = 'Science';
  } else if (/\b(ai|artificial intelligence|machine learning|deep learning|transformer|llm|neural network|diffusion|vllm|inference|prompt)\b/i.test(q)) {
    domain = 'AI';
  } else if (/\b(business|enterprise|commerce|retail|supply chain|logistics|strategy|b2b)\b/i.test(q)) {
    domain = 'Business';
  }

  // 3. Dynamic Source & Tool Selection
  let preferredSources: SourceType[] = ['arxiv', 'github', 'news', 'web'];
  let selectedTools: ToolName[] = ['search_arxiv', 'search_github'];

  if (intent === 'Academic papers' || hasNoGithub) {
    preferredSources = ['arxiv', 'web'];
    selectedTools = ['search_arxiv'];
    intentType = 'academic_only';
  } else if (intent === 'Code/implementation research' || hasNoArxiv) {
    preferredSources = ['github', 'web'];
    selectedTools = ['search_github'];
    intentType = 'opensource_only';
  } else if (intent === 'Comparison') {
    preferredSources = ['arxiv', 'github', 'news', 'web'];
    selectedTools = ['search_arxiv', 'search_github'];
    intentType = 'comparative';
  } else if (domain === 'Movies' || domain === 'Entertainment' || intent === 'Public reaction/sentiment') {
    preferredSources = ['news', 'social_media', 'web'];
    // For media/sentiment, open-source or academic are queried only if technical keywords exist, else broad
    selectedTools = ['search_github', 'search_arxiv'];
    intentType = 'exploratory';
  } else if (intent === 'Patent research') {
    preferredSources = ['patent', 'web'];
    selectedTools = ['search_arxiv'];
    intentType = 'exploratory';
  } else if (intent === 'Competitive intelligence' || intent === 'Company research') {
    preferredSources = ['news', 'sec_filing', 'web'];
    selectedTools = ['search_arxiv', 'search_github'];
    intentType = 'exploratory';
  }

  // Apply explicit negative overrides
  if (hasNoGithub) {
    selectedTools = selectedTools.filter((t) => t !== 'search_github');
  }
  if (hasNoArxiv) {
    selectedTools = selectedTools.filter((t) => t !== 'search_arxiv');
  }
  if (selectedTools.length === 0) {
    selectedTools = hasNoArxiv ? ['search_github'] : ['search_arxiv'];
  }

  // Extract entities & keywords
  const cleanTokens = query
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^(the|and|for|with|from|this|that|these|research|find|about|recent|latest)$/i.test(w));

  const entities: Array<{ name: string; role: string }> = [];
  const knownProperWords = cleanTokens.filter((w) => /^[A-Z]/.test(w) || /nvidia|amd|intel|google|apple|tesla|dhurandhar|disney|netflix/i.test(w));
  if (knownProperWords.length > 0) {
    entities.push({
      name: knownProperWords.slice(0, 2).join(' '),
      role: 'Primary Target Entity'
    });
  }

  const rationale = `Inferred domain: [${domain}] and intent: [${intent}]. Selected ${selectedTools.length} tool(s) (${selectedTools.join(', ')}) targeting ${preferredSources.join(', ')}.`;

  return {
    domain,
    intent,
    preferredSources,
    selectedTools,
    intentType,
    keywords: cleanTokens.slice(0, 6),
    entities,
    rationale
  };
}

/**
 * Intelligent Routing Layer Entry Point:
 * Detects domain, intent, dynamically selects sources/tools, and generates clean mission metadata.
 */
export async function routeResearchQuery(
  rawQuery: string,
  context?: ResearchContext | null,
  existingMission?: Partial<Mission> | null
): Promise<QueryRoutingResult> {
  const query = rawQuery?.trim() || 'General Research';
  const apiKey = process.env.GEMINI_API_KEY;

  // Run deterministic baseline first
  const base = inferDomainAndIntentDeterministically(query, context);
  const cleanTitle = generateCleanMissionTitle(query, base.domain, base.intent);
  const suggestedCode = generateMissionCode(cleanTitle);

  // If no Gemini API key, return deterministic result immediately
  if (!apiKey) {
    return {
      query,
      detectedDomain: base.domain,
      detectedIntent: base.intent,
      confidence: 0.92,
      missionTitle: cleanTitle,
      suggestedCode,
      description: `Autonomous investigation targeting ${base.domain} (${base.intent}) across ${base.preferredSources.join(', ')}.`,
      targetEntities: base.entities.length > 0 ? base.entities : [{ name: cleanTitle.split(' ')[0] || 'Target', role: 'Focus Entity' }],
      keywords: base.keywords,
      researchAreas: [base.domain, base.intent, cleanTitle],
      preferredSources: base.preferredSources,
      selectedTools: base.selectedTools,
      toolQueries: {
        search_arxiv: base.selectedTools.includes('search_arxiv') ? query.replace(/\b(arxiv only|papers only)\b/gi, '').trim() : undefined,
        search_github: base.selectedTools.includes('search_github') ? query.replace(/\b(github only|code only)\b/gi, '').trim() : undefined
      },
      intentType: base.intentType,
      rationale: base.rationale
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the INTELLIGENT ROUTING LAYER for HackVerse Intel, an autonomous research platform.
Analyze the user's research query and classify it into an open-ended DOMAIN, INTENT, and select optimal sources/tools.

Query: "${query}"
Context Summary: ${context?.conversationSteps?.length ? `${context.conversationSteps.length} historical research steps available.` : 'Fresh research task.'}

DOMAIN INFERENCE RULES:
- Infer the domain naturally. Examples: AI, Semiconductors, Quantum, Robotics, Cybersecurity, Biotechnology, Pharmaceuticals, Energy, Automotive, Finance, Business, Startups, Science, Entertainment, Movies, Sports, Education, Consumer topics.
- If the topic is outside these or custom (e.g., "cake preservation techniques", "urban gardening", etc.), label it appropriately or use "General/Custom". Do NOT force hardware or semiconductor labels onto non-hardware topics.

INTENT INFERENCE RULES:
- Classify into one of: "General research", "Comparison", "Academic papers", "Competitive intelligence", "Company research", "Technology analysis", "News/current developments", "Public reaction/sentiment", "Patent research", "Code/implementation research", "Market/industry research".

SOURCE & TOOL SELECTION RULES:
- "search_arxiv": select if query is academic, scientific, theoretical, or research papers.
- "search_github": select if query seeks code, repositories, libraries, software implementations, or benchmarks.
- STRICT: If user says "no github" or "papers only", DO NOT select "search_github".
- STRICT: If user says "no arxiv" or "code only", DO NOT select "search_arxiv".
- If comparative or general, select both or appropriate tools.

MISSION TITLE RULES:
- Generate a clean, descriptive title (e.g. "Dhurandhar Research", "Netflix vs Disney Comparison", "Cake Preservation Techniques Research", "NVIDIA AI Chips Research").
- DO NOT automatically append "Intelligence" to every title.

Respond strictly with a valid JSON object matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedDomain: { type: Type.STRING },
            detectedIntent: {
              type: Type.STRING,
              enum: [
                'General research',
                'Comparison',
                'Academic papers',
                'Competitive intelligence',
                'Company research',
                'Technology analysis',
                'News/current developments',
                'Public reaction/sentiment',
                'Patent research',
                'Code/implementation research',
                'Market/industry research'
              ]
            },
            cleanTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            selectedTools: {
              type: Type.ARRAY,
              items: { type: Type.STRING, enum: ['search_arxiv', 'search_github'] }
            },
            arxivQuery: { type: Type.STRING },
            githubQuery: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            researchAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            targetEntities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING }
                },
                required: ['name', 'role']
              }
            },
            rationale: { type: Type.STRING }
          },
          required: [
            'detectedDomain',
            'detectedIntent',
            'cleanTitle',
            'selectedTools',
            'rationale'
          ]
        }
      }
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    const domain = parsed.detectedDomain || base.domain;
    const intent = (parsed.detectedIntent as RecognizedIntent) || base.intent;
    const title = parsed.cleanTitle ? parsed.cleanTitle.trim() : cleanTitle;
    let selectedTools: ToolName[] = Array.isArray(parsed.selectedTools) && parsed.selectedTools.length > 0
      ? parsed.selectedTools
      : base.selectedTools;

    // Apply negative constraint safety
    const qLower = query.toLowerCase();
    if (/\b(no|not|without|exclude|skip)\s+github\b/i.test(qLower) || /\b(arxiv|papers?)\s+only\b/i.test(qLower)) {
      selectedTools = selectedTools.filter((t) => t !== 'search_github');
    }
    if (/\b(no|not|without|exclude|skip)\s+arxiv\b/i.test(qLower) || /\b(github|code)\s+only\b/i.test(qLower)) {
      selectedTools = selectedTools.filter((t) => t !== 'search_arxiv');
    }
    if (selectedTools.length === 0) {
      selectedTools = base.selectedTools;
    }

    let intentType: 'comparative' | 'academic_only' | 'opensource_only' | 'exploratory' = 'exploratory';
    if (selectedTools.includes('search_arxiv') && selectedTools.includes('search_github')) {
      intentType = intent === 'Comparison' ? 'comparative' : 'exploratory';
    } else if (selectedTools.includes('search_arxiv') && !selectedTools.includes('search_github')) {
      intentType = 'academic_only';
    } else if (selectedTools.includes('search_github') && !selectedTools.includes('search_arxiv')) {
      intentType = 'opensource_only';
    }

    const preferredSources: SourceType[] = [];
    if (selectedTools.includes('search_arxiv')) preferredSources.push('arxiv');
    if (selectedTools.includes('search_github')) preferredSources.push('github');
    if (domain === 'Movies' || domain === 'Entertainment' || intent === 'Public reaction/sentiment') {
      preferredSources.push('news', 'social_media', 'web');
    } else {
      preferredSources.push('news', 'web');
    }

    return {
      query,
      detectedDomain: domain,
      detectedIntent: intent,
      confidence: 0.96,
      missionTitle: title,
      suggestedCode: generateMissionCode(title),
      description: parsed.description || `Autonomous investigation targeting ${domain} (${intent}).`,
      targetEntities: Array.isArray(parsed.targetEntities) && parsed.targetEntities.length > 0
        ? parsed.targetEntities
        : base.entities.length > 0 ? base.entities : [{ name: title.split(' ')[0] || 'Target', role: 'Focus Entity' }],
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords : base.keywords,
      researchAreas: Array.isArray(parsed.researchAreas) && parsed.researchAreas.length > 0
        ? parsed.researchAreas
        : [domain, intent, title],
      preferredSources: Array.from(new Set(preferredSources)),
      selectedTools,
      toolQueries: {
        search_arxiv: parsed.arxivQuery || (selectedTools.includes('search_arxiv') ? query : undefined),
        search_github: parsed.githubQuery || (selectedTools.includes('search_github') ? query : undefined)
      },
      intentType,
      rationale: parsed.rationale || base.rationale
    };
  } catch (err: any) {
    store.addLog(
      'WARNING',
      `[INTENT ROUTER] Fallback to deterministic routing (${err.message || 'LLM parsing error'}).`,
      'IntelligentRouter'
    );
    return {
      query,
      detectedDomain: base.domain,
      detectedIntent: base.intent,
      confidence: 0.92,
      missionTitle: cleanTitle,
      suggestedCode,
      description: `Autonomous investigation targeting ${base.domain} (${base.intent}).`,
      targetEntities: base.entities.length > 0 ? base.entities : [{ name: cleanTitle.split(' ')[0] || 'Target', role: 'Focus Entity' }],
      keywords: base.keywords,
      researchAreas: [base.domain, base.intent, cleanTitle],
      preferredSources: base.preferredSources,
      selectedTools: base.selectedTools,
      toolQueries: {
        search_arxiv: base.selectedTools.includes('search_arxiv') ? query : undefined,
        search_github: base.selectedTools.includes('search_github') ? query : undefined
      },
      intentType: base.intentType,
      rationale: base.rationale
    };
  }
}
