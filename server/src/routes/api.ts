import { Router, Request, Response } from 'express';
import {
  CreateReportRequestSchema,
  UpdateWorkflowRequestSchema,
  QueryReportsFilterSchema,
} from '../validators/schemas.js';
import { StorageService } from '../services/storageService.js';
import { findNearbyCandidates } from '../services/spatialService.js';
import {
  triageReportWithGemini,
  generateClusterActionBriefWithGemini,
} from '../services/geminiService.js';

export const apiRouter = Router();

/**
 * GET /api/health
 */
apiRouter.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const health = await StorageService.getHealth();
    res.json({
      status: 'ok',
      service: 'STRATUM.AI Core Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      ...health,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Health check failed', details: err.message });
  }
});

/**
 * GET /api/reports
 */
apiRouter.get('/reports', async (req: Request, res: Response): Promise<void> => {
  try {
    const filterQuery = QueryReportsFilterSchema.safeParse(req.query);
    const filters = filterQuery.success ? filterQuery.data : {};
    const result = await StorageService.getReports(filters);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch civic reports', details: err.message });
  }
});

/**
 * GET /api/reports/:ticketOrId
 */
apiRouter.get('/reports/:ticketOrId', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketOrId = String(req.params.ticketOrId);
    const result = await StorageService.getReportByIdOrTicket(ticketOrId);
    if (!result.report) {
      res.status(404).json({ error: `Ticket or Report '${ticketOrId}' not found` });
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch report', details: err.message });
  }
});

/**
 * POST /api/reports
 * Citizen Submission & Spatial + LLM Triage
 */
apiRouter.post('/reports', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = CreateReportRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const input = parseResult.data;

    // 1. Haversine Spatial Candidate Lookup (200m radius)
    const allReports = StorageService.getAllReportsSync();
    const nearbyCandidates = findNearbyCandidates(
      input.latitude,
      input.longitude,
      allReports,
      200
    );

    console.log(
      `[TRIAGE] Citizen report submitted at (${input.latitude}, ${input.longitude}). Found ${nearbyCandidates.length} candidate reports within 200m.`
    );

    // 2. Multimodal & Spatial LLM Triage via Gemini 2.5 Flash
    const triage = await triageReportWithGemini(
      input.description,
      input.user_category,
      input.address_label,
      input.latitude,
      input.longitude,
      input.image_url,
      nearbyCandidates
    );

    // 3. Persist and resolve duplicates / clusters
    const created = await StorageService.createReport(input, triage);

    res.status(201).json({
      success: true,
      data: created.report,
      master_report: created.master_report,
      nearby_candidates_checked: nearbyCandidates.length,
      ai_engine_used: triage.ai_engine,
    });
  } catch (err: any) {
    console.error('[API] Report creation error:', err);
    res.status(500).json({ error: 'Failed to process and triage report', details: err.message });
  }
});

/**
 * PATCH /api/reports/:id/workflow
 */
apiRouter.patch('/reports/:id/workflow', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const parseResult = UpdateWorkflowRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const updates = parseResult.data;
    const result = await StorageService.updateWorkflow(id, updates);

    if (!result.report) {
      res.status(404).json({ error: `Report '${id}' not found` });
      return;
    }

    res.json({
      success: true,
      data: result.report,
      synced_duplicate_children: result.updatedChildDuplicatesCount,
    });
  } catch (err: any) {
    console.error('[API] Workflow update error:', err);
    res.status(500).json({ error: 'Failed to update report workflow', details: err.message });
  }
});

/**
 * GET /api/clusters
 */
apiRouter.get('/clusters', async (_req: Request, res: Response): Promise<void> => {
  try {
    const clusters = await StorageService.getClusters();
    res.json({ clusters });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch clusters', details: err.message });
  }
});

/**
 * POST /api/clusters/:id/action-brief
 * Generates an Executive Action Brief for a cluster
 */
apiRouter.post('/clusters/:id/action-brief', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const clusters = await StorageService.getClusters();
    const cluster = clusters.find((c) => c.id === id || c.cluster_code === id);

    if (!cluster) {
      res.status(404).json({ error: `Cluster '${id}' not found` });
      return;
    }

    console.log(`[BRIEF] Generating Gemini Action Brief for cluster "${cluster.title}" with ${cluster.reports.length} reports...`);

    const actionBrief = await generateClusterActionBriefWithGemini(
      cluster.title,
      cluster.reports
    );

    const updated = await StorageService.updateClusterActionBrief(cluster.id, actionBrief);

    res.json({
      success: true,
      cluster: updated,
      action_brief: actionBrief,
    });
  } catch (err: any) {
    console.error('[API] Action brief generation error:', err);
    res.status(500).json({ error: 'Failed to generate cluster action brief', details: err.message });
  }
});

/**
 * POST /api/seed/reset
 */
apiRouter.post('/seed/reset', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await StorageService.resetAllData();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset seed data', details: err.message });
  }
});
