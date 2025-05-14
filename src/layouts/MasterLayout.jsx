import { Box, Container, Flex } from "@chakra-ui/react";
import Header from "./Header";
import Footer from "./Footer";

const MasterLayout = ({ children }) => {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Box as="main" flex="1" bg="backgrounds.app" py={8}>
        <Container maxW="container.xl">{children}</Container>
      </Box>
      <Footer />
    </Flex>
  );
};

export default MasterLayout;
