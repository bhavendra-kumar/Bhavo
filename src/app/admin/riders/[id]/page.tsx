import { use } from "react";
import { RiderDetailView } from "@/components/admin/riders/RiderDetailView";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <RiderDetailView id={resolvedParams.id} />;
}
