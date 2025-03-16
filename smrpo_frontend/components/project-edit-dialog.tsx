"use client"

import { useEffect, useState } from "react"
import { updateProject } from "@/lib/actions/project-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Project } from "@/lib/types/project-types"

interface ProjectEditDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectEditDialog({ project, open, onOpenChange }: ProjectEditDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState<number | "">(project?.estimated_time ?? "");

  useEffect(() => {
    if (project && typeof project.estimated_time === "number") {
      setEstimatedTime(project.estimated_time);
    } else {
      setEstimatedTime(""); // Ensure it's empty instead of undefined
    }
  }, [project]);




  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const updatedData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string || undefined,
        estimated_time: estimatedTime !== "" ? parseInt(estimatedTime.toString(), 10) : 0,
      };

      console.log("Submitting updated project:", updatedData);

      const result = await updateProject(project._id, updatedData);

      if ("error" in result) {
        setError(result.error.message);
        toast({
          variant: "destructive",
          title: "Error updating project",
          description: result.error.message,
        });
      } else {
        onOpenChange(false);
        toast({
          variant: "success",
          title: "Project updated",
          description: "Your changes have been saved successfully.",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Error updating project",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Make changes to your project.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={project.name}
                className="col-span-3"
                required
                minLength={3}
                maxLength={50}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={project.description}
                className="col-span-3"
                maxLength={500}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="estimated_time" className="block text-sm font-medium text-gray-700">
                Estimated Time (hours)
              </label>
              <input
                id="estimated_time"
                name="estimated_time"
                type="number"
                placeholder="0"
                className="w-16 p-1 text-center border rounded-md"
                min="0"
                max="99"
                value={estimatedTime}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value.length > 2) value = value.slice(0, 2);
                  setEstimatedTime(value ? parseInt(value, 10) : "");
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 