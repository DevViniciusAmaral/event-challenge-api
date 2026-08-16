import Elysia, { t } from "elysia";
import { createEventSchema } from "./event.schema";
import * as eventService from "./event.service";
import { notFound, internalError, conflict, badRequest } from "../../shared/errors";

const ORGANIZER_ID = process.env.ORGANIZER_ID ?? "default-organizer";

export const eventRoutes = new Elysia({ prefix: "/events" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const result = await eventService.listPublishedEvents(query.search);
        return result;
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String({ description: "Busca por nome do movie, descrição ou local" })),
      }),
      detail: {
        summary: "Listar eventos publicados",
        tags: ["Eventos"],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const event = await eventService.getEventDetails(params.id);
        if (!event) {
          set.status = 404;
          return notFound("Evento não encontrado.", "EVENT_NOT_FOUND");
        }
        return event;
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Detalhes de um evento",
        tags: ["Eventos"],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const event = await eventService.createEvent(body, ORGANIZER_ID);
        set.status = 201;
        return event;
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      body: createEventSchema,
      detail: {
        summary: "Criar novo evento",
        tags: ["Eventos"],
      },
    }
  )
  .patch(
    "/:id/publish",
    async ({ params, set }) => {
      try {
        const event = await eventService.publishEvent(params.id);
        if (!event) {
          set.status = 404;
          return notFound("Evento não encontrado.", "EVENT_NOT_FOUND");
        }
        return event;
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Publicar evento",
        tags: ["Eventos"],
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      try {
        const result = await eventService.deleteEvent(params.id, ORGANIZER_ID);

        if (!result.success) {
          set.status = result.status;
          if (result.status === 404) {
            return notFound(result.message, result.code);
          }
          if (result.status === 409) {
            return conflict(result.message, result.code);
          }
          if (result.status === 403 || result.status === 400) {
            return badRequest(result.message, result.code);
          }
        }

        set.status = 204;
        return null;
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Excluir evento",
        tags: ["Eventos"],
        description:
          "Exclui um evento. Apenas o organizador pode excluir. Não é possível excluir eventos com ingressos vendidos.",
      },
    }
  )
  .post(
    "/:id/tickets",
    async ({ params, body, set }) => {
      try {
        const result = await import("../tickets/ticket.service").then((m) =>
          m.purchaseTicket(params.id, body)
        );

        if (!result.success) {
          set.status = result.status;
          return { error: { code: result.code, message: result.message } };
        }

        set.status = 201;
        return result.ticket;
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        buyerName: t.String({ minLength: 1 }),
        buyerEmail: t.String({ format: "email" }),
        quantity: t.Number({ minimum: 1 }),
      }),
      detail: {
        summary: "Comprar ingresso para um evento",
        tags: ["Ingressos"],
      },
    }
  );
