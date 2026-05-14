import { Request, Response } from "express";
import * as aiService from "../services/aiService";
import * as openAIService from "../services/openaiService";
import { OpenAIAppError } from "../services/openaiService";

export async function getInsights(req: Request, res: Response) {
  try {
    const insights = await aiService.getInsights();
    res.json(insights);
  } catch (error) {
    console.error("AI insights error:", error);
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
}

export async function getOpenAIStatus(req: Request, res: Response) {
  try {
    const status = openAIService.getOpenAIConfigStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({
      configured: false,
      error: error?.message || "Failed to read OpenAI configuration",
    });
  }
}

export async function testOpenAI(req: Request, res: Response) {
  try {
    const result = await openAIService.testOpenAIConnection();
    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("OpenAI test error:", error);

    const statusCode = error instanceof OpenAIAppError ? error.statusCode : 500;

    res.status(statusCode).json({
      success: false,
      error: error?.message || "OpenAI test failed",
    });
  }
}

export async function askAI(req: Request, res: Response) {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }

    const result = await openAIService.askHotelAI({ question });
    res.json(result);
  } catch (error: any) {
    console.error("OpenAI hotel assistant error:", error);

    const statusCode = error instanceof OpenAIAppError ? error.statusCode : 500;

    res.status(statusCode).json({
      error: error?.message || "Failed to generate OpenAI response",
    });
  }
}

export async function generateBriefing(req: Request, res: Response) {
  try {
    const result = await openAIService.generateDailyManagerBriefing();

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("OpenAI briefing error:", error);

    const statusCode = error instanceof OpenAIAppError ? error.statusCode : 500;

    res.status(statusCode).json({
      success: false,
      error: error?.message || "Failed to generate manager briefing",
    });
  }
}