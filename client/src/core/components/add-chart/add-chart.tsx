import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Plus } from "lucide-react";
import chartTypes from "./add-chart.data"

interface AddChartDialogProps {
  onAddChart: (type: string) => void;
}

//TODO: Better look + chart preview
export function AddChartDialog({ onAddChart }: AddChartDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="flex h-[300px] cursor-pointer items-center justify-center border-2 border-dashed border-muted transition-colors hover:border-primary/80 hover:bg-accent/50">
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
        <div className="grid  gap-4 py-4">
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
