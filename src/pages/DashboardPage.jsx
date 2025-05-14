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
import { canvasService } from "../services/canvasService";
import ErrorBoundary from "../components/ErrorBoundary";
import MasterLayout from "../layouts/MasterLayout.jsx"; // Add .jsx extension

const DashboardPage = () => {
  const [canvases, setCanvases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchCanvases = async () => {
      try {
        console.log("Dashboard: Attempting to fetch canvases");
        setIsLoading(true);
        setError(null);
        const fetchedCanvases = await canvasService.getCanvases();
        console.log("Dashboard: Canvases fetched:", fetchedCanvases);
        setCanvases(fetchedCanvases);
      } catch (err) {
        console.error("Dashboard: Error fetching canvases:", err);
        setError(err.message);
        toast({
          title: "Error fetching canvases",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCanvases();
  }, [toast]);

  const handleCreateCanvas = async () => {
    try {
      const title = prompt("Enter canvas title:", "New Canvas");
      if (title) {
        const newCanvas = await canvasService.createCanvas(title);
        toast({
          title: "Canvas Created",
          description: `Canvas "${newCanvas.title}" created successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setCanvases((prev) => [newCanvas, ...prev]);
        navigate(`/canvas/${newCanvas.id}`);
      }
    } catch (err) {
      toast({
        title: "Error creating canvas",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const filteredCanvases = canvases.filter((canvas) =>
    canvas.title.toLowerCase().includes(searchTerm.toLowerCase())
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

  const CanvasGrid = ({ items }) => (
    <Box px={6} pb={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md" fontWeight="semibold" color={theme.colors.gray[900]}>
          Recent Canvas
        </Heading>
        <Link
          as={RouterLink}
          to="/canvases/all"
          color={theme.colors.blue[500]}
          fontWeight="medium"
        >
          View All
        </Link>
      </Flex>
      {items.length === 0 && !isLoading && (
        <Text textAlign="center" color="gray.500" py={10}>
          No canvases yet. Create one to get started!
        </Text>
      )}
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing="16px">
        {items.map((canvas, index) => (
          <Box
            key={canvas.id}
            as={RouterLink}
            to={`/canvas/${canvas.id}`}
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
              {canvas.title}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );

  CanvasGrid.propTypes = {
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
        <Heading size="lg" mb={6}>My Canvas</Heading>
        <SearchBar />
        <Box mb={6}>
          <Button
            variant="solid"
            leftIcon={<AddIcon />}
            width="full"
            onClick={handleCreateCanvas}
            bg="#4186E0"
            color="white"
            _hover={{ bg: "#3674C7" }}
            borderRadius="md"
            size="lg"
            height="48px"
          >
            Create Canvas
          </Button>
        </Box>
        {isLoading && <LoadingSpinner />}
        {error && (
          <Text color="red.500" textAlign="center" p={4}>
            Error: {error}
          </Text>
        )}
        {!isLoading && !error && <CanvasGrid items={filteredCanvases} />}
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
