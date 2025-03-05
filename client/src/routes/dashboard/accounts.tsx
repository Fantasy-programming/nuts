import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountService } from "@/features/accounts/services/account";

import { AccountList } from "./-components/Accounts/Account";
import { AccountSchema } from "./-components/Accounts/Account.type";
import { Suspense } from "react";
import { Spinner } from "@/core/components/ui/spinner";

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
    <div className="flex h-full flex-col space-y-8">
      <Suspense fallback={<Spinner />}>
        <AccountList onSubmit={onSubmit} />
      </Suspense>
    </div>
  );
}
