"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE } from "./theme";

export async function toggleTheme() {
  const jar = await cookies();
  const next = jar.get(THEME_COOKIE)?.value === "dark" ? "light" : "dark";
  jar.set(THEME_COOKIE, next, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
