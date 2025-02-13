import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTransaction } from "@/features/transactions/services/transaction";
import { RecordsTable } from "./-components/Records/records";
import { Suspense } from "react";

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
});

const demoData = {
  groups: [
    {
      id: "1",
      date: "October 19 2029 - 2",
      total: "$700.00",
      transactions: [
        {
          id: "1",
          description: "Groceries",
          amount: 200,
          date: "May 20, 2024",
          payee: "Melcolm",
          category: "Groceries",
          account: "Cash",
          avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-SIDE05mJ9Smd3LPqZGBKAnFSIw7LTc.png",
        },
        {
          id: "2",
          description: "Utilities",
          amount: 500,
          date: "May 20, 2024",
          payee: "Electric Company",
          category: "Utilities",
          account: "Checking",
          avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-SIDE05mJ9Smd3LPqZGBKAnFSIw7LTc.png",
        },
      ],
    },
    {
      id: "2",
      date: "October 16 2029 - 1",
      total: "$500.00",
      transactions: [
        {
          id: "3",
          description: "Entertainment",
          amount: 500,
          date: "May 20, 2024",
          payee: "Cinema",
          category: "Entertainment",
          account: "Credit Card",
          avatarUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-SIDE05mJ9Smd3LPqZGBKAnFSIw7LTc.png",
        },
      ],
    },
  ],
}


function RouteComponent() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });


  return (
    <div className="space-y-8">
      <Suspense fallback={<div>loading</div>}>
        <RecordsTable groups={demoData.groups} />
      </Suspense>
    </div>
  );
}
