import { NextResponse } from "next/server";
import { isValidSyncSecret, jobSyncCookieName } from "@/lib/jobSyncAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";

  if (!isValidSyncSecret(token)) {
    return new NextResponse("云端同步授权链接无效。", { status: 401 });
  }

  const response = NextResponse.redirect(new URL("/", url.origin));
  response.cookies.set(jobSyncCookieName, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });
  return response;
}


