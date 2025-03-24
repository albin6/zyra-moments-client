import TransactionsComponent from "@/components/client/TransactionsComponent";
import { Spinner } from "@/components/ui/spinner";
import { useClientTransactionsQuery } from "@/hooks/service/useTransactions";
import { PopulatedPayments } from "@/types/Payment";
import { useEffect, useState } from "react";

export default function ClientTransactions() {
  const { data, isLoading } = useClientTransactionsQuery();
  const [transactions, setTransactions] = useState<PopulatedPayments[] | null>(
    null
  );

  useEffect(() => {
    if (data) {
      setTransactions(data.payments);
    }
  }, [data]);

  if (isLoading) {
    return <Spinner />;
  }

  if (!transactions) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <TransactionsComponent
        transactions={transactions}
        userRole="client" // Change to "vendor" or "admin" to see different views
      />
    </div>
  );
}
