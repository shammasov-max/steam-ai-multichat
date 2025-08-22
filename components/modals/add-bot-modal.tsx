'use client'

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addBot } from "@/app/actions/bots"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AddBotModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddBotModal({ isOpen, onClose }: AddBotModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const input = {
      label: formData.get("label") as string,
      proxyUrl: formData.get("proxyUrl") as string,
      password: formData.get("password") as string,
      maFileJSON: formData.get("maFile") as string,
    }
    
    try {
      const result = await addBot(input)
      if (result.success) {
        toast.success("Bot added successfully")
        onClose()
        router.refresh()
        ;(e.target as HTMLFormElement).reset()
      } else {
        toast.error(result.error || "Failed to add bot")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Bot">
      <form onSubmit={handleSubmit} className="space-y-4">
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