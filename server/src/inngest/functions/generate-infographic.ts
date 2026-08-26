import { inngest } from "../client";
import { infographicRepository } from "../../repository/infographic.repository";
import { infographicRAGService } from "../../ai/infographic/infographic-rag.service";
import { planInfographic } from "../../ai/infographic/infographic-planner.service";
import { getStyleMeta } from "../../ai/infographic/styles";
import { getLanguageMeta } from "../../ai/infographic/languages";
import type { InfographicConfig } from "../../types";

export const generateInfographicFn: ReturnType<typeof inngest.createFunction> =
  inngest.createFunction(
    {
      id: "generate-infographic",
      name: "Generate Infographic",
      retries: 2,
      triggers: [{ event: "infographic.requested" }],
    },
    async ({ event, step }) => {
      const { infographicId, workspaceId, config } = event.data as {
        infographicId: string;
        workspaceId: string;
        userId: string;
        config: InfographicConfig;
      };

      await step.run("mark-processing", () =>
        infographicRepository.updateStatus(infographicId, "processing")
      );

      try {
        const style = getStyleMeta(config.styleId);
        const language = getLanguageMeta(config.language);

        const context = await step.run("retrieve-context", () =>
          infographicRAGService.retrieveForInfographic({
            workspaceId,
            prompt: config.prompt,
          })
        );

        const content = await step.run("plan-infographic", () =>
          planInfographic({
            context,
            style,
            language,
            prompt: config.prompt,
            styleId: config.styleId,
            languageCode: config.language,
          })
        );

        await step.run("mark-ready", () =>
          infographicRepository.updateStatus(infographicId, "ready", {
            content,
          })
        );

        return {
          infographicId,
          sectionCount: content.sections.length,
          title: content.title,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await step.run("mark-failed", () =>
          infographicRepository.updateStatus(infographicId, "failed", {
            errorMessage: message,
          })
        );
        throw error;
      }
    }
  );