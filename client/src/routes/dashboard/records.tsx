import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from '@tanstack/react-query';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/core/components/ui/table';
import { getTransactions } from '@/features/transactions/services/transaction';

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Records</h2>
      </div>
      {/* <Table> */}
      {/*   <TableHeader> */}
      {/*     <TableRow> */}
      {/*       <TableHead>Date</TableHead> */}
      {/*       <TableHead>Description</TableHead> */}
      {/*       <TableHead>Category</TableHead> */}
      {/*       <TableHead className="text-right">Amount</TableHead> */}
      {/*     </TableRow> */}
      {/*   </TableHeader> */}
      {/*   <TableBody> */}
      {/*     {transactions?.map((transaction) => ( */}
      {/*       <TableRow key={transaction.id}> */}
      {/*         <TableCell>{transaction.date}</TableCell> */}
      {/*         <TableCell>{transaction.description}</TableCell> */}
      {/*         <TableCell>{transaction.category}</TableCell> */}
      {/*         <TableCell className={`text-right ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500' */}
      {/*           }`}> */}
      {/*           ${Math.abs(transaction.amount).toFixed(2)} */}
      {/*         </TableCell> */}
      {/*       </TableRow> */}
      {/*     ))} */}
      {/*   </TableBody> */}
      {/* </Table> */}
    </div>
  );
}
