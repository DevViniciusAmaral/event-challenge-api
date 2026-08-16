import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

import { eventRoutes } from "./modules/events/event.routes";
import { ticketRoutes } from "./modules/tickets/ticket.routes";
import { organizerRoutes } from "./modules/organizer/organizer.routes";

export const app = new Elysia()
  .use(
    cors({ origin: "*" }))
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Event Challenge API",
          version: "1.0.0",
          description:
            "API da plataforma de eventos e ingressos. Desenvolvida com Bun, Elysia e Firebase Admin SDK.",
        },
        tags: [
          { name: "Eventos", description: "Consulta e gestão de eventos" },
          { name: "Ingressos", description: "Compra e consulta de ingressos" },
          { name: "Organizador", description: "Área do organizador" },
          { name: "Portaria", description: "Validação de ingressos" },
        ],
      },
    })
  )
  .get("/swagger", () => Response.redirect("/docs", 302))
  .group("/api", (app) =>
    app
      .use(eventRoutes)
      .use(ticketRoutes)
      .use(organizerRoutes)
  );
