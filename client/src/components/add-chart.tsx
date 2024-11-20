import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, LineChart, BarChart, PieChart } from "lucide-react";

const chartTypes = [
  {
    id: "line",
    name: "Line Chart",
    icon: LineChart,
    description: "Perfect for showing trends over time",
  },
  {
    id: "bar",
    name: "Bar Chart",
    icon: BarChart,
    description: "Great for comparing values across categories",
  },
  {
    id: "pie",
    name: "Pie Chart",
    icon: PieChart,
    description: "Ideal for showing composition and proportions",
  },
];

interface AddChartDialogProps {
  onAddChart: (type: string) => void;
}

export function AddChartDialog({ onAddChart }: AddChartDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="flex h-[400px] cursor-pointer items-center justify-center border-2 border-dashed border-muted transition-colors hover:border-primary hover:bg-accent/50">
          <Button
            variant="ghost"
            size="icon"
            className="h-20 w-20 text-muted-foreground"
          >
            <Plus className="h-10 w-10" />
          </Button>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Chart</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {chartTypes.map((chart) => (
            <Button
              key={chart.id}
              variant="outline"
              className="flex h-auto flex-col gap-2 p-4"
              onClick={() => onAddChart(chart.id)}
            >
              <div className="flex w-full items-center gap-2">
                <chart.icon className="h-5 w-5" />
                <span className="font-semibold">{chart.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {chart.description}
              </p>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
