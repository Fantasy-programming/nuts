import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Spinner } from "@/core/components/ui/spinner";
import { accountService } from "@/features/accounts/services/account";
import { AccountList } from "@/features/accounts/components/account";
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

  const createAccount = useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const updateAccount = useMutation({
    mutationFn: accountService.updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: accountService.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const onCreate = (values: AccountSchema) => {
    createAccount.mutate(values);
  };


  const onUpdate = (id: string, values: AccountSchema) => {
    updateAccount.mutate({ id, account: values });
  };

  const onDelete = (id: string) => {
    deleteAccount.mutate(id);
  };

  return (
    <div className="flex h-full flex-col space-y-8">
      <AccountList onCreate={onCreate} onUpdate={onUpdate} onDelete={onDelete} accounts={data} />
    </div>
  );
}
