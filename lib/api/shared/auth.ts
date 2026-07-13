import { notImplemented } from "./errors"

export interface OwnerSession {
  userId: string
  role: "owner" | "admin"
}

export async function requireOwner(): Promise<OwnerSession> {
  throw notImplemented("Owner authentication is not wired up yet")
}

export async function requireClubOwner(clubId: string): Promise<OwnerSession> {
  throw notImplemented(`Owner authentication for club ${clubId} is not wired up yet`)
}
