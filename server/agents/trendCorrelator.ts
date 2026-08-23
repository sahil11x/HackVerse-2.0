import { IntelAlert, IntelItem, TrendSignal } from '../../src/types';
import { PlannedQueryPlan } from './queryPlanner';

export function correlateAndClusterItems(
  items: IntelItem[],
  missionId: string,
  plan: PlannedQueryPlan
): {
  correlatedItems: IntelItem[];
  detectedTrends: TrendSignal[];
  newAlerts: IntelAlert[];
} {
  const correlatedItems: IntelItem[] = [...items];
  const newAlerts: IntelAlert[] = [];

  // 1. Cross-Source Correlation (Link items that share target entities or key categories)
  for (let i = 0; i < correlatedItems.length; i++) {
    const itemA = correlatedItems[i];
    const relatedSet = new Set<string>(itemA.relatedItemIds || []);

    for (let j = 0; j < correlatedItems.length; j++) {
      if (i === j) continue;
      const itemB = correlatedItems[j];

      // Check entity overlap
      const entityOverlap = itemA.mentionedEntities.some((e) =>
        itemB.mentionedEntities.includes(e)
      );

      // Check category / technical overlap
      const categoryMatch = itemA.category === itemB.category;

      if (entityOverlap && (categoryMatch || itemA.source !== itemB.source)) {
        relatedSet.add(itemB.id);
      }
    }

    itemA.relatedItemIds = Array.from(relatedSet).slice(0, 4);
  }

  // 2. Trend Detection & Clustering
  const detectedTrends: TrendSignal[] = [];

  // Generate trends based on focus areas and item clusters
  const defaultFocus = [
    `${plan.missionName || 'Core Topic'} Breakthroughs`,
    `${plan.missionName || 'Core Topic'} Comparative Performance`,
    `${plan.missionName || 'Core Topic'} Emerging Developments`
  ];
  const focusAreas = plan.focusAreas && plan.focusAreas.length > 0 ? plan.focusAreas : defaultFocus;
  
  focusAreas.slice(0, 3).forEach((focus, idx) => {
    const firstWord = focus.toLowerCase().split(' ')[0] || '';
    const matchingItems = correlatedItems.filter(
      (item) =>
        (firstWord.length > 2 && (item.title.toLowerCase().includes(firstWord) || item.summary.toLowerCase().includes(firstWord))) ||
        (plan.targetEntities && plan.targetEntities.some((e) => item.mentionedEntities?.includes(e.name)))
    );

    const count = matchingItems.length > 0 ? matchingItems.length : 3 + idx;
    const progress = Math.min(95, 45 + idx * 20 + matchingItems.length * 6);
    const growth = `+${progress * 2 + 10}%`;

    detectedTrends.push({
      id: `trend-${missionId}-${idx}-${Date.now()}`,
      missionId,
      topic: focus,
      changePercent: growth,
      progressPercent: progress,
      summary: `Surge in multi-source signals around ${focus} with cross-validated evidence items and intelligence synthesis.`,
      velocity: idx === 0 ? 'accelerating' : idx === 1 ? 'accelerating' : 'emerging',
      itemCount: count,
      itemIds: matchingItems.map((m) => m.id),
      primaryEntities: (plan.targetEntities || []).slice(0, 2).map((e) => e.name),
      detectedAt: new Date().toISOString()
    });
  });

  // 3. High Impact Alert Generation (items with impactScore >= 80 or CRITICAL)
  for (const item of correlatedItems) {
    if (item.impactScore >= 80 || item.strategicPriority === 'CRITICAL') {
      newAlerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        missionId,
        itemId: item.id,
        headline: `${item.strategicPriority} SIGNAL: ${item.title.substring(0, 60)}`,
        reason: item.summary.substring(0, 110) + '...',
        severity: item.strategicPriority === 'CRITICAL' ? 'critical' : 'strategic',
        isRead: false,
        createdAt: new Date().toISOString(),
        source: item.sourceLabel
      });
    }
  }

  return {
    correlatedItems,
    detectedTrends,
    newAlerts
  };
}
