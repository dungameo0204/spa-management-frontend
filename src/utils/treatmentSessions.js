export const isLifetimeTreatment = treatment => treatment?.total_sessions === null
export const canExecuteTreatment = treatment => !treatment?.closed_at && (isLifetimeTreatment(treatment) || Number(treatment?.remaining_sessions) > 0)
export const treatmentSessionsLabel = treatment => isLifetimeTreatment(treatment)
  ? 'Trọn đời'
  : `${treatment?.remaining_sessions ?? 0}/${treatment?.total_sessions ?? 0} buổi`