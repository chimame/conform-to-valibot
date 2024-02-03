import { describe, expect, test } from "vitest";
import { string, object, optional, nullable } from "valibot";
import { parse } from "../parse";
import { createFormData } from "./helpers/FormData";

describe("pipe", () => {
  test("should pass also undefined", () => {
    const schema = object({ name: optional(nullable(string()), null) });
    const output = parse(createFormData("name", ""), { schema: schema });
    expect(output).toMatchObject({ error: {}, value: { name: null } });
  });
});
