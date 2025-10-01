import { describe, expect, it } from "vitest";
import { formatTicketCode } from "./api";

describe("formatTicketCode", () => {
  it("pads numbers to 3 digits", () => {
    expect(formatTicketCode("S1", 5)).toBe("S1-005");
    expect(formatTicketCode("S2", 42)).toBe("S2-042");
    expect(formatTicketCode("S3", 123)).toBe("S3-123");
  });
});
