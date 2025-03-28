import { API_URL } from "@src/Env.jsx";
import { logError } from "@utils/logger";
import { useState, useEffect, useCallback } from "react";
import useAuthAxios from "@hooks/useAuthAxios";

const useFetchUrlsStats = (userId, currentPage) => {
  const [urlsStats, setUrlsStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const authAxios = useAuthAxios();

  const fetchUrlsStats = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const urlsRes = await authAxios.get(`${API_URL}/user/${userId}/stats`, {
        params: {
          page: currentPage,
        },
      });
      setUrlsStats(urlsRes.data.stats || []);
      setTotalPages(urlsRes.data.pagination.totalPages);
    } catch (error) {
      logError("Error fetching URLs stats:", error);
      setUrlsStats([]);
    } finally {
      setLoading(false);
    }
  }, [userId, currentPage, authAxios]);

  useEffect(() => {
    if (!userId) return;
    fetchUrlsStats();
  }, [userId, currentPage, fetchUrlsStats]);

  return { urlsStats, loading, totalPages };
};

export default useFetchUrlsStats;
