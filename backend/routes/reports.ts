import express from "express";
import {
  authorize,
  verifyToken,
} from "../middleware/auth";
import { prisma } from "../prismaClient";
import { RoomType } from "../generated/prisma/client";

const router = express.Router();

function roomTypeToLegacy(
  value: RoomType
): string {
  switch (value) {
    case RoomType.KING:
      return "King";
    case RoomType.QUEEN:
      return "Queen";
    case RoomType.DELUXE:
      return "Deluxe";
    case RoomType.ACCESSIBLE:
      return "Accessible";
  }
}

router.get(
  "/room-type-summary",
  verifyToken,
  authorize("Manager"),
  async (req, res) => {
    try {
      const groups =
        await prisma.room.groupBy({
          by: ["roomType"],
          _count: {
            roomNumber: true,
          },
          _avg: {
            ratePerNight: true,
          },
          orderBy: {
            _count: {
              roomNumber: "desc",
            },
          },
        });

      const result = groups.map(
        (group) => ({
          RoomType:
            roomTypeToLegacy(
              group.roomType
            ),
          count:
            group._count.roomNumber,
          avgRate: Number(
            (
              group._avg
                .ratePerNight ?? 0
            ).toFixed(2)
          ),
        })
      );

      res.json(result);
    } catch (error) {
      console.error(
        "Reports error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch report",
      });
    }
  }
);

export default router;