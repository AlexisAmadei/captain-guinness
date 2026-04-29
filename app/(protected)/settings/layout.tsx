"use client";

import { Box, Button, HStack, Icon, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { BiChevronLeft } from "react-icons/bi";

type SettingsLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export default function SettingsLayout({ children, title }: SettingsLayoutProps) {
  const router = useRouter();

  return (
    <Box minH="100dvh" bg="app.canvas">
      {/* Settings Header */}
      {title && (
        <Box
          position="sticky"
          top={0}
          bg="app.surface"
          backdropFilter="blur(20px)"
          borderBottomWidth={1}
          borderColor="app.border"
          zIndex={10}
        >
          <HStack h="14" px={4} gap={3}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              p={0}
            >
              <Icon fontSize="xl" color="app.fg">
                <BiChevronLeft />
              </Icon>
            </Button>
            <Text fontSize="lg" fontWeight="bold">
              {title}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Content */}
      {children}
    </Box>
  );
}
