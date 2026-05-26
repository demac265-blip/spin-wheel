interface GameCardProps {
  name: string;
  playerUrl: string;
  adminUrl: string;
  image: string;
}

export function GameCard({ name, playerUrl, adminUrl, image }: GameCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border-gold bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-gold">
      <a href={playerUrl} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-black">
        <img
          src={image}
          alt={`${name} casino game logo`}
          loading="lazy"
          width={512}
          height={512}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </a>
      <div className="p-4 text-center border-t border-gold bg-card">
        <h3 className="text-lg font-bold tracking-wider text-gold-gradient">{name}</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-full bg-gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider shadow-gold hover:scale-105 transition-transform"
          >
            Player
          </a>
          <a
            href={adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-full border-gold text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors"
          >
            Admin
          </a>
        </div>
      </div>
    </div>
  );
}
