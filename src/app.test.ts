import { beforeEach, describe, expect, mock, test } from "bun:test";

let listPublishedEventsImpl: (search?: string) => Promise<unknown>;
let getEventDetailsImpl: (id: string) => Promise<unknown>;
let createEventImpl: (body: unknown, organizerId: string) => Promise<unknown>;
let publishEventImpl: (id: string) => Promise<unknown>;
let listOrganizerEventsImpl: (organizerId: string) => Promise<unknown>;
let getOrganizerStatsImpl: (organizerId: string) => Promise<unknown>;

let purchaseTicketImpl: (eventId: string, body: unknown) => Promise<unknown>;
let getTicketWithEventImpl: (id: string) => Promise<unknown>;
let validateTicketImpl: (code: string) => Promise<unknown>;

mock.module("./modules/events/event.service", () => ({
  listPublishedEvents: (search?: string) => listPublishedEventsImpl(search),
  getEventDetails: (id: string) => getEventDetailsImpl(id),
  createEvent: (body: unknown, organizerId: string) =>
    createEventImpl(body, organizerId),
  publishEvent: (id: string) => publishEventImpl(id),
  listOrganizerEvents: (organizerId: string) =>
    listOrganizerEventsImpl(organizerId),
  getOrganizerStats: (organizerId: string) =>
    getOrganizerStatsImpl(organizerId),
}));

mock.module("./modules/tickets/ticket.service", () => ({
  purchaseTicket: (eventId: string, body: unknown) =>
    purchaseTicketImpl(eventId, body),
  getTicketWithEvent: (id: string) => getTicketWithEventImpl(id),
  validateTicket: (code: string) => validateTicketImpl(code),
}));

const { app } = await import("./app");

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const hasStringTimestamps = (record: Record<string, unknown>) =>
  ["createdAt", "updatedAt"].every((field) => {
    const value = record[field];
    if (value === undefined) return true;
    if (!isIsoDate(value)) return false;
    if (typeof value !== "string") return false;
    const parsed = JSON.parse(JSON.stringify(value));
    return typeof parsed === "string";
  });

describe("App routes", () => {
  beforeEach(() => {
    listPublishedEventsImpl = async () => ({
      data: [
        {
          id: "event-1",
          movie: { name: "Matrix", description: "Filme" },
          date: "2026-12-20",
          hours: "20:00",
          local: "Cinema",
          capacity: 100,
          price: 50,
          availableTickets: 90,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      total: 1,
    });
    getEventDetailsImpl = async (id: string) =>
      id === "event-1"
        ? {
            id,
            movie: { name: "Matrix", description: "Filme" },
            date: "2026-12-20",
            hours: "20:00",
            local: "Cinema Central",
            capacity: 100,
            price: 50,
            status: "published",
            organizerId: "default-organizer",
            ticketsSold: 10,
            availableTickets: 90,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
          }
        : null;
    createEventImpl = async (body: unknown, organizerId: string) => ({
      id: "event-new",
      organizerId,
      status: "draft",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...(body as Record<string, unknown>),
    });
    publishEventImpl = async (id: string) =>
      id === "event-1"
        ? {
            id,
            status: "published",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-03T00:00:00.000Z",
          }
        : null;
    listOrganizerEventsImpl = async () => [
      {
        id: "event-1",
        movie: { name: "Matrix", description: "Filme" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    getOrganizerStatsImpl = async () => ({
      totalEvents: 1,
      publishedEvents: 1,
      totalTicketsSold: 10,
      totalRevenue: 500,
      upcomingEvents: 1,
    });

    purchaseTicketImpl = async (eventId: string, body: unknown) => ({
      success: true,
      ticket: {
        id: "ticket-1",
        code: "EVT-123456",
        eventId,
        status: "valid",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...(body as Record<string, unknown>),
      },
    });
    getTicketWithEventImpl = async (id: string) =>
      id === "ticket-1"
        ? {
            id,
            code: "EVT-123456",
            buyerName: "Ana",
            quantity: 2,
            totalPrice: 100,
            status: "valid",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            event: {
              id: "event-1",
              title: "Matrix",
              date: "2026-12-20",
              hours: "20:00",
              local: "Cinema",
            },
          }
        : null;
    validateTicketImpl = async (code: string) =>
      code === "EVT-123456"
        ? {
            valid: true,
            ticket: {
              id: "ticket-1",
              code,
              buyerName: "Ana",
              event: { id: "event-1", title: "Matrix" },
            },
          }
        : { valid: false, message: "Ingresso inválido." };
  });

  test("GET /docs returns swagger page", async () => {
    const response = await app.handle(new Request("http://localhost/docs"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });

  test("GET /swagger redirects to /docs", async () => {
    const response = await app.handle(new Request("http://localhost/swagger"));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("/docs");
  });

  test("GET /api/events returns published events", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/events?search=matrix")
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      data: Record<string, unknown>[];
      total: number;
    };
    expect(json.total).toBe(1);
    expect(json.data[0]).toMatchObject({ id: "event-1", movie: { name: "Matrix" } });
    expect(hasStringTimestamps(json.data[0])).toBe(true);
  });

  test("GET /api/events/:id returns event details", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/events/event-1")
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json).toMatchObject({
      id: "event-1",
      availableTickets: 90,
    });
    expect(hasStringTimestamps(json)).toBe(true);
  });

  test("GET /api/events/:id returns 404 when event is missing", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/events/missing")
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "EVENT_NOT_FOUND",
        message: "Evento não encontrado.",
      },
    });
  });

  test("POST /api/events creates a draft event", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          movie: {
            name: "Matrix",
            description: "Clássico de ficção científica",
          },
          date: "2026-12-20",
          hours: "20:00",
          local: "Cinema Central",
          capacity: 100,
          price: 50,
        }),
      })
    );

    expect(response.status).toBe(201);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json).toMatchObject({
      id: "event-new",
      status: "draft",
      organizerId: "default-organizer",
    });
    expect(hasStringTimestamps(json)).toBe(true);
  });

  test("PATCH /api/events/:id/publish publishes an event", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/events/event-1/publish", {
        method: "PATCH",
      })
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json).toEqual({
      id: "event-1",
      status: "published",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });
    expect(hasStringTimestamps(json)).toBe(true);
  });

  test("POST /api/events/:id/tickets creates a ticket", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/events/event-1/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          buyerName: "Ana",
          buyerEmail: "ana@email.com",
          quantity: 2,
        }),
      })
    );

    expect(response.status).toBe(201);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json).toMatchObject({
      id: "ticket-1",
      eventId: "event-1",
      buyerName: "Ana",
    });
    expect(hasStringTimestamps(json)).toBe(true);
  });

  test("POST /api/events/:id/tickets returns domain error from service", async () => {
    purchaseTicketImpl = async () => ({
      success: false,
      status: 409,
      code: "INSUFFICIENT_CAPACITY",
      message: "Não há ingressos suficientes disponíveis.",
    });

    const response = await app.handle(
      new Request("http://localhost/api/events/event-1/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          buyerName: "Ana",
          buyerEmail: "ana@email.com",
          quantity: 2,
        }),
      })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: {
        code: "INSUFFICIENT_CAPACITY",
        message: "Não há ingressos suficientes disponíveis.",
      },
    });
  });

  test("GET /api/tickets/:id returns a ticket", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/tickets/ticket-1")
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json).toMatchObject({
      id: "ticket-1",
      code: "EVT-123456",
    });
    expect(hasStringTimestamps(json)).toBe(true);
  });

  test("GET /api/tickets/:id returns 404 when ticket is missing", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/tickets/missing")
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "TICKET_NOT_FOUND",
        message: "Ingresso não encontrado.",
      },
    });
  });

  test("POST /api/tickets/:code/validate validates a ticket", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/tickets/EVT-123456/validate", {
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      valid: true,
      ticket: {
        id: "ticket-1",
        code: "EVT-123456",
      },
    });
  });

  test("POST /api/tickets/:code/validate returns invalid message", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/tickets/EVT-INVALID/validate", {
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      valid: false,
      message: "Ingresso inválido.",
    });
  });

  test("GET /api/organizer/events returns organizer events", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/organizer/events")
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      data: Record<string, unknown>[];
      total: number;
    };
    expect(json.total).toBe(1);
    expect(json.data[0]).toMatchObject({ id: "event-1", movie: { name: "Matrix" } });
    expect(hasStringTimestamps(json.data[0])).toBe(true);
  });

  test("GET /api/organizer/stats returns organizer stats", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/organizer/stats")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      totalEvents: 1,
      publishedEvents: 1,
      totalTicketsSold: 10,
      totalRevenue: 500,
      upcomingEvents: 1,
    });
  });
});
