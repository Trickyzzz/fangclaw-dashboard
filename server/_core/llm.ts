import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  model?: string;
  routingHint?: "default" | "prefer_mini" | "complex_reasoning" | "strict_reasoning";
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () =>
  (() => {
    const raw = ENV.forgeApiUrl?.trim();
    if (!raw) return "https://forge.manus.im/v1/chat/completions";
    const normalized = raw.replace(/\/$/, "");
    if (/\/v1$/i.test(normalized)) {
      return `${normalized}/chat/completions`;
    }
    return `${normalized}/v1/chat/completions`;
  })();

const resolveModel = (rawModel: string) => {
  const model = rawModel.trim();
  const aliases: Record<string, string> = {
    "deepseekv3.2": "deepseek/deepseek-v3.2",
    "deepseek-v3.2": "deepseek/deepseek-v3.2",
  };
  return aliases[model] ?? model;
};

const stringifyContent = (content: MessageContent | MessageContent[]): string => {
  const parts = ensureArray(content);
  return parts
    .map(part => {
      if (typeof part === "string") return part;
      if (part.type === "text") return part.text;
      if (part.type === "image_url") return "[image]";
      if (part.type === "file_url") return "[file]";
      return "";
    })
    .join("\n")
    .trim();
};

const shouldUseProModel = (params: InvokeParams) => {
  if (params.routingHint === "prefer_mini") {
    return false;
  }

  if (params.routingHint === "strict_reasoning" || params.routingHint === "complex_reasoning") {
    return true;
  }

  const userText = params.messages
    .filter(message => message.role === "user")
    .map(message => stringifyContent(message.content))
    .join("\n");

  const lines = userText.split("\n").filter(line => line.trim().length > 0).length;
  const chars = userText.length;
  const lowered = userText.toLowerCase();
  const deepReasoningSignals = [
    "多跳",
    "反方",
    "反对论点",
    "验证清单",
    "情景推演",
    "因果链",
    "counterargument",
    "verification",
    "scenario",
    "reasoning",
  ];
  const signalHits = deepReasoningSignals.filter(signal => lowered.includes(signal.toLowerCase())).length;
  const hasStructuredOutput = Boolean(params.responseFormat || params.response_format || params.outputSchema || params.output_schema);

  return (
    chars >= ENV.forgeModelProMinChars ||
    lines >= ENV.forgeModelProMinLines ||
    signalHits >= 2 ||
    (hasStructuredOutput && chars >= Math.max(220, ENV.forgeModelProMinChars - 80))
  );
};

const resolveRequestedModels = (params: InvokeParams): string[] => {
  if (params.model?.trim()) {
    return [resolveModel(params.model)];
  }

  if (!ENV.forgeModelRoutingEnabled) {
    return [resolveModel(ENV.forgeModel || ENV.forgeModelMini || "gpt-5.4-mini")];
  }

  const mini = resolveModel(ENV.forgeModelMini || "gpt-5.4-mini");
  const pro = resolveModel(ENV.forgeModelPro || "gpt-5.4");

  if (shouldUseProModel(params)) {
    return pro === mini ? [pro] : [pro, mini];
  }
  return mini === pro ? [mini] : [mini, pro];
};

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY / OPENAI_API_KEY is not configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    maxTokens,
    max_tokens,
  } = params;

  const requestedModels = resolveRequestedModels(params);
  const payload: Record<string, unknown> = {
    model: requestedModels[0],
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = maxTokens ?? max_tokens ?? 32768;

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const request = async (requestPayload: Record<string, unknown>) => {
    const response = await fetch(resolveApiUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });
    const bodyText = await response.text();
    return { response, bodyText };
  };

  let lastErrorDetail = "unknown";

  for (const requestedModel of requestedModels) {
    const modelPayload: Record<string, unknown> = {
      ...payload,
      model: requestedModel,
    };

    let { response, bodyText } = await request(modelPayload);

    if (!response.ok && modelPayload.response_format) {
      const lowered = bodyText.toLowerCase();
      const unsupportedStructuredOutput =
        lowered.includes("response_format") &&
        (lowered.includes("unavailable") ||
          lowered.includes("unsupported") ||
          lowered.includes("not support") ||
          lowered.includes("json_schema"));

      if (response.status === 400 && unsupportedStructuredOutput) {
        const fallbackPayload = { ...modelPayload };
        delete fallbackPayload.response_format;
        ({ response, bodyText } = await request(fallbackPayload));
      }
    }

    if (response.ok) {
      return JSON.parse(bodyText) as InvokeResult;
    }

    lastErrorDetail = `${requestedModel}: ${response.status} ${response.statusText} - ${bodyText}`;
    const retriableForNextModel = [401, 403, 404, 429].includes(response.status);
    if (!retriableForNextModel) {
      throw new Error(`LLM invoke failed: ${lastErrorDetail}`);
    }
    console.warn(`[LLM] model ${requestedModel} failed (${response.status}), trying next route model if available.`);
  }

  throw new Error(`LLM invoke failed across routed models: ${lastErrorDetail}`);
}
