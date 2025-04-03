import { useState, useEffect } from 'react';
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/core/components/ui/dialog";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { PlusCircle } from 'lucide-react';
import { getAvailableChartConfigs } from '@/features/dashboard/charts/loader';
import type { DashboardChartModuleConfig } from '@/features/dashboard/charts/types';

interface AddChartDialogProps {
  onAddChart: (config: DashboardChartModuleConfig) => void;
}

export function AddChartDialog({ onAddChart }: AddChartDialogProps) {
  const [availableCharts, setAvailableCharts] = useState<DashboardChartModuleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load configs when the dialog is about to open or is open
    if (isOpen) {
      setIsLoading(true);
      getAvailableChartConfigs()
        .then(configs => {
          setAvailableCharts(configs);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to load available chart configs:", err);
          setIsLoading(false);
          // Handle error state in UI if needed
        });
    }
  }, [isOpen]); // Re-fetch if dialog re-opens (might be overkill if configs rarely change)

  const handleSelectChart = (config: DashboardChartModuleConfig) => {
    onAddChart(config);
    setIsOpen(false); // Close dialog after adding
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Chart
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Chart to Dashboard</DialogTitle>
          <DialogDescription>
            Select a chart widget to add to your current view.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="text-center p-4">Loading available charts...</div>
          ) : availableCharts.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4"> {/* Added padding-right */}
              <div className="space-y-2">
                {availableCharts.map((config) => (
                  <Button
                    key={config.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleSelectChart(config)}
                  >
                    <div>
                      <div className="font-medium">{config.title}</div>
                      {config.description && (
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center p-4 text-muted-foreground">No charts available to add.</div>
          )}
        </div>
        {/* Optional Footer with Close button */}
        {/* <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
