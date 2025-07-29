import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Github, MessageCircle, Mail } from "lucide-react";
import { Textarea } from "@/core/components/ui/textarea";
import { Label } from "@/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useFeedbackMutation } from "@/features/preferences/services/feedback.queries";
import { logger } from "@/lib/logger";

export const Route = createFileRoute("/dashboard_/settings/feedback")({
  component: RouteComponent,
});

function RouteComponent() {
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "general">("general");
  const feedbackMutation = useFeedbackMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      try {
        await feedbackMutation.mutateAsync({
          type: feedbackType,
          message: feedback.trim(),
        });
        setFeedback("");
        setFeedbackType("general");
      } catch (error) {
        logger.error(error)
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">Feedback Type</Label>
              <Select value={feedbackType} onValueChange={(value: "bug" | "feature" | "general") => setFeedbackType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts, suggestions, or report issues..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[150px]"
                required
              />
            </div>
            <Button type="submit" disabled={!feedback.trim() || feedbackMutation.isPending}>
              {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Get in Touch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start gap-2" asChild>
            <a href="https://github.com/Fantasy-programming/nuts/issues" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              Report an Issue on GitHub
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" asChild>
            <a href="https://discord.gg/nuts-finance" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Join our Discord Community
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" asChild>
            <a href="mailto:engineer@nuts.com">
              <Mail className="h-4 w-4" />
              Email Support
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
