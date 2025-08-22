"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createTask } from "@/app/actions/tasks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddTaskModal({ isOpen, onClose }: AddTaskModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const priceMin = parseFloat(formData.get("priceMin") as string)
    const priceMax = parseFloat(formData.get("priceMax") as string)
    
    const input = {
      playerSteamId64: formData.get("playerSteamId64") as string,
      item: formData.get("item") as string,
      priceMin,
      priceMax,
    }
    
    try {
      const result = await createTask(input)
      if (result.success) {
        toast.success("Task created successfully")
        onClose()
        router.refresh()
        ;(e.target as HTMLFormElement).reset()
      } else {
        toast.error(result.error || "Failed to create task")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="playerSteamId64">Player Steam ID64</Label>
          <Input
            id="playerSteamId64"
            name="playerSteamId64"
            placeholder="76561198000000000"
            required
          />
        </div>

        <div>
          <Label htmlFor="item">Item Name</Label>
          <Input
            id="item"
            name="item"
            placeholder="AK-47 | Redline"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priceMin">Min Price ($)</Label>
            <Input
              id="priceMin"
              name="priceMin"
              type="number"
              step="0.01"
              placeholder="10.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="priceMax">Max Price ($)</Label>
            <Input
              id="priceMax"
              name="priceMax"
              type="number"
              step="0.01"
              placeholder="50.00"
              required
            />
          </div>
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
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}