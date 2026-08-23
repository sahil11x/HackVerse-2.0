import { GoogleGenAI, Type } from '@google/genai';
import { SourceType } from '../../src/types';

export interface StructuredResearchObjective {
  name: string;
  topic: string;
  description: string;
  companies: string[];
  competitors: string[];
  keywords: string[];
  researchInterests: string[];
  researchAreas: string[];
  preferredSources: SourceType[];
  trackingObjective: string;
  responseSummary: string;
  usedGemini: boolean;
}

export async function parseResearchPromptWithGemini(
  prompt: string
): Promise<StructuredResearchObjective> {
  const apiKey = process.env.GEMINI_API_KEY;

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
        contents: `You are the AI Research Assistant of HACKVERSE Autonomous Competitive Intelligence Tracker.
The user provides a natural-language research task:
"${prompt}"

Extract and structure this into an operational research mission specification following these STRICT rules:
CRITICAL RULE ON ENTITIES & COMPETITORS:
- NEVER invent entities, competitors, or companies simply to populate fields!
- If the user prompt does NOT mention or imply specific companies/entities, leave companies and competitors as empty arrays [].
- If the user provides a generic or brief query like "cake", "solar energy", or "quantum", extract only what was requested or closely implied, do NOT hallucinate fictional companies or placeholder names like "Primary Industry Leader".

DYNAMIC SOURCE SELECTION:
- If the user focuses on research papers/academic breakthroughs, select ["arxiv", "web"]
- If the user focuses on competitor/industry/company tracking, select ["news", "web"]
- If the user mentions patents, include "patent"
- If the user mentions code/benchmarks, include "github"
- If the user mentions social media, discussions, public buzz, or sentiment, include "social_media"
- If the user asks for multi-source/broad research, select the relevant subset of ["arxiv", "patent", "news", "sec_filing", "social_media", "github", "web"]

Format response fields:
1. topic: The main technological topic or concept
2. name: A concise, professional title for the mission
3. description: A clear 1-2 sentence description of what will be researched
4. companies: Array of explicitly mentioned or primary entities (empty if none)
5. competitors: Array of key direct competitors mentioned or directly relevant (empty if none)
6. keywords: Core technical keywords to track
7. researchInterests: Specific technical or market angles of interest
8. researchAreas: Human-readable research areas (e.g. ["Research papers", "Patents", "Industry news", "Competitor developments", "Social media", "General research"])
9. preferredSources: Array chosen from ["arxiv", "patent", "news", "sec_filing", "social_media", "github", "web"]
10. trackingObjective: A concise operational objective (e.g. "Monitor new developments and identify important changes.")
11. responseSummary: A conversational confirmation message following this clean format:
"I understand your research objective.

Topic:
{topic}

Entities:
{companies or 'None identified'}

Competitors:
{competitors or 'None identified'}

Research areas:
{researchAreas}

Tracking objective:
{trackingObjective}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              topic: { type: Type.STRING },
              description: { type: Type.STRING },
              companies: { type: Type.ARRAY, items: { type: Type.STRING } },
              competitors: { type: Type.ARRAY, items: { type: Type.STRING } },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              researchInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
              researchAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
              preferredSources: { type: Type.ARRAY, items: { type: Type.STRING } },
              trackingObjective: { type: Type.STRING },
              responseSummary: { type: Type.STRING }
            },
            required: [
              'name',
              'topic',
              'description',
              'companies',
              'keywords',
              'researchAreas',
              'trackingObjective',
              'responseSummary'
            ]
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini request timeout')), 5000)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        const validSources: SourceType[] = ['arxiv', 'patent', 'news', 'sec_filing', 'social_media', 'github', 'web'];
        const sanitizedSources = Array.isArray(parsed.preferredSources)
          ? parsed.preferredSources.filter((s: string) => validSources.includes(s as SourceType))
          : (['arxiv', 'patent', 'news', 'sec_filing', 'social_media', 'github'] as SourceType[]);

        const companiesList = Array.isArray(parsed.companies) ? parsed.companies : [];
        const competitorsList = Array.isArray(parsed.competitors) ? parsed.competitors : [];

        return {
          name: parsed.name || 'AI Research Mission',
          topic: parsed.topic || prompt,
          description: parsed.description || prompt,
          companies: companiesList,
          competitors: competitorsList,
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          researchInterests: Array.isArray(parsed.researchInterests) ? parsed.researchInterests : [],
          researchAreas: Array.isArray(parsed.researchAreas) && parsed.researchAreas.length > 0
            ? parsed.researchAreas
            : ['General research'],
          preferredSources: sanitizedSources.length > 0 ? (sanitizedSources as SourceType[]) : ['arxiv', 'news'],
          trackingObjective: parsed.trackingObjective || `Monitor new developments and identify important changes.`,
          responseSummary: parsed.responseSummary || `I understand your research objective.\n\nTopic:\n${parsed.topic || prompt}\n\nEntities:\n${companiesList.length > 0 ? companiesList.join(', ') : 'None identified'}\n\nCompetitors:\n${competitorsList.length > 0 ? competitorsList.join(', ') : 'None identified'}\n\nResearch areas:\n${(parsed.researchAreas || ['General research']).join(', ')}\n\nTracking objective:\n${parsed.trackingObjective || 'Monitor new developments and identify important changes.'}`,
          usedGemini: true
        };
      }
    } catch (err) {
      console.warn('Gemini chat parser fallback triggered:', err);
    }
  }

  // Deterministic NLP / Pattern Fallback (No hallucinated fake companies)
  const lower = prompt.toLowerCase();
  
  // Extract companies explicitly mentioned
  const detectedCompanies: string[] = [];
  if (lower.includes('nvidia')) detectedCompanies.push('NVIDIA');
  if (lower.includes('amd')) detectedCompanies.push('AMD');
  if (lower.includes('google')) detectedCompanies.push('Google');
  if (lower.includes('intel')) detectedCompanies.push('Intel');
  if (lower.includes('apple')) detectedCompanies.push('Apple');
  if (lower.includes('microsoft')) detectedCompanies.push('Microsoft');
  if (lower.includes('amazon') || lower.includes('aws')) detectedCompanies.push('AWS');
  if (lower.includes('tesla')) detectedCompanies.push('Tesla');
  if (lower.includes('tsmc')) detectedCompanies.push('TSMC');
  if (lower.includes('qualcomm')) detectedCompanies.push('Qualcomm');
  if (lower.includes('ibm')) detectedCompanies.push('IBM');
  if (lower.includes('figure')) detectedCompanies.push('Figure AI');
  if (lower.includes('boston dynamics')) detectedCompanies.push('Boston Dynamics');
  if (lower.includes('quera')) detectedCompanies.push('QuEra');
  if (lower.includes('ionq')) detectedCompanies.push('IonQ');
  if (lower.includes('quantinuum')) detectedCompanies.push('Quantinuum');

  // Topic determination & clean extraction
  let topic = '';
  let name = '';
  let keywords: string[] = [];
  let competitors: string[] = [];
  let researchInterests: string[] = [];
  let preferredSources: SourceType[] = ['arxiv', 'news'];

  if (lower.includes('quantum')) {
    topic = 'Quantum computing architectures';
    name = 'Quantum Hardware Breakthroughs';
    keywords = ['Superconducting qubit', 'Surface codes', 'Cryo-CMOS'];
    if (detectedCompanies.length > 0) {
      competitors = ['QuEra', 'IonQ', 'Quantinuum'].filter(c => !detectedCompanies.includes(c));
    }
    researchInterests = ['Logical qubit fidelity', 'Quantum error correction'];
    preferredSources = ['arxiv', 'patent', 'news'];
  } else if (lower.includes('robot') || lower.includes('humanoid')) {
    topic = 'Humanoid robotics & embodied actuation';
    name = 'Humanoid Robotics Intelligence';
    keywords = ['Harmonic drive', 'Actuator', 'VLA model', 'Tactile sensing'];
    if (detectedCompanies.length > 0) {
      competitors = ['Unitree', 'Agility Robotics', 'Sanctuary AI'].filter(c => !detectedCompanies.includes(c));
    }
    researchInterests = ['Torque density', 'Sim-to-real transfer'];
    preferredSources = ['arxiv', 'news', 'github'];
  } else if (lower.includes('battery') || lower.includes('solid-state')) {
    topic = 'Solid-state battery chemistry';
    name = 'Battery Chemistry Innovations';
    keywords = ['Solid electrolyte', 'Silicon anode', 'Cathode loading'];
    if (detectedCompanies.length > 0) {
      competitors = ['QuantumScape', 'CATL', 'Toyota'].filter(c => !detectedCompanies.includes(c));
    }
    researchInterests = ['Dendrite suppression', 'Energy density'];
    preferredSources = ['arxiv', 'patent', 'news'];
  } else if (lower.includes('semiconductor') || lower.includes('gpu') || lower.includes('chip') || lower.includes('accelerator')) {
    topic = 'AI semiconductor technology';
    name = 'AI Semiconductor Intelligence';
    keywords = ['GPU', 'AI accelerator', 'inference', 'HBM', 'chiplets'];
    if (detectedCompanies.length > 0) {
      competitors = ['Intel', 'Tenstorrent', 'Cerebras', 'Groq'].filter(c => !detectedCompanies.includes(c));
    }
    researchInterests = ['Packaging yields', 'Inference acceleration', 'Interconnect bandwidth'];
    preferredSources = ['arxiv', 'patent', 'news', 'sec_filing', 'github'];
  } else {
    // Arbitrary query clean-up (e.g. "cake", "autonomous drones", etc.)
    const cleaned = prompt.replace(/research|track|monitor|the latest developments in|and track|please|what are|find|show me/gi, '').trim();
    topic = cleaned.length > 1 ? cleaned : prompt;
    name = `${topic.charAt(0).toUpperCase() + topic.slice(1, 24).trim()} Research`;
    keywords = topic.split(/\s+/).filter(w => w.length > 2);
    preferredSources = ['arxiv', 'news'];
  }

  // Dynamic source selection based on intent
  if (lower.includes('paper') || lower.includes('academic') || lower.includes('arxiv')) {
    preferredSources = ['arxiv', 'web'];
  } else if (lower.includes('news') || lower.includes('competitor') || lower.includes('activity')) {
    preferredSources = ['news', 'web'];
  }

  const researchAreas = [
    'Research papers',
    'Patents',
    'Industry news',
    'Competitor developments'
  ];

  const trackingObjective = 'Monitor new developments and identify important changes.';

  const responseSummary = `I understand your research objective.

Topic:
${topic}

Entities:
${detectedCompanies.length > 0 ? detectedCompanies.join(', ') : 'None identified'}

Competitors:
${competitors.length > 0 ? competitors.join(', ') : 'None identified'}

Research areas:
${researchAreas.join(', ')}

Tracking objective:
${trackingObjective}`;

  return {
    name,
    topic,
    description: `Track latest developments and intelligence for ${topic}.`,
    companies: detectedCompanies,
    competitors,
    keywords,
    researchInterests,
    researchAreas: detectedCompanies.length > 0 ? researchAreas : ['General research'],
    preferredSources,
    trackingObjective,
    responseSummary,
    usedGemini: false
  };
}
