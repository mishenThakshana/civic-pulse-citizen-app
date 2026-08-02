import { WorkInProgress } from '@/components/ui/work-in-progress';

export default function ReportsScreen() {
  return (
    <WorkInProgress
      title="My Reports"
      description="Every issue you have reported, with its current status."
      icon="document-text-outline"
    />
  );
}
