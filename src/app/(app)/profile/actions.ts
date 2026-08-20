"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema, updateNameSchema } from "@/lib/validation/auth";
import { changeUserPassword, IncorrectPasswordError } from "@/lib/services/auth-service";

const MAX_AVATAR_BYTES = 1_500_000;

export async function updateAvatar(formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "No image selected" };
  if (!file.type.startsWith("image/")) return { error: "File must be an image" };
  if (file.size > MAX_AVATAR_BYTES) return { error: "Image is too large" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await prisma.user.update({ where: { id: session.user.id }, data: { imageUrl: dataUrl } });
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return {};
}

type UpdateNameState = { error?: string; ok?: boolean };

export async function updateName(_prevState: UpdateNameState, formData: FormData): Promise<UpdateNameState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };

  const parsed = updateNameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name } });
  revalidatePath("/profile");
  return { ok: true };
}

type ChangePasswordState = { error?: string; ok?: boolean };

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await changeUserPassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (error) {
    if (error instanceof IncorrectPasswordError) return { error: error.message };
    throw error;
  }

  return { ok: true };
}
