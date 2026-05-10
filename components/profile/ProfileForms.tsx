"use client";

import { Alert, Box, Button, Field, Input, Stack, Text } from "@chakra-ui/react";
import { useActionState } from "react";
import { initialProfileActionState } from "@/app/(protected)/profile/types";
import {
  updateAvatar,
  updateDisplayName,
  updateEmail,
  updatePassword,
} from "@/app/(protected)/profile/actions";

function FormFeedback({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message: string;
}) {
  if (status === "idle" || !message) {
    return null;
  }

  return (
    <Alert.Root status={status === "success" ? "success" : "error"}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Description>{message}</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

export function ProfileForms({
  initialFullName,
  initialEmail,
}: {
  initialFullName: string;
  initialEmail: string;
}) {
  const [avatarState, avatarAction, avatarPending] = useActionState(
    updateAvatar,
    initialProfileActionState,
  );
  const [nameState, nameAction, namePending] = useActionState(
    updateDisplayName,
    initialProfileActionState,
  );
  const [emailState, emailAction, emailPending] = useActionState(
    updateEmail,
    initialProfileActionState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePassword,
    initialProfileActionState,
  );

  return (
    <Stack gap={4}>
      <Box p={4} bg="app.surfaceSolid" borderRadius="lg" borderWidth={1} borderColor="app.border">
        <Text fontWeight="semibold" mb={3}>
          Avatar
        </Text>
        <form action={avatarAction} encType="multipart/form-data">
          <Stack gap={3}>
            <Field.Root required>
              <Field.Label>Image</Field.Label>
              <Input name="avatar" type="file" accept="image/*" />
            </Field.Root>
            <Button type="submit" loading={avatarPending} alignSelf="start">
              Mettre à jour l&apos;avatar
            </Button>
            <FormFeedback status={avatarState.status} message={avatarState.message} />
          </Stack>
        </form>
      </Box>

      <Box p={4} bg="app.surfaceSolid" borderRadius="lg" borderWidth={1} borderColor="app.border">
        <Text fontWeight="semibold" mb={3}>
          Pseudo
        </Text>
        <form action={nameAction}>
          <Stack gap={3}>
            <Field.Root required>
              <Field.Label>Pseudo</Field.Label>
              <Input name="fullName" defaultValue={initialFullName} />
            </Field.Root>
            <Button type="submit" loading={namePending} alignSelf="start">
              Enregistrer le pseudo
            </Button>
            <FormFeedback status={nameState.status} message={nameState.message} />
          </Stack>
        </form>
      </Box>

      <Box p={4} bg="app.surfaceSolid" borderRadius="lg" borderWidth={1} borderColor="app.border">
        <Text fontWeight="semibold" mb={3}>
          Email
        </Text>
        <form action={emailAction}>
          <Stack gap={3}>
            <Field.Root required>
              <Field.Label>Nouvel email</Field.Label>
              <Input name="email" type="email" defaultValue={initialEmail} />
            </Field.Root>
            <Button type="submit" loading={emailPending} alignSelf="start">
              Mettre à jour l&apos;email
            </Button>
            <FormFeedback status={emailState.status} message={emailState.message} />
          </Stack>
        </form>
      </Box>

      <Box p={4} bg="app.surfaceSolid" borderRadius="lg" borderWidth={1} borderColor="app.border">
        <Text fontWeight="semibold" mb={3}>
          Mot de passe
        </Text>
        <form action={passwordAction}>
          <Stack gap={3}>
            <Field.Root required>
              <Field.Label>Ancien mot de passe</Field.Label>
              <Input name="oldPassword" type="password" />
            </Field.Root>
            <Field.Root required>
              <Field.Label>Nouveau mot de passe</Field.Label>
              <Input name="newPassword" type="password" minLength={8} />
            </Field.Root>
            <Button type="submit" loading={passwordPending} alignSelf="start">
              Mettre à jour le mot de passe
            </Button>
            <FormFeedback status={passwordState.status} message={passwordState.message} />
          </Stack>
        </form>
      </Box>
    </Stack>
  );
}