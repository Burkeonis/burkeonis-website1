export async function getCommerceBindings(): Promise<CommerceBindings> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env as CommerceBindings;
  } catch {
    const processEnv = typeof process !== "undefined" ? process.env : undefined;
    return (processEnv as CommerceBindings) ?? {};
  }
}
