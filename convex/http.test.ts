/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { parseCompletionBody } from "./http";

test("parseCompletionBody accepts a well-formed completion payload", () => {
  const parsed = parseCompletionBody({
    agentId: "kg27f12h6g3hjmskn5s251hw7x8erg7k",
    deliverables: [
      {
        requestId: "kg27f12h6g3hjmskn5s251hw7x8erg7j",
        contentId: "kg27f12h6g3hjmskn5s251hw7x8erg7i",
        contentTitle: "Immunity Boosting Soups",
        isReused: false,
        reuseNote: undefined,
      },
    ],
  });

  expect(parsed).not.toBeNull();
  expect(parsed?.agentId).toBe("kg27f12h6g3hjmskn5s251hw7x8erg7k");
  expect(parsed?.deliverables).toHaveLength(1);
  expect(parsed?.deliverables[0].isReused).toBe(false);
});

test("parseCompletionBody rejects malformed payloads", () => {
  // Missing agentId
  expect(parseCompletionBody({ deliverables: [] })).toBeNull();
  // deliverables not an array
  expect(parseCompletionBody({ agentId: "a", deliverables: "nope" })).toBeNull();
  // requestId wrong type
  expect(
    parseCompletionBody({ agentId: "a", deliverables: [{ requestId: 42, isReused: true }] })
  ).toBeNull();
  // isReused missing
  expect(
    parseCompletionBody({ agentId: "a", deliverables: [{ requestId: "r" }] })
  ).toBeNull();
  // Non-object body
  expect(parseCompletionBody("hello")).toBeNull();
  expect(parseCompletionBody(null)).toBeNull();
});

test("parseCompletionBody allows an empty deliverables array (nothing delivered)", () => {
  const parsed = parseCompletionBody({ agentId: "a", deliverables: [] });
  expect(parsed).not.toBeNull();
  expect(parsed?.deliverables).toHaveLength(0);
});
