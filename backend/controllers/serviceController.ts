import { Request, Response } from "express";
import * as serviceService from "../services/serviceService";

export async function getServices(req: Request, res: Response) {
  try {
    const services = await serviceService.getAllServices();
    res.json(services);
  } catch (error) {
    console.error("GET services error:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
}

export async function createService(req: Request, res: Response) {
  try {
    const result = await serviceService.createService(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Create service error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to create service",
    });
  }
}

export async function updateServiceStatus(req: Request, res: Response) {
  try {
    const serviceId = Number(req.params.id);
    const result = await serviceService.updateServiceStatus(serviceId, req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Update service status error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to update service status",
    });
  }
}