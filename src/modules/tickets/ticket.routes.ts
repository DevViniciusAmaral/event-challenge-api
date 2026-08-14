import Elysia, { t } from "elysia";
import * as ticketService from "./ticket.service";
import { notFound, internalError } from "../../shared/errors";

export const ticketRoutes = new Elysia({ prefix: "/tickets" })
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const ticket = await ticketService.getTicketWithEvent(params.id);
        if (!ticket) {
          set.status = 404;
          return notFound("Ingresso não encontrado.", "TICKET_NOT_FOUND");
        }
        return ticket;
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Consultar ingresso por ID",
        tags: ["Ingressos"],
      },
    }
  )
  .post(
    "/:code/validate",
    async ({ params, set }) => {
      try {
        const result = await ticketService.validateTicket(params.code);
        if (!result.valid) {
          set.status = 200;
        }
        return result;
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      params: t.Object({ code: t.String() }),
      detail: {
        summary: "Validar ingresso pelo código (portaria)",
        tags: ["Portaria"],
      },
    }
  );
