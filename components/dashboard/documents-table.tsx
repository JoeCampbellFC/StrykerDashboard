import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentRow, SelectedRange } from "@/types/documents";
import { CornerDownRight } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";

type DocumentsTableProps = {
  selectedRange: SelectedRange;
  documents: DocumentRow[];
  loadingDocuments: boolean;
  granularityLabel: string;
  formatDate: (value: string) => string;
};

const DOCUMENTS_TO_SEARCH_MARKER = "documents to search";

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
        <Input
          placeholder="Search documents"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          disabled={!documents.length}
        />
        {loadingDocuments && (
          <p className="text-sm text-muted-foreground">Loading…</p>
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
                    <TableHead>Customer</TableHead>
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
                        <Button asChild variant="link" className="h-auto p-0">
                          <a href={doc.file_link} target="_blank" rel="noreferrer">
                            Open
                          </a>
                        </Button>
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
