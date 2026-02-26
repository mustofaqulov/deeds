export default function VideoModal({ surah, onClose }) {
  if (!surah) return null;
  const videoId = surah.youtubeId;
  const hasVideo = Boolean(videoId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="video-modal card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>🎥 {surah.nameTranslit} - Video darslik</h2>
            <p>{surah.nameUz} surahi uchun tavsiya etilgan dars.</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Yopish</button>
        </div>

        {hasVideo ? (
          <div className="video-frame">
            <iframe
              title={surah.nameTranslit}
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="video-empty">Video tayyor emas. Keyinroq urinib ko'ring.</div>
        )}
      </div>
    </div>
  );
}