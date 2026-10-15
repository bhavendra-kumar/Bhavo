import { use } from "react";
import { RideDetailView } from "@/components/admin/rides/RideDetailView";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <RideDetailView id={resolvedParams.id} />;
}
