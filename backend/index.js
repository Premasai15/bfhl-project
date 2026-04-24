const express = require("express");
const cors = require("cors");

const app = express();

// ✅ CORS (safe for frontend on Netlify/Vercel)
app.use(cors({
  origin: "*",
   methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* =========================
   DFS (safe version)
========================= */
function dfs(node, graph, visiting) {
  if (visiting.has(node)) {
    return { cycle: true };
  }

  visiting.add(node);

  let subtree = {};
  let maxDepth = 0;

  for (let child of (graph[node] || [])) {
    const res = dfs(child, graph, visiting);

    if (res.cycle) return { cycle: true };

    subtree[child] = res.tree;
    maxDepth = Math.max(maxDepth, res.depth);
  }

  visiting.delete(node);

  return {
    tree: subtree,
    depth: maxDepth + 1
  };
}

/* =========================
   Get connected component
========================= */
function getComponent(start, graph) {
  const stack = [start];
  const comp = new Set();

  while (stack.length) {
    const node = stack.pop();
    if (comp.has(node)) continue;

    comp.add(node);

    for (let child of (graph[node] || [])) {
      stack.push(child);
    }

    for (let parent in graph) {
      if (graph[parent].includes(node)) {
        stack.push(parent);
      }
    }
  }

  return comp;
}

/* =========================
   MAIN API
========================= */
app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];

  const validEdges = [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const seen = new Set();

  // ✅ Validate edges
  for (let item of data) {
    const str = item.trim();

    if (!/^[A-Z]->[A-Z]$/.test(str) || str[0] === str[3]) {
      invalidEntries.push(item);
      continue;
    }

    if (seen.has(str)) {
      if (!duplicateEdges.includes(str)) {
        duplicateEdges.push(str);
      }
      continue;
    }

    seen.add(str);
    validEdges.push(str);
  }

  // Build graph
  const graph = {};
  const childSet = new Set();
  const nodes = new Set();

  for (let edge of validEdges) {
    const [p, c] = edge.split("->");

    if (!graph[p]) graph[p] = [];
    graph[p].push(c);

    childSet.add(c);
    nodes.add(p);
    nodes.add(c);
  }

  let visited = new Set();
  let hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let maxDepth = 0;
  let largestRoot = "";

  // Process components
  for (let node of nodes) {
    if (visited.has(node)) continue;

    const comp = getComponent(node, graph);
    comp.forEach(n => visited.add(n));

    let roots = [...comp].filter(n => !childSet.has(n));

    // Cycle case
    if (roots.length === 0) {
      const root = [...comp][0];
      totalCycles++;

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });

      continue;
    }

    let root = roots[0];
    let res = dfs(root, graph, new Set());

    if (res.cycle) {
      totalCycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
      continue;
    }

    totalTrees++;

    if (res.depth > maxDepth || (res.depth === maxDepth && root < largestRoot)) {
      maxDepth = res.depth;
      largestRoot = root;
    }

    hierarchies.push({
      root,
      tree: { [root]: res.tree },
      depth: res.depth
    });
  }

  // ✅ FINAL RESPONSE
  res.json({
    user_id: "premasai_15122006",
    email_id: "p.s.chowdary15@gmail.com",
    college_roll_number: "RA2311003020233",

    hierarchies,

    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,

    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestRoot
    }
  });
});

/* =========================
   ROOT ROUTE (fixes Cannot GET /)
========================= */
app.get("/", (req, res) => {
  res.send("BFHL API is running 🚀");
});

/* =========================
   SERVER START (Render safe)
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});