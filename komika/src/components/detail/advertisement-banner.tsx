/* eslint-disable @next/next/no-img-element */
// Banner promosi opsional: tidak merender apa pun bila tidak ada gambar.
export default function AdvertisementBanner({ image, href }: { image?: string; href?: string }) {
  if (!image) return null;
  const content = <img src={image} alt="Promosi" className="ad-banner-img" />;
  return (
    <aside className="ad-banner" aria-label="Iklan">
      {href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : content}
    </aside>
  );
}
