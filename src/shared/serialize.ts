type TimestampLike =
  | { toMillis?: () => number; seconds?: number; nanoseconds?: number }
  | number
  | string
  | Date
  | null
  | undefined;

function timestampToIsoString(value: TimestampLike): string | undefined {
  if (value == null) return undefined;

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value.toMillis === "function") {
    const millis = value.toMillis();
    if (Number.isFinite(millis)) {
      return new Date(millis).toISOString();
    }
  }

  if (typeof value.seconds === "number") {
    const millis =
      value.seconds * 1000 +
      (typeof value.nanoseconds === "number"
        ? Math.floor(value.nanoseconds / 1_000_000)
        : 0);

    return new Date(millis).toISOString();
  }

  return undefined;
}

type AnyRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is AnyRecord {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

type DateField = "createdAt" | "updatedAt";

const DEFAULT_DATE_FIELDS: DateField[] = ["createdAt", "updatedAt"];

function normalizeDateFields<T extends AnyRecord>(
  record: T,
  fields: readonly DateField[] = DEFAULT_DATE_FIELDS
): T {
  const next = { ...record } as AnyRecord;

  for (const field of fields) {
    if (field in next) {
      const normalized = timestampToIsoString(next[field] as TimestampLike);
      if (normalized !== undefined) {
        next[field] = normalized;
      }
    }
  }

  return next as T;
}

export function serializeRecord<T extends AnyRecord>(
  value: T,
  dateFields: readonly DateField[] = DEFAULT_DATE_FIELDS
): T {
  return normalizeDateFields(value, dateFields);
}

export function serializeRecords<T extends AnyRecord>(
  values: readonly T[],
  dateFields: readonly DateField[] = DEFAULT_DATE_FIELDS
): T[] {
  return values.map((value) => serializeRecord(value, dateFields));
}

export function serializeDeep<T>(value: T): T {
  if (value == null) return value;

  if (Array.isArray(value)) {
    return value.map((item) => serializeDeep(item)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const normalized = normalizeDateFields(value);
    const next: AnyRecord = {};

    for (const key of Object.keys(normalized)) {
      const entry = (normalized as AnyRecord)[key];

      if (DEFAULT_DATE_FIELDS.includes(key as DateField) && typeof entry === "string") {
        next[key] = entry;
        continue;
      }

      next[key] = serializeDeep(entry);
    }

    return next as T;
  }

  return value;
}
