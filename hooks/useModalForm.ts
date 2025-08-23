import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ActionResult } from '@/lib/types/common'

interface UseModalFormOptions<T> {
  action: (input: T) => Promise<ActionResult>
  onSuccess?: () => void
  successMessage?: string
  errorMessage?: string
}

export function useModalForm<T>({
  action,
  onSuccess,
  successMessage = 'Operation completed successfully',
  errorMessage = 'Operation failed'
}: UseModalFormOptions<T>) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    transform: (formData: FormData) => T
  ) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const input = transform(formData)
    
    try {
      const result = await action(input)
      if (result.success) {
        toast.success(successMessage)
        onSuccess?.()
        router.refresh()
        ;(e.target as HTMLFormElement).reset()
      } else {
        toast.error(result.error || errorMessage)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    handleSubmit,
    isSubmitting
  }
}