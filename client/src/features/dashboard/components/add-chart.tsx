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
import { getAvailableChartConfigs } from '@/features/dashboard/charts/loader';
import type { DashboardChartModuleConfig } from '@/features/dashboard/charts/types';

interface AddChartDialogProps {
  children: React.ReactNode
  onClose?: () => void
  onAddChart: (config: DashboardChartModuleConfig) => void;
}

export function AddChartDialog({ onAddChart, children }: AddChartDialogProps) {
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
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add Chart to Dashboard</DialogTitle>
          <DialogDescription>
            Select a chart widget to add to your current view.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          {isLoading ? (
            <div className="text-center p-4">Loading available charts...</div>
          ) : availableCharts.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableCharts.map((config) => (
                  <Button
                    key={config.id}
                    variant="ghost"
                    className="w-full h-auto p-4 border border-border hover:border-primary/50 rounded-lg transition-colors"
                    onClick={() => handleSelectChart(config)}
                  >
                    <div className="flex flex-col items-start gap-3 w-full">
                      <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                        <div className="text-muted-foreground text-sm">Chart Preview</div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-base">{config.title}</div>
                        {config.description && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {config.description}
                          </p>
                        )}
                      </div>
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
