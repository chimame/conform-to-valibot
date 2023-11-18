import { describe, expect, test } from "vitest";
import { number, object, optional } from "valibot";
import { parse } from "../parse";
import { createFormData } from "./helpers/FormData";

describe("optional", () => {
  test("should pass also undefined", () => {
    const schema = object({ age: optional(number()) });
    const output = parse(createFormData("age", ""), { schema });

    expect(output).toMatchObject({ error: {}, value: { age: undefined } });
    expect(
      parse(createFormData("age", "20"), { schema }),
    ).toMatchObject({ error: {}, value: { age: 20 } });
    expect(
      parse(createFormData("age", "non number"), { schema }),
    ).toMatchObject({ error: { age: ["Invalid type"] } });
  });
});
