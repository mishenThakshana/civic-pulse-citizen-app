import { WorkInProgress } from '@/components/ui/work-in-progress';

export default function NotificationsScreen() {
  return (
    <WorkInProgress
      title="Notifications"
      description="Updates from departments handling the issues you reported."
      icon="notifications-outline"
    />
  );
}
