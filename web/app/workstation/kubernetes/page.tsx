import DomainWorkspace from "@/components/workbench/DomainWorkspace";

export default function KubernetesWorkspacePage() {
  return <DomainWorkspace domain="kubernetes" title="Kubernetes workbench" description="Map workloads, services, selectors, requests, and security context without kubeconfig or cluster access." artifactName="manifests.yaml" />;
}
