// Production-Ready Firebase Job Service
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { firestore } from "../../firebaseConfig";

// Simple cache storage
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Prevent memory issues
const MAX_RETRIES = 2;

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

/**
 * Fetch all jobs from Firebase with production features
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<Array>} Array of job objects
 */
export const fetchAllJobs = async (useCache = true) => {
  const cacheKey = "all_jobs";

  try {
    // Try cache first
    if (useCache) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch with retry logic
    const jobs = await withRetry(async () => {
      const snapshot = await getDocs(collection(firestore, "jobs"));
      const jobList = [];

      snapshot.forEach((docSnapshot) => {
        const jobData = docSnapshot.data();

        // Basic data validation
        if (jobData && typeof jobData === "object") {
          jobList.push({
            id: docSnapshot.id,
            ...jobData,
          });
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

      const jobData = docSnap.data();

      // Basic data validation
      if (!jobData || typeof jobData !== "object") {
        throw new Error("Invalid job data received");
      }

      return {
        id: docSnap.id,
        ...jobData,
      };
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
 * Batch fetch multiple jobs by IDs (production optimization)
 * @param {Array<string>} jobIds - Array of job IDs to fetch
 * @param {boolean} useCache - Whether to use cached data
 * @returns {Promise<Array>} Array of job objects (null for not found)
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
    // Fetch jobs in parallel for better performance
    const promises = validJobIds.map((jobId) =>
      fetchJobById(jobId, useCache).catch((error) => {
        console.warn(`Failed to fetch job ${jobId}:`, error.message);
        return null; // Continue with other jobs even if one fails
      })
    );

    return await Promise.all(promises);
  } catch (error) {
    logError("fetchJobsByIds", error, { jobIds: validJobIds });
    throw new Error("Unable to load some job details. Please try again.");
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
    },
  };
};

/**
 * Prefetch jobs for better performance
 * @param {Array<string>} jobIds - Job IDs to prefetch
 */
export const prefetchJobs = async (jobIds) => {
  if (!Array.isArray(jobIds) || jobIds.length === 0) return;

  try {
    // Fetch jobs in background without blocking UI
    const validIds = jobIds.filter((id) => id && typeof id === "string");

    // Only prefetch jobs not in cache
    const uncachedIds = validIds.filter((id) => !getFromCache(`job_${id}`));

    if (uncachedIds.length > 0) {
      // Fetch without waiting for results
      fetchJobsByIds(uncachedIds).catch((error) => {
        console.warn("Prefetch failed:", error.message);
      });
    }
  } catch (error) {
    // Silently fail prefetch to not impact user experience
    console.warn("Prefetch error:", error.message);
  }
};

// Usage Examples:
/*
import { 
  fetchAllJobs, 
  fetchJobById, 
  fetchJobsByIds,
  clearJobCache, 
  getServiceHealth,
  prefetchJobs 
} from './JobService.js';

// 1. Basic usage (production optimized)
try {
  const jobs = await fetchAllJobs();
  console.log('Jobs loaded:', jobs.length);
} catch (error) {
  console.error('Error:', error.message);
  // Show user-friendly error in UI
}

// 2. Batch fetch multiple jobs
const jobIds = ['job1', 'job2', 'job3'];
const jobs = await fetchJobsByIds(jobIds);
console.log('Batch loaded:', jobs.filter(job => job !== null).length);

// 3. Prefetch for better performance
const upcomingJobIds = ['job4', 'job5', 'job6'];
prefetchJobs(upcomingJobIds); // Non-blocking

// 4. Monitor service health
const health = getServiceHealth();
console.log('Service status:', health);

// 5. Production React component
import React, { useState, useEffect } from 'react';

const ProductionJobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const loadJobs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const jobData = await fetchAllJobs();
      setJobs(jobData);
      setRetryCount(0);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadJobs();
  };

  useEffect(() => {
    loadJobs();
  }, []);

  if (loading && jobs.length === 0) {
    return <div>Loading jobs...</div>;
  }

  return (
    <div>
      {error && (
        <div style={{ 
          background: '#fee', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '10px' 
        }}>
          <p>Error: {error}</p>
          <button onClick={handleRetry}>
            Retry {retryCount > 0 && `(${retryCount})`}
          </button>
        </div>
      )}
      
      <button onClick={() => loadJobs(false)}>
        Refresh {loading && '...'}
      </button>
      
      {jobs.length === 0 ? (
        <p>No jobs available</p>
      ) : (
        <div>
          <p>{jobs.length} jobs found</p>
          {jobs.map(job => (
            <div key={job.id} style={{ 
              border: '1px solid #ddd', 
              padding: '10px', 
              margin: '5px 0' 
            }}>
              <h3>{job.title || 'Untitled Job'}</h3>
              <p>{job.company || 'Unknown Company'}</p>
              <p>{job.location || 'Location not specified'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductionJobList;
*/
