import { Container, Heading, Stack } from "@chakra-ui/react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditDisplayNameForm from "./EditDisplayNameForm";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <Container maxW="container.sm" py={6}>
      <Stack gap={6}>
        <Heading as="h1" size="md">
          Edit Profile
        </Heading>
        <EditDisplayNameForm initialFullName={profile?.full_name || ""} />
      </Stack>
    </Container>
  );
}
