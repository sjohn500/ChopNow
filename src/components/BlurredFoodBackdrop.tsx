import feastWallpaper from '../assets/images/hero_chopbellyfull_feast_1795011357691.jpg';

interface BlurredFoodBackdropProps {
  intensity?: 'subtle' | 'rich';
}

export function BlurredFoodBackdrop({
  intensity = 'rich',
}: BlurredFoodBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      <img
        src={feastWallpaper}
        alt=""
        className={`h-full w-full scale-110 object-cover saturate-[1.12] ${
          intensity === 'rich'
            ? 'opacity-90 blur-[14px]'
            : 'opacity-75 blur-[18px]'
        }`}
      />
      <div
        className={`absolute inset-0 ${
          intensity === 'rich'
            ? 'bg-gradient-to-b from-[#FFFDF7]/52 via-[#F3EAD8]/48 to-[#FFFDF7]/64'
            : 'bg-gradient-to-b from-[#FFFDF7]/66 via-[#F3EAD8]/62 to-[#FFFDF7]/74'
        }`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,180,0,0.16),transparent_58%)]" />
    </div>
  );
}
