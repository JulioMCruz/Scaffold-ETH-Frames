"use client";

import UserBadge from "@/components/user-badge";
import { useNeynarContext } from "@neynar/react";

export default function Home() {
  const { user, isAuthenticated } = useNeynarContext();
  
  return (
    <>
      {isAuthenticated && user?.fid ? (
        <UserBadge fid={user.fid} />
      ) : null}
    </>
  );
}
