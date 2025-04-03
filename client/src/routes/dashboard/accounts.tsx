import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { accountService } from "@/features/accounts/services/account";
import { AccountList } from "@/features/accounts/components/account";
import AccountsLoading from "@/features/accounts/components/account.loading";
import { AccountFormSchema } from "@/features/accounts/services/account.types";

export const Route = createFileRoute("/dashboard/accounts")({
  component: RouteComponent,
  pendingComponent: AccountsLoading,
  loader: ({ context }) => {
    const queryClient = context.queryClient
    queryClient.prefetchQuery({
      queryKey: ["accountsWT"],
      queryFn: accountService.getAccountsWTrends,
    })
  }
});

function RouteComponent() {
  const queryClient = useQueryClient();

  const {
    data
  } = useSuspenseQuery({
    queryKey: ["accountsWT"],
    queryFn: accountService.getAccountsWTrends,
  });

  const createAccount = useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['accountsWT'] })
    },
  });

  const updateAccount = useMutation({
    mutationFn: accountService.updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['accountsWT'] })
    },
  });

  const deleteAccount = useMutation({
    mutationFn: accountService.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['accountsWT'] })
    },
  });

  const onCreate = (values: AccountFormSchema) => {
    createAccount.mutate(values);
  };


  const onUpdate = (id: string, values: AccountFormSchema) => {
    updateAccount.mutate({ id, account: values });
  };

  const onDelete = (id: string) => {
    deleteAccount.mutate(id);
  };


  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between gap-2 px-4">
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="h-full w-full space-y-8 overflow-y-auto px-6 py-2">
          <div className="flex h-full flex-col space-y-8">
            <AccountList onCreate={onCreate} onUpdate={onUpdate} onDelete={onDelete} accounts={data} />
          </div>
        </div>
      </main>
    </>
  );
}
