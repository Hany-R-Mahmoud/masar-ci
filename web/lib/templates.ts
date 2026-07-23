import type { Workflow } from "@/lib/model/types";
import { createWorkflow, addJob, addStep } from "@/lib/model/factory";

// Regional deployment templates (slice 5). One-click load from the tray.
// Action refs use the verified majors from product-facts.md.

export interface RegionalTemplate {
  id: string;
  label: string;
  build: () => Workflow;
}

export const TEMPLATES: RegionalTemplate[] = [
  {
    id: "aws-bahrain",
    label: "AWS ECR · Bahrain",
    build: () => {
      const w = createWorkflow({
        name: "aws-bahrain-deploy",
        permissions: { contents: "read" },
      });
      addJob(w, { id: "build", runsOn: "ubuntu-latest" });
      addStep(w, "build", {
        id: "b1",
        name: "Checkout",
        kind: "action",
        action: { repo: "actions/checkout", ref: "v7", isSha: false },
      });
      addStep(w, "build", {
        id: "b2",
        name: "Setup Node",
        kind: "action",
        action: { repo: "actions/setup-node", ref: "v7", isSha: false },
        with: { "node-version": "20" },
      });
      addStep(w, "build", {
        id: "b3",
        name: "Build",
        kind: "run",
        run: "npm ci && npm run build",
      });
      addJob(w, { id: "deploy", runsOn: "ubuntu-latest", needs: ["build"] });
      addStep(w, "deploy", {
        id: "d1",
        name: "Configure AWS credentials (me-south-1, Bahrain)",
        kind: "action",
        action: { repo: "aws-actions/configure-aws-credentials", ref: "v4", isSha: false },
        with: {
          "aws-region": "me-south-1",
        },
      });
      addStep(w, "deploy", {
        id: "d2",
        name: "Log in to Amazon ECR",
        kind: "action",
        action: { repo: "aws-actions/amazon-ecr-login", ref: "v2", isSha: false },
      });
      addStep(w, "deploy", {
        id: "d3",
        name: "Build & push image",
        kind: "action",
        action: { repo: "docker/build-push-action", ref: "v7", isSha: false },
        with: { push: "true", tags: "latest" },
      });
      return w;
    },
  },
  {
    id: "oracle-jeddah",
    label: "Oracle Cloud · Jeddah",
    build: () => {
      const w = createWorkflow({
        name: "oracle-jeddah-deploy",
        permissions: { contents: "read" },
      });
      addJob(w, { id: "build", runsOn: "ubuntu-latest" });
      addStep(w, "build", {
        id: "b1",
        name: "Checkout",
        kind: "action",
        action: { repo: "actions/checkout", ref: "v7", isSha: false },
      });
      addStep(w, "build", {
        id: "b2",
        name: "Build artifact",
        kind: "run",
        run: "tar -czf app.tar.gz dist",
      });
      addJob(w, { id: "deploy", runsOn: "ubuntu-latest", needs: ["build"] });
      addStep(w, "deploy", {
        id: "d1",
        name: "Upload to OCI Object Storage (jeddah-1)",
        kind: "run",
        run: "oci os object put --namespace $OCI_NS -bn releases --name app.tar.gz --file app.tar.gz",
      });
      return w;
    },
  },
  {
    id: "salla",
    label: "Salla deploy",
    build: () => {
      const w = createWorkflow({
        name: "salla-deploy",
        permissions: { contents: "read" },
      });
      addJob(w, { id: "deploy", runsOn: "ubuntu-latest" });
      addStep(w, "deploy", {
        id: "d1",
        name: "Checkout",
        kind: "action",
        action: { repo: "actions/checkout", ref: "v7", isSha: false },
      });
      addStep(w, "deploy", {
        id: "d2",
        name: "Notify Salla webhook",
        kind: "run",
        run: 'curl -X POST "$SALLA_WEBHOOK" -d \'{"event":"deploy"}\'',
      });
      return w;
    },
  },
];
