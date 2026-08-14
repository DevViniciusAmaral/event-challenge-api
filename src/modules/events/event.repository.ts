import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../config/firebase";
import { serializeRecord, serializeRecords } from "../../shared/serialize";
import type { FirestoreEvent, Event, CreateEventInput } from "./event.types";

const COLLECTION = "events";

function getCreatedAtMillis(event: FirestoreEvent): number {
  const createdAt = event.createdAt as
    | { toMillis?: () => number; seconds?: number }
    | undefined;

  if (createdAt?.toMillis) {
    return createdAt.toMillis();
  }

  if (typeof createdAt?.seconds === "number") {
    return createdAt.seconds * 1000;
  }

  return 0;
}

function sortByCreatedAtDesc(events: FirestoreEvent[]): FirestoreEvent[] {
  return events.sort((a, b) => getCreatedAtMillis(b) - getCreatedAtMillis(a));
}

export async function findPublishedEvents(): Promise<Event[]> {
  const snapshot = await db
    .collection(COLLECTION)
    .where("status", "==", "published")
    .get();

  const events = sortByCreatedAtDesc(
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FirestoreEvent)
  );

  return serializeRecords(events) as Event[];
}

export async function findEventById(id: string): Promise<Event | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeRecord({ id: doc.id, ...doc.data() } as FirestoreEvent) as Event;
}

export async function findEventsByOrganizer(organizerId: string): Promise<Event[]> {
  const snapshot = await db
    .collection(COLLECTION)
    .where("organizerId", "==", organizerId)
    .get();

  const events = sortByCreatedAtDesc(
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FirestoreEvent)
  );

  return serializeRecords(events) as Event[];
}

export async function createEvent(
  input: CreateEventInput,
  organizerId: string
): Promise<Event> {
  const ref = db.collection(COLLECTION).doc();

  const now = FieldValue.serverTimestamp();
  const data = {
    ...input,
    status: "draft" as const,
    availableTickets: input.capacity,
    organizerId,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(data);

  const created = await ref.get();
  return serializeRecord({ id: created.id, ...created.data() } as FirestoreEvent) as Event;
}

export async function publishEvent(id: string): Promise<Event | null> {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;

  await ref.update({
    status: "published",
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();
  return serializeRecord({ id: updated.id, ...updated.data() } as FirestoreEvent) as Event;
}

export async function updateEventAvailableTickets(
  id: string,
  availableTickets: number
): Promise<Event | null> {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;

  await ref.update({
    availableTickets,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();
  return serializeRecord({ id: updated.id, ...updated.data() } as FirestoreEvent) as Event;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;

  await ref.delete();
  return true;
}
