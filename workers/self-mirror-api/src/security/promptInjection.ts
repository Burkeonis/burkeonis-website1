const suspiciousInstruction = /\b(ignore|disregard|override|replace)\b.{0,40}\b(system|developer|previous|above)\b.{0,40}\b(instruction|prompt|rule)s?\b/i;
const secretExtraction = /\b(reveal|print|show|repeat|extract)\b.{0,40}\b(system prompt|api key|secret|internal configuration|developer message)\b/i;

export const containsPromptInjectionSignal = (text: string) => suspiciousInstruction.test(text) || secretExtraction.test(text);
