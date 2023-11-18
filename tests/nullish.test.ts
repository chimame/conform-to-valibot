import { describe, expect, test } from "vitest";
import { number, object, nullish} from "valibot";
import { parse } from "../parse";
import { createFormData } from "./helpers/FormData";

describe("nullish", () => {
  test("should pass also undefined", () => {
    const schema = object({ age: nullish(number()) });
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
