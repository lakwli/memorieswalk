import { useState, useEffect } from "react";
import {
  Box,
  Button,
  InputGroup,
  InputLeftElement,
  Input,
  Link,
  SimpleGrid,
  Text,
  useToast,
  Spinner,
  useTheme,
  Heading,
  Flex, // Add missing Flex import
} from "@chakra-ui/react";
import { SearchIcon, AddIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { memoryService } from "../services/memoryService";
import ErrorBoundary from "../components/ErrorBoundary";
import MasterLayout from "../layouts/MasterLayout.jsx"; // Add .jsx extension

const DashboardPage = () => {
  const [memories, setMemories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        console.log("Dashboard: Attempting to fetch memories");
        setIsLoading(true);
        setError(null);
        const fetchedMemories = await memoryService.getMemories();
        console.log("Dashboard: Memories fetched:", fetchedMemories);
        setMemories(fetchedMemories);
      } catch (err) {
        console.error("Dashboard: Error fetching memories:", err);
        setError(err.message);
        toast({
          title: "Error fetching memories",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemories();
  }, [toast]);
  const handleCreateMemory = async () => {
    try {
      const title = prompt("Enter memory title:", "New Memory");
      if (title) {
        const newMemory = await memoryService.createMemory(title);
        toast({
          title: "Memory Created",
          description: `Memory "${newMemory.title}" created successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setMemories((prev) => [newMemory, ...prev]);
        navigate(`/memory/${newMemory.id}`);
      }
    } catch (err) {
      toast({
        title: "Error creating memory",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  const filteredMemories = memories.filter((memory) =>
    memory.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SearchBar = () => (
    <Box mb={6}>
      <InputGroup size="lg">
        <InputLeftElement pointerEvents="none" h="48px">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          h="48px"
          fontSize="md"
          placeholder="Search photos, albums or places..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="filled"
          bg="gray.50"
          _placeholder={{ color: "gray.400" }}
          _focus={{ bg: "gray.100", boxShadow: "none" }}
        />
      </InputGroup>
    </Box>
  );

  const LoadingSpinner = () => (
    <Flex justify="center" align="center" height="200px">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.primary"
        size="xl"
      />
    </Flex>
  );
  const MemoryGrid = ({ items }) => (
    <Box px={6} pb={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md" fontWeight="semibold" color={theme.colors.gray[900]}>
          Recent Memories
        </Heading>
        <Link
          as={RouterLink}
          to="/memories/all"
          color={theme.colors.blue[500]}
          fontWeight="medium"
        >
          View All
        </Link>
      </Flex>
      {items.length === 0 && !isLoading && (
        <Text textAlign="center" color="gray.500" py={10}>
          No memories yet. Create one to get started!
        </Text>
      )}
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing="16px">
        {items.map((memory, index) => (
          <Box
            key={memory.id}
            as={RouterLink}
            to={`/memory/${memory.id}`}
            bg={
              theme.colors.mode === "light"
                ? ["#F8F9FE", "#F7FCF7", "#FFF8F5"][index % 3]
                : theme.colors.gray[700]
            }
            borderRadius="lg"
            height="180px"
            p={4}
            transition="transform 0.2s"
            _hover={{
              transform: "translateY(-2px)",
              shadow: "sm",
            }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text
              fontWeight="semibold"
              color={theme.colors.gray[800]}
              fontSize="lg"
            >
              {memory.title}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );

  MemoryGrid.propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        title: PropTypes.string.isRequired,
      })
    ).isRequired,
    isLoading: PropTypes.bool,
  };
  return (
    <MasterLayout>
      <Box>
        <Heading size="lg" mb={6}>
          My Memories
        </Heading>
        <SearchBar />
        <Box mb={6}>
          <Button
            variant="solid"
            leftIcon={<AddIcon />}
            width="full"
            onClick={handleCreateMemory}
            bg="#4186E0"
            color="white"
            _hover={{ bg: "#3674C7" }}
            borderRadius="md"
            size="lg"
            height="48px"
          >
            Create Memory
          </Button>
        </Box>
        {isLoading && <LoadingSpinner />}
        {error && (
          <Text color="red.500" textAlign="center" p={4}>
            Error: {error}
          </Text>
        )}
        {!isLoading && !error && <MemoryGrid items={filteredMemories} />}
      </Box>
    </MasterLayout>
  );
};

export default function WrappedDashboard() {
  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  );
}
