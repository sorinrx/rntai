// app/components/ProtectedPage.tsx
"use client";

import { useSession, signIn } from "next-auth/react";

const ProtectedPage = ({ children }) => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div>
        <h1>Access Denied</h1>
        <button onClick={() => signIn("google")}>Sign in</button>
      </div>
    );
  }

  return children;
};

export default ProtectedPage;
