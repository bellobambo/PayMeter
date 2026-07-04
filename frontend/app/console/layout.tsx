import { ConsoleDataProvider } from "@/components/console/ConsoleDataProvider";
import { ConsoleShell } from "@/components/console/ConsoleShell";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleDataProvider>
      <ConsoleShell>{children}</ConsoleShell>
    </ConsoleDataProvider>
  );
}
