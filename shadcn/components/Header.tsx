"use client";

import { NeynarAuthButton } from "@neynar/react";
import Link from "next/link";
import { FC } from "react";

export const Header: FC = () => {
  return (
    <div className="flex items-center justify-between px-16 pt-4 text-white">
      <Link href="/" className="text-3xl font-bold">
        NeynarClient
      </Link>

      <NeynarAuthButton 
        className="right-4 top-4" 
        value="Sign Out"
      />
    </div>
  );
};
