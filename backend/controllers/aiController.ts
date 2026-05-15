import { Request, Response } from "express";
import {
  getAIActionCenter,
  getHotelOperationsSnapshot,
  getLocalHotelInsights,
  getOccupancyForecast,
  getRevenueOpportunities,
} from "../services/aiService";
import {
  askOpenAI,
  generateActionPlan,
  generateForecastPlan,
  generateGuestRecoveryDrafts,
  generateManagerBriefing,
  generateRevenuePlan,
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

export async function getRevenue(req: Request, res: Response) {
  try {
    const result = await getRevenueOpportunities();
    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate revenue opportunities");
  }
}

export async function getForecast(req: Request, res: Response) {
  try {
    const result = await getOccupancyForecast();
    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate occupancy forecast");
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

export async function createGuestRecoveryDrafts(req: Request, res: Response) {
  try {
    const snapshot = await getHotelOperationsSnapshot();

    if (!snapshot.lowFeedback || snapshot.lowFeedback.length === 0) {
      res.json({
        success: true,
        recoveryDrafts:
          "No low-feedback guest recovery cases were found in the current hotel data.",
        lowFeedbackCount: 0,
      });
      return;
    }

    const recoveryDrafts = await generateGuestRecoveryDrafts(
      snapshot.lowFeedback
    );

    res.json({
      success: true,
      recoveryDrafts,
      lowFeedbackCount: snapshot.lowFeedback.length,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate guest recovery drafts");
  }
}

export async function createRevenuePlan(req: Request, res: Response) {
  try {
    const revenueOpportunities = await getRevenueOpportunities();
    const revenuePlan = await generateRevenuePlan(revenueOpportunities);

    res.json({
      success: true,
      revenuePlan,
      opportunities: revenueOpportunities.opportunities,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate OpenAI revenue plan");
  }
}

export async function createForecastPlan(req: Request, res: Response) {
  try {
    const forecast = await getOccupancyForecast();
    const forecastPlan = await generateForecastPlan(forecast);

    res.json({
      success: true,
      forecastPlan,
      forecastItems: forecast.forecastItems,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate OpenAI forecast plan");
  }
}