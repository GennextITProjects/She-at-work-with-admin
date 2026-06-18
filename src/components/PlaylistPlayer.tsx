/*eslint-disable  @typescript-eslint/no-explicit-any */
// components/PlaylistPlayer.tsx
"use client"

import Image from "next/image"
import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export function PlaylistPlayer({
  videos,
  playlistId,
}: {
  videos: any[]
  playlistId: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeVideo = videos[activeIndex]
  const activeVideoId = activeVideo.snippet.resourceId.videoId

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Back button */}
      <Link
        href="/playlist"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        All Playlists
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT — Video Player */}
        <div className="flex-1">
          {/* Player */}
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
            <iframe
              key={activeVideoId}
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&list=${playlistId}&rel=0`}
              title={activeVideo.snippet.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Active video info */}
          <div className="mt-4">
            <h1 className="text-xl font-bold line-clamp-2">
              {activeVideo.snippet.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(activeVideo.snippet.publishedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {activeVideo.snippet.description && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                {activeVideo.snippet.description}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT — Video List */}
        <div className="lg:w-80 xl:w-96">
          <h2 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
            {videos.length} Videos in this playlist
          </h2>

          <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
            {videos.map((video: any, index: number) => {
              const { title, thumbnails, resourceId } = video.snippet
              const thumbnail = thumbnails?.medium?.url ?? thumbnails?.default?.url
              const isActive = index === activeIndex

              return (
                <button
                  key={resourceId.videoId}
                  onClick={() => setActiveIndex(index)}
                  className={`flex gap-3 rounded-lg p-2 text-left transition-all duration-200 ${
                    isActive
                      ? "bg-accent/10 border border-accent/30"
                      : "hover:bg-muted border border-transparent"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-28 aspect-video rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={thumbnail}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-red-600 rounded-full p-1.5">
                          <svg className="w-3 h-3 text-white fill-white" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {/* Index number */}
                    {!isActive && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <p className={`text-xs font-medium line-clamp-3 ${isActive ? "text-accent" : ""}`}>
                    {title}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}