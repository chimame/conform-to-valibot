# conform-to-valibot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/conform-to-valibot.svg)](https://badge.fury.io/js/conform-to-valibot)

> [Conform](https://github.com/edmundhung/conform) helpers for integrating with [Valibot](https://github.com/fabian-hiller/valibot)

<!-- aside -->

## Installation

```bash
npm install @conform-to/react valibot conform-to-valibot
```

<!-- aside -->

## API Reference

- [parseWithValibot](#parseWithValibot)
- [getValibotConstraint](#getValibotConstraint)
- [coerceFormValue](#coerceFormValue)

<!-- /aside -->

### parseWithValibot

It parses the formData and returns a submission result with the validation error. If no error is found, the parsed data will also be populated as `submission.value`.

```tsx
import { useForm } from '@conform-to/react';
import { parseWithValibot } from 'conform-to-valibot';
import { object, string } from 'valibot';

const schema = object({
  email: string('Email is required' ),
  password: string('Password is required' ),
});

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema,
      });
    },
  });

  // ...
}
```

Or when parsing the formData on server side (e.g. Remix):

```tsx
import { useForm } from '@conform-to/react';
import { parseWithValibot } from 'conform-to-valibot';
import { object } from 'valibot';

const schema = object({
  // Define the schema with valibot
});

export async function action({ request }) {
  const formData = await request.formData();
  const submission = await parseWithValibot(formData, {
    schema,
  });

  // Send the submission back to the client if the status is not successful
  if (submission.status !== 'success') {
    return submission.reply();
  }

  // ...
}
```

You can skip an validation to use the previous result. On client validation, you can indicate the validation is not defined to fallback to server validation.

```tsx
import type { Intent } from "@conform-to/react";
import { useForm } from '@conform-to/react';
import { parseWithValibot } from 'conform-to-valibot';
import {
  check,
  forward,
  forwardAsync,
  object,
  partialCheck,
  partialCheckAsync,
  pipe,
  pipeAsync,
  string,
} from "valibot";

function createBaseSchema(intent: Intent | null) {
  return object({
    email: pipe(
      string("Email is required"),
      // When not validating email, leave the email error as it is.
      check(
        () =>
          intent === null ||
          (intent.type === "validate" && intent.payload.name === "email"),
        conformValibotMessage.VALIDATION_SKIPPED,
      ),
    ),
    password: string("Password is required"),
  });
}

function createServerSchema(
  intent: Intent | null,
  options: { isEmailUnique: (email: string) => Promise<boolean> },
) {
  return pipeAsync(
    createBaseSchema(intent),
    forwardAsync(
      partialCheckAsync(
        [["email"]],
        async ({ email }) => options.isEmailUnique(email),
        "Email is already used",
      ),
      ["email"],
    ),
  );
}

function createClientSchema(intent: Intent | null) {
  return pipe(
    createBaseSchema(intent),
    forward(
      // If email is specified, fallback to server validation to check its uniqueness.
      partialCheck(
        [["email"]],
        () => false,
        conformValibotMessage.VALIDATION_UNDEFINED,
      ),
      ["email"],
    ),
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const submission = await parseWithValibot(formData, {
    schema: (intent) =>
      createServerSchema(intent, {
        isEmailUnique: async (email) => {
          // Query your database to check if the email is unique
        },
      }),
  });

  // Send the submission back to the client if the status is not successful
  if (submission.status !== "success") {
    return submission.reply();
  }

  // ...
}

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema: (intent) => createClientSchema(intent),
      });
    },
  });

  // ...
}
```

By default, `parseWithValibot` will strip empty value and coerce form data to the correct type by introspecting the schema and inject extra preprocessing steps using the `valibotFormValue` helper internally.
If you want to customize this behavior, you can disable automatic type coercion by setting `options.disableAutoCoercion` to `true` and manage it yourself.

```ts
import { useForm } from '@conform-to/react';
import { parseWithValibot, unstable_valibotFormValue as valibotFormValue } from 'conform-to-valibot';
import { pipe, transform, unknown, object, string } from 'valibot';

// `parseWithValibot` implicitly performs the following forced conversion:
const schema = object({
  name: pipe(unknown(), transform(v => v === "" ? undefined ? v), string('Name is required' )),
  age: pipe(unknown(), transform(v => Number(v)), number('Age is required number' )),
});

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema,
        disableAutoCoercion: true
      });
    },
  });

  // ...
}
```

### getValibotConstraint

A helper that returns an object containing the validation attributes for each field by introspecting the valibot schema.

```tsx
import { getValibotConstraint } from "conform-to-valibot";
import { useForm } from "@conform-to/react";
import { object, string, pipe, minLength, maxLength, optional } from "valibot";

const schema = object({
  title: pipe(string(), minLength(10), maxLength(100)),
  description: optional(pipe(string(), minLength(100), maxLength(1000))),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getValibotConstraint(schema),
  });

  // ...
}
```

### coerceFormValue

A helper that enhances the schema with extra preprocessing steps to strip empty value and coerce form value to the expected type.

```ts
const enhancedSchema = coerceFormValue(schema, options);
```

The following rules will be applied by default:

1. If the value is an empty string / file, pass `undefined` to the schema
2. If the schema is `v.number()`, trim the value and cast it with the `Number` constructor
3. If the schema is `v.boolean()`, treat the value as `true` if it equals to `on` (Browser default `value` of a checkbox / radio button)
4. If the schema is `v.date()`, cast the value with the `Date` constructor
5. If the schema is `v.bigint()`, trim the value and cast the value with the `BigInt` constructor

```ts
import { parseWithValibot, unstable_coerceFormValue as coerceFormValue } from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { object, string, date, number, boolean } from 'valibot';
import { jsonSchema } from './jsonSchema';

const metadata = object({
  number: number(),
  confirmed: boolean(),
});

const schema = coerceFormValue(
  object({
    ref: string()
    date: date(),
    amount: number(),
    confirm: boolean(),
    metadata,
  }),
  {
    defaultCoercion: {
      // Override the default coercion with `number()`
      number: (value) => {
        // Pass the value as is if it's not a string
        if (typeof value !== 'string') {
          return value;
        }

        // Trim and remove commas before casting it to number
        return Number(value.trim().replace(/,/g, ''));
      },

      // Disable coercion for `boolean()`
      boolean: false,
    },
    customize(schema) {
      // Customize how the `metadata` field value is coerced
      if (schema === metadata) {
        return (value) => {
          if (typeof value !== 'string') {
            return value;
          }

          // Parse the value as JSON
          return JSON.parse(value);
        };
      }

      // Return `null` to keep the default behavior
      return null;
    },
  },
);

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema,
        defaultTypeCoercion: false,
      });
    },
  });

  // ...
}
```
