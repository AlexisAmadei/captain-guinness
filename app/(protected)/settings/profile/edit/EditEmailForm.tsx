"use client";

import { Alert, Box, Button, Field, Input, Stack, Text } from "@chakra-ui/react";
import { useActionState } from "react";
import { initialProfileActionState } from "@/app/(protected)/profile/types";
import { updateEmail } from "@/app/(protected)/profile/actions";

export default function EditEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, pending] = useActionState(updateEmail, initialProfileActionState);

  return (
    <Box p={4} bg="app.surfaceSolid" borderRadius="lg" borderWidth={1} borderColor="app.border">
      <Text fontWeight="semibold" mb={3}>
        Email address
      </Text>
      <form action={action}>
        <Stack gap={3}>
          <Field.Root required>
            <Field.Label>New email address</Field.Label>
            <Input name="email" type="email" placeholder={currentEmail} autoComplete="email" />
          </Field.Root>

          {state.status === "error" && state.message ? (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{state.message}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          {state.status === "success" && state.message ? (
            <Alert.Root status="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{state.message}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          <Button type="submit" colorPalette="brand" loading={pending}>
            Update email
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
