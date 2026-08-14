import type { Timestamp } from "firebase-admin/firestore";

export type TicketStatus = "valid" | "used" | "cancelled";

export interface FirestoreTicket {
  id: string;
  code: string;
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  totalPrice: number;
  status: TicketStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Ticket {
  id: string;
  code: string;
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  totalPrice: number;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  totalPrice: number;
}
