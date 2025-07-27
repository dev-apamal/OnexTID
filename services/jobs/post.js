// Simple Firebase Job Posting Service
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../../firebaseConfig";

const MAX_RETRIES = 2;

// Production error logger (matches your fetch service pattern)
const logError = (operation, error, context = {}) => {
  const errorLog = {
    operation,
    error: error.message,
    code: error.code,
    context,
    timestamp: new Date().toISOString(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "server",
  };

  console.error("Firebase Error:", errorLog);

  // Add your production logging service here
  // e.g., Sentry, LogRocket, or your analytics service
  // Analytics.track('firebase_error', errorLog);
};

// Simple retry function for network issues (matches your fetch service)
const withRetry = async (operation, retries = MAX_RETRIES) => {
  try {
    return await operation();
  } catch (error) {
    // Only retry on network/temporary errors
    const isRetryable =
      error.code === "unavailable" ||
      error.code === "deadline-exceeded" ||
      error.message.includes("network");

    if (retries > 0 && isRetryable) {
      console.warn(`Retrying operation, ${retries} attempts left`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
};

// Validate job data before posting
const validateJobData = (jobData) => {
  const required = [
    "date",
    "hospital",
    "location",
    "position",
    "salary",
    "schedule",
    "type",
  ];

  for (const field of required) {
    if (!jobData[field]) {
      throw new Error(`${field} is required`);
    }

    // Check if string fields are not empty after trimming
    if (typeof jobData[field] === "string" && !jobData[field].trim()) {
      throw new Error(`${field} cannot be empty`);
    }
  }

  // Validate salary is a positive number
  if (isNaN(jobData.salary) || parseFloat(jobData.salary) <= 0) {
    throw new Error("Salary must be a positive number");
  }

  // Validate job type
  if (!["permanent", "relieving"].includes(jobData.type)) {
    throw new Error('Job type must be either "permanent" or "relieving"');
  }

  // Validate date format
  if (isNaN(Date.parse(jobData.date))) {
    throw new Error("Invalid date format");
  }
};

/**
 * Post a new job to Firebase
 * @param {Object} jobData - The job form data
 * @param {string} userId - The authenticated user's ID
 * @param {string} userName - The authenticated user's name
 * @returns {Promise<Object>} Result with success status and job data
 */
export const postJob = async (jobData, userId, userName) => {
  try {
    // Input validation
    if (!jobData || typeof jobData !== "object") {
      throw new Error("Job data is required");
    }

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      throw new Error("User ID is required");
    }

    if (!userName || typeof userName !== "string" || !userName.trim()) {
      throw new Error("User name is required");
    }

    // Validate job data
    validateJobData(jobData);

    // Clean and prepare job data
    const cleanJobData = {
      date: jobData.date,
      hospital: jobData.hospital.trim(),
      location: jobData.location.trim(),
      position: jobData.position.trim(),
      salary: parseFloat(jobData.salary),
      schedule: jobData.schedule.trim(),
      type: jobData.type,
      // Auto-generated fields
      createdAt: serverTimestamp(),
      createdBy: userName.trim(),
      createdById: userId.trim(),
      status: "active", // Default status
    };

    // Post job with retry logic
    const result = await withRetry(async () => {
      const docRef = await addDoc(collection(firestore, "jobs"), cleanJobData);
      return docRef;
    });

    // Success response
    return {
      success: true,
      data: {
        id: result.id,
        ...cleanJobData,
        // Convert serverTimestamp to readable format for UI
        createdAt: new Date().toISOString(),
      },
      message: "Job posted successfully",
    };
  } catch (error) {
    logError("postJob", error, {
      userId,
      userName,
      jobDataKeys: jobData ? Object.keys(jobData) : null,
    });

    // User-friendly error response
    return {
      success: false,
      error: error.message,
      message:
        error.message.includes("required") || error.message.includes("must be")
          ? error.message
          : "Failed to post job. Please check your connection and try again.",
    };
  }
};

/**
 * Get posting service health info
 * @returns {Object} Service health information
 */
export const getPostingServiceHealth = () => {
  return {
    timestamp: new Date().toISOString(),
    service: "job-posting",
    config: {
      maxRetries: MAX_RETRIES,
      collection: "jobs",
    },
    status: "healthy",
  };
};
