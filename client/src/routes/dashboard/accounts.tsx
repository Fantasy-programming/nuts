import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountService } from "@/features/accounts/services/account";

import { AccountDialog, AccountList } from "./-components/Accounts/Account";
import { AccountSchema } from "./-components/Accounts/Account.type";
import { Suspense } from "react";

export const Route = createFileRoute("/dashboard/accounts")({
  component: RouteComponent,
});


function RouteComponent() {
  const queryClient = useQueryClient();

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <AccountDialog onSubmit={onSubmit} />
      </div>
      <Suspense fallback={<div>loading...</div>}>
        <AccountList />
      </Suspense>
    </div>
  );
}
