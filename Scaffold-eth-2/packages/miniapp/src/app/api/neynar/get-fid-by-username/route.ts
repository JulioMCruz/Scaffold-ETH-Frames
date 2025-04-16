import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Types for Neynar API response
interface MentionedProfile {
  fid: number
  username: string
  display_name?: string
}

interface NeynarUserResponse {
  result: {
    user: {
      fid: number
      username: string
      display_name: string
      pfp_url: string
      profile: {
        bio: {
          text: string
          mentioned_profiles: MentionedProfile[]
        }
      }
      follower_count: number
      following_count: number
      verifications: string[]
      active_status: string
    }
  }
}

// Input validation schema
const querySchema = z.object({
  username: z.string().min(1, 'Username is required')
})

export async function GET(request: NextRequest) {
  try {
    // Get username from query params
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    // Validate input
    const result = querySchema.safeParse({ username })
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid username parameter' },
        { status: 400 }
      )
    }

    // Fetch user data from Neynar
    const response = await fetch(
      `https://hub-api.neynar.com/v1/userDataByFid?username=${username}`,
      {
        headers: {
          'x-api-key': process.env.NEYNAR_API_KEY || '',
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: `Neynar API error: ${error}` },
        { status: response.status }
      )
    }

    const data = (await response.json()) as NeynarUserResponse

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 