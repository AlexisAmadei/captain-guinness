"use client";

import { Box, Button, Container, Heading, Stack, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { BiChevronRight } from "react-icons/bi";

export default function SettingsPage() {
  return (
    <Container maxW="container.sm" py={6}>
      <Stack gap={6}>
          {/* Account Settings */}
          <VStack align="start" gap={3}>
            <Heading as="h2" size="sm">
              Account
            </Heading>
            <Stack w="100%" gap={0}>
              <Button
                asChild
                variant="ghost"
                h="12"
                borderRadius={0}
                borderBottomWidth={1}
                borderColor="app.border"
              >
                <Link href="/settings/profile">
                  <Text>Profile</Text>
                  <Box as={BiChevronRight} />
                </Link>
              </Button>
              <Button
                variant="ghost"
                h="12"
                borderRadius={0}
                borderBottomWidth={1}
                borderColor="app.border"
              >
                <Text>Email & Password</Text>
                <Box as={BiChevronRight} />
              </Button>
              <Button
                variant="ghost"
                h="12"
                borderRadius={0}
                borderBottomWidth={1}
                borderColor="app.border"
              >
                <Text>Linked Accounts</Text>
                <Box as={BiChevronRight} />
              </Button>
              <Button
                variant="ghost"
                h="12"
                borderRadius={0}
              >
                <Text>Privacy & Security</Text>
                <Box as={BiChevronRight} />
              </Button>
            </Stack>
          </VStack>

          {/* App Settings */}
          <VStack align="start" gap={3}>
            <Heading as="h2" size="sm">
              App
            </Heading>
            <Stack w="100%" gap={0}>
              <Button
                variant="ghost"
                h="12"
                borderRadius={0}
                borderBottomWidth={1}
                borderColor="app.border"
              >
                <Text>Notifications</Text>
                <Box as={BiChevronRight} />
              </Button>
              <Button
                variant="ghost"
                h="12"
                borderRadius={0}
                borderBottomWidth={1}
                borderColor="app.border"
              >
                <Text>Theme</Text>
                <Box as={BiChevronRight} />
              </Button>
              <Button
                variant="ghost"
                h="12"
                borderRadius={0}
              >
                <Text>Language</Text>
                <Box as={BiChevronRight} />
              </Button>
            </Stack>
          </VStack>

          {/* Support */}
          <VStack align="start" gap={3}>
            <Heading as="h2" size="sm">
              Support
            </Heading>
            <Stack w="100%" gap={0}>
              <Button
                variant="ghost"
                h="12"
                borderRadius={0}
                borderBottomWidth={1}
                borderColor="app.border"
              >
                <Text>Help & Feedback</Text>
                <Box as={BiChevronRight} />
              </Button>
              <Button
                variant="ghost"
                h="12"
                borderRadius={0}
                borderBottomWidth={1}
                borderColor="app.border"
              >
                <Text>About</Text>
                <Box as={BiChevronRight} />
              </Button>
              <Button
                variant="ghost"
                h="12"
                borderRadius={0}
              >
                <Text>Terms & Privacy</Text>
                <Box as={BiChevronRight} />
              </Button>
            </Stack>
          </VStack>
      </Stack>
    </Container>
  );
}
