import type { Metadata } from "next";
import Link from "next/link";
import { LandingHashCleanup } from "@/components/LandingHashCleanup";
import { LandingHeroMedia } from "@/components/LandingHeroMedia";
import { LandingScrollButton } from "@/components/LandingScrollButton";
import { PwaInstallAction } from "@/components/pwa/PwaInstallAction";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Visual DevOps Workbench",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

const siteUrl = getSiteUrl();
const structuredData = siteUrl
  ? {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: siteUrl, name: "MasarCI", description: "Local-first visual DevOps workbench." },
        { "@type": "SoftwareApplication", "@id": `${siteUrl}/#application`, name: "MasarCI", url: siteUrl, applicationCategory: "DeveloperApplication", operatingSystem: "Web", description: "Author and review Actions, Docker, Kubernetes, and Terraform artifacts locally." },
      ],
    }
  : null;

const workspaces = [
  {
    id: "actions",
    name: "Actions",
    eyebrow: "AUTHOR WORKFLOWS",
    description: "Shape triggers, jobs, permissions, and findings before a workflow runs.",
    href: "/workstation/actions",
  },
  {
    id: "containers",
    name: "Docker",
    eyebrow: "MAP CONTAINERS",
    description: "Map Compose services, images, ports, and Dockerfile build stages.",
    href: "/workstation/docker",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    eyebrow: "AUTHOR MANIFESTS",
    description: "Inspect manifests, selectors, resources, and security context.",
    href: "/workstation/kubernetes",
  },
  {
    id: "terraform",
    name: "Terraform Review",
    eyebrow: "REVIEW PLAN JSON",
    description: "Review immutable, redacted plan data. No apply, state, or provider execution.",
    href: "/workstation/terraform",
  },
];

const proofPoints = [
  ["Author", "Actions, Compose, Dockerfile, and Kubernetes remain editable sources."],
  ["Trace", "Inspect relationships and deterministic findings beside artifact paths."],
  ["Review", "Terraform plan JSON becomes a bounded, digest-bound review snapshot."],
];

const journeySteps = [
  ["Author", "Start with the source you need to change."],
  ["Trace", "Follow evidence across the delivery path without hiding the artifact."],
  ["Review", "Make a bounded decision before anything reaches production."],
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <LandingHashCleanup />
      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />}
      <div className="landing-grid" aria-hidden="true" />
      <div className="landing-inner">
        <header className="landing-header">
          <Link href="/" className="landing-wordmark">masar<span>·</span>ci</Link>
          <span className="landing-header-tools"><span>Visual DevOps workbench / local-first</span><PwaInstallAction compact /></span>
        </header>

        <section className="landing-hero">
          <div className="landing-copy">
            <p className="landing-eyebrow">One path through delivery</p>
            <h1>Make the delivery <span>path legible.</span></h1>
            <p className="landing-lede">MasarCI is a local-first workbench for authoring Actions, Compose, Dockerfile, and Kubernetes artifacts and reviewing Terraform plans with bounded, deterministic evidence.</p>
            <div className="landing-actions">
              <LandingScrollButton targetId="workspaces" className="landing-cta">Choose a workspace <span aria-hidden="true">↘</span></LandingScrollButton>
              <LandingScrollButton targetId="journey" className="landing-quiet-link">See the path</LandingScrollButton>
            </div>
            <div className="landing-meta"><span><b>Author</b> source artifacts</span><span><b>Trace</b> relationships</span><span><b>Review</b> bounded evidence</span></div>
          </div>
          <div className="landing-stage-wrap">
            <LandingHeroMedia />
            <img className="landing-logo-tile" src="/masar-ci.png" alt="MasarCI logo" />
            <div className="landing-signal"><b>PATH STATUS</b><br />trigger → build → deploy</div>
          </div>
        </section>

        <section id="workspaces" className="landing-workspaces" aria-labelledby="workspaces-title">
          <div className="landing-section-intro">
            <p className="landing-kicker">Choose where to enter</p>
            <h2 id="workspaces-title">Four workspaces. One delivery path.</h2>
            <p>Each workspace carries equal weight. Pick the artifact that needs attention, then follow its evidence downstream.</p>
          </div>
          <div className="landing-workspace-grid">
            {workspaces.map((workspace) => (
              <Link key={workspace.id} href={workspace.href} className="landing-workspace-card" data-domain={workspace.id}>
                <span className="landing-workspace-index" aria-hidden="true">↗</span>
                <span className="landing-workspace-eyebrow">{workspace.eyebrow}</span>
                <strong>{workspace.name}</strong>
                <span>{workspace.description}</span>
                <span className="landing-workspace-link">Open workspace</span>
              </Link>
            ))}
          </div>
        </section>

        <section id="journey" className="landing-section landing-journey">
          <div><p className="landing-kicker">The shared journey</p><h2>Follow the change from source to decision.</h2></div>
          <div className="landing-section-copy">
            <p>MasarCI keeps the workflow visible while you author, trace relationships, and review the resulting change.</p>
            <div className="landing-journey-list">
              {journeySteps.map(([title, copy], index) => <article key={title}><span className="landing-journey-number">0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}
            </div>
          </div>
        </section>

        <section className="landing-section landing-reference">
          <div><p className="landing-kicker">Local-first, bounded by design</p><h2>Author source. Review change.</h2><p className="landing-section-copy">Source artifacts stay authorable in the browser. Terraform plan JSON becomes a digest-bound, redacted review snapshot. It is never an execution surface.</p><div className="landing-proof-list">{proofPoints.map(([title, copy]) => <div key={title}><strong>{title}</strong><span>{copy}</span></div>)}</div></div>
          <figure><img src="/masar-ci-builder-reference.png" alt="MasarCI Actions builder workspace" loading="lazy" decoding="async" /><figcaption>Actions builder example</figcaption></figure>
        </section>

        <section className="landing-closing">
          <div><p className="landing-kicker">Ready before the next change</p><h2>Review the path before production does.</h2></div>
          <div><p>Start from a safe example or import an existing artifact into the local workbench.</p><Link href="/workstation/actions" className="landing-cta">Review an Actions example <span aria-hidden="true">↗</span></Link></div>
        </section>

        <footer className="landing-footer"><span>masar<span>·</span>ci</span><span>Visual DevOps Workbench / Local-first</span></footer>
      </div>
    </main>
  );
}
