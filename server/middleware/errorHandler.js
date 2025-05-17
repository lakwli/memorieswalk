// ES Module version of the error handler from the plan

const errorHandler = (err, req, res, next) => {
  // Log error for server-side debugging
  console.error("Error:", err);
  console.error("Error Name:", err.name);
  console.error("Error Code:", err.code);
  console.error("Error Message:", err.message);
  if (err.isJoi) {
    console.error("Joi Details:", err.details);
  }

  // Handle multer errors specifically
  if (err.name === "MulterError") {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(413).json({
          message: "File too large. Maximum size is 10MB.", // As per upload.js
        });
      case "LIMIT_FILE_COUNT":
        return res.status(413).json({
          message: "Too many files. Maximum is 10 files per upload.", // As per upload.js
        });
      case "LIMIT_UNEXPECTED_FILE":
        // This error might occur if the field name in upload.array('photos', 10) doesn't match the form field name.
        return res.status(400).json({
          message: "Unexpected file field. Please check your form submission.",
        });
      default:
        return res.status(400).json({
          message: "File upload error: " + err.message,
        });
    }
  }

  // Handle validation errors from Joi
  if (err.isJoi) {
    return res.status(400).json({
      message:
        "Validation error: " + err.details.map((d) => d.message).join(", "),
      details: err.details.map((d) => ({
        message: d.message,
        path: d.path,
        type: d.type,
      })),
    });
  }

  // Handle known error types
  switch (err.name) {
    case "SyntaxError": // Often from express.json() failing to parse body
      return res.status(400).json({
        message: "Invalid JSON in request body.",
      });
    case "JsonWebTokenError":
    case "TokenExpiredError": // From jsonwebtoken if token is invalid or expired
      return res.status(401).json({
        message: "Authentication failed. Please log in again.",
        code: err.name, // Provide specific code for frontend to handle
      });
    // Add other specific error names you anticipate
    // e.g., from database interactions if they throw named errors
    // case 'PgError': // Example for node-postgres errors
    //   return res.status(500).json({ message: 'Database error: ' + err.message, code: err.code });
    default:
      // For all other errors, return generic message
      // Check if it's a standard error object with a status property
      if (typeof err.status === "number") {
        return res.status(err.status).json({
          message: err.message || "An unexpected error occurred.",
        });
      }
      // Generic fallback
      return res.status(500).json({
        message:
          "An unexpected server error occurred: " +
          (err.message || "Unknown error"),
      });
  }
};

export default errorHandler;
