import { object, string } from "valibot";
import { describe, expect, test } from "vitest";
import { parse } from "../parse";
import { createFormData } from "./helpers/FormData";

describe("string", () => {
  test("should pass only strings", () => {
    const schema = object({ name: string() });

    const output = parse(createFormData("name", "Jane"), { schema });

    expect(output).toMatchObject({ error: {}, value: { name: "Jane" } });
    expect(parse(createFormData("name", ""), { schema })).toMatchObject({
      error: { name: ["Invalid type"] },
    });
  });
});
