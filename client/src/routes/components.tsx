import { Button } from "@/core/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/components")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex gap-4 p-12">
      <div className="flex flex-col gap-6">
        <div>Buttons</div>
        <Button>Primary button</Button>
        <Button variant="destructive">Destructive button</Button>
        <Button
          variant="secondary"
          className="cursor-pointer border-[1.5px] border-[rgba(1,1,1,0.4)] shadow-[0_1px_1px_rgba(0,0,0,0.19),_0_1px_1px_rgba(0,0,0,0.23)] hover:bg-[#e0e0e0] active:bg-[#d0d0d0] active:shadow-[inset_1px_1px_2px_0_rgba(0,0,0,0.1)]"
        >
          Secondary button
        </Button>
        <Button variant="outline">Outline button</Button>
      </div>
      <div className="flex flex-col gap-6">
        <div>Buttons</div>
        <Button>Primary button</Button>
        <Button variant="destructive" className="grain-effect animate-grain">
          Destructive button
        </Button>
        <Button variant="secondary">Secondary button</Button>
        <Button variant="outline">Outline button</Button>
      </div>
    </div>
  );
}
