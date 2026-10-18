import { use } from "react";
import { DriverDetailView } from "@/components/admin/drivers/DriverDetailView";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <DriverDetailView id={resolvedParams.id} />;
}
