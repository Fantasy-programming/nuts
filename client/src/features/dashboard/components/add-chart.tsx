import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { BarChart, LineChart, PieChart, Plus, TrendingUp } from "lucide-react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/core/components/ui/dialog-sheet";
import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/core/components/ui/scroll-area";

interface ChartTypeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ChartTypeCard: React.FC<ChartTypeCardProps> = ({ title, description, icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="mb-2 text-primary">{icon}</div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-500 text-center mt-1">{description}</p>
    </div>
  );
};



interface AddChartDialogProps {
  onAddChart: (type: string, title?: string) => void;
}

//TODO: Better look + chart preview
export function AddChartDialog({ onAddChart }: AddChartDialogProps) {
  const [open, setOpen] = useState(false)
  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger>
        <Card className="border-muted hover:border-primary/80 hover:bg-accent/50 flex h-[340px] cursor-pointer items-center justify-center border-2 border-dashed transition-colors">
          <Button variant="ghost" size="icon" className="text-muted-foreground h-20 w-20">
            <Plus className="h-10 w-10" />
          </Button>
        </Card>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-[600px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add New Chart</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ScrollArea>
          <div className=" grid gap-3 p-3">
            <ChartTypeCard
              title="Line Chart"
              description="Track changes over time"
              icon={<LineChart className="h-8 w-8" />}
              onClick={() => onAddChart('line', "Line Chart")}
            />
            <ChartTypeCard
              title="Bar Chart"
              description="Compare values across categories"
              icon={<BarChart className="h-8 w-8" />}
              onClick={() => onAddChart('bar', "Bar Chart")}
            />
            <ChartTypeCard
              title="Area Chart"
              description="Show cumulative totals over time"
              icon={<TrendingUp className="h-8 w-8" />}
              onClick={() => onAddChart('area', "Area Chart")}
            />
            <ChartTypeCard
              title="Pie Chart"
              description="Show proportions of a whole"
              icon={<PieChart className="h-8 w-8" />}
              onClick={() => onAddChart('pie', "Pie Chart")}
            />
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea >
      </ResponsiveDialogContent >
    </ResponsiveDialog>
  );
}
