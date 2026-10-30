import { z } from 'zod';

export const CivicCategoryEnum = z.enum([
  'WATERLOGGING_DRAINAGE',
  'ROAD_INFRASTRUCTURE',
  'ELECTRICAL_STREETLIGHTS',
  'WASTE_SANITATION',
  'WATER_SUPPLY_LEAKAGE',
  'PUBLIC_SAFETY_OBSTRUCTION',
  'UNSURE'
]);

export const PriorityLevelEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const ReportStatusEnum = z.enum([
  'Submitted',
  'AI Triaged',
  'Assigned',
  'In Progress',
  'Resolved'
]);

export const CreateReportRequestSchema = z.object({
  citizen_name: z.string().trim().min(2).max(120).optional().default('Anonymous Citizen'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000),
  user_category: CivicCategoryEnum,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address_label: z.string().trim().min(3).max(255),
  image_url: z.string().optional().nullable()
});

export const UpdateWorkflowRequestSchema = z.object({
  status: ReportStatusEnum,
  assigned_crew: z.string().trim().min(2).max(120).optional().nullable(),
  official_notes: z.string().trim().min(3).max(500),
  actor: z.string().trim().default('Municipal Duty Officer')
});

export const QueryReportsFilterSchema = z.object({
  status: ReportStatusEnum.optional(),
  category: z.string().optional(),
  priority_level: PriorityLevelEnum.optional(),
  include_duplicates: z.enum(['true', 'false']).optional().default('false')
});

export const ClusterActionBriefSchema = z.object({
  executive_headline: z.string(),
  root_cause_diagnosis: z.string(),
  operational_sequence: z.array(
    z.object({
      step_number: z.number(),
      department: z.string(),
      action_directive: z.string(),
      dependency_note: z.string()
    })
  ),
  estimated_impact_if_delayed: z.string(),
  field_equipment_checklist: z.array(z.string())
});

export type CreateReportInput = z.infer<typeof CreateReportRequestSchema>;
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowRequestSchema>;
export type ClusterActionBriefData = z.infer<typeof ClusterActionBriefSchema>;
