import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { feedbackService } from "./feedback";

export const useFeedbackMutation = () => {
  return useMutation({
    mutationFn: feedbackService.submitFeedback,
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to submit feedback. Please try again.");
    },
  });
};
