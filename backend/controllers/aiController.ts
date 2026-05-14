import { Request, Response } from "express";
import {
  getAIActionCenter,
  getHotelOperationsSnapshot,
  getLocalHotelInsights,
} from "../services/aiService";
import {
  askOpenAI,
  generateActionPlan,
  generateManagerBriefing,
  getOpenAIStatus,
  testOpenAIConnection,
} from "../services/openaiService";

function sendError(res: Response, error: any, fallbackMessage: string) {
  console.error(fallbackMessage, error);

  res.status(error?.status || 500).json({
    success: false,
    error: error?.message || fallbackMessage,
  });
}

export async function getAIStatus(req: Request, res: Response) {
  try {
    res.json({
      success: true,
      ...getOpenAIStatus(),
    });
  } catch (error: any) {
    sendError(res, error, "Failed to get OpenAI status");
  }
}

export async function testAI(req: Request, res: Response) {
  try {
    const result = await testOpenAIConnection();
    res.json(result);
  } catch (error: any) {
    sendError(res, error, "OpenAI test failed");
  }
}

export async function getInsights(req: Request, res: Response) {
  try {
    const result = await getLocalHotelInsights();
    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate local AI insights");
  }
}

export async function getActions(req: Request, res: Response) {
  try {
    const result = await getAIActionCenter();
    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate AI action center");
  }
}

export async function askAI(req: Request, res: Response) {
  try {
    const question = String(req.body?.question || "").trim();
    const snapshot = await getHotelOperationsSnapshot();
    const answer = await askOpenAI(question, snapshot);

    res.json({
      success: true,
      answer,
    });
  } catch (error: any) {
    sendError(res, error, "OpenAI ask failed");
  }
}

export async function createManagerBriefing(req: Request, res: Response) {
  try {
    const snapshot = await getHotelOperationsSnapshot();
    const briefing = await generateManagerBriefing(snapshot);

    res.json({
      success: true,
      briefing,
      snapshotSummary: snapshot.summary,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate manager briefing");
  }
}

export async function createActionPlan(req: Request, res: Response) {
  try {
    const actionCenter = await getAIActionCenter();
    const actionPlan = await generateActionPlan(
      actionCenter.snapshot,
      actionCenter.actionItems
    );

    res.json({
      success: true,
      actionPlan,
      actionItems: actionCenter.actionItems,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate OpenAI action plan");
  }
}