import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { expandObjectiveIntoQueries } from './server/agents/queryPlanner';
import { parseResearchPromptWithGemini } from './server/agents/researchChatbot';
import { runAutonomousMissionCycle } from './server/engine';
import { store } from './server/store';
import { evaluationEngine } from './server/evaluation/engine';
import { EVALUATION_SCENARIOS } from './server/evaluation/scenarios';
import { tracer } from './server/observability/tracer';
import { Mission } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Research Assistant Natural Language Chatbot Endpoint
  app.post('/api/research/chat-parse', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Research task prompt is required' });
      }

      store.addLog('INFO', `AI Research Assistant parsing: "${prompt.slice(0, 80)}..."`, 'ChatAssistant');
      const structured = await parseResearchPromptWithGemini(prompt.trim());
      res.json(structured);
    } catch (err: any) {
      console.error('Research chat parse error:', err);
      res.status(500).json({ error: err.message || 'Failed to parse research prompt' });
    }
  });

  // Missions
  app.get('/api/missions', (req, res) => {
    res.json({
      missions: store.getMissions(),
      activeMissionId: store.getActiveMissionId()
    });
  });

  app.get('/api/missions/active', (req, res) => {
    const activeId = store.getActiveMissionId();
    const mission = store.getMission(activeId);
    if (!mission) {
      return res.status(404).json({ error: 'Active mission not found' });
    }
    res.json(mission);
  });

  app.post('/api/missions/active', (req, res) => {
    const { id } = req.body;
    if (!id) {
      store.setActiveMissionId(null);
      store.addLog('SYSTEM', 'Cleared active research mission state', 'Dashboard');
      return res.json({ success: true, activeMissionId: null });
    }
    if (store.getMission(id)) {
      store.setActiveMissionId(id);
      store.addLog('SYSTEM', `Switched active dashboard mission to: [${id}]`, 'Dashboard');
      return res.json({ success: true, activeMissionId: id });
    }
    res.status(400).json({ error: 'Invalid mission id' });
  });

  // Get single mission
  app.get('/api/missions/:id', (req, res) => {
    const { id } = req.params;
    const mission = store.getMission(id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(mission);
  });

  // Create new mission with automated AI expansion and structured parameters
  app.post('/api/missions', async (req, res) => {
    try {
      const {
        name,
        topic,
        description,
        companies = [],
        competitors = [],
        keywords = [],
        researchInterests = [],
        preferredSources = ['arxiv', 'patent', 'news', 'sec_filing', 'github', 'web'],
        objective,
        frequencyMinutes = 30
      } = req.body;

      const rawObjective = objective || description || topic || name;
      if (!rawObjective && !name && !topic) {
        return res.status(400).json({ error: 'Mission name, topic, or objective is required' });
      }

      store.addLog('INFO', `Analyzing new tracking mission: "${name || topic || rawObjective}"`, 'MissionManager');
      const plan = await expandObjectiveIntoQueries({
        name,
        topic: topic || rawObjective,
        description: description || rawObjective,
        companies: Array.isArray(companies) ? companies : [],
        competitors: Array.isArray(competitors) ? competitors : [],
        keywords: Array.isArray(keywords) ? keywords : [],
        researchInterests: Array.isArray(researchInterests) ? researchInterests : [],
        preferredSources: Array.isArray(preferredSources) ? preferredSources : [],
        objective: rawObjective
      });

      const newMission: Mission = {
        id: `mission-${Date.now()}`,
        name: name || plan.missionName,
        code: plan.code,
        topic: topic || rawObjective,
        description: description || rawObjective,
        companies: Array.isArray(companies) ? companies : [],
        competitors: Array.isArray(competitors) ? competitors : [],
        keywords: Array.isArray(keywords) ? keywords : [],
        researchInterests: Array.isArray(researchInterests) ? researchInterests : [],
        preferredSources: Array.isArray(preferredSources) ? preferredSources : ['arxiv', 'patent', 'news', 'sec_filing', 'github'],
        objective: rawObjective,
        targetEntities: plan.targetEntities,
        searchVectors: plan.searchVectors,
        focusAreas: plan.focusAreas,
        frequencyMinutes: Number(frequencyMinutes) || 30,
        status: 'active',
        createdAt: new Date().toISOString(),
        totalSignalsScanned: 0,
        filteredInsightsCount: 0,
        meanLatencyMs: 6.8
      };

      const created = store.createMission(newMission);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create mission error:', err);
      res.status(500).json({ error: err.message || 'Failed to create mission' });
    }
  });

  // Edit / update existing mission
  app.put('/api/missions/:id', async (req, res) => {
    const { id } = req.params;
    const existing = store.getMission(id);
    if (!existing) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    try {
      const updates = req.body;
      // Re-run light planning if topic, companies, competitors, or keywords changed
      if (
        updates.topic !== undefined ||
        updates.companies !== undefined ||
        updates.competitors !== undefined ||
        updates.keywords !== undefined ||
        updates.researchInterests !== undefined
      ) {
        const plan = await expandObjectiveIntoQueries({
          name: updates.name || existing.name,
          topic: updates.topic || existing.topic,
          description: updates.description || existing.description,
          companies: updates.companies || existing.companies,
          competitors: updates.competitors || existing.competitors,
          keywords: updates.keywords || existing.keywords,
          researchInterests: updates.researchInterests || existing.researchInterests,
          preferredSources: updates.preferredSources || existing.preferredSources
        });

        updates.targetEntities = plan.targetEntities;
        updates.searchVectors = plan.searchVectors;
        updates.focusAreas = plan.focusAreas;
      }

      const updated = store.updateMission(id, updates);
      res.json(updated);
    } catch (err: any) {
      console.error('Update mission error:', err);
      res.status(500).json({ error: err.message || 'Failed to update mission' });
    }
  });

  // Delete mission
  app.delete('/api/missions/:id', (req, res) => {
    const { id } = req.params;
    const success = store.deleteMission(id);
    if (!success) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json({
      success: true,
      activeMissionId: store.getActiveMissionId()
    });
  });

  // Activate / Deactivate (toggle status)
  app.post('/api/missions/:id/toggle-status', (req, res) => {
    const { id } = req.params;
    const updated = store.toggleMissionStatus(id);
    if (!updated) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(updated);
  });

  // Run autonomous cycle or contextual research step for a mission
  app.post('/api/missions/:id/run', async (req, res) => {
    const { id } = req.params;
    const { query, isFollowUp, runId, adversarialConfig, initialBudget } = req.body || {};
    try {
      const result = await runAutonomousMissionCycle(id, {
        query,
        isFollowUp,
        runId,
        adversarialConfig,
        initialBudget
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution error' });
    }
  });

  // Direct contextual research execution endpoint
  app.post('/api/missions/:id/research', async (req, res) => {
    const { id } = req.params;
    const { query, isFollowUp, runId, adversarialConfig, initialBudget } = req.body || {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Research query is required' });
    }
    try {
      const result = await runAutonomousMissionCycle(id, {
        query: query.trim(),
        isFollowUp,
        runId,
        adversarialConfig,
        initialBudget
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution error' });
    }
  });

  // Developer / Demo Adversarial Live Test Mode Endpoint
  app.post('/api/research/adversarial-test', async (req, res) => {
    try {
      const {
        missionId,
        query = 'Compare recent transformer inference optimization research with open-source implementations and identify the most credible performance improvement.',
        failTool = 'search_github',
        injectConflictingClaims = true,
        forceLowInitialConfidence = true,
        tightBudget = false
      } = req.body || {};

      const targetMissionId = missionId || store.getActiveMissionId();
      store.addLog(
        'WARNING',
        `[ADVERSARIAL TEST] Initiating Controlled Adversarial Live Test on mission [${targetMissionId}]. Objective: "${query}"`,
        'AdversarialTesting'
      );

      const result = await runAutonomousMissionCycle(targetMissionId, {
        query,
        adversarialConfig: {
          enabled: true,
          failTool,
          injectConflictingClaims,
          forceLowInitialConfidence,
          tightBudget
        },
        initialBudget: tightBudget ? { remainingBudget: 12, maxToolCalls: 2 } : undefined
      });

      res.json(result);
    } catch (err: any) {
      console.error('Adversarial test error:', err);
      res.status(500).json({ error: err.message || 'Adversarial execution error' });
    }
  });

  // ============================================================================
  // TASK 6: EVALUATION & BENCHMARKING API ENDPOINTS
  // ============================================================================

  // Get Latest Evaluation Report
  app.get('/api/evaluations/latest', async (req, res) => {
    try {
      const missionId = (req.query.missionId as string) || store.getActiveMissionId();
      let latest = store.getLatestEvaluation(missionId);
      if (!latest) {
        // Automatically execute initial benchmark suite if none exists yet
        latest = await evaluationEngine.executeFullSuite(missionId);
      }
      res.json(latest);
    } catch (err: any) {
      console.error('Get latest evaluation error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch evaluation report' });
    }
  });

  // Get Evaluation History
  app.get('/api/evaluations/history', (req, res) => {
    try {
      const missionId = req.query.missionId as string;
      const history = store.getEvaluationHistory(missionId);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch evaluation history' });
    }
  });

  // Run Full Evaluation Suite (7 Scenarios + Baseline Comparisons + Repeated Reliability)
  app.post('/api/evaluations/run-suite', async (req, res) => {
    try {
      const missionId = req.body?.missionId || store.getActiveMissionId();
      const report = await evaluationEngine.executeFullSuite(missionId);
      res.json(report);
    } catch (err: any) {
      console.error('Run evaluation suite error:', err);
      res.status(500).json({ error: err.message || 'Evaluation suite run failed' });
    }
  });

  // Run a Single Scenario
  app.post('/api/evaluations/run-scenario', async (req, res) => {
    try {
      const { scenarioId, scenarioType, missionId } = req.body || {};
      const targetMissionId = missionId || store.getActiveMissionId();
      const scenario =
        EVALUATION_SCENARIOS.find((s) => s.id === scenarioId || s.type === scenarioType) ||
        EVALUATION_SCENARIOS[0];

      const scenarioEval = await evaluationEngine.executeScenario(scenario, targetMissionId);
      res.json(scenarioEval);
    } catch (err: any) {
      console.error('Run single scenario error:', err);
      res.status(500).json({ error: err.message || 'Single scenario run failed' });
    }
  });

  // Run Repeated Runs for Consistency & Variance Benchmark
  app.post('/api/evaluations/run-repeated', async (req, res) => {
    try {
      const { scenarioId, scenarioType, missionId, iterations = 3 } = req.body || {};
      const targetMissionId = missionId || store.getActiveMissionId();
      const scenario =
        EVALUATION_SCENARIOS.find((s) => s.id === scenarioId || s.type === scenarioType) ||
        EVALUATION_SCENARIOS[0];

      const summary = await evaluationEngine.executeRepeatedRuns(scenario, targetMissionId, iterations);
      res.json(summary);
    } catch (err: any) {
      console.error('Run repeated scenario error:', err);
      res.status(500).json({ error: err.message || 'Repeated evaluation run failed' });
    }
  });

  // Reset Evaluation Store
  app.post('/api/evaluations/reset', (req, res) => {
    try {
      store.resetEvaluations();
      res.json({ success: true, message: 'Evaluation store reset successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reset evaluations' });
    }
  });

  // Get Research Context & Mission Memory
  app.get('/api/missions/:id/context', (req, res) => {
    const { id } = req.params;
    const mission = store.getMission(id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    const context = store.getContext(id);
    res.json(context);
  });

  // Get Intelligence items
  app.get('/api/missions/:id/intel', (req, res) => {
    const { id } = req.params;
    const { minRelevance, minImpact, source, query } = req.query;

    let items = store.getIntelItems(id);

    if (minRelevance) {
      const min = Number(minRelevance);
      items = items.filter((i) => i.relevanceScore >= min);
    }
    if (minImpact) {
      const min = Number(minImpact);
      items = items.filter((i) => i.impactScore >= min);
    }
    if (source && source !== 'all') {
      items = items.filter((i) => i.source === source);
    }
    if (query && typeof query === 'string') {
      const q = query.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          i.mentionedEntities.some((e) => e.toLowerCase().includes(q))
      );
    }

    res.json({
      items,
      totalCount: items.length
    });
  });

  // Get Trends
  app.get('/api/missions/:id/trends', (req, res) => {
    const { id } = req.params;
    res.json(store.getTrends(id));
  });

  // Get Alerts
  app.get('/api/missions/:id/alerts', (req, res) => {
    const { id } = req.params;
    res.json(store.getAlerts(id));
  });

  // Mark Alert Read
  app.post('/api/missions/:id/alerts/:alertId/read', (req, res) => {
    const { id, alertId } = req.params;
    const success = store.markAlertRead(id, alertId);
    res.json({ success });
  });

  // System Logs
  app.get('/api/logs', (req, res) => {
    res.json(store.getLogs());
  });

  // ===========================================================================
  // TASK 7: OBSERVABILITY & TRACING ENDPOINTS
  // ===========================================================================

  // Get all Traces (latest first)
  app.get('/api/traces', (req, res) => {
    const traces = store.getAllTraces();
    res.json({
      traces,
      totalCount: traces.length
    });
  });

  // Get Latest Trace
  app.get('/api/traces/latest', (req, res) => {
    const latest = tracer.getLatestTrace();
    if (!latest) {
      return res.status(404).json({ error: 'No traces recorded yet.' });
    }
    res.json(latest);
  });

  // Get Specific Trace by ID
  app.get('/api/traces/:id', (req, res) => {
    const { id } = req.params;
    const trace = store.getTrace(id);
    if (!trace) {
      return res.status(404).json({ error: `Trace ${id} not found.` });
    }
    res.json(trace);
  });

  // Run Controlled Failure Demonstration & Benchmark (Before vs After)
  app.post('/api/traces/controlled-failure-test', async (req, res) => {
    try {
      const { missionId } = req.body || {};
      const targetMissionId = missionId || store.getActiveMissionId();
      
      store.addLog(
        'WARNING',
        `[OBSERVABILITY BENCHMARK] Executing Controlled Failure & Remediation Benchmark on mission [${targetMissionId}]...`,
        'ObservabilityTracer'
      );

      const benchmarkResult = await tracer.runControlledFailureScenario(targetMissionId);
      res.json(benchmarkResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Controlled failure benchmark failed.' });
    }
  });

  // Get Latest Controlled Failure Benchmark
  app.get('/api/traces/benchmark/latest', (req, res) => {
    const latest = store.getLatestBenchmark();
    if (!latest) {
      return res.status(404).json({ error: 'No benchmark results recorded yet.' });
    }
    res.json(latest);
  });

  // Trigger Automatic Root Cause Diagnosis for a specific trace
  app.post('/api/traces/:id/diagnose', (req, res) => {
    const { id } = req.params;
    const trace = store.getTrace(id);
    if (!trace) {
      return res.status(404).json({ error: `Trace ${id} not found.` });
    }
    const diagnosis = tracer.diagnoseTrace(trace);
    res.json(diagnosis);
  });

  // Generate Executive Intelligence Briefing
  app.get('/api/missions/:id/report', (req, res) => {
    const { id } = req.params;
    const mission = store.getMission(id);
    const items = store.getIntelItems(id);
    const trends = store.getTrends(id);
    const alerts = store.getAlerts(id);

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const reportMarkdown = `# Autonomous Intelligence Briefing: ${mission.name} [${mission.code}]
**Generated:** ${new Date().toUTCString()}
**Tracking Objective:** ${mission.objective}
**Monitored Entities:** ${mission.targetEntities.map((e) => e.name).join(', ')}

---

## 1. Executive Summary
The autonomous tracker has indexed ${mission.totalSignalsScanned} signals across ArXiv, USPTO, and trade news, extracting ${items.length} actionable intelligence items. Key priority shifts center on ${mission.focusAreas.slice(0, 3).join(', ')}.

---

## 2. Critical & Strategic Alerts
${
  alerts.length > 0
    ? alerts.map((a) => `- **[${a.severity.toUpperCase()}]** ${a.headline} (${a.source})\n  *${a.reason}*`).join('\n')
    : '_No critical alerts triggered in this period._'
}

---

## 3. High-Impact Discoveries
${items
  .slice(0, 5)
  .map(
    (i, idx) => `### ${idx + 1}. ${i.title}
- **Source:** ${i.sourceLabel} | **Relevance:** ${i.relevanceScore}/100 | **Impact:** ${i.impactScore}/100 | **Priority:** ${i.strategicPriority}
- **Summary:** ${i.summary}
- **Strategic Implications:**
${i.keyImplications.map((imp) => `  - ${imp}`).join('\n')}
- **Evidence / Source Reference:** [Direct Link](${i.sourceUrl})
`
  )
  .join('\n')}

---

## 4. Trend Velocity Radar
${trends.map((t) => `- **${t.topic}** (${t.changePercent} growth): ${t.summary} [Velocity: ${t.velocity}]`).join('\n')}
`;

    res.json({
      missionName: mission.name,
      reportMarkdown
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hackverse Intel Tracker running on http://localhost:${PORT}`);
  });
}

startServer();
