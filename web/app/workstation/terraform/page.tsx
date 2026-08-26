import DomainWorkspace from "@/components/workbench/DomainWorkspace";

export default function TerraformWorkspacePage() {
  return <DomainWorkspace domain="terraform" title="Terraform Review" description="Review resource changes, replacements, and blast-radius evidence from imported plan JSON. No apply, state, HCL, or cost claims." artifactName="terraform-plan.review" />;
}
