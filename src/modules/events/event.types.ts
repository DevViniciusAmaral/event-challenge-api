import type { Timestamp } from "firebase-admin/firestore";

export type EventStatus = "draft" | "published";

export interface EventMovie {
  name: string;
  youtubeUrl: string;
  description: string;
}

export interface FirestoreEvent {
  id: string;
  movie: EventMovie;
  date: string;
  hours: string;
  local: string;
  capacity: number;
  price: number;
  status: EventStatus;
  availableTickets: number;
  organizerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Event {
  id: string;
  movie: EventMovie;
  date: string;
  hours: string;
  local: string;
  capacity: number;
  price: number;
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
  movie: EventMovie;
  date: string;
  hours: string;
  local: string;
  capacity: number;
  price: number;
}
