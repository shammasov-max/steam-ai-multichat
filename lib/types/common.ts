export type ActionResult<T = unknown> = 
  | { success: true; data?: T }
  | { success: false; error: string }

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface FormModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface SubmissionState {
  isSubmitting: boolean
  error?: string
}