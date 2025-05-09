import { motion } from "framer-motion"

interface FinancialHealthScoreProps {
  score: number
}

export default function FinancialHealthScore({ score }: FinancialHealthScoreProps) {
  // Determine color based on score
  const getColor = () => {
    if (score >= 80) return "text-emerald-500"
    if (score >= 60) return "text-blue-500"
    if (score >= 40) return "text-amber-500"
    return "text-red-500"
  }

  // Determine label based on score
  const getLabel = () => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Needs Attention"
  }

  // Calculate the circumference of the circle
  const circumference = 2 * Math.PI * 40

  // Calculate the offset based on the score
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle className="text-muted stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />

          {/* Score circle */}
          <motion.circle
            className={`${getColor()} stroke-current`}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-4xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.div>
          <motion.div
            className={`text-sm font-medium ${getColor()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {getLabel()}
          </motion.div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 text-center">
        <div>
          <div className="text-sm text-muted-foreground">Debt Ratio</div>
          <div className="font-medium">28%</div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: "28%" }} />
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Savings Rate</div>
          <div className="font-medium">15%</div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: "65%" }} />
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Credit Score</div>
          <div className="font-medium">745</div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: "75%" }} />
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Emergency Fund</div>
          <div className="font-medium">3.2 months</div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: "55%" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

