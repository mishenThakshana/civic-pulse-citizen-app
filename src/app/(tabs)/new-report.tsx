import { WorkInProgress } from '@/components/ui/work-in-progress';

export default function NewReportScreen() {
  return (
    <WorkInProgress
      title="Report an Issue"
      description="Photograph a problem, pin its location, and send it to the right department."
      icon="camera-outline"
    />
  );
}
