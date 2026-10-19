// Status vocabularies for project records. They describe the state of work; none
// of them is an approval, which only a person's recorded decision can be.

export const STAGE_STATUS = {
  not_started: 'Not started',
  active: 'Active',
  in_review: 'In review',
  blocked: 'Blocked',
  reopened: 'Reopened',
  completed: 'Completed',
  skipped: 'Skipped',
};

export const TASK_STATUS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  ready_for_review: 'Ready for review',
  changes_requested: 'Changes requested',
  completed: 'Completed',
  waived: 'Waived',
};

export const DOC_STATUS = { draft: 'Draft', in_review: 'In review', final: 'Final' };

export const OUTCOME = {
  approved: 'Approved',
  changes_requested: 'Changes requested',
  rejected: 'Rejected',
  noted: 'Noted',
};

/** The stage a project is "at": the first one in motion, else the first not yet done. */
export function currentStage(stageStatuses) {
  const moving = stageStatuses.find(s => ['active', 'in_review', 'blocked', 'reopened'].includes(s.status));
  if (moving) return moving;
  return stageStatuses.find(s => s.status === 'not_started') ?? stageStatuses[stageStatuses.length - 1];
}

export const isDone = status => status === 'completed' || status === 'waived' || status === 'skipped';

export function when(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
