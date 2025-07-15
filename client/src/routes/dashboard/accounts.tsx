import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { accountService } from "@/features/accounts/services/account";
import { DraggableAccountGroups } from "@/features/accounts/components/account";
import { AccountsLoading } from "@/features/accounts/components/account.loading";
import { AccountFormSchema } from "@/features/accounts/services/account.types";
import { AddAccountModal } from "@/features/accounts/components/account.create-modal";
import { NetWorthCard } from "@/features/accounts/components/account.net-worth";
import { Button } from "@/core/components/ui/button";
import { LayoutDashboard, Plus } from "lucide-react";
import { groupAccountsByType } from "@/features/accounts/components/account.utils";
import { SidebarTrigger } from "@/core/components/ui/sidebar";
import { getAllAccountsWithTrends } from "@/features/accounts/services/account.queries";
import { EmptyStateGuide } from "@/core/components/EmptyStateGuide";

export const Route = createFileRoute("/dashboard/accounts")({
  component: RouteComponent,
  pendingComponent: AccountsLoading,
  loader: ({ context }) => {
    const queryClient = context.queryClient

    if (!queryClient.getQueryData(["accounts", "trends"])) {
      queryClient.prefetchQuery(getAllAccountsWithTrends());
    }

  }
});

function RouteComponent() {
  const queryClient = useQueryClient();

  const { hasAccounts } = useRouteContext({ from: "/dashboard" });
  const { data } = useSuspenseQuery(getAllAccountsWithTrends());

  const cashTotal = data.reduce((sum, account) => sum + account.balance, 0)
  const grouppedAccounts = groupAccountsByType(data)


  const onCloseModal = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
  }


  const createAccount = useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: () => {
      onCloseModal()
    },
  });

  const updateAccount = useMutation({
    mutationFn: accountService.updateAccount,
    onSuccess: () => {
      onCloseModal()
    },
  });

  const deleteAccount = useMutation({
    mutationFn: accountService.deleteAccount,
    onSuccess: () => {
      onCloseModal()
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
      {!hasAccounts && (
        <EmptyStateGuide
          Icon={LayoutDashboard}
          title="Here you can view account details"
          description="Add an account with the button below to get started"
        >
          <AddAccountModal
            onAddAccount={onCreate}
            onClose={onCloseModal}
          >
            <Button className="hidden md:inline-flex mt-4">
              Add Account
            </Button>
          </AddAccountModal>

        </EmptyStateGuide>
      )}
      <div className="border-b border-b-bg-nuts-500/20 py-1 flex gap-2 items-center md:hidden -mx-4 px-3">
        <SidebarTrigger />
        <span className="font-semibold text-sm tracking-tight">Accounts</span>
      </div>
      <header className="h-22 shrink-0 items-center gap-2 transition-[width,height] ease-linear md:flex hidden ">
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:block hidden">Accounts</h1>
            <p className="text-[#757575] mt-1">Manage your financial accounts and track your balances</p>
          </div>
          <AddAccountModal
            onAddAccount={onCreate}
            onClose={onCloseModal}
          >
            <Button className="hidden md:inline-flex">
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </AddAccountModal>
        </div>
      </header>
      <div className="flex flex-1">
        <div className="h-full w-full space-y-8  py-2">
          <NetWorthCard cashTotal={cashTotal} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DraggableAccountGroups
                initialAccounts={grouppedAccounts}
                period={"1 month change"}
                onEdit={onUpdate}
                onDelete={onDelete}
              />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {/* <SummaryCard assets={summaryData.assets} liabilities={summaryData.liabilities} /> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        <AddAccountModal
          onAddAccount={onCreate}
        >
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
            <Plus className="size-6" />
          </Button>
        </AddAccountModal>
      </div>
    </>
  );
}
