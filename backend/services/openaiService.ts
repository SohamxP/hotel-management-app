export type OpenAIStatus = {
  configured: boolean;
  model: string;
  message: string;
};

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatOptions = {
  temperature?: number;
  maxTokens?: number;
};

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

function getApiKey() {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

function getModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

function isReasoningOrLatestModel(model: string) {
  const normalized = model.toLowerCase();

  return (
    normalized.startsWith("gpt-5") ||
    normalized.startsWith("o1") ||
    normalized.startsWith("o3") ||
    normalized.startsWith("o4")
  );
}

export function getOpenAIStatus(): OpenAIStatus {
  const model = getModel();
  const configured = Boolean(getApiKey());

  return {
    configured,
    model,
    message: configured
      ? "OpenAI is configured on the backend."
      : "OpenAI is not configured. Add OPENAI_API_KEY to backend/.env.",
  };
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

async function callOpenAI(messages: ChatMessage[], options: ChatOptions = {}) {
  const apiKey = getApiKey();
  const model = getModel();

  if (!apiKey) {
    throw {
      status: 503,
      message: "OpenAI API key is not configured on the backend",
    };
  }

  const requestBody: any = {
    model,
    messages,
    max_completion_tokens: options.maxTokens ?? 700,
  };

  if (!isReasoningOrLatestModel(model)) {
    requestBody.temperature = options.temperature ?? 0.3;
  }

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let providerMessage = responseText;

    try {
      const parsed = JSON.parse(responseText);
      providerMessage = parsed?.error?.message || responseText;
    } catch {
      providerMessage = responseText;
    }

    throw {
      status: response.status,
      message: providerMessage || "OpenAI request failed",
    };
  }

  let data: any;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw {
      status: 502,
      message: "OpenAI returned an invalid JSON response",
    };
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw {
      status: 502,
      message: "OpenAI returned an empty response",
    };
  }

  return String(content).trim();
}

export async function testOpenAIConnection() {
  const answer = await callOpenAI(
    [
      {
        role: "system",
        content:
          "You are a backend health-check assistant. Reply in one short sentence.",
      },
      {
        role: "user",
        content:
          "Confirm that the OpenAI integration for my hotel management backend is working.",
      },
    ],
    { temperature: 0.1, maxTokens: 80 }
  );

  return {
    success: true,
    message: answer,
    model: getOpenAIStatus().model,
  };
}

export async function askOpenAI(question: string, context?: unknown) {
  const cleanQuestion = question.trim();

  if (!cleanQuestion) {
    throw {
      status: 400,
      message: "Question is required",
    };
  }

  return callOpenAI(
    [
      {
        role: "system",
        content:
          "You are an AI assistant inside a hotel management app. Give practical manager-facing answers. Use the provided hotel data when available. Do not invent exact numbers that are not in the context.",
      },
      {
        role: "user",
        content: `Hotel context:\n${safeJson(
          context || {}
        )}\n\nManager question:\n${cleanQuestion}`,
      },
    ],
    { temperature: 0.35, maxTokens: 850 }
  );
}

export async function generateManagerBriefing(snapshot: unknown) {
  return callOpenAI(
    [
      {
        role: "system",
        content:
          "You are an operations manager for a hotel. Create a concise daily manager briefing. Use headings: Today Snapshot, Risks, Revenue Opportunities, Recommended Actions. Keep it practical and do not exaggerate.",
      },
      {
        role: "user",
        content: `Create today's hotel manager briefing from this operational snapshot:\n${safeJson(
          snapshot
        )}`,
      },
    ],
    { temperature: 0.25, maxTokens: 900 }
  );
}

export async function generateActionPlan(snapshot: unknown, actionItems: unknown) {
  return callOpenAI(
    [
      {
        role: "system",
        content:
          "You are a hotel general manager. Convert operational issues into a short execution plan. Use these exact headings: Priority Order, Who Should Act, Guest Experience Impact, Revenue Impact, Next 24 Hours. Be specific but concise.",
      },
      {
        role: "user",
        content: `Operational snapshot:\n${safeJson(
          snapshot
        )}\n\nRule-based action items:\n${safeJson(
          actionItems
        )}\n\nCreate an execution plan for the manager.`,
      },
    ],
    { temperature: 0.25, maxTokens: 900 }
  );
}

export async function generateGuestRecoveryDrafts(lowFeedback: unknown) {
  return callOpenAI(
    [
      {
        role: "system",
        content:
          "You are a hotel guest experience manager. Create professional guest recovery follow-up drafts from low feedback records. Do not promise refunds unless explicitly told. Keep each message specific, polite, and realistic.",
      },
      {
        role: "user",
        content: `Create guest recovery drafts for these low-feedback hotel stays:\n${safeJson(
          lowFeedback
        )}\n\nFor each case, include:\n1. Guest / Reservation\n2. Main issue\n3. Suggested manager action\n4. Short follow-up message draft`,
      },
    ],
    { temperature: 0.35, maxTokens: 1100 }
  );
}

export async function generateRevenuePlan(revenueOpportunities: unknown) {
  return callOpenAI(
    [
      {
        role: "system",
        content:
          "You are a hotel revenue manager. Create a practical revenue plan from room, reservation, guest, membership, and service data. Do not invent new numbers. Focus on realistic actions the manager can take.",
      },
      {
        role: "user",
        content: `Create a revenue opportunity plan from this data:\n${safeJson(
          revenueOpportunities
        )}\n\nUse these headings:\n1. Highest-Value Opportunities\n2. Upsell Targets\n3. Service Revenue Plays\n4. Risks To Avoid\n5. Next 24 Hours`,
      },
    ],
    { temperature: 0.3, maxTokens: 1100 }
  );
}