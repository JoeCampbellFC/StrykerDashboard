import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentRow, SelectedRange } from "@/types/documents";
import { CornerDownRight, Download, ExternalLink } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";

type DocumentsTableProps = {
  selectedRange: SelectedRange;
  documents: DocumentRow[];
  loadingDocuments: boolean;
  granularityLabel: string;
  formatDate: (value: string) => string;
};

const DOCUMENTS_TO_SEARCH_MARKER = "documents to search";
const SHAREPOINT_PREFIX = "https://stryker.sharepoint.com/";

function formatCustomerLabel(folderPath: string) {
  const trimmed = folderPath.trim();
  if (!trimmed) return trimmed;

  const lower = trimmed.toLowerCase();
  const markerIndex = lower.indexOf(DOCUMENTS_TO_SEARCH_MARKER);
  if (markerIndex === -1) return trimmed;

  const afterMarker = trimmed.slice(markerIndex + DOCUMENTS_TO_SEARCH_MARKER.length);
  return afterMarker.replace(/^\/+/, "");
}

function renderCustomerPath(path: string) {
  const label = formatCustomerLabel(path);
  const segments = label.split("/").filter(Boolean);
  if (!segments.length) return label;

  return segments.map((segment, index) => (
    <Fragment key={`${segment}-${index}`}>
      {index > 0 && <CornerDownRight className="mx-1 inline-block h-3.5 w-3.5 text-muted-foreground" />}
      <span>{segment}</span>
    </Fragment>
  ));
}

function formatSharePointLink(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith(SHAREPOINT_PREFIX)) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  const normalized = trimmed.replace(/^\/+/, "");
  return `${SHAREPOINT_PREFIX}${normalized}`;
}

function buildSharePointLink(url: string, options?: { openInWeb?: boolean }) {
  const formatted = formatSharePointLink(url);
  if (!options?.openInWeb) {
    return formatted;
  }

  try {
    const parsed = new URL(formatted);
    if (!parsed.searchParams.has("web")) {
      parsed.searchParams.set("web", "1");
    }
    return parsed.toString();
  } catch {
    const delimiter = formatted.includes("?") ? "&" : "?";
    return formatted.includes("web=1") ? formatted : `${formatted}${delimiter}web=1`;
  }
}

export function DocumentsTable({
  selectedRange,
  documents,
  loadingDocuments,
  granularityLabel,
  formatDate,
}: DocumentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return documents;
    }

    return documents.filter((doc) => {
      const customerLabel = formatCustomerLabel(doc.folder_path);
      const haystack = [doc.title, doc.text, customerLabel].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [documents, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedDocuments = filteredDocuments.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedRange]);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Matching documents</CardTitle>
        <CardDescription>
          {selectedRange
            ? `${selectedRange.count} hits in ${selectedRange.label}`
            : "Select a bar from the chart to view documents."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {documents.length > 0 && (
          <Input
            placeholder="Search documents"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        )}
        {loadingDocuments && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead>Folder</TableHead>
                    <TableHead>File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-3/5" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-top">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="align-top">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="align-top">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <Skeleton className="h-4 w-40" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        )}
        {selectedRange && !documents.length && !loadingDocuments && (
          <p className="text-sm text-muted-foreground">
            No documents matched this {granularityLabel}.
          </p>
        )}
        {selectedRange && documents.length > 0 && !filteredDocuments.length && !loadingDocuments && (
          <p className="text-sm text-muted-foreground">No documents match your search.</p>
        )}

        {pagedDocuments.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead>Folder</TableHead>
                    <TableHead>File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {doc.text.slice(0, 140)}
                            {doc.text.length > 140 ? "…" : ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-top">
                        {formatDate(doc.document_date)}
                      </TableCell>
                      <TableCell className="align-top">
                        {renderCustomerPath(doc.folder_path)}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center gap-2">
                          <Button asChild variant="ghost" size="icon">
                            <a
                              href={buildSharePointLink(doc.file_link, { openInWeb: true })}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Open in SharePoint"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button asChild variant="ghost" size="icon">
                            <a
                              href={buildSharePointLink(doc.file_link)}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredDocuments.length)} of{" "}
                {filteredDocuments.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
