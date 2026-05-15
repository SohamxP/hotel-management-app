import { Request, Response } from "express";
import {
  createGuestRecoveryDraft,
  createQualityImprovementPlan,
  getQualityEngine,
} from "../services/qualityService";

function sendError(res: Response, error: any, fallbackMessage: string) {
  console.error(fallbackMessage, error);

  res.status(error.status || 500).json({
    success: false,
    error: error.message || fallbackMessage,
  });
}

export async function getQualityOverview(req: Request, res: Response) {
  try {
    const result = await getQualityEngine();

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to load quality engine");
  }
}

export async function generateQualityPlan(req: Request, res: Response) {
  try {
    const result = await createQualityImprovementPlan();

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate quality improvement plan");
  }
}

export async function generateGuestRecoveryDraft(req: Request, res: Response) {
  try {
    const feedbackId = Number(req.body?.feedbackId);
    const result = await createGuestRecoveryDraft(feedbackId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to generate guest recovery draft");
  }
}