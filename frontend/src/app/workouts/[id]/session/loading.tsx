import { DetailSkeleton } from "@/components/ui/route-skeleton";

export default function LoadingWorkoutSession() {
  return <DetailSkeleton destination="workouts" label="workout" />;
}
