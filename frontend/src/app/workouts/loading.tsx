import { CollectionSkeleton } from "@/components/ui/route-skeleton";

export default function LoadingWorkouts() {
  return <CollectionSkeleton destination="workouts" title="Workouts" />;
}
