"use client";

import React, { useCallback, useState, useEffect, Suspense } from "react";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk from "@farcaster/frame-sdk";
import {
  useAccount,
} from "wagmi";
import dynamic from 'next/dynamic';

import { Button } from "~/components/ui/Button";
import { useSession } from "next-auth/react";
import { useFrame } from "~/components/providers/FrameProvider";

// Dynamically import NeynarProfileCard with no SSR
const NeynarProfileCard = dynamic(
  () => import("@neynar/react").then((mod) => mod.NeynarProfileCard),
  { 
    ssr: false,
    loading: () => <div className="h-32 w-full bg-gray-100 animate-pulse rounded-lg" />
  }
);

// Client-only wrapper component
function ProfileCardWrapper({ context, session }: { 
  context: { user: { fid: number } } | null | undefined, 
  session: { user: { fid: number } } | null | undefined 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !context?.user?.fid || !session?.user?.fid || hasError) {
    return null;
  }

  return (
    <div className="mb-4">
      <Suspense fallback={<div className="h-32 w-full bg-gray-100 animate-pulse rounded-lg" />}>
        <ErrorBoundary onError={() => setHasError(true)}>
          <NeynarProfileCard
            fid={context.user.fid}
            viewerFid={session.user.fid}
          />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Error in ProfileCard:', error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

function SignIn() {
  const [isMounted, setIsMounted] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, status, update } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });

      const signInResult = await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });

      if (signInResult?.error) {
        console.error("Sign in failed:", signInResult.error);
        return;
      }

      // Force a session update
      await update();

    } catch (e) {
      console.error("Sign in error:", e);
    } finally {
      setSigningIn(false);
    }
  }, [getNonce, update]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut({ redirect: false });
      // Force a session update after sign out
      await update();
    } finally {
      setSigningOut(false);
    }
  }, [update]);

  // Return null during server-side rendering
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {(status === "unauthenticated" || status === "loading") && (
        <Button onClick={handleSignIn} disabled={signingIn || status === "loading"}>
          {status === "loading" ? "Loading..." : "Sign In with Farcaster"}
        </Button>
      )}
      {status === "authenticated" && session && (
        <>
          <Button onClick={handleSignOut} disabled={signingOut}>
            Sign out
          </Button>
          <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
            <div className="font-semibold text-gray-500 mb-1">Session</div>
            <div className="whitespace-pre">
              {JSON.stringify(session, null, 2)}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!title) {
    title = process.env.NEXT_PUBLIC_FRAME_TITLE || "Frames v2 Demo";
  }

  const { isSDKLoaded, context } = useFrame();
  const [isContextOpen, setIsContextOpen] = useState(false);

  const { address, isConnected } = useAccount();

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  // Return null during server-side rendering
  if (!isMounted) {
    return null;
  }

  // Return loading state while SDK is initializing
  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <ProfileCardWrapper context={context} session={session} />

        <div className="mb-4">
          <SignIn />
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

        <p className="text-white font-bold">Exist Context: {context ? "true" : "false"}</p>
        <p className="text-white font-bold">User Its Connected: {isConnected ? "true" : "false"}</p>
        <p className="text-white font-bold">User Address: {address}</p>
        <p className="text-white font-bold">Exist Session: {session ? "true" : "false"}</p>
        {context && (
          <div className="mb-4">
            <h2 className="font-2xl font-bold">Context</h2>
            <button
              onClick={toggleContext}
              className="flex items-center gap-2 transition-colors"
            >
              <span
                className={`transform transition-transform ${
                  isContextOpen ? "rotate-90" : ""
                }`}
              >
                ➤
              </span>
              Tap to expand
            </button>

            {isContextOpen && (
              <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <pre className="text-black font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                  {JSON.stringify(context, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

