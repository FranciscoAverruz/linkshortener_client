import useAuthAxios from "@hooks/useAuthAxios";
import { API_URL } from "@src/Env.jsx";
import { logError } from "@utils/logger";
import { AuthContext } from "@context/AuthContext";
import { useState, useEffect, useContext } from "react";

const useUserUrlsStats = () => {
  const [loading, setLoading] = useState(true);
  const [totalUrls, setTotalUrls] = useState(0);
  const [urlsStats, setUrlsStats] = useState([]);
  const { user } = useContext(AuthContext);
  const { userId } = useContext(AuthContext);
  const authAxios = useAuthAxios();

  useEffect(() => {
    if (!user || !userId) {
      return;
    }

    const fetchUserUrlsStats = async () => {
      try {
        const response = await authAxios.get(`${API_URL}/user/${userId}/stats`);
        setTotalUrls(response.data.pagination.totalUrls || 0);
        setUrlsStats(response.data.stats || []);
      } catch (error) {
        logError("Error fetching URL stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserUrlsStats();
  }, [user, userId, authAxios]);

  return { loading, totalUrls, urlsStats };
};

export default useUserUrlsStats;
