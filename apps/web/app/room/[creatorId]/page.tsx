import type { Metadata } from "next";
import { RoomClient } from "@/components/room/room-client";

export const metadata: Metadata = {
  title: "Listening Room — Sonexa",
  description: "Join the room, add tracks and vote on what plays next.",
};

export default async function RoomPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  return <RoomClient creatorId={creatorId} />;
}
