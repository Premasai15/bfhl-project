const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// DFS
function dfs(node, graph, stack) {
  if (stack.has(node)) return { cycle: true };

  stack.add(node);

  let subtree = {};
  let maxDepth = 0;

  for (let child of (graph[node] || [])) {
    let res = dfs(child, graph, stack);

    if (res.cycle) return { cycle: true };

    subtree[child] = res.tree;
    maxDepth = Math.max(maxDepth, res.depth);
  }

  stack.delete(node);

  return {
    tree: subtree,
    depth: maxDepth + 1
  };
}

// Get component (forward + reverse)
function getComponent(start, graph) {
  const stack = [start];
  const comp = new Set();

  while (stack.length) {
    let node = stack.pop();
    if (comp.has(node)) continue;

    comp.add(node);

    for (let child of (graph[node] || [])) stack.push(child);

    for (let parent in graph) {
      if (graph[parent].includes(node)) stack.push(parent);
    }
  }

  return comp;
}

app.post("/bfhl", (req, res) => {
    console.log("API HIT");  
  const data = req.body.data || [];

  const validEdges = [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const seen = new Set();

  for (let item of data) {
    let str = item.trim();

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

  const graph = {};
  const childSet = new Set();

  for (let edge of validEdges) {
    const [p, c] = edge.split("->");

    if (!graph[p]) graph[p] = [];
    graph[p].push(c);

    childSet.add(c);
  }

  const nodes = new Set();
  validEdges.forEach(e => {
    const [p, c] = e.split("->");
    nodes.add(p);
    nodes.add(c);
  });

  let hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let maxDepth = 0;
  let largestRoot = "";

  const visited = new Set();

  for (let node of nodes) {
    if (visited.has(node)) continue;

    const comp = getComponent(node, graph);
    comp.forEach(n => visited.add(n));

    let roots = [...comp].filter(n => !childSet.has(n));

    if (roots.length === 0) {
      const root = [...comp].sort()[0];
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

    totalTrees++;

    if (
      res.depth > maxDepth ||
      (res.depth === maxDepth && root < largestRoot)
    ) {
      maxDepth = res.depth;
      largestRoot = root;
    }

    hierarchies.push({
      root,
      tree: { [root]: res.tree },
      depth: res.depth
    });
  }

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port 3000"));