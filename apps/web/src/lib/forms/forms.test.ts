import { afterEach, describe, expect, it, vi } from "vitest";
import { dictionaries } from "@/content";
import { formatPhone, isValidPhone, normalizePhone } from "./phone";
import { contactSchema, fieldErrors, referralSchema } from "./schemas";
import { MAX_SENDS, MIN_FILL_MS, WINDOW_MS, checkSpam, readRecent, recordSend } from "./spam";
import { buildMailtoUrl, buildWhatsAppUrl, limitMessage, submitLead, whatsappSubmission } from "./submit";

describe("normalizePhone: accepted ways to write a Moroccan number", () => {
  it.each([
    ["06 12 34 56 78", "+212612345678"],
    ["0612345678", "+212612345678"],
    ["06-12-34-56-78", "+212612345678"],
    ["06.12.34.56.78", "+212612345678"],
    ["+212 6 12 34 56 78", "+212612345678"],
    ["+212612345678", "+212612345678"],
    ["00212612345678", "+212612345678"],
    ["212612345678", "+212612345678"],
    ["612345678", "+212612345678"],
    ["+212 0612345678", "+212612345678"],
    ["07 61 23 45 67", "+212761234567"],
    ["05 39 12 34 56", "+212539123456"],
    ["(0612) 345 678", "+212612345678"],
    ["  0612345678  ", "+212612345678"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe("normalizePhone: other countries", () => {
  it.each([
    ["+33 6 12 34 56 78", "+33612345678"],
    ["0033612345678", "+33612345678"],
    ["+1 415 555 2671", "+14155552671"],
    ["+34 612 34 56 78", "+34612345678"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe("normalizePhone: refused values", () => {
  it.each(["", "   ", "abc", "06123", "0612345678900", "+212 1 12 34 56 78", "+212 6 12 34 56", "12345678", "+0 1234567890", "06 12 34 56 7x", "00", "+"])(
    "refuses %j",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
      expect(isValidPhone(input)).toBe(false);
    },
  );

  it("formats a Moroccan number to be easy to read", () => {
    expect(formatPhone("+212612345678")).toBe("+212 6 12 34 56 78");
    expect(formatPhone("+33612345678")).toBe("+33612345678");
  });
});

describe("contact form rules", () => {
  const errors = dictionaries.fr.contact.form.errors;
  const schema = contactSchema(errors);
  const valid = { name: "Sara Benali", phone: "06 12 34 56 78", business: "Atlas Immo, Tanger", need: "Site vitrine", details: "" };

  it("accepts good answers and cleans the phone number", () => {
    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("+212612345678");
  });

  it("accepts Arabic and accented names", () => {
    expect(schema.safeParse({ ...valid, name: "سارة بنعلي" }).success).toBe(true);
    expect(schema.safeParse({ ...valid, name: "Élodie Ouazzani-Chahdi" }).success).toBe(true);
  });

  it("explains each problem in the visitor language", () => {
    const result = schema.safeParse({ ...valid, name: "  ", phone: "123", need: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = fieldErrors(result.error);
      expect(messages.name).toBe(errors.name);
      expect(messages.phone).toBe(errors.phone);
      expect(messages.need).toBe(errors.need);
    }
  });

  it("limits the length of every field", () => {
    expect(schema.safeParse({ ...valid, name: "x".repeat(81) }).success).toBe(false);
    expect(schema.safeParse({ ...valid, business: "x".repeat(121) }).success).toBe(false);
    expect(schema.safeParse({ ...valid, details: "x".repeat(1001) }).success).toBe(false);
    expect(schema.safeParse({ ...valid, details: "x".repeat(1000) }).success).toBe(true);
  });

  it("refuses control characters", () => {
    expect(schema.safeParse({ ...valid, name: "Sara\u0000" }).success).toBe(false);
  });
});

describe("referral form rules", () => {
  const schema = referralSchema(dictionaries.en.referrals.form.errors);
  const valid = { yourName: "Sara", yourPhone: "0612345678", theirName: "Karim", theirPhone: "", reward: "Credit" };

  it("allows an empty phone for the referred person", () => {
    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.theirPhone).toBe("");
  });

  it("checks the phone of the referred person when it is given", () => {
    expect(schema.safeParse({ ...valid, theirPhone: "12" }).success).toBe(false);
    const ok = schema.safeParse({ ...valid, theirPhone: "0661234567" });
    expect(ok.success && ok.data.theirPhone).toBe("+212661234567");
  });
});

describe("spam control", () => {
  const base = { honeypot: "", startedAt: 1_000_000, now: 1_000_000 + MIN_FILL_MS + 1, recent: [] as number[] };

  it("lets a normal visitor through", () => {
    expect(checkSpam(base)).toBe("ok");
  });

  it("stops a filled honeypot", () => {
    expect(checkSpam({ ...base, honeypot: "http://spam.example" })).toBe("honeypot");
  });

  it("stops a form sent too fast", () => {
    expect(checkSpam({ ...base, now: base.startedAt + 500 })).toBe("too-fast");
  });

  it("stops more than the allowed sends in the time window", () => {
    const recent = Array.from({ length: MAX_SENDS }, (_, i) => base.now - 1000 * (i + 1));
    expect(checkSpam({ ...base, recent })).toBe("rate-limited");
  });

  it("forgets old sends", () => {
    const old = Array.from({ length: MAX_SENDS }, () => base.now - WINDOW_MS - 1);
    expect(checkSpam({ ...base, recent: old })).toBe("ok");
  });

  it("remembers sends in storage and survives broken storage", () => {
    const memory = new Map<string, string>();
    const storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => void memory.set(k, v) };
    recordSend(storage, 5000);
    recordSend(storage, 6000);
    expect(readRecent(storage, 7000)).toEqual([5000, 6000]);

    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readRecent(broken, 7000)).toEqual([]);
    expect(() => recordSend(broken, 7000)).not.toThrow();
    expect(readRecent(null, 1)).toEqual([]);
  });
});

describe("sending", () => {
  afterEach(() => vi.unstubAllGlobals());

  const context = { whatsappNumber: "212612345678", email: "a@b.ma", subject: "Free design", message: "Hello\nName: Sara" };

  it("builds a WhatsApp link with the message encoded", () => {
    expect(buildWhatsAppUrl("212612345678", "Hello Sara")).toBe("https://wa.me/212612345678?text=Hello%20Sara");
    expect(buildWhatsAppUrl("212612345678", "سلام")).toContain(encodeURIComponent("سلام"));
  });

  it("builds an email draft", () => {
    expect(buildMailtoUrl("a@b.ma", "Free design", "Hi")).toBe("mailto:a@b.ma?subject=Free%20design&body=Hi");
  });

  it("cuts a very long message so the link still opens", () => {
    const long = "a".repeat(5000);
    expect(limitMessage(long).length).toBeLessThanOrEqual(1400);
    expect(limitMessage(long).endsWith("…")).toBe(true);
    expect(limitMessage("short")).toBe("short");
  });

  it("uses WhatsApp when no backend is configured", async () => {
    const result = await submitLead({ kind: "contact", locale: "fr", page: "/fr/contact/", fields: {} }, context);
    expect(result.channel).toBe("whatsapp");
    expect(whatsappSubmission(context)).toMatchObject({ channel: "whatsapp" });
  });

  it("posts to the backend when its address is set, and falls back to WhatsApp if it fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true }).mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const lead = { kind: "contact" as const, locale: "en", page: "/en/contact/", fields: { name: "Sara" } };
    expect((await submitLead(lead, context)).channel).toBe("api");
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/v1/leads", expect.objectContaining({ method: "POST" }));
    expect((await submitLead(lead, context)).channel).toBe("whatsapp");
    vi.unstubAllEnvs();
  });
});
