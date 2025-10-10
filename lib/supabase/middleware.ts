import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // No auth needed - just pass through all requests
  return NextResponse.next({
    request,
  })
}
