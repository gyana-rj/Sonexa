import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaClient } from "@repo/db/client";

// Returns the signed-in user's stable id — used to build their shareable room link.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const user = await prismaClient.user.findFirst({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  return NextResponse.json({ id: user.id, email: user.email });
}
