import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentRow, SelectedRange } from "@/types/documents";

type DocumentsTableProps = {
  selectedRange: SelectedRange;
  documents: DocumentRow[];
  loadingDocuments: boolean;
  granularityLabel: string;
  formatDate: (value: string) => string;
};

export function DocumentsTable({
  selectedRange,
  documents,
  loadingDocuments,
  granularityLabel,
  formatDate,
}: DocumentsTableProps) {
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
        {loadingDocuments && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {selectedRange && !documents.length && !loadingDocuments && (
          <p className="text-sm text-muted-foreground">
            No documents matched this {granularityLabel}.
          </p>
        )}

        {documents.length > 0 && (
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
                {documents.map((doc) => (
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
                    <TableCell className="align-top">{doc.customer}</TableCell>
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
        )}
      </CardContent>
    </Card>
  );
}
