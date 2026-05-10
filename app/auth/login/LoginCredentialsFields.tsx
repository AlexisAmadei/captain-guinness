"use client";

import NextLink from "next/link";
import { Field, Input, Link, Stack } from "@chakra-ui/react";
import { useState } from "react";

export function LoginCredentialsFields() {
  const [email, setEmail] = useState("");

  return (
    <>
      <Field.Root required>
        <Field.Label>Email</Field.Label>
        <Input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field.Root>
      <Field.Root required>
        <Stack direction="row" justify="space-between" align="baseline" w="full">
          <Field.Label mb="0">Mot de passe</Field.Label>
          <Link asChild fontSize="xs" color="fg.muted">
            <NextLink
              href={`/auth/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            >
              Mot de passe oublié ?
            </NextLink>
          </Link>
        </Stack>
        <Input name="password" type="password" />
      </Field.Root>
    </>
  );
}
