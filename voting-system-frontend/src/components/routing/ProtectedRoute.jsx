import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/**
 * ProtectedRoute
 * @param {string|string[]} roles      Allowed roles (e.g. ["admin"], ["voter"])
 * @param {string}          redirectTo Redirect URL when authenticated but wrong role
 */
export default function ProtectedRoute({ children, roles, redirectTo = "/" }) {
  const user = useAuthStore((s) => s.user);
  const bootstrapping = useAuthStore((s) => s.bootstrapping);

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
