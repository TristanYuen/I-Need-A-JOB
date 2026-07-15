import { promises as fs } from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
const defaultBaseUrl = "https://api.deepseek.com";
const defaultModel = "deepseek-v4-flash";

export type DeepSeekServerConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  configured: boolean;
  keyPreview: string;
};

type EnvMap = Record<string, string>;

function unquoteEnvValue(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseEnv(content: string) {
  return content.split(/\r?\n/).reduce<EnvMap>((values, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return values;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      return values;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1);
    values[key] = unquoteEnvValue(value);
    return values;
  }, {});
}

async function readEnvLocal() {
  try {
    return await fs.readFile(envPath, "utf8");
  } catch {
    return "";
  }
}

function escapeEnvValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/"/g, "\\\"");
}

function maskKey(apiKey: string) {
  if (!apiKey) {
    return "";
  }

  if (apiKey.length <= 8) {
    return "********";
  }

  return `${apiKey.slice(0, 4)}********${apiKey.slice(-4)}`;
}

export async function getDeepSeekServerConfig(): Promise<DeepSeekServerConfig> {
  const fileValues = parseEnv(await readEnvLocal());
  const apiKey = fileValues.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || "";
  const baseUrl = fileValues.DEEPSEEK_BASE_URL || process.env.DEEPSEEK_BASE_URL || defaultBaseUrl;
  const model = fileValues.DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL || defaultModel;

  return {
    apiKey,
    baseUrl,
    model,
    configured: Boolean(apiKey),
    keyPreview: maskKey(apiKey)
  };
}

export async function saveDeepSeekServerConfig(input: {
  apiKey?: string;
  baseUrl: string;
  model: string;
  clearKey?: boolean;
}) {
  const currentContent = await readEnvLocal();
  const values = parseEnv(currentContent);
  const baseUrl = input.baseUrl.trim() || defaultBaseUrl;
  const model = input.model.trim() || defaultModel;

  if (input.clearKey) {
    delete values.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
  } else if (input.apiKey?.trim()) {
    values.DEEPSEEK_API_KEY = input.apiKey.trim();
    process.env.DEEPSEEK_API_KEY = input.apiKey.trim();
  }

  values.DEEPSEEK_BASE_URL = baseUrl;
  values.DEEPSEEK_MODEL = model;
  process.env.DEEPSEEK_BASE_URL = baseUrl;
  process.env.DEEPSEEK_MODEL = model;

  const lines = Object.entries(values).map(([key, value]) => `${key}="${escapeEnvValue(value)}"`);
  await fs.writeFile(envPath, `${lines.join("\n")}\n`, "utf8");

  return getDeepSeekServerConfig();
}
