import type { Timestamp } from "firebase-admin/firestore";

export type EventStatus = "draft" | "published";

export interface FirestoreEvent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  capacity: number;
  ticketPrice: number;
  status: EventStatus;
  availableTickets: number;
  organizerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  capacity: number;
  ticketPrice: number;
  status: EventStatus;
  availableTickets: number;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventWithAvailability extends Event {
  ticketsSold: number;
}

export interface CreateEventInput {
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  capacity: number;
  ticketPrice: number;
}
