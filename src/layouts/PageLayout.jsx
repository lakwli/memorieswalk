import React from "react";
import PropTypes from "prop-types";
import { Box, Heading, Flex } from "@chakra-ui/react";
import MasterLayout from "./MasterLayout";

/**
 * PageLayout provides consistent structure for page content within the MasterLayout
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {React.ReactNode} props.actions - Optional action buttons for the header
 * @param {React.ReactNode} props.children - Page content
 */
const PageLayout = ({
  title,
  actions,
  children,
  maxContentWidth = "1200px", // Default width used across all pages
}) => {
  return (
    <MasterLayout>
      <Box width="100%" maxWidth={maxContentWidth} mx="auto">
        {/* Page Header */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          mb={6}
          flexWrap="wrap"
          gap={4}
        >
          <Heading size="lg">{title}</Heading>
          {actions && <Box>{actions}</Box>}
        </Flex>

        {/* Page Content */}
        {children}
      </Box>
    </MasterLayout>
  );
};

PageLayout.propTypes = {
  title: PropTypes.string.isRequired,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  maxContentWidth: PropTypes.string,
};

export default PageLayout;
