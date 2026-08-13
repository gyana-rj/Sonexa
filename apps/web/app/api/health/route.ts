import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Liveness probe for load balancers and container orchestrators.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
