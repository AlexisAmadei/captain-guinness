"use client";

import { Alert, Box, Button, Field, Input, Stack, Text } from "@chakra-ui/react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initialProfileActionState } from "@/app/(protected)/profile/types";
import { updateDisplayName } from "@/app/(protected)/profile/actions";

export default function EditDisplayNameForm({ initialFullName }: { initialFullName: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateDisplayName, initialProfileActionState);

  useEffect(() => {
    if (state.status === "success") {
      router.push("/settings/profile");
    }
  }, [state.status, router]);

  return (
    <Box p={4} bg="app.surfaceSolid" borderRadius="lg" borderWidth={1} borderColor="app.border">
      <Text fontWeight="semibold" mb={3}>
        Display name
      </Text>
      <form action={action}>
        <Stack gap={3}>
          <Field.Root required>
            <Field.Label>New display name</Field.Label>
            <Input name="fullName" defaultValue={initialFullName} autoFocus />
          </Field.Root>

          {state.status === "error" && state.message ? (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{state.message}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          <Stack direction="row" gap={2}>
            <Button type="submit" colorPalette="brand" loading={pending} flex={1}>
              Save
            </Button>
            <Button variant="outline" onClick={() => router.back()} flex={1} disabled={pending}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}
