import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../config/firebase";
import { serializeRecord } from "../../shared/serialize";
import type { Ticket, CreateTicketInput } from "./ticket.types";

const COLLECTION = "tickets";

function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "EVT-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function findTicketById(id: string): Promise<Ticket | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeRecord({ id: doc.id, ...doc.data() } as any) as unknown as Ticket;
}

export async function findTicketByCode(code: string): Promise<Ticket | null> {
  const snapshot = await db
    .collection(COLLECTION)
    .where("code", "==", code)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return serializeRecord({ id: doc.id, ...doc.data() } as any) as unknown as Ticket;
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const ref = db.collection(COLLECTION).doc();
  const now = FieldValue.serverTimestamp();

  const data = {
    ...input,
    code: generateTicketCode(),
    status: "valid" as const,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(data);

  const created = await ref.get();
  return serializeRecord({ id: created.id, ...created.data() } as any) as unknown as Ticket;
}

export async function markTicketAsUsed(id: string): Promise<void> {
  await db.collection(COLLECTION).doc(id).update({
    status: "used",
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function countTicketsSoldForEvent(eventId: string): Promise<number> {
  const snapshot = await db
    .collection(COLLECTION)
    .where("eventId", "==", eventId)
    .where("status", "in", ["valid", "used"])
    .get();

  return snapshot.docs.reduce((sum, doc) => {
    const data = doc.data();
    return sum + (data.quantity ?? 1);
  }, 0);
}

export async function getTicketStatsByEvents(
  eventIds: string[]
): Promise<{ totalTicketsSold: number; totalRevenue: number }> {
  if (eventIds.length === 0) {
    return { totalTicketsSold: 0, totalRevenue: 0 };
  }

  const chunkSize = 30;
  let totalTicketsSold = 0;
  let totalRevenue = 0;

  for (let i = 0; i < eventIds.length; i += chunkSize) {
    const chunk = eventIds.slice(i, i + chunkSize);
    const snapshot = await db
      .collection(COLLECTION)
      .where("eventId", "in", chunk)
      .where("status", "in", ["valid", "used"])
      .get();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalTicketsSold += data.quantity ?? 1;
      totalRevenue += data.totalPrice ?? 0;
    });
  }

  return { totalTicketsSold, totalRevenue };
}
