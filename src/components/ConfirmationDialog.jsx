import PropTypes from "prop-types";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";

/**
 * A reusable confirmation dialog component
 * Uses AlertDialog for better accessibility than Modal
 */
const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary", // primary | danger | warning | success
  isLoading = false,
  leastDestructiveRef,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling should be done by the parent component
      console.error("Confirmation action failed:", error);
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={leastDestructiveRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {title}
          </AlertDialogHeader>

          <AlertDialogBody>{message}</AlertDialogBody>

          <AlertDialogFooter>
            <Button
              variant="dialogSecondary"
              ref={leastDestructiveRef}
              onClick={onClose}
            >
              {cancelText}
            </Button>
            <Button
              variant={`dialog${
                confirmVariant.charAt(0).toUpperCase() + confirmVariant.slice(1)
              }`}
              onClick={handleConfirm}
              ml={3}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

ConfirmationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmVariant: PropTypes.oneOf(["primary", "danger", "warning", "success"]),
  isLoading: PropTypes.bool,
  leastDestructiveRef: PropTypes.object.isRequired,
};

export default ConfirmationDialog;
