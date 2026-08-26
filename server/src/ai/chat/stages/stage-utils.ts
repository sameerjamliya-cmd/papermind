import type { ChatState } from "../types/chat-state";
import type { ChatProgressEvent } from "../types/chat-events";

export async function withProgress<T extends ChatState>(
  state: T,
  stage: ChatProgressEvent["stage"],
  execute: () => Promise<T>
): Promise<T> {
  await state.progressWriter?.({ type: "progress", stage, status: "started" });
  try {
    const result = await execute();
    await result.progressWriter?.({
      type: "progress",
      stage,
      status: "completed",
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await state.progressWriter?.({ type: "error", message });
    throw error;
  }
}