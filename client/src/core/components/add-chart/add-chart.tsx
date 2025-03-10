import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { BarChart, LineChart, PieChart, Plus, TrendingUp } from "lucide-react";

interface ChartTypeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ChartTypeCard: React.FC<ChartTypeCardProps> = ({ title, description, icon, onClick }) => {
  return (
    <div
      className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
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
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="border-muted hover:border-primary/80 hover:bg-accent/50 flex h-[300px] cursor-pointer items-center justify-center border-2 border-dashed transition-colors">
          <Button variant="ghost" size="icon" className="text-muted-foreground h-20 w-20">
            <Plus className="h-10 w-10" />
          </Button>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Chart</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
      </DialogContent>
    </Dialog>
  );
}
