import { EditorSkeleton } from "@/components/ui/route-skeleton";

export default function LoadingNewMeal() {
  return <EditorSkeleton destination="meals" label="new meal form" />;
}
