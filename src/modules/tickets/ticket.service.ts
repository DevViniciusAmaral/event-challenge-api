import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../config/firebase";
import * as ticketRepo from "./ticket.repository";
import * as eventRepo from "../events/event.repository";
import { serializeDeep } from "../../shared/serialize";
import type { Ticket } from "./ticket.types";
import type { Event, FirestoreEvent } from "../events/event.types";

export interface TicketWithEvent extends Ticket {
  event: Pick<Event, "id" | "title" | "date" | "time" | "venue">;
}

export interface PurchaseTicketInput {
  buyerName: string;
  buyerEmail: string;
  quantity: number;
}

export async function purchaseTicket(
  eventId: string,
  input: PurchaseTicketInput
): Promise<
  | { success: true; ticket: Ticket }
  | { success: false; status: number; code: string; message: string }
> {
  const eventRef = db.collection("events").doc(eventId);
  const ticketsRef = db.collection("tickets");
  let createdTicketId: string | null = null;

  try {
    await db.runTransaction(async (tx) => {
      const eventDoc = await tx.get(eventRef);

      if (!eventDoc.exists) {
        throw { status: 404, code: "EVENT_NOT_FOUND", message: "Evento não encontrado." };
      }

      const event = { id: eventDoc.id, ...eventDoc.data() } as FirestoreEvent;

      if (event.status !== "published") {
        throw { status: 400, code: "EVENT_NOT_PUBLISHED", message: "Este evento não está disponível para compra." };
      }

      if (event.availableTickets <= 0) {
        throw { status: 409, code: "EVENT_SOLD_OUT", message: "Todos os ingressos para este evento foram vendidos." };
      }

      if (input.quantity > event.availableTickets) {
        throw {
          status: 409,
          code: "INSUFFICIENT_CAPACITY",
          message: "Não há ingressos suficientes disponíveis.",
        };
      }

      const newTicketRef = ticketsRef.doc();
      const now = FieldValue.serverTimestamp();

      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "EVT-";
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }

      const ticketData = {
        code,
        eventId,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        quantity: input.quantity,
        totalPrice: parseFloat((event.ticketPrice * input.quantity).toFixed(2)),
        status: "valid" as const,
        createdAt: now,
        updatedAt: now,
      };

      tx.set(newTicketRef, ticketData);
      createdTicketId = newTicketRef.id;

      tx.update(eventRef, {
        availableTickets: Math.max(0, event.availableTickets - input.quantity),
        updatedAt: now,
      });

      return { id: newTicketRef.id, ...ticketData } as Ticket;
    });

    if (!createdTicketId) {
      throw new Error("Ticket ID was not generated.");
    }

    const createdTicket = await ticketRepo.findTicketById(createdTicketId);

    if (!createdTicket) {
      throw new Error("Ticket was created but could not be loaded.");
    }

    return { success: true, ticket: createdTicket };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      "code" in err &&
      "message" in err
    ) {
      const e = err as { status: number; code: string; message: string };
      return { success: false, status: e.status, code: e.code, message: e.message };
    }
    throw err;
  }
}

export async function getTicketWithEvent(
  id: string
): Promise<TicketWithEvent | null> {
  const ticket = await ticketRepo.findTicketById(id);
  if (!ticket) return null;

  const event = await eventRepo.findEventById(ticket.eventId);
  const eventSummary = event
    ? { id: event.id, title: event.title, date: event.date, time: event.time, venue: event.venue }
    : { id: ticket.eventId, title: "Evento não encontrado", date: "", time: "", venue: "" };

  return serializeDeep({ ...ticket, event: eventSummary });
}

export async function validateTicket(code: string): Promise<
  | { valid: true; ticket: { id: string; code: string; buyerName: string; event: { id: string; title: string } } }
  | { valid: false; message: string }
> {
  const ticket = await ticketRepo.findTicketByCode(code);

  if (!ticket) {
    return { valid: false, message: "Ingresso inválido." };
  }

  if (ticket.status === "used") {
    return { valid: false, message: "Ingresso já utilizado." };
  }

  if (ticket.status === "cancelled") {
    return { valid: false, message: "Ingresso cancelado." };
  }

  await ticketRepo.markTicketAsUsed(ticket.id);

  const event = await eventRepo.findEventById(ticket.eventId);
  const eventSummary = event
    ? { id: event.id, title: event.title }
    : { id: ticket.eventId, title: "Evento não encontrado" };

  return {
    valid: true,
    ticket: {
      id: ticket.id,
      code: ticket.code,
      buyerName: ticket.buyerName,
      event: eventSummary,
    },
  };
}
