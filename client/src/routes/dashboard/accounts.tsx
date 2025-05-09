import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { accountService } from "@/features/accounts/services/account";
import { AccountGroup } from "@/features/accounts/components/account";
import AccountsLoading from "@/features/accounts/components/account.loading";
import { AccountFormSchema } from "@/features/accounts/services/account.types";
import { AddAccountModal } from "@/features/accounts/components/account.create-modal";
import { NetWorthCard } from "@/features/accounts/components/account.net-worth";
import { Button } from "@/core/components/ui/button";
import { Plus } from "lucide-react";



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

  const cashTotal = data.reduce((sum, account) => sum + account.balance, 0)

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
      <header className="flex h-22 shrink-0 items-center gap-2 transition-[width,height] ease-linear ">
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
            <p className="text-muted-foreground mt-1">Manage your financial accounts and track your balances</p>
          </div>

          <AddAccountModal
            onAddAccount={onCreate}
          >
            <Button >
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </AddAccountModal>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="h-full w-full space-y-8 overflow-y-auto  py-2">
          <NetWorthCard accounts={data} />

          <AccountGroup
            title="Cash"
            accounts={data}
            totalBalance={cashTotal}
            trend={{ value: 431.89, period: "1 month change" }}
            onEdit={onUpdate}
            onDelete={onDelete}
          />
        </div>
      </main>
    </>
  );
}
