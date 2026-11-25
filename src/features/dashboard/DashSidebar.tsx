import { Sidebar as AppSidebar } from '@/components/layout/Sidebar';
import { useDemoStore } from '@/services/mock/store';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';

/** Sidebar aplikasi (sama dengan halaman lain) untuk Dashboard insiden; props dari desain diabaikan. */
export function Sidebar(props: Record<string, unknown>) {
  void props;
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  return <AppSidebar active="analitik" role={role} taskCount={tasks} />;
}
