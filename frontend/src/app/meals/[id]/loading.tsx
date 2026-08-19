import { DetailSkeleton } from "@/components/ui/route-skeleton";

export default function LoadingMealDetail() {
  return <DetailSkeleton destination="meals" label="meal" />;
}
