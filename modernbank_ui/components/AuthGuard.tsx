"use client";

import { setUser } from "@/store/slices/authSlice";
import { RootState } from "@/store/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          dispatch(setUser({
            user_id: data.user_id,
            name: data.user_id
          }));
        } else if (!pathname.startsWith("/sign")) {
          // Don't redirect paths starting with /signin or /signup
          router.push("/signin");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (!pathname.startsWith("/sign")) {
          // Don't redirect paths starting with /signin or /signup
          router.push("/signin");
        }
      }
    };

    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, dispatch, router, pathname]);

  // Show login/signup pages even when not authenticated
  if (!isAuthenticated && !pathname.startsWith("/sign")) {
    return null;
  }

  return <>{children}</>;
}
