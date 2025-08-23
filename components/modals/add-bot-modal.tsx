'use client'

import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addBot } from "@/app/actions/bots"
import { useModalForm } from "@/hooks/useModalForm"
import { AddBotInput } from "@/lib/zod/bots"
import { FormModalProps } from "@/lib/types/common"

export function AddBotModal({ isOpen, onClose }: FormModalProps) {
  const { handleSubmit, isSubmitting } = useModalForm({
    action: addBot,
    onSuccess: onClose,
    successMessage: "Bot added successfully",
    errorMessage: "Failed to add bot"
  })

  const transformFormData = (formData: FormData): AddBotInput => ({
    label: formData.get("label") as string,
    proxyUrl: formData.get("proxyUrl") as string,
    password: formData.get("password") as string,
    maFileJSON: formData.get("maFile") as string,
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Bot">
      <form onSubmit={(e) => handleSubmit(e, transformFormData)} className="space-y-4">
        <div>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            name="label"
            placeholder="Bot nickname"
            required
          />
        </div>

        <div>
          <Label htmlFor="proxyUrl">Proxy URL</Label>
          <Input
            id="proxyUrl"
            name="proxyUrl"
            placeholder="socks5://user:pass@host:port"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Steam account password"
            required
          />
        </div>

        <div>
          <Label htmlFor="maFile">maFile (JSON)</Label>
          <Textarea
            id="maFile"
            name="maFile"
            rows={8}
            placeholder='{"shared_secret": "...", "identity_secret": "...", ...}'
            required
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Bot"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}