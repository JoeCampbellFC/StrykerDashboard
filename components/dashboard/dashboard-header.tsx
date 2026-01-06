import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchTerm } from "@/types/searchTerm";

type DashboardHeaderProps = {
  terms: SearchTerm[];
  selectedTermId: string;
  onSelectTerm: (termId: string) => void;
  onOpenManageTerms: () => void;
};

export function DashboardHeader({
  terms,
  selectedTermId,
  onSelectTerm,
  onOpenManageTerms,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b-1 border-[#ffb500] bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/stryker-logo.png"
            alt="Stryker logo"
            width={128}
            height={128}
            className="shrink-0"
          />

          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold leading-tight">
              Document Intelligence
            </span>
            <span className="text-xs text-muted-foreground">
              Turn document mentions into actionable insights
            </span>
          </div>
        </div>

        <div className="ml-auto flex w-full max-w-[520px] items-center gap-2">
          <Select value={selectedTermId} onValueChange={onSelectTerm}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a search term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={onOpenManageTerms}>
            Manage terms
          </Button>
        </div>
      </div>
    </header>
  );
}
