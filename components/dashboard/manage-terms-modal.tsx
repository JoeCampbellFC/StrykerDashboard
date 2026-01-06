import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchTerm } from "@/types/searchTerm";

type ManageTermsModalProps = {
  isOpen: boolean;
  terms: SearchTerm[];
  termsLoading: boolean;
  termsError: string | null;
  newTerm: string;
  editingId: string | null;
  editingTerm: string;
  savingTermId: string | null;
  deletingTermId: string | null;
  onNewTermChange: (value: string) => void;
  onEditingTermChange: (value: string) => void;
  onCreateTerm: () => void;
  onStartEditing: (term: SearchTerm) => void;
  onCancelEditing: () => void;
  onSaveEditing: (id: string) => void;
  onDeleteTerm: (id: string) => void;
  onClose: () => void;
  formatDate: (value: string) => string;
};

export function ManageTermsModal({
  isOpen,
  terms,
  termsLoading,
  termsError,
  newTerm,
  editingId,
  editingTerm,
  savingTermId,
  deletingTermId,
  onNewTermChange,
  onEditingTermChange,
  onCreateTerm,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onDeleteTerm,
  onClose,
  formatDate,
}: ManageTermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl space-y-4 rounded-lg bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Manage search terms</h2>
            <p className="text-sm text-muted-foreground">
              Add, edit, or remove the terms used to track document mentions.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {termsError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {termsError}
          </div>
        )}

        <div className="space-y-3 rounded-lg border p-4">
          <div className="text-sm font-medium">Add new term</div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              placeholder="Search term"
              value={newTerm}
              onChange={(event) => onNewTermChange(event.target.value)}
            />
            <Button
              onClick={onCreateTerm}
              disabled={savingTermId === "new"}
              className="md:w-[140px]"
            >
              {savingTermId === "new" ? "Saving..." : "Add term"}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead className="whitespace-nowrap">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {termsLoading ? (
                <TableRow>
                  <TableCell className="text-sm text-muted-foreground">
                    Loading terms...
                  </TableCell>
                </TableRow>
              ) : terms.length ? (
                terms.map((term) => {
                  const isEditing = String(term.id) === editingId;
                  const isSaving = savingTermId === String(term.id);
                  const isDeleting = deletingTermId === String(term.id);

                  return (
                    <TableRow key={term.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingTerm}
                            onChange={(event) => onEditingTermChange(event.target.value)}
                          />
                        ) : (
                          <div className="font-medium">{term.term}</div>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(term.created_date)}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onSaveEditing(String(term.id))}
                                disabled={isSaving}
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={onCancelEditing}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onStartEditing(term)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onDeleteTerm(String(term.id))}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell className="text-sm text-muted-foreground">
                    No terms yet. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
