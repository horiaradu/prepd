export interface ProgressEvent {
  step: string;
  progress: number;
}

export async function readProgressStream<T>(
  res: Response,
  onProgress: (event: ProgressEvent) => void,
): Promise<T> {
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === "progress") {
          onProgress({ step: event.step, progress: event.progress });
        } else if (event.type === "done") {
          result = event.data as T;
        } else if (event.type === "error") {
          throw new Error(event.error);
        }
      } catch (e) {
        if (e instanceof Error && e.message !== "No response body") throw e;
      }
    }
  }

  if (result === undefined) throw new Error("Stream ended without result");
  return result;
}
