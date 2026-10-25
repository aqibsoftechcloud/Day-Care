import { apiFetch } from "./client";
import type { CreateUserInput, UpdateUserInput, User } from "@/types/user";

type UsersListResponse = { success: true; users: User[] };
type UserResponse = { success: true; user: User };
type DeleteUserResponse = { success: true; message: string };

export function listUsers() {
  return apiFetch<UsersListResponse>("/api/users");
}

/** `userId` is the already-encrypted `user_id` string — never a raw numeric id (see controllers/user.controller.ts's use of decryptUserId). */
export function getUser(userId: string) {
  return apiFetch<UserResponse>(`/api/users/${userId}`);
}

export function createUser(data: CreateUserInput) {
  return apiFetch<UserResponse>("/api/users", { method: "POST", body: data });
}

export function updateUser(userId: string, data: UpdateUserInput) {
  return apiFetch<UserResponse>(`/api/users/${userId}`, {
    method: "PUT",
    body: data,
  });
}

/** Backend semantics: a soft delete that sets status to "inactive" — the record itself is never removed (services/user.service.ts). */
export function deleteUser(userId: string) {
  return apiFetch<DeleteUserResponse>(`/api/users/${userId}`, {
    method: "DELETE",
  });
}
