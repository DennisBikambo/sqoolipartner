import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";

export function SystemLoggerProvider() {
  const location = useLocation();
  const { user } = useAuth();
  const logMutation = useMutation(api.systemLogs.logFrontendEvent);

  const fireLog = useCallback(
    (payload: Parameters<typeof logMutation>[0]) => {
      logMutation(payload).catch(() => {});
    },
    [logMutation]
  );

  const userId = user && "_id" in user ? String(user._id) : undefined;
  const userEmail = user?.email ?? undefined;

  // Route change logging
  useEffect(() => {
    fireLog({
      user_id: userId,
      user_email: userEmail,
      level: "info",
      event_name: "navigation.routeChange",
      status: "success",
      message: location.pathname,
      details: JSON.stringify({ path: location.pathname, search: location.search }),
    });
  }, [location.pathname, fireLog, userId, userEmail]);

  // Global error + rejection listeners — re-register when user changes
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      fireLog({
        user_id: userId,
        user_email: userEmail,
        level: "error",
        event_name: "browser.uncaughtError",
        status: "error",
        message: event.message,
        details: JSON.stringify({
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack?.slice(0, 500),
        }),
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      fireLog({
        user_id: userId,
        user_email: userEmail,
        level: "error",
        event_name: "browser.unhandledRejection",
        status: "error",
        message: String(event.reason),
        details: JSON.stringify({
          reason: String(event.reason),
          stack: event.reason?.stack?.slice(0, 500),
        }),
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [fireLog, userId, userEmail]);

  return null;
}
