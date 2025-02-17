"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function withAuth(Component: any) {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    }, [router]);

    if (loading) return <p>Loading...</p>;

    return <Component {...props} />;
  };
}
