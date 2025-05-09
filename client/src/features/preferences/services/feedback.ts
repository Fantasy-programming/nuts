import { api } from "@/lib/axios";

const FEEDBACK_ENDPOINT = "/feedback";

export interface FeedbackData {
  type: "bug" | "feature" | "general";
  message: string;
  email?: string;
}

/**
 * Submit user feedback to the server
 * @param feedback The feedback data to submit
 * @returns A promise that resolves when the feedback has been submitted
 */
const submitFeedback = async (feedback: FeedbackData): Promise<void> => {
  await api.post(FEEDBACK_ENDPOINT, feedback);
};

export const feedbackService = {
  submitFeedback,
};
