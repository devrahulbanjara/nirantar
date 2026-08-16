import { CollectionSkeleton } from "@/components/ui/route-skeleton";

export default function LoadingMeals() {
  return <CollectionSkeleton destination="meals" title="Meals" />;
}
