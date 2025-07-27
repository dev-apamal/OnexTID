// hooks/useJobs.js
import { useState, useEffect, useCallback } from "react";
import { fetchAllJobs } from "../services/jobs/fetch";

// Simple cache - just store data with timestamp
const jobsCache = {
  data: null,
  timestamp: null,

  set(data) {
    this.data = data;
    this.timestamp = Date.now();
  },

  get() {
    // Cache for 3 minutes
    const CACHE_TIME = 3 * 60 * 1000;

    if (!this.data || !this.timestamp) {
      return null;
    }

    const isExpired = Date.now() - this.timestamp > CACHE_TIME;
    if (isExpired) {
      this.clear();
      return null;
    }

    return this.data;
  },

  isStale() {
    // Consider stale after 1 minute
    const STALE_TIME = 1 * 60 * 1000;

    if (!this.timestamp) return true;
    return Date.now() - this.timestamp > STALE_TIME;
  },

  clear() {
    this.data = null;
    this.timestamp = null;
  },
};

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async (useCache = true) => {
    try {
      // Check cache first
      if (useCache) {
        const cachedJobs = jobsCache.get();
        if (cachedJobs) {
          setJobs(cachedJobs);
          setError(null);
          setLoading(false);

          // If cache is stale, refresh in background
          if (jobsCache.isStale()) {
            // Background refresh without showing loading
            fetchAllJobs()
              .then((freshData) => {
                jobsCache.set(freshData);
                setJobs(freshData);
              })
              .catch((err) => {
                console.error("Background refresh failed:", err);
                // Don't update error state for background failures
              });
          }

          return;
        }
      }

      setLoading(true);
      setError(null);

      const jobData = await fetchAllJobs();

      // Update cache and state
      jobsCache.set(jobData);
      setJobs(jobData);
    } catch (err) {
      setError(err.message);
      console.error("Error loading jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Force fresh data (ignore cache)
      const jobData = await fetchAllJobs(false);

      // Update cache and state
      jobsCache.set(jobData);
      setJobs(jobData);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Clear cache function (useful for logout, etc.)
  const clearCache = useCallback(() => {
    jobsCache.clear();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    loading,
    error,
    refreshing,
    loadJobs,
    onRefresh,
    clearCache, // New: for manual cache clearing
  };
}
