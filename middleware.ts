import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {

  const token =
    request.cookies.get("sb-access-token") ||
    request.cookies.get("sb-refresh-token");

  const ruta = request.nextUrl.pathname;

  const protegidas = [
    "/admin",
    "/campus",
    "/perfil",
    "/practica",
  ];

  const requiereAuth = protegidas.some((p) =>
    ruta.startsWith(p)
  );

  if (requiereAuth && !token) {

    return NextResponse.redirect(
      new URL("/login", request.url)
    );

  }

  return NextResponse.next();

}

export const config = {

  matcher: [
    "/admin/:path*",
    "/campus/:path*",
    "/perfil/:path*",
    "/practica/:path*",
  ],

};