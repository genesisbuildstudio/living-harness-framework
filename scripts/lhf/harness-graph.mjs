#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { collectChangedPaths, contractEntries, loadRegistry, normalizePath, pathExists, ROOT, trackedFiles } from "./lib.mjs";

const OUTPUT_PATH = "docs/system/generated/harness-graph.json";
const CHECK_MODE = process.argv.includes("--check");
const SPINES = ["truth_graph", "run_spine", "capability_gate", "context_cost_spine", "proof_spine", "admin_cortex"];

function sourceRef(path) {
  return { path };
}

function addNode(map, node) {
  if (!map.has(node.id)) map.set(node.id, node);
}

function addEdge(map, edge) {
  const id = `edge:${edge.kind}:${edge.from}:${edge.to}`;
  if (!map.has(id)) map.set(id, { id, ...edge });
}

function routeFromPath(path) {
  return `/${path.replace(/^apps\/web\/src\//, "").replace(/\.(tsx|ts|js|jsx)$/, "").replace(/\/index$/, "")}`.replace(/\/+/g, "/");
}

function buildGraph(generatedAt) {
  const files = [...new Set([...trackedFiles(), ...collectChangedPaths()])].sort();
  const fileSet = new Set(files);
  const registry = loadRegistry();
  const nodes = new Map();
  const edges = new Map();
  const findings = [];

  for (const spine of SPINES) {
    addNode(nodes, {
      id: `spine:${spine}`,
      kind: "lhf_spine",
      label: spine.replaceAll("_", " "),
      sourceRefs: [sourceRef("AGENTS.md")],
      proofStatus: "partial",
      drift: "current",
    });
  }

  for (const path of files) {
    if (/^workers\/[^/]+\/wrangler\.jsonc$/.test(path)) {
      const name = path.split("/")[1];
      addNode(nodes, { id: `worker:${name}`, kind: "worker", label: name, path, sourceRefs: [sourceRef(path)], proofStatus: "partial", drift: "current" });
      addEdge(edges, { from: "spine:truth_graph", to: `worker:${name}`, kind: "governs", sourceRefs: [sourceRef(path)] });
    }
    if (/^apps\/web\/src\/.+\.(tsx|ts|js|jsx)$/.test(path)) {
      const route = routeFromPath(path);
      addNode(nodes, { id: `route:web:${route}`, kind: "web_route", label: route, path, route, sourceRefs: [sourceRef(path)], proofStatus: "partial", drift: "current" });
    }
    if (/^supabase\/migrations\/.+\.sql$/.test(path)) {
      addNode(nodes, { id: `migration:${path.split("/").at(-1)}`, kind: "migration", label: path.split("/").at(-1), path, sourceRefs: [sourceRef(path)], proofStatus: "partial", drift: "current" });
      const sql = readFileSync(join(ROOT, path), "utf8");
      for (const match of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z_][a-zA-Z0-9_]*)/gi)) {
        addNode(nodes, { id: `table:supabase:${match[1]}`, kind: "table", label: match[1], path, sourceRefs: [sourceRef(path)], proofStatus: "partial", drift: "current" });
      }
    }
    if (/^full-system-tester\/tasks\/.+\.md$/.test(path)) {
      const task = path.split("/").at(-1).replace(/\.md$/, "");
      addNode(nodes, { id: `fst_task:${task}`, kind: "fst_task", label: task, path, sourceRefs: [sourceRef(path)], proofStatus: "partial", drift: "current" });
      addEdge(edges, { from: "spine:proof_spine", to: `fst_task:${task}`, kind: "governs", sourceRefs: [sourceRef(path)] });
    }
  }

  for (const [id, contract] of contractEntries(registry)) {
    addNode(nodes, { id: `spec:${id}`, kind: "spec", label: contract.title, path: contract.spec, sourceRefs: [sourceRef(contract.spec)], proofStatus: "partial", drift: "current" });
    for (const source of contract.source_paths ?? []) {
      if (fileSet.has(normalizePath(source))) addEdge(edges, { from: `file:${normalizePath(source)}`, to: `spec:${id}`, kind: "implements", sourceRefs: [sourceRef(contract.spec)] });
    }
    if (contract.fst_task_path && pathExists(contract.fst_task_path)) {
      const task = contract.fst_task_path.split("/").at(-1).replace(/\.md$/, "");
      addEdge(edges, { from: `fst_task:${task}`, to: `spec:${id}`, kind: "tests", sourceRefs: [sourceRef(contract.spec)] });
    }
  }

  const nodeList = [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
  const edgeList = [...edges.values()].sort((a, b) => a.id.localeCompare(b.id));
  const nodesByKind = {};
  const edgesByKind = {};
  for (const node of nodeList) nodesByKind[node.kind] = (nodesByKind[node.kind] ?? 0) + 1;
  for (const edge of edgeList) edgesByKind[edge.kind] = (edgesByKind[edge.kind] ?? 0) + 1;

  return {
    schemaVersion: "living-harness-graph/v1",
    generatedAt,
    nodes: nodeList,
    edges: edgeList,
    findings,
    stats: {
      totalNodes: nodeList.length,
      totalEdges: edgeList.length,
      nodesByKind,
      edgesByKind,
      trackedFileCount: files.length,
      workerCount: nodeList.filter((node) => node.kind === "worker").length,
      fstTaskCount: nodeList.filter((node) => node.kind === "fst_task").length,
    },
  };
}

function stable(value) {
  return JSON.stringify({ ...value, generatedAt: "<ignored>" }, null, 2);
}

const existing = pathExists(OUTPUT_PATH) ? JSON.parse(readFileSync(join(ROOT, OUTPUT_PATH), "utf8")) : null;
const graph = buildGraph(existing?.generatedAt ?? new Date().toISOString());

if (CHECK_MODE) {
  if (!existing || stable(existing) !== stable(graph)) {
    console.error(`${OUTPUT_PATH} is stale. Run pnpm lhf:harness-graph.`);
    process.exit(1);
  }
  console.log(`${OUTPUT_PATH} is current (${graph.stats.totalNodes} nodes, ${graph.stats.totalEdges} edges).`);
} else {
  mkdirSync(dirname(join(ROOT, OUTPUT_PATH)), { recursive: true });
  writeFileSync(join(ROOT, OUTPUT_PATH), `${JSON.stringify(graph, null, 2)}\n`);
  console.log(`Wrote ${OUTPUT_PATH} (${graph.stats.totalNodes} nodes, ${graph.stats.totalEdges} edges).`);
}
