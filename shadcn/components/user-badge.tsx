"use client";

import { NeynarProfileCard } from '@neynar/react';

import React from 'react';

interface UserBadgeProps {
  fid?: number
  viewerFid?: number
}

export function UserBadge({ fid = 0}: UserBadgeProps) {

    return (
        <div className="flex flex-col items-center justify-center gap-4 p-4 rounded-lg bg-card text-card-foreground">
            <NeynarProfileCard 
                fid={fid} 
                containerStyles={{
                    background: 'black',
                    color: 'white'
                }}
            />
        </div>
    )
}

export default UserBadge;   