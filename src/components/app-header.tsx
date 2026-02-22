import { ModeToggle } from "@/components/mode-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const AppHeader = () => {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <SidebarTrigger />
      <ModeToggle />
    </header>
  );
};
