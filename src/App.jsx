import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import theme from "./theme";

function App() {
  return (
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  );
}

export default App;
