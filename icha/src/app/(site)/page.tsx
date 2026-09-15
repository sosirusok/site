import { BRAND } from "@/lib/config";

export default function HomePage() {
  return (
    <section className="wrap" style={{ padding: "48px 0" }}>
      <p className="eyebrow">{BRAND.unionName}</p>
      <h1 className="display">{BRAND.name}</h1>
      <p className="lead">{BRAND.tagline}</p>
    </section>
  );
}
