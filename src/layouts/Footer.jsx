import { Box, Container, Flex, Text, HStack, Link } from "@chakra-ui/react";

const Footer = () => {
  return (
    <Box bg="backgrounds.header" borderTop="1px" borderColor="borders.light">
      <Container maxW="container.xl">
        <Flex py={6} justify="space-between" align="center">
          <Text color="textColors.secondary" fontSize="sm">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </Text>
          <HStack spacing={6}>
            <Link fontSize="sm" color="textColors.secondary">
              Privacy Policy
            </Link>
            <Link fontSize="sm" color="textColors.secondary">
              Terms of Service
            </Link>
            <Link fontSize="sm" color="textColors.secondary">
              Contact
            </Link>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;
