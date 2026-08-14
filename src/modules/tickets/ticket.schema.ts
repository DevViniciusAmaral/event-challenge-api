import { t } from "elysia";

export const createTicketSchema = t.Object({
  buyerName: t.String({ minLength: 1, description: "Nome do comprador" }),
  buyerEmail: t.String({
    format: "email",
    description: "E-mail do comprador",
  }),
  quantity: t.Number({ minimum: 1, description: "Quantidade de ingressos" }),
});

export const validateTicketSchema = t.Object({
  code: t.String({ minLength: 1, description: "Código do ingresso" }),
});
