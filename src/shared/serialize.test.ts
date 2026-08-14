import { describe, expect, test } from "bun:test";
import { serializeDeep, serializeRecord, serializeRecords } from "./serialize";

describe("serialize", () => {
  test("serializeRecord converte createdAt e updatedAt para ISO string", () => {
    const value = serializeRecord({
      id: "abc",
      createdAt: { seconds: 1_700_000_000, nanoseconds: 123_000_000 } as never,
      updatedAt: { toMillis: () => 1_700_000_001_000 } as never,
    });

    expect(value).toEqual({
      id: "abc",
      createdAt: "2023-11-14T22:13:20.123Z",
      updatedAt: "2023-11-14T22:13:21.000Z",
    });
  });

  test("serializeRecords converte todos os itens", () => {
    const items = serializeRecords([
      {
        id: "a",
        createdAt: { seconds: 1_700_000_000 } as never,
      },
      {
        id: "b",
        createdAt: new Date("2024-01-01T00:00:00.000Z") as never,
      },
    ]);

    expect(items).toEqual([
      { id: "a", createdAt: "2023-11-14T22:13:20.000Z" },
      { id: "b", createdAt: "2024-01-01T00:00:00.000Z" },
    ]);
  });

  test("serializeDeep converte objetos aninhados", () => {
    const value = serializeDeep({
      id: "ticket-1",
      createdAt: { seconds: 1_700_000_000 } as never,
      event: {
        id: "event-1",
        updatedAt: { toMillis: () => 1_700_000_100_000 } as never,
      },
      list: [
        { createdAt: new Date("2024-06-01T10:00:00.000Z") as never },
      ],
    });

    expect(value).toEqual({
      id: "ticket-1",
      createdAt: "2023-11-14T22:13:20.000Z",
      event: {
        id: "event-1",
        updatedAt: "2023-11-14T22:15:00.000Z",
      },
      list: [{ createdAt: "2024-06-01T10:00:00.000Z" }],
    });
  });

  test("serializeRecord deixa passar campos de data ja serializados", () => {
    const fixed = "2024-01-01T00:00:00.000Z";
    const value = serializeRecord({
      id: "x",
      createdAt: fixed as never,
      updatedAt: fixed as never,
    });

    expect(value).toEqual({
      id: "x",
      createdAt: fixed,
      updatedAt: fixed,
    });
  });
});
