import type { Event, EventWithAvailability, CreateEventInput } from "./event.types";
import * as eventRepo from "./event.repository";
import * as ticketRepo from "../tickets/ticket.repository";

export async function listPublishedEvents(
  search?: string
): Promise<{ data: Event[]; total: number }> {
  const events = await eventRepo.findPublishedEvents();

  const filtered = search
    ? events.filter(
        (e) =>
          e.movie.name.toLowerCase().includes(search.toLowerCase()) ||
          e.movie.description.toLowerCase().includes(search.toLowerCase()) ||
          e.local.toLowerCase().includes(search.toLowerCase())
      )
    : events;

  return { data: filtered, total: filtered.length };
}

export async function getEventDetails(
  id: string
): Promise<EventWithAvailability | null> {
  const event = await eventRepo.findEventById(id);
  if (!event) return null;

  const ticketsSold = await ticketRepo.countTicketsSoldForEvent(id);

  return { ...event, ticketsSold };
}

export async function createEvent(
  input: CreateEventInput,
  organizerId: string
): Promise<Event> {
  return eventRepo.createEvent(input, organizerId);
}

export async function publishEvent(id: string): Promise<Event | null> {
  return eventRepo.publishEvent(id);
}

export type DeleteEventResult =
  | { success: true }
  | { success: false; status: number; code: string; message: string };

export async function deleteEvent(
  id: string,
  organizerId: string
): Promise<DeleteEventResult> {
  const event = await eventRepo.findEventById(id);
  if (!event) {
    return {
      success: false,
      status: 404,
      code: "EVENT_NOT_FOUND",
      message: "Evento não encontrado.",
    };
  }

  if (event.organizerId !== organizerId) {
    return {
      success: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Apenas o organizador do evento pode excluí-lo.",
    };
  }

  const ticketsSold = await ticketRepo.countTicketsSoldForEvent(id);
  if (ticketsSold > 0) {
    return {
      success: false,
      status: 409,
      code: "EVENT_HAS_TICKETS",
      message: "Não é possível excluir um evento com ingressos vendidos.",
    };
  }

  const deleted = await eventRepo.deleteEvent(id);
  if (!deleted) {
    return {
      success: false,
      status: 404,
      code: "EVENT_NOT_FOUND",
      message: "Evento não encontrado.",
    };
  }

  return { success: true };
}

export async function listOrganizerEvents(
  organizerId: string
): Promise<Event[]> {
  return eventRepo.findEventsByOrganizer(organizerId);
}

export async function getOrganizerStats(organizerId: string) {
  const events = await eventRepo.findEventsByOrganizer(organizerId);

  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === "published").length;

  const now = new Date();
  const upcomingEvents = events.filter((e) => {
    if (e.status !== "published") return false;
    const eventDate = new Date(`${e.date}T${e.hours}`);
    return eventDate > now;
  }).length;

  const eventIds = events.map((e) => e.id);
  const { totalTicketsSold, totalRevenue } =
    await ticketRepo.getTicketStatsByEvents(eventIds);

  return {
    totalEvents,
    publishedEvents,
    totalTicketsSold,
    totalRevenue,
    upcomingEvents,
  };
}
