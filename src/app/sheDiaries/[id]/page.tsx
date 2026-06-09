/*eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar/Navbar"
import { Suspense } from "react"
import { getPlaylistVideos, getChannelPlaylists } from "@/lib/youtube"
import { PlaylistDetailClient } from "@/components/playlist/PlaylistDetailClient"

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>   // ← Promise type
}): Promise<Metadata> {
  const { id } = await params        // ← await it
  const playlists = await getChannelPlaylists()
  const playlist = playlists.find((p: any) => p.id === id)
  const title = playlist?.snippet?.title ?? "Playlist"
  return {
    title: `${title} | She At Work`,
    description: playlist?.snippet?.description ?? "Watch this playlist on She At Work.",
  }
}

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>   // ← Promise type
}) {
  const { id } = await params        // ← await it

  const [videos, playlists] = await Promise.all([
    getPlaylistVideos(id),
    getChannelPlaylists(),
  ])

  const currentPlaylist = playlists.find((p: any) => p.id === id)
  const playlistTitle = currentPlaylist?.snippet?.title ?? "Playlist"
  const playlistDescription = currentPlaylist?.snippet?.description ?? ""

  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <PlaylistDetailClient
          videos={videos}
          playlistId={id}
          playlistTitle={playlistTitle}
          playlistDescription={playlistDescription}
        />
      </Suspense>
    </>
  )
}