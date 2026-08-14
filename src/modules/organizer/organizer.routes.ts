import Elysia from "elysia";
import * as eventService from "../events/event.service";
import { internalError } from "../../shared/errors";

const ORGANIZER_ID = process.env.ORGANIZER_ID ?? "default-organizer";

export const organizerRoutes = new Elysia({ prefix: "/organizer" })
  .get(
    "/events",
    async ({ set }) => {
      try {
        const events = await eventService.listOrganizerEvents(ORGANIZER_ID);
        return { data: events, total: events.length };
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      detail: {
        summary: "Listar eventos do organizador",
        tags: ["Organizador"],
        description:
          "Retorna todos os eventos do organizador configurado via ORGANIZER_ID. Futuramente substituído por autenticação real.",
      },
    }
  )

  .get(
    "/stats",
    async ({ set }) => {
      try {
        const stats = await eventService.getOrganizerStats(ORGANIZER_ID);
        return stats;
      } catch (err) {
        set.status = 500;
        return internalError();
      }
    },
    {
      detail: {
        summary: "Estatísticas do organizador",
        tags: ["Organizador"],
      },
    }
  );
