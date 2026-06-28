"use server";

import { verify } from "@node-rs/argon2";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, deleteCurrentSession } from "./session";

export type LoginState = { error?: string };

const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8),
});

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: "Informe um e-mail e uma senha válidos." };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      memberships: {
        where: { tenant: { status: "ACTIVE" } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user || user.status !== "ACTIVE") return { error: "E-mail ou senha incorretos." };

  const passwordIsValid = await verify(user.passwordHash, parsed.data.password);
  const membership = user.memberships[0];
  if (!passwordIsValid || !membership) return { error: "E-mail ou senha incorretos." };

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id, membership.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteCurrentSession();
  redirect("/login");
}
