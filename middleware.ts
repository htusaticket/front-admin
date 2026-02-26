import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const userStatus = request.cookies.get("userStatus")?.value;
  const userRole = request.cookies.get("userRole")?.value;
  const { pathname } = request.nextUrl;

  // Rutas públicas de autenticación
  const publicAuthPaths = ["/login", "/forgot-password", "/reset-password"];
  const isPublicAuthPath = publicAuthPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));

  // Rutas de estado especial
  const _isPendingPage = pathname === "/pending";
  const _isSuspendedPage = pathname === "/suspended";

  // Rutas protegidas del admin (requieren token + rol admin)
  const protectedPaths = [
    "/dashboard", 
    "/users", 
    "/academy", 
    "/classes", 
    "/jobs", 
    "/challenges",
    "/corrections",
    "/audit",
    "/profile", 
    "/settings",
  ];
  const isProtectedPath = protectedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));

  // 1. Sin token intentando acceder a ruta protegida o root → login
  if (!token && (isProtectedPath || pathname === "/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Con token pero sin rol de admin → mostrar error (o redirigir a login)
  if (token && isProtectedPath) {
    if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      // Limpiar cookies y redirigir a login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("accessToken");
      response.cookies.delete("userStatus");
      response.cookies.delete("userRole");
      return response;
    }
  }

  // 3. Con token, admin activo, intentando acceder a login o root → dashboard
  if (token && userStatus === "ACTIVE" && (userRole === "ADMIN" || userRole === "SUPERADMIN")) {
    if (isPublicAuthPath || pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 4. Con token pero PENDING, no en /pending → redirigir
  if (token && userStatus === "PENDING" && isProtectedPath) {
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  // 5. Con token pero SUSPENDED, no en /suspended → redirigir
  if (token && userStatus === "SUSPENDED" && isProtectedPath) {
    return NextResponse.redirect(new URL("/suspended", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/users/:path*",
    "/academy/:path*",
    "/classes/:path*",
    "/jobs/:path*",
    "/challenges/:path*",
    "/corrections/:path*",
    "/audit/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/pending",
    "/suspended",
  ],
};
