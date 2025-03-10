import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Suspense } from "react";

import { Spinner } from "@/core/components/ui/spinner";
import { accountService } from "@/features/accounts/services/account";
import { AccountList } from "@/features/accounts/components/Account";
import { AccountSchema } from "@/features/accounts/components/Account.type";

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
