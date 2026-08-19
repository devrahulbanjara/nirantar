import { DetailSkeleton } from "@/components/ui/route-skeleton";

export default function LoadingWorkoutDetail() {
  return <DetailSkeleton destination="workouts" label="workout" />;
}
