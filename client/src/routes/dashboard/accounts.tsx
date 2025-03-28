import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Spinner } from "@/core/components/ui/spinner";
import { accountService } from "@/features/accounts/services/account";
import { AccountList } from "@/features/accounts/components/Account";
import { AccountSchema } from "@/features/accounts/components/Account.type";

export const Route = createFileRoute("/dashboard/accounts")({
  component: RouteComponent,
  pendingComponent: Spinner,
  loader: ({ context }) => {
    const queryClient = context.queryClient
    queryClient.prefetchQuery({
      queryKey: ["accounts"],
      queryFn: accountService.getAccounts,
    })
  }
});

function RouteComponent() {
  const queryClient = useQueryClient();

  const {
    data
  } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: accountService.getAccounts,
  });

  const createMutation = useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const onSubmit = (values: AccountSchema) => {
    createMutation.mutate(values);
  };

  return (
    <div className="flex h-full flex-col space-y-8">
      <AccountList onSubmit={onSubmit} accounts={data} />
    </div>
  );
}
