import Image from 'next/image';

interface GalleryProps {
  seed: string;
  count: number;
}

export default function Gallery({ seed, count }: GalleryProps) {
  const images = Array.from({ length: count }, (_, i) => ({
    id: i,
    url: `https://picsum.photos/seed/${seed}-${i}/400/400`,
  }));

  return (
    <div className="grid grid-cols-2 gap-3">
      {images.map((img) => (
        <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 group">
          <Image
            src={img.url}
            alt={`Example ${img.id + 1}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
      ))}
    </div>
  );
}
