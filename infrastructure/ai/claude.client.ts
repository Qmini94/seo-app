import Anthropic from "@anthropic-ai/sdk";

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (clientInstance) return clientInstance;
  clientInstance = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
  return clientInstance;
}

interface ClaudeOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Claude API를 호출하여 텍스트 응답을 받는다.
 * 시스템 프롬프트 + 유저 메시지 구조.
 */
export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const client = getClient();
  const { maxTokens = 2048, temperature = 0.7 } = options;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API 응답에 텍스트가 없습니다.");
  }

  return textBlock.text;
}

/**
 * Claude API를 호출하여 JSON 응답을 파싱한다.
 * 응답에서 JSON 블록을 추출하여 파싱.
 */
export async function askClaudeJson<T>(
  systemPrompt: string,
  userMessage: string,
  options: ClaudeOptions = {}
): Promise<T> {
  const text = await askClaude(systemPrompt, userMessage, {
    ...options,
    temperature: options.temperature ?? 0.3, // JSON은 낮은 temperature
  });

  // ```json ... ``` 블록 추출 또는 전체 텍스트 파싱
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(`Claude JSON 파싱 실패: ${jsonStr.slice(0, 200)}`);
  }
}
