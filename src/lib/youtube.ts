// lib/youtube.ts

const API_KEY = process.env.YOUTUBE_API_KEY
const CHANNEL_ID = "UCRDm04xdA1tWZsBoMCyEUqw" // paste from step 1

export async function getChannelPlaylists() {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}`,
    { next: { revalidate: 3600 } }
  )
  const data = await res.json()
  return data.items ?? []
}

export async function getPlaylistVideos(playlistId: string) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}`,
    { next: { revalidate: 3600 } }
  )
  const data = await res.json()
  return data.items ?? []
}