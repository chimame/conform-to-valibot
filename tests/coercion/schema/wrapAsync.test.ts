import {
  checkAsync,
  isoDate,
  nullableAsync,
  objectAsync,
  optionalAsync,
  pipeAsync,
  string,
} from "valibot";
import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import { createFormData } from "../../helpers/FormData";

describe("wrapAsync", () => {
  test("should pass also undefined", async () => {
    const schema = objectAsync({
      name: optionalAsync(nullableAsync(string()), null),
    });
    const output = await parseWithValibot(createFormData("name", ""), {
      schema,
    });
    expect(output).toMatchObject({ status: "success", value: { name: null } });
  });

  test("should pass with nested pipe object", async () => {
    const schema = objectAsync({
      key1: string(),
      key2: optionalAsync(
        pipeAsync(
          objectAsync({
            date: optionalAsync(pipeAsync(string(), isoDate())),
          }),
          checkAsync((input) => input?.date !== "2000-01-01", "Bad date"),
        ),
      ),
    });

    const input = createFormData("key1", "valid");
    input.append("key2.date", "");

    const output = await parseWithValibot(input, {
      schema,
    });

    expect(output).toMatchObject({
      status: "success",
      value: { key1: "valid", key2: {} },
    });
  });
});
