import { AuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { createAppClient, viemConnector } from "@farcaster/auth-client";

declare module "next-auth" {
  interface Session {
    user: {
      fid: number;
    };
  }
  
  interface User {
    id: string;
    fid: number;
  }
}

function getDomainFromUrl(urlString: string | undefined): string {
  if (!urlString) {
    console.warn('NEXTAUTH_URL is not set, using localhost:3000 as fallback');
    return 'localhost:3000';
  }
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) {
    console.error('Invalid NEXTAUTH_URL:', urlString, error);
    console.warn('Using localhost:3000 as fallback');
    return 'localhost:3000';
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Sign in with Farcaster",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials, req) {
        try {
          console.log('Authorize called with credentials:', credentials);
          
          if (!credentials?.message || !credentials?.signature) {
            console.error('Missing message or signature');
            return null;
          }

          const csrfToken = req?.body?.csrfToken;
          if (!csrfToken) {
            console.error('CSRF token is missing from request');
            return null;
          }

          const appClient = createAppClient({
            ethereum: viemConnector(),
          });

          const domain = getDomainFromUrl(process.env.NEXTAUTH_URL);
          console.log('Verifying sign-in message with domain:', domain);

          const verifyResponse = await appClient.verifySignInMessage({
            message: credentials.message,
            signature: credentials.signature as `0x${string}`,
            domain,
            nonce: csrfToken,
          });

          console.log('Verify response:', verifyResponse);
          
          const { success, fid } = verifyResponse;

          if (!success || !fid) {
            console.error('Verification failed:', verifyResponse);
            return null;
          }

          return {
            id: fid.toString(),
            fid: fid,
          };
        } catch (error) {
          console.error('Error in authorize:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.fid = user.fid;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.fid = token.fid as number;
      }
      return session;
    },
  },
  debug: true, // Enable debug messages
  pages: {
    signIn: '/', // Redirect to home page after sign in
    error: '/', // Redirect to home page on error
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax", // Changed from "none" to "lax" for better compatibility
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax", // Changed from "none" to "lax"
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax", // Changed from "none" to "lax"
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  }
}

export const getSession = async () => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}
