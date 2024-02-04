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

- [parse](#parse)

<!-- /aside -->

### parse

It parses the formData and returns a submission result with the validation error. If no error is found, the parsed data will also be populated as `submission.value`.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from 'conform-to-valibot';
import { object, string } from 'valibot';

const schema = object({
  email: string('Email is required' ),
  password: string('Password is required' ),
});

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parse(formData, {
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
import { parse } from 'conform-to-valibot';
import { object } from 'valibot';

const schema = object({
  // Define the schema with valibot
});

export async function action({ request }) {
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema,
  });

  if (!submission.value || submission.intent !== 'submit') {
    return submission;
  }

  // ...
}
```
