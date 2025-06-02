import { describe, it, expect } from "@jest/globals";
import { ELEMENT_STATES } from "../constants/index.js";

describe("Element State Constants", () => {
  it("should have the correct state values", () => {
    expect(ELEMENT_STATES.NEW).toBe("N");
    expect(ELEMENT_STATES.PERSISTED).toBe("P");
    expect(ELEMENT_STATES.REMOVED).toBe("R");
  });

  it("should have all required state properties", () => {
    expect(ELEMENT_STATES).toHaveProperty("NEW");
    expect(ELEMENT_STATES).toHaveProperty("PERSISTED");
    expect(ELEMENT_STATES).toHaveProperty("REMOVED");
  });
});
