import { GoogleGenAI, Type } from '@google/genai';
import { DynamicToolPlan, ToolName } from '../tools/types';

export interface ToolPlanningContext {
  topic?: string;
  objective?: string;
  description?: string;
  keywords?: string[];
  companies?: string[];
  competitors?: string[];
  researchInterests?: string[];
  preferredSources?: string[];
}

/**
 * Helper to strip conversational stop words and build clean search queries for API endpoints
 */
export function sanitizeSearchQuery(raw: string, target: 'arxiv' | 'github'): string {
  if (!raw) return '';
  // Remove conversational prompt fluff
  let cleaned = raw
    .replace(/\b(find|search|research|look up|get|fetch|compare|comparing|recent|latest|new|papers|paper|academic|studies|scholarly|preprints|arxiv|github|repositories|repository|repos|repo|projects|project|open-source|opensource|implementations|implementation|code|software|vs|versus|and|with|for|about|in|on|the|a|an|by)\b/gi, ' ')
    .replace(/[^\w\s\-+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If cleaning made it too short, fallback to original non-punct text
  if (cleaned.length < 3) {
    cleaned = raw.replace(/[^\w\s\-+]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Cap token count
  const tokens = cleaned.split(/\s+/).slice(0, 6);
  return tokens.join(' ');
}

/**
 * Dynamic Tool Planner using Gemini
 * Analyzes the user's natural-language research intent and dynamically determines
 * whether to call search_arxiv, search_github, both, or neither.
 */
export async function planDynamicTools(
  queryOrPrompt: string,
  context?: ToolPlanningContext
): Promise<DynamicToolPlan> {
  const apiKey = process.env.GEMINI_API_KEY;

  const topic = context?.topic || '';
  const objective = context?.objective || '';
  const description = context?.description || '';
  const keywords = context?.keywords || [];
  const companies = context?.companies || [];
  const competitors = context?.competitors || [];
  const researchInterests = context?.researchInterests || [];
  const preferredSources = context?.preferredSources || [];

  // Construct comprehensive user intent text
  const intentFragments = [
    queryOrPrompt ? `Primary Query: ${queryOrPrompt}` : '',
    objective ? `Objective: ${objective}` : '',
    topic ? `Topic: ${topic}` : '',
    description ? `Description: ${description}` : '',
    keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : '',
    companies.length > 0 ? `Target Companies: ${companies.join(', ')}` : '',
    researchInterests.length > 0 ? `Interests: ${researchInterests.join(', ')}` : '',
    preferredSources.length > 0 ? `Preferred Sources: ${preferredSources.join(', ')}` : ''
  ].filter(Boolean);

  const fullIntentText = intentFragments.join('\n');

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

      const prompt = `You are the Dynamic Tool Selection Agent for HackVerse Autonomous Competitive Intelligence Tracker.
You have access to TWO real external search tools:
1. "search_arxiv": Searches academic research papers, preprints, scholarly literature, algorithms, and theoretical publications on arXiv.
2. "search_github": Searches open-source code repositories, frameworks, libraries, benchmarks, and software implementations on GitHub.

YOUR PRIMARY TASK:
Carefully evaluate the user's research intent and dynamically select ONLY the tool(s) relevant to their request.

INTENT CLASSIFICATION RULES:
1. ACADEMIC / PAPERS / THEORY ONLY:
   - When the user asks for academic papers, preprints, research literature, scientific theory, arXiv -> select ONLY ["search_arxiv"].
   - Example: "Find recent academic papers about transformer inference." -> ["search_arxiv"]

2. OPEN-SOURCE / GITHUB / CODE ONLY:
   - When the user asks for GitHub repositories, open-source projects, codebases, software libraries, benchmarks, or implementations -> select ONLY ["search_github"].
   - Example: "Find open-source GitHub repositories for LLM inference." -> ["search_github"]

3. COMPARATIVE / DUAL-DOMAIN / BOTH:
   - When the user asks to compare academic research with open-source/GitHub implementations, OR mentions both academic papers AND open-source/GitHub code/repos -> select BOTH ["search_arxiv", "search_github"].
   - Example: "Compare recent academic research with GitHub implementations of LLM inference." -> ["search_arxiv", "search_github"]
   - Example: "Research NVIDIA AI accelerators and compare academic papers with open-source GitHub implementations." -> ["search_arxiv", "search_github"]
   - Example: "Research NVIDIA AI accelerators by comparing recent academic research papers with open-source GitHub implementations for transformer and LLM inference optimization." -> ["search_arxiv", "search_github"]

4. GENERAL EXPLORATION:
   - If the request is broad technology exploration (e.g. "Research NVIDIA AI accelerators"), select both tools if both academic papers and open-source implementations provide valuable signal.

QUERY GENERATION FOR TOOLS:
- For each selected tool, construct a concise, high-relevance search query (2 to 5 clean keywords).
- Strip conversational words like "find", "search", "compare", "recent papers with open source github implementations".
- For search_arxiv: focus on the core technical concepts (e.g. "NVIDIA AI accelerator transformer LLM inference").
- For search_github: focus on repository keywords (e.g. "NVIDIA transformer LLM inference").

User Research Context:
${fullIntentText}`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              research_intent: {
                type: Type.STRING,
                description: 'Short 1-sentence explanation of the user intent and tool selection reasoning.'
              },
              selected_tools: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  enum: ['search_arxiv', 'search_github']
                },
                description: 'Array of selected tool names.'
              },
              tool_queries: {
                type: Type.OBJECT,
                properties: {
                  search_arxiv: { type: Type.STRING, description: 'Optimized search query for arXiv' },
                  search_github: { type: Type.STRING, description: 'Optimized search query for GitHub' }
                }
              }
            },
            required: ['research_intent', 'selected_tools', 'tool_queries']
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini dynamic tool selection timeout')), 6000)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        const validTools: ToolName[] = ['search_arxiv', 'search_github'];
        let selectedTools: ToolName[] = Array.isArray(parsed.selected_tools)
          ? parsed.selected_tools.filter((t: string) => validTools.includes(t as ToolName))
          : [];

        if (selectedTools.length > 0) {
          const arxivQ = parsed.tool_queries?.search_arxiv || sanitizeSearchQuery(queryOrPrompt + ' ' + topic, 'arxiv');
          const githubQ = parsed.tool_queries?.search_github || sanitizeSearchQuery(queryOrPrompt + ' ' + topic, 'github');

          return {
            research_intent: parsed.research_intent || 'Dynamic tool selection for intelligence gathering.',
            selected_tools: selectedTools,
            tool_queries: {
              search_arxiv: arxivQ,
              search_github: githubQ
            }
          };
        }
      }
    } catch (err) {
      console.warn('Gemini dynamic tool selection fallback triggered:', err);
    }
  }

  // Deterministic Intent Classification Fallback
  const lower = (
    queryOrPrompt + ' ' +
    objective + ' ' +
    topic + ' ' +
    description + ' ' +
    keywords.join(' ') + ' ' +
    researchInterests.join(' ') + ' ' +
    preferredSources.join(' ')
  ).toLowerCase();

  const isArxivIntent =
    lower.includes('paper') ||
    lower.includes('arxiv') ||
    lower.includes('academic') ||
    lower.includes('scholarly') ||
    lower.includes('preprint') ||
    lower.includes('literature') ||
    lower.includes('study') ||
    lower.includes('theory') ||
    lower.includes('journal');

  const isGithubIntent =
    lower.includes('github') ||
    lower.includes('repo') ||
    lower.includes('open-source') ||
    lower.includes('opensource') ||
    lower.includes('implementation') ||
    lower.includes('code') ||
    lower.includes('software') ||
    lower.includes('framework') ||
    lower.includes('library') ||
    lower.includes('package') ||
    lower.includes('benchmark');

  const selectedTools: ToolName[] = [];
  let intentDesc = '';

  if (isArxivIntent && isGithubIntent) {
    selectedTools.push('search_arxiv', 'search_github');
    intentDesc = 'Multi-vector research comparing academic papers with open-source GitHub implementations.';
  } else if (isGithubIntent && !isArxivIntent) {
    selectedTools.push('search_github');
    intentDesc = 'Targeted open-source software and GitHub repository discovery.';
  } else if (isArxivIntent && !isGithubIntent) {
    selectedTools.push('search_arxiv');
    intentDesc = 'Targeted academic literature and preprint paper discovery.';
  } else {
    // General exploration or preferred sources
    if (preferredSources.includes('github') && !preferredSources.includes('arxiv')) {
      selectedTools.push('search_github');
      intentDesc = 'Targeted GitHub repository search based on preferred sources.';
    } else if (preferredSources.includes('arxiv') && !preferredSources.includes('github')) {
      selectedTools.push('search_arxiv');
      intentDesc = 'Targeted arXiv paper search based on preferred sources.';
    } else {
      selectedTools.push('search_arxiv', 'search_github');
      intentDesc = 'Comprehensive technical discovery across academic literature and open-source implementations.';
    }
  }

  const baseQuery = (topic || queryOrPrompt).replace(/[^\w\s\-]/g, ' ').trim();
  const kw = keywords.slice(0, 3).join(' ');

  return {
    research_intent: intentDesc,
    selected_tools: selectedTools,
    tool_queries: {
      search_arxiv: sanitizeSearchQuery(`${baseQuery} ${kw}`, 'arxiv') || baseQuery,
      search_github: sanitizeSearchQuery(`${baseQuery} ${kw}`, 'github') || baseQuery
    }
  };
}
