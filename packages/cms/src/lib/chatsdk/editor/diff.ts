import type { Node as ProsemirrorNode, Schema } from "prosemirror-model";

export enum DiffType {
  Inserted = "inserted",
  Deleted = "deleted",
  Unchanged = "unchanged",
}

/**
 * Computes the diff between two ProseMirror documents and returns a new document
 * with diff marks applied to show insertions and deletions.
 */
export function diffEditor(
  schema: Schema,
  oldDocJson: Record<string, unknown>,
  newDocJson: Record<string, unknown>
): ProsemirrorNode {
  const oldDoc = schema.nodeFromJSON(oldDocJson);
  const newDoc = schema.nodeFromJSON(newDocJson);

  // Extract text content from documents for comparison
  const oldText = getTextContent(oldDoc);
  const newText = getTextContent(newDoc);

  // If content is identical, return the new document as-is
  if (oldText === newText) {
    return newDoc;
  }

  // Compute the diff and create a new document with diff marks
  const diffedContent = computeTextDiff(schema, oldText, newText);
  return diffedContent;
}

function getTextContent(node: ProsemirrorNode): string {
  let text = "";
  node.descendants((child) => {
    if (child.isText) {
      text += child.text;
    } else if (child.isBlock) {
      text += "\n";
    }
    return true;
  });
  return text.trim();
}

function computeTextDiff(
  schema: Schema,
  oldText: string,
  newText: string
): ProsemirrorNode {
  const diffMark = schema.marks.diffMark;
  const nodes: ProsemirrorNode[] = [];

  // Simple word-based diff
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  // Use LCS (Longest Common Subsequence) approach for diffing
  const lcs = computeLCS(oldWords, newWords);
  const { result } = applyDiff(oldWords, newWords, lcs);

  let currentParagraphContent: ProsemirrorNode[] = [];

  for (const item of result) {
    if (item.text === "\n" || item.text === "") {
      if (currentParagraphContent.length > 0) {
        nodes.push(
          schema.nodes.paragraph.create(null, currentParagraphContent)
        );
        currentParagraphContent = [];
      }
      continue;
    }

    let textNode: ProsemirrorNode;
    if (item.type === DiffType.Unchanged) {
      textNode = schema.text(item.text);
    } else {
      const mark = diffMark.create({ type: item.type });
      textNode = schema.text(item.text, [mark]);
    }
    currentParagraphContent.push(textNode);
  }

  if (currentParagraphContent.length > 0) {
    nodes.push(schema.nodes.paragraph.create(null, currentParagraphContent));
  }

  if (nodes.length === 0) {
    nodes.push(schema.nodes.paragraph.create());
  }

  return schema.nodes.doc.create(null, nodes);
}

interface DiffItem {
  type: DiffType;
  text: string;
}

function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

function applyDiff(
  oldWords: string[],
  newWords: string[],
  dp: number[][]
): { result: DiffItem[] } {
  const result: DiffItem[] = [];
  let i = oldWords.length;
  let j = newWords.length;

  const temp: DiffItem[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      temp.push({ type: DiffType.Unchanged, text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({ type: DiffType.Inserted, text: newWords[j - 1] });
      j--;
    } else if (i > 0) {
      temp.push({ type: DiffType.Deleted, text: oldWords[i - 1] });
      i--;
    }
  }

  // Reverse to get correct order
  for (let k = temp.length - 1; k >= 0; k--) {
    result.push(temp[k]);
  }

  return { result };
}
