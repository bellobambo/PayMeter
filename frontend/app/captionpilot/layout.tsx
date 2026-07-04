import { CaptionPilotProvider } from "@/components/captionpilot/CaptionPilotProvider";
import { CaptionPilotShell } from "@/components/captionpilot/CaptionPilotShell";

export default function CaptionPilotLayout({ children }: { children: React.ReactNode }) {
  return (
    <CaptionPilotProvider>
      <CaptionPilotShell>{children}</CaptionPilotShell>
    </CaptionPilotProvider>
  );
}
