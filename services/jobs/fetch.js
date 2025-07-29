// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   orderBy,
//   query,
// } from "firebase/firestore";
// import { firestore } from "../../firebaseConfig";

// // Simple cache storage
// const cache = new Map();
// const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
// const MAX_CACHE_SIZE = 50; // Prevent memory issues
// const MAX_RETRIES = 2;

// // Helper function to check if cache is still valid
// const isCacheValid = (timestamp) => {
//   return Date.now() - timestamp < CACHE_TIME;
// };

// // Helper function to get from cache
// const getFromCache = (key) => {
//   const cached = cache.get(key);
//   if (cached && isCacheValid(cached.timestamp)) {
//     return cached.data;
//   }
//   cache.delete(key); // Remove expired cache
//   return null;
// };

// // Helper function to save to cache with size limit
// const saveToCache = (key, data) => {
//   // Prevent cache from growing too large
//   if (cache.size >= MAX_CACHE_SIZE) {
//     const firstKey = cache.keys().next().value;
//     cache.delete(firstKey);
//   }

//   cache.set(key, {
//     data: data,
//     timestamp: Date.now(),
//   });
// };

// // Simple retry function for network issues
// const withRetry = async (operation, retries = MAX_RETRIES) => {
//   try {
//     return await operation();
//   } catch (error) {
//     // Only retry on network/temporary errors
//     const isRetryable =
//       error.code === "unavailable" ||
//       error.code === "deadline-exceeded" ||
//       error.message.includes("network");

//     if (retries > 0 && isRetryable) {
//       console.warn(`Retrying operation, ${retries} attempts left`);
//       await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
//       return withRetry(operation, retries - 1);
//     }
//     throw error;
//   }
// };

// // Production error logger (customize for your logging service)
// const logError = (operation, error, context = {}) => {
//   const errorLog = {
//     operation,
//     error: error.message,
//     code: error.code,
//     context,
//     timestamp: new Date().toISOString(),
//     userAgent:
//       typeof navigator !== "undefined" ? navigator.userAgent : "server",
//   };

//   console.error("Firebase Error:", errorLog);

//   // Add your production logging service here
//   // e.g., Sentry, LogRocket, or your analytics service
//   // Analytics.track('firebase_error', errorLog);
// };

// /**
//  * Fetch all jobs from Firebase with production features - SORTED BY LATEST FIRST
//  * @param {boolean} useCache - Whether to use cached data (default: true)
//  * @returns {Promise<Array>} Array of job objects sorted by createdAt (latest first)
//  */
// export const fetchAllJobs = async (useCache = true) => {
//   const cacheKey = "all_jobs_sorted";

//   try {
//     // Try cache first
//     if (useCache) {
//       const cached = getFromCache(cacheKey);
//       if (cached) {
//         return cached;
//       }
//     }

//     // Fetch with retry logic and sorting
//     const jobs = await withRetry(async () => {
//       // Create query with sorting by createdAt descending (latest first)
//       const jobsQuery = query(
//         collection(firestore, "jobs"),
//         orderBy("createdAt", "desc")
//       );

//       const snapshot = await getDocs(jobsQuery);
//       const jobList = [];

//       snapshot.forEach((docSnapshot) => {
//         const jobData = docSnapshot.data();

//         // Basic data validation
//         if (jobData && typeof jobData === "object") {
//           // Convert Firestore timestamps to readable format
//           const processedJob = {
//             id: docSnapshot.id,
//             ...jobData,
//             // Convert Firestore timestamp to ISO string if it exists
//             createdAt:
//               jobData.createdAt?.toDate?.()?.toISOString() || jobData.createdAt,
//             updatedAt:
//               jobData.updatedAt?.toDate?.()?.toISOString() || jobData.updatedAt,
//           };

//           jobList.push(processedJob);
//         }
//       });

//       return jobList;
//     });

//     // Save to cache
//     saveToCache(cacheKey, jobs);

//     return jobs;
//   } catch (error) {
//     logError("fetchAllJobs", error, { useCache });

//     // Return cached data if available during errors
//     if (useCache) {
//       const staleCache = cache.get(cacheKey);
//       if (staleCache) {
//         console.warn("Returning stale cached data due to error");
//         return staleCache.data;
//       }
//     }

//     throw new Error(
//       "Unable to load jobs. Please check your connection and try again."
//     );
//   }
// };

// /**
//  * Fetch a specific job by ID with production features
//  * @param {string} jobId - The job ID to fetch
//  * @param {boolean} useCache - Whether to use cached data (default: true)
//  * @returns {Promise<Object|null>} Job object or null if not found
//  */
// export const fetchJobById = async (jobId, useCache = true) => {
//   // Input validation
//   if (!jobId || typeof jobId !== "string" || jobId.trim() === "") {
//     throw new Error("Please provide a valid job ID");
//   }

//   const cleanJobId = jobId.trim();
//   const cacheKey = `job_${cleanJobId}`;

//   try {
//     // Try cache first
//     if (useCache) {
//       const cached = getFromCache(cacheKey);
//       if (cached !== null) {
//         return cached;
//       }
//     }

//     // Fetch with retry logic
//     const job = await withRetry(async () => {
//       const docRef = doc(firestore, "jobs", cleanJobId);
//       const docSnap = await getDoc(docRef);

//       if (!docSnap.exists()) {
//         return null;
//       }

//       const jobData = docSnap.data();

//       // Basic data validation
//       if (!jobData || typeof jobData !== "object") {
//         throw new Error("Invalid job data received");
//       }

//       // Process timestamps
//       const processedJob = {
//         id: docSnap.id,
//         ...jobData,
//         // Convert Firestore timestamps to ISO strings
//         createdAt:
//           jobData.createdAt?.toDate?.()?.toISOString() || jobData.createdAt,
//         updatedAt:
//           jobData.updatedAt?.toDate?.()?.toISOString() || jobData.updatedAt,
//       };

//       return processedJob;
//     });

//     // Save to cache (including null for not found)
//     saveToCache(cacheKey, job);

//     return job;
//   } catch (error) {
//     logError("fetchJobById", error, { jobId: cleanJobId, useCache });

//     // Return cached data if available during errors
//     if (useCache) {
//       const staleCache = cache.get(cacheKey);
//       if (staleCache) {
//         console.warn(
//           `Returning stale cached data for job ${cleanJobId} due to error`
//         );
//         return staleCache.data;
//       }
//     }

//     throw new Error(
//       "Unable to load job details. Please check your connection and try again."
//     );
//   }
// };

// /**
//  * Batch fetch multiple jobs by IDs (production optimization)
//  * @param {Array<string>} jobIds - Array of job IDs to fetch
//  * @param {boolean} useCache - Whether to use cached data
//  * @returns {Promise<Array>} Array of job objects (null for not found)
//  */
// export const fetchJobsByIds = async (jobIds, useCache = true) => {
//   if (!Array.isArray(jobIds) || jobIds.length === 0) {
//     return [];
//   }

//   // Filter and validate job IDs
//   const validJobIds = jobIds
//     .filter((id) => id && typeof id === "string" && id.trim() !== "")
//     .map((id) => id.trim());

//   if (validJobIds.length === 0) {
//     return [];
//   }

//   try {
//     // Fetch jobs in parallel for better performance
//     const promises = validJobIds.map((jobId) =>
//       fetchJobById(jobId, useCache).catch((error) => {
//         console.warn(`Failed to fetch job ${jobId}:`, error.message);
//         return null; // Continue with other jobs even if one fails
//       })
//     );

//     const results = await Promise.all(promises);

//     // Sort the results by createdAt if they have timestamps
//     const sortedResults = results.sort((a, b) => {
//       if (!a || !b) return 0;
//       const aDate = new Date(a.createdAt || 0);
//       const bDate = new Date(b.createdAt || 0);
//       return bDate - aDate; // Latest first
//     });

//     return sortedResults;
//   } catch (error) {
//     logError("fetchJobsByIds", error, { jobIds: validJobIds });
//     throw new Error("Unable to load some job details. Please try again.");
//   }
// };

// /**
//  * Clear all cached data
//  */
// export const clearJobCache = () => {
//   const cacheSize = cache.size;
//   cache.clear();
//   console.log(`Cleared ${cacheSize} cached items`);
// };

// /**
//  * Get cache and service health info
//  * @returns {Object} Service health information
//  */
// export const getServiceHealth = () => {
//   const now = Date.now();
//   let validCacheCount = 0;

//   for (const [key, value] of cache.entries()) {
//     if (isCacheValid(value.timestamp)) {
//       validCacheCount++;
//     }
//   }

//   return {
//     timestamp: new Date().toISOString(),
//     cache: {
//       total: cache.size,
//       valid: validCacheCount,
//       expired: cache.size - validCacheCount,
//       maxSize: MAX_CACHE_SIZE,
//       ttlMinutes: CACHE_TIME / (60 * 1000),
//     },
//     config: {
//       maxRetries: MAX_RETRIES,
//       cacheEnabled: true,
//       sortOrder: "createdAt desc (latest first)",
//     },
//   };
// };

// /**
//  * Prefetch jobs for better performance
//  * @param {Array<string>} jobIds - Job IDs to prefetch
//  */
// export const prefetchJobs = async (jobIds) => {
//   if (!Array.isArray(jobIds) || jobIds.length === 0) return;

//   try {
//     // Fetch jobs in background without blocking UI
//     const validIds = jobIds.filter((id) => id && typeof id === "string");

//     // Only prefetch jobs not in cache
//     const uncachedIds = validIds.filter((id) => !getFromCache(`job_${id}`));

//     if (uncachedIds.length > 0) {
//       // Fetch without waiting for results
//       fetchJobsByIds(uncachedIds).catch((error) => {
//         console.warn("Prefetch failed:", error.message);
//       });
//     }
//   } catch (error) {
//     // Silently fail prefetch to not impact user experience
//     console.warn("Prefetch error:", error.message);
//   }
// };

import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { firestore } from "../../firebaseConfig";

// Simple cache storage
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Prevent memory issues
const MAX_RETRIES = 2;
const FIRESTORE_IN_LIMIT = 10; // Firestore 'in' query limit

// Helper function to check if cache is still valid
const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_TIME;
};

// Helper function to get from cache
const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  cache.delete(key); // Remove expired cache
  return null;
};

// Helper function to save to cache with size limit
const saveToCache = (key, data) => {
  // Prevent cache from growing too large
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  cache.set(key, {
    data: data,
    timestamp: Date.now(),
  });
};

// Simple retry function for network issues
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

// Production error logger (customize for your logging service)
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

// Helper function to chunk array into smaller arrays
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Helper function to process job data consistently
const processJobData = (docSnapshot) => {
  const jobData = docSnapshot.data();

  if (!jobData || typeof jobData !== "object") {
    return null;
  }

  return {
    id: docSnapshot.id,
    ...jobData,
    // Convert Firestore timestamps to ISO strings
    createdAt:
      jobData.createdAt?.toDate?.()?.toISOString() || jobData.createdAt,
    updatedAt:
      jobData.updatedAt?.toDate?.()?.toISOString() || jobData.updatedAt,
  };
};

/**
 * Fetch all jobs from Firebase with production features - SORTED BY LATEST FIRST
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<Array>} Array of job objects sorted by createdAt (latest first)
 */
export const fetchAllJobs = async (useCache = true) => {
  const cacheKey = "all_jobs_sorted";

  try {
    // Try cache first
    if (useCache) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch with retry logic and sorting
    const jobs = await withRetry(async () => {
      // Create query with sorting by createdAt descending (latest first)
      const jobsQuery = query(
        collection(firestore, "jobs"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(jobsQuery);
      const jobList = [];

      snapshot.forEach((docSnapshot) => {
        const processedJob = processJobData(docSnapshot);
        if (processedJob) {
          jobList.push(processedJob);
          // Cache individual jobs while we have them
          saveToCache(`job_${processedJob.id}`, processedJob);
        }
      });

      return jobList;
    });

    // Save to cache
    saveToCache(cacheKey, jobs);

    return jobs;
  } catch (error) {
    logError("fetchAllJobs", error, { useCache });

    // Return cached data if available during errors
    if (useCache) {
      const staleCache = cache.get(cacheKey);
      if (staleCache) {
        console.warn("Returning stale cached data due to error");
        return staleCache.data;
      }
    }

    throw new Error(
      "Unable to load jobs. Please check your connection and try again."
    );
  }
};

/**
 * Fetch a specific job by ID with production features
 * @param {string} jobId - The job ID to fetch
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<Object|null>} Job object or null if not found
 */
export const fetchJobById = async (jobId, useCache = true) => {
  // Input validation
  if (!jobId || typeof jobId !== "string" || jobId.trim() === "") {
    throw new Error("Please provide a valid job ID");
  }

  const cleanJobId = jobId.trim();
  const cacheKey = `job_${cleanJobId}`;

  try {
    // Try cache first
    if (useCache) {
      const cached = getFromCache(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch with retry logic
    const job = await withRetry(async () => {
      const docRef = doc(firestore, "jobs", cleanJobId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return processJobData(docSnap);
    });

    // Save to cache (including null for not found)
    saveToCache(cacheKey, job);

    return job;
  } catch (error) {
    logError("fetchJobById", error, { jobId: cleanJobId, useCache });

    // Return cached data if available during errors
    if (useCache) {
      const staleCache = cache.get(cacheKey);
      if (staleCache) {
        console.warn(
          `Returning stale cached data for job ${cleanJobId} due to error`
        );
        return staleCache.data;
      }
    }

    throw new Error(
      "Unable to load job details. Please check your connection and try again."
    );
  }
};

/**
 * OPTIMIZED: Batch fetch multiple jobs by IDs using minimal API calls
 * @param {Array<string>} jobIds - Array of job IDs to fetch
 * @param {boolean} useCache - Whether to use cached data
 * @returns {Promise<Array>} Array of job objects (null for not found, preserves input order)
 */
export const fetchJobsByIds = async (jobIds, useCache = true) => {
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return [];
  }

  // Filter and validate job IDs
  const validJobIds = jobIds
    .filter((id) => id && typeof id === "string" && id.trim() !== "")
    .map((id) => id.trim());

  if (validJobIds.length === 0) {
    return [];
  }

  try {
    const cachedResults = new Map();
    const uncachedIds = [];

    // First, check cache for existing jobs
    if (useCache) {
      for (const jobId of validJobIds) {
        const cached = getFromCache(`job_${jobId}`);
        if (cached !== null) {
          cachedResults.set(jobId, cached);
        } else {
          uncachedIds.push(jobId);
        }
      }
    } else {
      uncachedIds.push(...validJobIds);
    }

    // If all jobs are cached, return them in original order
    if (uncachedIds.length === 0) {
      return validJobIds.map((id) => cachedResults.get(id) || null);
    }

    // Fetch uncached jobs in batches (Firestore 'in' limit is 10)
    const idChunks = chunkArray(uncachedIds, FIRESTORE_IN_LIMIT);
    const fetchedJobs = new Map();

    // Process chunks in parallel for better performance
    const chunkPromises = idChunks.map(async (chunk) => {
      return withRetry(async () => {
        const jobsQuery = query(
          collection(firestore, "jobs"),
          where(documentId(), "in", chunk)
        );

        const snapshot = await getDocs(jobsQuery);

        snapshot.forEach((docSnapshot) => {
          const processedJob = processJobData(docSnapshot);
          if (processedJob) {
            fetchedJobs.set(processedJob.id, processedJob);
            // Cache the fetched job
            saveToCache(`job_${processedJob.id}`, processedJob);
          }
        });
      });
    });

    await Promise.all(chunkPromises);

    // Handle jobs that weren't found and cache null results
    for (const jobId of uncachedIds) {
      if (!fetchedJobs.has(jobId)) {
        fetchedJobs.set(jobId, null);
        if (useCache) {
          saveToCache(`job_${jobId}`, null);
        }
      }
    }

    // Combine cached and fetched results in original order
    const finalResults = validJobIds.map((jobId) => {
      // Check cached first
      if (cachedResults.has(jobId)) {
        return cachedResults.get(jobId);
      }
      // Otherwise use fetched result
      return fetchedJobs.get(jobId) || null;
    });

    return finalResults;
  } catch (error) {
    logError("fetchJobsByIds", error, {
      jobIds: validJobIds,
      totalIds: validJobIds.length,
      chunks: Math.ceil(validJobIds.length / FIRESTORE_IN_LIMIT),
    });

    // Fallback to cached data if available
    if (useCache) {
      const fallbackResults = validJobIds.map((jobId) => {
        const staleCache = cache.get(`job_${jobId}`);
        if (staleCache) {
          console.warn(`Using stale cache for job ${jobId}`);
          return staleCache.data;
        }
        return null;
      });

      // If we have some cached data, return it
      if (fallbackResults.some((job) => job !== null)) {
        return fallbackResults;
      }
    }

    throw new Error("Unable to load job details. Please try again.");
  }
};

/**
 * Fetch jobs with filters and pagination
 * @param {Object} filters - Filter options
 * @param {number} filters.limit - Max number of jobs to return
 * @param {string} filters.status - Filter by job status
 * @param {string} filters.category - Filter by job category
 * @param {Object} filters.startAfter - Document to start after (for pagination)
 * @param {string} filters.orderByField - Field to order by (default: 'createdAt')
 * @param {string} filters.orderDirection - Order direction (default: 'desc')
 * @param {boolean} useCache - Whether to use cached data
 * @returns {Promise<Array>} Filtered job objects
 */
export const fetchJobsWithFilters = async (filters = {}, useCache = true) => {
  const {
    limit: limitCount = 50,
    status,
    category,
    startAfter: startAfterDoc,
    orderByField = "createdAt",
    orderDirection = "desc",
  } = filters;

  const cacheKey = `jobs_filtered_${JSON.stringify(filters)}`;

  try {
    if (useCache) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const jobs = await withRetry(async () => {
      let jobsQuery = query(
        collection(firestore, "jobs"),
        orderBy(orderByField, orderDirection)
      );

      // Add filters
      if (status) {
        jobsQuery = query(jobsQuery, where("status", "==", status));
      }
      if (category) {
        jobsQuery = query(jobsQuery, where("category", "==", category));
      }
      if (limitCount) {
        jobsQuery = query(jobsQuery, limit(limitCount));
      }
      if (startAfterDoc) {
        jobsQuery = query(jobsQuery, startAfter(startAfterDoc));
      }

      const snapshot = await getDocs(jobsQuery);
      const jobList = [];

      snapshot.forEach((docSnapshot) => {
        const processedJob = processJobData(docSnapshot);
        if (processedJob) {
          jobList.push(processedJob);
          // Cache individual jobs
          saveToCache(`job_${processedJob.id}`, processedJob);
        }
      });

      return jobList;
    });

    saveToCache(cacheKey, jobs);
    return jobs;
  } catch (error) {
    logError("fetchJobsWithFilters", error, { filters });
    throw new Error("Unable to load filtered jobs. Please try again.");
  }
};

/**
 * Prefetch jobs for better performance with minimal API calls
 * @param {Array<string>} jobIds - Job IDs to prefetch
 */
export const prefetchJobs = async (jobIds) => {
  if (!Array.isArray(jobIds) || jobIds.length === 0) return;

  try {
    const validIds = jobIds.filter((id) => id && typeof id === "string");

    // Only prefetch jobs not in cache
    const uncachedIds = validIds.filter((id) => !getFromCache(`job_${id}`));

    if (uncachedIds.length > 0) {
      // Use the optimized batch fetch without waiting
      fetchJobsByIds(uncachedIds, false).catch((error) => {
        console.warn("Prefetch failed:", error.message);
      });
    }
  } catch (error) {
    // Silently fail prefetch to not impact user experience
    console.warn("Prefetch error:", error.message);
  }
};

/**
 * Clear all cached data
 */
export const clearJobCache = () => {
  const cacheSize = cache.size;
  cache.clear();
  console.log(`Cleared ${cacheSize} cached items`);
};

/**
 * Get cache and service health info
 * @returns {Object} Service health information
 */
export const getServiceHealth = () => {
  const now = Date.now();
  let validCacheCount = 0;

  for (const [key, value] of cache.entries()) {
    if (isCacheValid(value.timestamp)) {
      validCacheCount++;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    cache: {
      total: cache.size,
      valid: validCacheCount,
      expired: cache.size - validCacheCount,
      maxSize: MAX_CACHE_SIZE,
      ttlMinutes: CACHE_TIME / (60 * 1000),
    },
    config: {
      maxRetries: MAX_RETRIES,
      cacheEnabled: true,
      sortOrder: "createdAt desc (latest first)",
      batchSize: FIRESTORE_IN_LIMIT,
    },
    optimization: {
      description: "Uses Firestore 'in' queries to minimize API calls",
      maxApiCallsFor100Jobs: Math.ceil(100 / FIRESTORE_IN_LIMIT),
      estimatedSavings: "90% reduction in API calls for batch operations",
    },
  };
};
