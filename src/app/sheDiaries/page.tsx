import type { Metadata } from "next"
import { Navbar } from "@/components/navbar/Navbar"
import { Suspense } from "react"
import { PlaylistGrid } from "@/components/playlist/PlaylistGrid"
import { getChannelPlaylists } from "@/lib/youtube"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "She Diaries | She At Work",
  description:
    "Watch our curated she Diaries on women entrepreneurship, leadership stories, and resources.",
  openGraph: {
    title: "She Diaries  | She At Work",
    description: "Curated video collections on women entrepreneurship and leadership.",
  },
}

export default async function PlaylistPage() {
  const playlists = await getChannelPlaylists()

  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <PlaylistGrid playlists={playlists} />
      </Suspense>
    </>
  )
}