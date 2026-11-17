export default function SongCard({ song, hideLink }) {
  if (!song) return null
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-black/35 p-3 backdrop-blur">
      {song.art ? (
        <img src={song.art} alt="" className="h-12 w-12 flex-none rounded-lg object-cover" />
      ) : (
        <div className="h-12 w-12 flex-none rounded-lg bg-white/10" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{song.title}</div>
        <div className="truncate text-xs text-white/70">{song.artist}</div>
      </div>
      <div className="flex h-5 items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-5 w-[3px] origin-bottom animate-bar rounded bg-sun"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      {!hideLink && song.url && (
        <a href={song.url} target="_blank" rel="noreferrer" className="chip flex-none hover:bg-white/10">
          Open song
        </a>
      )}
    </div>
  )
}
