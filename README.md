# conform-to-valibot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/conform-to-valibot.svg)](https://badge.fury.io/js/conform-to-valibot)

> [Conform](https://github.com/edmundhung/conform) helpers for integrating with [Valibot](https://github.com/fabian-hiller/valibot)

<!-- aside -->

## Installation

```bash
$ npm install @conform-to/react valibot conform-to-valibot
```

<!-- aside -->

## API Reference

- [parseWithValibot](#parseWithValibot)
- [getValibotConstraint](#getValibotConstraint)

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

### getValibotConstraint

A helper that returns an object containing the validation attributes for each field by introspecting the valibot schema.

```tsx
import { getValibotConstraint } from "conform-to-valibot";
import { useForm } from "@conform-to/react";
import { object, string, minLength, maxLength, optional } from "valibot";

const schema = object({
  title: string([minLength(10), maxLength(100)]),
  description: optional(string([minLength(100), maxLength(1000)])),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getValibotConstraint(schema),
  });

  // ...
}
```
