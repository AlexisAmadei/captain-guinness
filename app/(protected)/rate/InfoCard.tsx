"use client";
import { Box, Stack, Heading, Text } from "@chakra-ui/react";

export function InfoCard({
  title, description, children,
}: Readonly<{ title: string; description: string; children: React.ReactNode; }>) {
  return (
    <Box
      borderRadius="lg"
      borderWidth="1px"
      borderColor="app.border"
      bg="app.surface"
      backdropFilter="blur(18px)"
      shadow="soft"
      p={{ base: 5, md: 6 }}
    >
      <Stack gap={4}>
        <Box>
          <Heading as="h2" size="md" color="app.fg" mb={1}>
            {title}
          </Heading>
          <Text fontSize="sm" color="app.muted">
            {description}
          </Text>
        </Box>
        {children}
      </Stack>
    </Box>
  );
}
