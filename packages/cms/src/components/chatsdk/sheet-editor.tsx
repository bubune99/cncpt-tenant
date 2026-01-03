"use client";

import { memo } from "react";

type SheetEditorProps = {
  content: string;
  saveContent: (content: string, isCurrentVersion: boolean) => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  status: string;
};

const PureSpreadsheetEditor = ({ content }: SheetEditorProps) => {
  return (
    <div
      data-testid="sheet-editor"
      className="flex items-center justify-center h-full p-8 bg-muted/30 rounded-lg"
    >
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Spreadsheet Editor</h3>
        <p className="text-sm text-muted-foreground">
          Sheet artifacts require React 19. Coming soon!
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          Content length: {content.length} characters
        </p>
      </div>
    </div>
  );
};

function areEqual(prevProps: SheetEditorProps, nextProps: SheetEditorProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === "streaming" && nextProps.status === "streaming") &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);
