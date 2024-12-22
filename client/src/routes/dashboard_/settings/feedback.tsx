import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card'
import { Button } from '@/core/components/ui/button'
import { Github, MessageCircle, Mail } from 'lucide-react'
import { Textarea } from '@/core/components/ui/textarea'
import { Label } from '@/core/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard_/settings/feedback')({
  component: RouteComponent,
})

function RouteComponent() {
  const [feedback, setFeedback] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (feedback.trim()) {
      toast.success('Feedback submitted successfully')
      setFeedback('')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts, suggestions, or report issues..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            <Button type="submit" disabled={!feedback.trim()}>
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Get in Touch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            asChild
          >
            <a
              href="https://github.com/yourusername/yourrepo/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              Report an Issue on GitHub
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            asChild
          >
            <a
              href="https://discord.gg/yourinvite"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              Join our Discord Community
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            asChild
          >
            <a href="mailto:support@example.com">
              <Mail className="h-4 w-4" />
              Email Support
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
