import { t } from "elysia";

export const createEventSchema = t.Object({
  movie: t.Object(
    {
      name: t.String({ minLength: 1, description: "Nome do filme" }),
      youtubeUrl: t.String({ minLength: 1, description: "URL do trailer no YouTube" }),
      description: t.String({ minLength: 1, description: "Descrição do filme" }),
    },
    { description: "Dados do filme do evento" }
  ),
  date: t.String({
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    description: "Data do evento (YYYY-MM-DD)",
  }),
  hours: t.String({
    pattern: "^\\d{2}:\\d{2}$",
    description: "Horário do evento (HH:MM)",
  }),
  local: t.String({ minLength: 1, description: "Local do evento" }),
  capacity: t.Number({ minimum: 1, description: "Capacidade total de ingressos" }),
  price: t.Number({ minimum: 0, description: "Preço do ingresso" }),
});
