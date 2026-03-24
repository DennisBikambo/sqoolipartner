import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { setQueryLoading, setQuerySuccess } from "../store/slices/queryStatusSlice";

export interface ConvexQueryResult<T> {
  data: T | undefined;
  status: "loading" | "error" | "success";
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: string | null;
}

/**
 * Wraps a Convex useQuery result with Redux-backed 3-state management.
 *
 * Usage:
 *   const rawCampaigns = useQuery(api.campaigns.getAll, { partner_id });
 *   const { data: campaigns, isLoading, isError, isSuccess } = useConvexQuery("campaigns", rawCampaigns);
 *
 * @param key   Unique string key for this query (e.g. "campaigns", "wallet", "transactions")
 * @param result The raw result from Convex useQuery (undefined = loading, T = data)
 */
export function useConvexQuery<T>(key: string, result: T | undefined): ConvexQueryResult<T> {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector((state: RootState) => state.queryStatus.statuses[key] ?? "loading");
  const error = useSelector((state: RootState) => state.queryStatus.errors[key] ?? null);

  useEffect(() => {
    if (result === undefined) {
      // Only dispatch loading if not already loading (avoid unnecessary re-renders)
      if (status !== "loading") {
        dispatch(setQueryLoading(key));
      }
    } else {
      dispatch(setQuerySuccess(key));
    }
  }, [result, key, dispatch, status]);

  return {
    data: result,
    status: status as "loading" | "error" | "success",
    isLoading: status === "loading",
    isError: status === "error",
    isSuccess: status === "success",
    error,
  };
}
