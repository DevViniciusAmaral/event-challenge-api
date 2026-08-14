import { t } from "elysia";

export const createEventSchema = t.Object({
  title: t.String({ minLength: 1, description: "Título do evento" }),
  description: t.String({ minLength: 1, description: "Descrição do evento" }),
  imageUrl: t.String({ minLength: 1, description: "URL da imagem do evento" }),
  date: t.String({
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    description: "Data do evento (YYYY-MM-DD)",
  }),
  time: t.String({
    pattern: "^\\d{2}:\\d{2}$",
    description: "Horário do evento (HH:MM)",
  }),
  venue: t.String({ minLength: 1, description: "Nome do local" }),
  address: t.String({ minLength: 1, description: "Endereço do local" }),
  capacity: t.Number({ minimum: 1, description: "Capacidade total de ingressos" }),
  ticketPrice: t.Number({ minimum: 0, description: "Preço do ingresso" }),
});
