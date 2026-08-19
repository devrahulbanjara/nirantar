import { EditorSkeleton } from "@/components/ui/route-skeleton";

export default function LoadingEditWorkout() {
  return <EditorSkeleton destination="workouts" label="workout editor" />;
}
