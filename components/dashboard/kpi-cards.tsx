import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonthTrend } from "@/types/documents";
import { SearchTerm } from "@/types/searchTerm";

type KpiCardsProps = {
  totalMentions: number;
  selectedTerm?: SearchTerm;
  monthTrend: MonthTrend | null;
  granularityLabel: string;
};

export function KpiCards({
  totalMentions,
  selectedTerm,
  monthTrend,
  granularityLabel,
}: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total mentions</CardDescription>
          <CardTitle className="text-2xl">{totalMentions}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Across all returned dates for the selected term.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Selected term</CardDescription>
          <CardTitle className="text-xl">
            {selectedTerm ? selectedTerm.term : "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {selectedTerm ? "Current selection." : "Choose a term to begin."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Trends</CardDescription>
          <CardTitle className="text-2xl">
            {selectedTerm && monthTrend ? (
              <span className="flex items-center gap-2">
                <span>
                  {monthTrend.percentChange === null
                    ? "New"
                    : monthTrend.percentChange === 0
                    ? "0%"
                    : `${monthTrend.percentChange > 0 ? "+" : ""}${
                        monthTrend.percentChange
                      }%`}
                </span>

                <span className="text-muted-foreground flex items-center">
                  {monthTrend.percentChange === null ||
                  monthTrend.percentChange > 0 ? (
                    <IconTrendingUp
                      size={16}
                      className="animate-pulse opacity-80"
                      aria-label="Trending up"
                    />
                  ) : monthTrend.percentChange < 0 ? (
                    <IconTrendingDown
                      size={16}
                      className="animate-pulse opacity-80"
                      aria-label="Trending down"
                    />
                  ) : (
                    "—"
                  )}
                </span>
              </span>
            ) : (
              "—"
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-xs text-muted-foreground">
          {selectedTerm && monthTrend
            ? `Past 30 days: +${monthTrend.addedLast30} (was ${monthTrend.baseBefore30}; now ${monthTrend.totalCount}).`
            : `Number of ${granularityLabel}s that have at least one match.`}
        </CardContent>
      </Card>
    </div>
  );
}
