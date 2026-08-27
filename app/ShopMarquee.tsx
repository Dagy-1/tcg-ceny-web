import Image from "next/image";
import { ExternalLink } from "lucide-react";

type Shop = { name: string; icon: string; url: string };

export default function ShopMarquee({ shops }: { shops: readonly Shop[] }) {
  return (
    <div className="shop-marquee-wrap">
      <div className="shop-marquee" aria-label="Sledované české e-shopy">
        <div className="shop-marquee-track">
          {[false, true].map((isDuplicate) => (
            <div className="shop-tags" aria-hidden={isDuplicate ? "true" : undefined} key={isDuplicate ? "duplicate" : "primary"}>
              {shops.map((shop) => (
                <a className="shop-link" href={shop.url} target="_blank" rel="noopener noreferrer" tabIndex={isDuplicate ? -1 : undefined} aria-label={`Otevřít e-shop ${shop.name} v nové kartě`} key={shop.name}>
                  <span className="shop-mark" aria-hidden="true"><Image className="shop-logo" src={shop.icon} alt="" width={64} height={64} unoptimized /></span>
                  <span className="shop-name">{shop.name}</span>
                  <ExternalLink className="shop-link-icon" size={13} strokeWidth={1.8} aria-hidden="true" />
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
