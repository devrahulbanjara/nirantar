import { EditorSkeleton } from "@/components/ui/route-skeleton";

export default function LoadingNewWorkout() {
  return <EditorSkeleton destination="workouts" label="new workout form" />;
}
