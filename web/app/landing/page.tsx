import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeroMedia } from "@/components/LandingHeroMedia";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Visual GitHub Actions Builder",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

const siteUrl = getSiteUrl();
const structuredData = siteUrl
  ? {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: siteUrl, name: "MasarCI", description: "Visual GitHub Actions workflow builder with security linting." },
        { "@type": "SoftwareApplication", "@id": `${siteUrl}/#application`, name: "MasarCI", url: siteUrl, applicationCategory: "DeveloperApplication", operatingSystem: "Web", description: "Build, inspect, lint, and export GitHub Actions workflows." },
      ],
    }
  : null;

const features = [
  ["01", "Visual builder", "Arrange triggers, jobs, and steps as a readable path."],
  ["02", "Security linting", "See risky patterns in context and apply safe fixes."],
  ["03", "Downloadable YAML", "Leave with valid GitHub Actions YAML you can trust."],
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />}
      <div className="landing-grid" aria-hidden="true" />
      <div className="landing-inner">
        <header className="landing-header">
          <Link href="/" className="landing-wordmark">masar<span>·</span>ci</Link>
          <span>Visual GitHub Actions builder · security linter</span>
        </header>

        <section className="landing-hero">
          <div className="landing-copy">
            <p className="landing-eyebrow">Build the path</p>
            <h1>Make your CI <i>legible.</i></h1>
            <p className="landing-lede">MasarCI is a visual GitHub Actions workflow builder with security linting, so you can see, inspect, and improve CI before it reaches production.</p>
            <div className="landing-actions">
              <Link href="/workstation" className="landing-cta">Open builder <span aria-hidden="true">↗</span></Link>
              <a href="#system" className="landing-quiet-link">See the system ↓</a>
            </div>
            <div className="landing-meta"><span><b>01</b> / visual workflow</span><span><b>02</b> / security context</span><span><b>03</b> / readable YAML</span></div>
          </div>
          <div className="landing-stage-wrap">
            <LandingHeroMedia />
            <img className="landing-logo-tile" src="/masar-ci.png" alt="MasarCI logo" />
            <div className="landing-signal"><b>PATH STATUS</b><br />trigger → build → deploy</div>
          </div>
        </section>

        <section className="landing-proof" aria-label="MasarCI capabilities">
          {features.map(([index, title]) => <div key={index}><small>{index}</small><span>{title}</span></div>)}
        </section>

        <section id="system" className="landing-section">
          <div><p className="landing-kicker">The workflow is the interface</p><h2>Keep the system in view.</h2></div>
          <div className="landing-section-copy"><p>The landing page should feel like the product: quiet surfaces, visible paths, and enough signal to make a confident next move.</p><div className="landing-feature-grid">{features.map(([index, title, copy]) => <article key={index}><small>{index}</small><h3>{title}</h3><p>{copy}</p></article>)}</div></div>
        </section>

        <section className="landing-section landing-reference">
          <div><p className="landing-kicker">From concept to canvas</p><h2>Design the path. Then open the builder.</h2><p className="landing-section-copy">A real workflow view anchors the promise: arrange the graph, inspect the YAML, and resolve security findings in the same working surface.</p></div>
          <figure><img src="/masar-ci-builder-reference.png" alt="MasarCI builder canvas reference" /><figcaption>Existing builder surface · reference asset</figcaption></figure>
        </section>

        <section className="landing-closing">
          <div><p className="landing-kicker">Ready when the pipeline is</p><h2>Make the next run easier to trust.</h2></div>
          <div><p>Open a blank workflow or bring an existing YAML file into a visual, security-aware workspace.</p><Link href="/workstation" className="landing-cta">Open builder <span aria-hidden="true">↗</span></Link></div>
        </section>

        <footer className="landing-footer"><span>masar<span>·</span>ci</span><span>Landing page · Workflow Observatory</span></footer>
      </div>
    </main>
  );
}
