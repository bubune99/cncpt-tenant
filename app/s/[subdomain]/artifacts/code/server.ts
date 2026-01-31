import { streamObject } from "ai";
import { z } from "zod";
import { codePrompt, updateDocumentPrompt } from '@/lib/cms/ai/prompts';
import { getArtifactModel } from '@/lib/cms/ai/providers';
import { createDocumentHandler } from '@/lib/cms/artifacts/server';

export const codeDocumentHandler = createDocumentHandler<"code">({
  kind: "code",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";
    const model = await getArtifactModel();

    const { fullStream } = streamObject({
      model,
      system: codePrompt,
      prompt: title,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.write({
            type: "data-codeDelta",
            data: code ?? "",
            transient: true,
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";
    const model = await getArtifactModel();

    const { fullStream } = streamObject({
      model,
      system: updateDocumentPrompt(document.content ?? null, "code"),
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.write({
            type: "data-codeDelta",
            data: code ?? "",
            transient: true,
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
});
