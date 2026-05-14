import { getInsights } from "./aiService";

type AskAIInput = {
  question: string;
};

type OpenAITextContent = {
  type: "output_text";
  text: string;
};

type OpenAIMessageOutput = {
  type: "message";
  content?: OpenAITextContent[];
};

type OpenAIResponseBody = {
  output_text?: string;
  output?: OpenAIMessageOutput[];
  error?: {
    message?: string;
  };
};

export class OpenAIAppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

const DEFAULT_MODEL = "gpt-5.4-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function getAPIKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new OpenAIAppError(
      "OPENAI_API_KEY is missing. Add it to backend/.env and restart the backend.",
      500
    );
  }

  return apiKey;
}

export function getOpenAIConfigStatus() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  return {
    configured: hasKey,
    model,
    message: hasKey
      ? "OpenAI API key is configured on the backend."
      : "OPENAI_API_KEY is missing in backend/.env.",
  };
}

function cleanQuestion(question: string) {
  return question.trim().slice(0, 700);
}

function compactInsights(insights: any) {
  return {
    generatedAt: insights.generatedAt,
    summary: insights.summary,
    recommendations: insights.recommendations,
    roomTypePerformance: insights.roomTypePerformance,
    reservationStatusBreakdown: insights.reservationStatusBreakdown,
    serviceStatusBreakdown: insights.serviceStatusBreakdown,
    serviceRevenueByType: insights.serviceRevenueByType,
    topGuests: insights.topGuests,
    recentLowFeedback: insights.recentLowFeedback,
  };
}

function extractText(body: OpenAIResponseBody) {
  if (body.output_text) return body.output_text;

  const textParts = body.output
    ?.flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .filter(Boolean);

  return textParts?.join("\n").trim() || "No answer generated.";
}

async function callOpenAI(input: {
  instructions: string;
  text: string;
  maxOutputTokens?: number;
}) {
  const apiKey = getAPIKey();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions: input.instructions,
      input: input.text,
      max_output_tokens: input.maxOutputTokens ?? 500,
    }),
  });

  const body = (await response.json()) as OpenAIResponseBody;

  if (!response.ok) {
    const message =
      body.error?.message || `OpenAI API failed with status ${response.status}`;

    throw new OpenAIAppError(message, response.status);
  }

  return {
    answer: extractText(body),
    model,
    generatedAt: new Date().toISOString(),
  };
}

export async function testOpenAIConnection() {
  return callOpenAI({
    instructions:
      "You are a connection test assistant. Reply with one short sentence only.",
    text: "Say: OpenAI connection is working for the hotel management app.",
    maxOutputTokens: 60,
  });
}

export async function askHotelAI(input: AskAIInput) {
  const question = cleanQuestion(input.question);

  if (!question) {
    throw new OpenAIAppError("Question is required", 400);
  }

  const insights = await getInsights();

  return callOpenAI({
    instructions:
      "You are an AI assistant inside a hotel management app. Answer like a hotel operations manager. Use only the hotel data provided. Do not invent guests, revenue, reservations, ratings, room counts, or service counts. Be concise, specific, and action-oriented. If the data is not enough, say what is missing.",
    text: JSON.stringify(
      {
        userQuestion: question,
        hotelData: compactInsights(insights),
      },
      null,
      2
    ),
    maxOutputTokens: 700,
  });
}

export async function generateDailyManagerBriefing() {
  const insights = await getInsights();

  return callOpenAI({
    instructions:
      "You are an AI hotel operations manager. Generate a daily manager briefing using only the hotel data provided. Do not invent numbers. Format the answer with these exact sections: 1) Today's Snapshot, 2) Urgent Issues, 3) Revenue Opportunities, 4) Guest Follow-Ups, 5) Recommended Manager Actions. Keep it concise and practical.",
    text: JSON.stringify(
      {
        task: "Generate today's hotel manager briefing.",
        hotelData: compactInsights(insights),
      },
      null,
      2
    ),
    maxOutputTokens: 900,
  });
}