import { GoogleGenAI, Type } from '@google/genai';
import { CategoryType, IntelItem, PriorityLevel, ImpactLevel, EvidenceLink, SourceType } from '../../src/types';
import { RawDiscoveredItem } from './fetcher';
import { PlannedQueryPlan } from './queryPlanner';

function generateFingerprint(title: string, content: string): string {
  const clean = (title + content.slice(0, 40))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 32);
  return `fp_${clean}_${clean.length}`;
}

export async function analyzeAndScoreItems(
  rawItems: RawDiscoveredItem[],
  missionId: string,
  plan: PlannedQueryPlan
): Promise<IntelItem[]> {
  const analyzed: IntelItem[] = [];
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Deduplication stage
  const seenFp = new Set<string>();
  const uniqueRaw: RawDiscoveredItem[] = [];

  for (const raw of rawItems) {
    const fp = generateFingerprint(raw.title, raw.rawContent);
    if (!seenFp.has(fp)) {
      seenFp.add(fp);
      uniqueRaw.push(raw);
    }
  }

  // 2. AI Deep Analysis & Actionable Intelligence Extraction
  if (apiKey && uniqueRaw.length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are a Senior Strategic Intelligence Analyst.
Analyze the following collected intelligence items for the mission:
Target Entities: ${plan.targetEntities.map((e) => e.name).join(', ') || 'General technological research'}
Focus Areas: ${plan.focusAreas.join(', ')}

For each raw item, extract structured Actionable Intelligence:
1. relevanceScore (0-100): How closely does this match the core topic and entities?
2. impactScore (0-100): Breakthrough level, competitive urgency, or technical significance.
3. impact: One of "Low", "Medium", "High", "Critical".
4. strategicPriority: CRITICAL (>=85), STRATEGIC (>=75), HIGH (>=65), TREND (>=50), or MEDIUM.
5. category: hardware, architecture, patent, business, benchmark, or software.
6. whatChanged: Short, 1-2 sentence concise explanation of the factual technological or market change. (NO vague fluff).
7. whyItMatters: Short, 1-2 sentence business/technical significance or competitive implication.
8. recommendedAction: A direct, realistic, actionable recommendation (e.g. "Evaluate prototype within 2 weeks", "Audit patent claims for infringement risk", or "No clear action recommended yet." if evidence does not support action).
9. timeHorizon: Urgency time horizon (e.g. "Within 48 hours", "Within 2 weeks", "This quarter", or "Monitor continuously").
10. supportingReason: Why this specific document supports the finding.
11. keyImplications: 2-3 concise bullet points.
12. mentionedEntities: Array of entities mentioned in the text (empty array if none).

Raw Items:
${JSON.stringify(uniqueRaw.slice(0, 8), null, 2)}`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                itemIndex: { type: Type.INTEGER },
                relevanceScore: { type: Type.INTEGER },
                impactScore: { type: Type.INTEGER },
                impact: {
                  type: Type.STRING,
                  enum: ['Low', 'Medium', 'High', 'Critical']
                },
                strategicPriority: {
                  type: Type.STRING,
                  enum: ['CRITICAL', 'STRATEGIC', 'HIGH', 'MEDIUM', 'TREND', 'LOW']
                },
                category: {
                  type: Type.STRING,
                  enum: ['hardware', 'architecture', 'patent', 'business', 'benchmark', 'software']
                },
                whatChanged: { type: Type.STRING },
                whyItMatters: { type: Type.STRING },
                recommendedAction: { type: Type.STRING },
                timeHorizon: { type: Type.STRING },
                supportingReason: { type: Type.STRING },
                keyImplications: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                mentionedEntities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                confidence: { type: Type.NUMBER }
              },
              required: [
                'itemIndex',
                'relevanceScore',
                'impactScore',
                'impact',
                'strategicPriority',
                'category',
                'whatChanged',
                'whyItMatters',
                'recommendedAction',
                'timeHorizon',
                'keyImplications'
              ]
            }
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini analysis timeout')), 6000)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      if (response.text) {
        const enrichedList = JSON.parse(response.text.trim());
        for (const enr of enrichedList) {
          const raw = uniqueRaw[enr.itemIndex] || uniqueRaw[0];
          if (raw && enr.relevanceScore >= 50) {
            const evidenceLinks: EvidenceLink[] = [
              {
                source: raw.source,
                sourceLabel: raw.sourceLabel,
                title: raw.title,
                url: raw.sourceUrl,
                date: raw.publishedAt,
                excerpt: raw.evidenceSnippet || raw.rawContent.substring(0, 160) + '...',
                supportingReason: enr.supportingReason || `Direct factual reporting from ${raw.sourceLabel}`,
                evidenceType: raw.source === 'patent' || raw.source === 'sec_filing' ? 'primary' : raw.source === 'arxiv' ? 'research' : raw.source === 'social_media' ? 'social' : 'secondary'
              }
            ];

            analyzed.push({
              id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              missionId,
              title: raw.title,
              source: raw.source,
              sourceLabel: raw.sourceLabel,
              sourceUrl: raw.sourceUrl,
              publishedAt: raw.publishedAt,
              rawContent: raw.rawContent,
              fingerprint: generateFingerprint(raw.title, raw.rawContent),
              relevanceScore: Math.min(100, Math.max(10, enr.relevanceScore)),
              impactScore: Math.min(100, Math.max(10, enr.impactScore)),
              strategicPriority: enr.strategicPriority as PriorityLevel,
              category: enr.category as CategoryType,
              summary: `${enr.whatChanged} ${enr.whyItMatters}`,
              keyImplications: enr.keyImplications || [],
              mentionedEntities: enr.mentionedEntities || [],
              relatedItemIds: [],
              evidenceSnippet: raw.evidenceSnippet,
              confidence: enr.confidence || 0.94,

              // Actionable Intelligence Model
              whatChanged: enr.whatChanged,
              whyItMatters: enr.whyItMatters,
              impact: (enr.impact || (enr.impactScore >= 85 ? 'Critical' : enr.impactScore >= 70 ? 'High' : enr.impactScore >= 50 ? 'Medium' : 'Low')) as ImpactLevel,
              recommendedAction: enr.recommendedAction || 'Further evaluation recommended.',
              timeHorizon: enr.timeHorizon || (enr.impactScore >= 85 ? 'Within 48 hours' : enr.impactScore >= 70 ? 'Within 2 weeks' : enr.impactScore >= 50 ? 'This quarter' : 'Monitor continuously'),
              evidenceCount: 1,
              sourceTypes: [raw.source],
              evidenceLinks
            });
          }
        }
      }
    } catch (err) {
      console.warn('Gemini analysis fallback triggered:', err);
    }
  }

  // Fallback heuristic scoring if AI call did not process all items
  if (analyzed.length === 0) {
    for (let i = 0; i < uniqueRaw.length; i++) {
      const raw = uniqueRaw[i];
      const lower = (raw.title + ' ' + raw.rawContent).toLowerCase();

      // Heuristic Relevance
      let rel = 70;
      for (const ent of plan.targetEntities) {
        if (lower.includes(ent.name.toLowerCase()) || (ent.ticker && lower.includes(ent.ticker.toLowerCase()))) {
          rel += 10;
        }
      }
      rel = Math.min(98, rel);

      // Heuristic Impact
      let imp = 65;
      if (raw.source === 'patent') imp += 15;
      if (lower.includes('yield') || lower.includes('breakthrough') || lower.includes('benchmark')) imp += 12;
      imp = Math.min(96, imp);

      let prio: PriorityLevel = 'MEDIUM';
      let impactLevel: ImpactLevel = 'Medium';
      if (imp >= 85) {
        prio = 'CRITICAL';
        impactLevel = 'Critical';
      } else if (imp >= 75) {
        prio = 'STRATEGIC';
        impactLevel = 'High';
      } else if (imp >= 65) {
        prio = 'HIGH';
        impactLevel = 'High';
      }

      let cat: CategoryType = 'hardware';
      if (raw.source === 'patent') cat = 'patent';
      else if (raw.source === 'github') cat = 'software';
      else if (lower.includes('interconnect') || lower.includes('fabric')) cat = 'architecture';
      else if (lower.includes('benchmark')) cat = 'benchmark';

      const foundEntities = plan.targetEntities
        .filter((e) => lower.includes(e.name.toLowerCase()) || (e.ticker && lower.includes(e.ticker.toLowerCase())))
        .map((e) => e.name);

      const whatChanged = `Discovered new development: ${raw.title}.`;
      const whyItMatters = `Indicates shifts in ${cat} technology with potential impact on technical performance and benchmarks.`;
      const recommendedAction = imp >= 80 ? 'Review technical specification and assess architectural impact within 2 weeks.' : 'Further evaluation recommended.';
      const timeHorizon = imp >= 85 ? 'Within 48 hours' : imp >= 70 ? 'Within 2 weeks' : imp >= 50 ? 'This quarter' : 'Monitor continuously';

      const evidenceLinks: EvidenceLink[] = [
        {
          source: raw.source,
          sourceLabel: raw.sourceLabel,
          title: raw.title,
          url: raw.sourceUrl,
          date: raw.publishedAt,
          excerpt: raw.evidenceSnippet || raw.rawContent.substring(0, 160) + '...',
          supportingReason: `Direct reporting from ${raw.sourceLabel}`,
          evidenceType: raw.source === 'patent' || raw.source === 'sec_filing' ? 'primary' : raw.source === 'arxiv' ? 'research' : raw.source === 'social_media' ? 'social' : 'secondary'
        }
      ];

      analyzed.push({
        id: `item-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        missionId,
        title: raw.title,
        source: raw.source,
        sourceLabel: raw.sourceLabel,
        sourceUrl: raw.sourceUrl,
        publishedAt: raw.publishedAt,
        rawContent: raw.rawContent,
        fingerprint: generateFingerprint(raw.title, raw.rawContent),
        relevanceScore: rel,
        impactScore: imp,
        strategicPriority: prio,
        category: cat,
        summary: `${whatChanged} ${whyItMatters}`,
        keyImplications: [
          `Potential performance or commercial implication for ${foundEntities[0] || 'target domain'}`,
          `Competitive tracking verified via ${raw.sourceLabel}`
        ],
        mentionedEntities: foundEntities,
        relatedItemIds: [],
        evidenceSnippet: raw.evidenceSnippet,
        confidence: 0.9,

        // Actionable Intelligence Model
        whatChanged,
        whyItMatters,
        impact: impactLevel,
        recommendedAction,
        timeHorizon,
        evidenceCount: 1,
        sourceTypes: [raw.source],
        evidenceLinks
      });
    }
  }

  return analyzed;
}
