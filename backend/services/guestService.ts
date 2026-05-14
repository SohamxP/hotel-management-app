import * as guestRepository from "../repositories/guestRepository";

export async function getAllGuests() {
  return guestRepository.findAllGuests();
}

export async function getGuestById(guestId: number) {
  if (!guestId) {
    throw {
      status: 400,
      message: "Guest ID is required",
    };
  }

  const guest = await guestRepository.findGuestById(guestId);

  if (!guest) {
    throw {
      status: 404,
      message: "Guest not found",
    };
  }

  return guest;
}