
let lastResponse = null;

/* =========================
   GLOBAL FUNCTIONS (IMPORTANT)
========================= */

window.toggleTheme = function () {
  document.body.classList.toggle("dark");
};

window.copyJSON = function () {
  if (!lastResponse) return;
  navigator.clipboard.writeText(JSON.stringify(lastResponse, null, 2));
  alert("Copied!");
};

window.analyze = async function () {
  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");

  try {
    console.log("clicked");

    const raw = document.getElementById("input").value;
    const data = raw.split(",").map(x => x.trim());

    const res = await fetch("https://bfhl-project-k7zl.onrender.com/bfhl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data })
    });

    const result = await res.json();
    lastResponse = result;

    renderStats(result);
    renderTree(result.hierarchies);
    drawGraph(result.hierarchies);

    document.getElementById("output").innerText =
      JSON.stringify(result, null, 2);

  } catch (err) {
    console.error(err);
    document.getElementById("output").innerText =
      "❌ Error: " + err.message;
  } finally {
    loader.classList.add("hidden");
  }
};

/* =========================
   STATS
========================= */

function renderStats(data) {
  document.getElementById("stats").innerHTML = `
    <div class="stat tree">Trees: ${data.summary.total_trees}</div>
    <div class="stat cycle">Cycles: ${data.summary.total_cycles}</div>
    <div class="stat invalid">Invalid: ${data.invalid_entries.length}</div>
    <div class="stat duplicate">Duplicates: ${data.duplicate_edges.length}</div>
  `;
}

/* =========================
   TREE VIEW
========================= */

function renderTree(hierarchies) {
  let txt = "";

  hierarchies.forEach(h => {
    if (h.has_cycle) {
      txt += `⚠ Cycle at ${h.root}\n`;
    } else {
      txt += `🌳 ${h.root}\n`;
      txt += renderNode(h.tree[h.root]);
    }
  });

  document.getElementById("treeView").innerText = txt;
}

function renderNode(obj, prefix = "") {
  if (!obj) return "";

  let keys = Object.keys(obj);
  let str = "";

  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const nextPrefix = prefix + (isLast ? "    " : "│   ");

    str += `${prefix}${connector}${key}\n`;
    str += renderNode(obj[key], nextPrefix);
  });

  return str;
}

/* =========================
   SVG HELPERS
========================= */

function createSVG(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

/* =========================
   GRAPH
========================= */

function initDefs(svg) {
  const defs = createSVG("defs");

  const marker = createSVG("marker");
  marker.setAttribute("id", "arrow");
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "10");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "6");
  marker.setAttribute("markerHeight", "6");
  marker.setAttribute("orient", "auto");

  const path = createSVG("path");
  path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  path.setAttribute("fill", "#111");

  marker.appendChild(path);
  defs.appendChild(marker);
  svg.appendChild(defs);
}

function drawGraph(hierarchies) {
  const svg = document.getElementById("graph");
  svg.innerHTML = "";

  initDefs(svg);

  let edges = [];
  let levelMap = {};
  let visited = new Set();

  function assign(node, level, obj) {
    if (visited.has(node)) return;
    visited.add(node);

    if (!levelMap[level]) levelMap[level] = [];
    levelMap[level].push(node);

    for (let child in obj) {
      edges.push([node, child]);
      assign(child, level + 1, obj[child]);
    }
  }

  hierarchies.forEach(h => {
    if (!h.has_cycle) assign(h.root, 0, h.tree[h.root]);
  });

  const positions = {};
  const width = svg.clientWidth || 800;

  Object.keys(levelMap).forEach(level => {
    levelMap[level].forEach((node, i) => {
      positions[node] = {
        x: (i + 1) * (width / (levelMap[level].length + 1)),
        y: level * 120 + 60
      };
    });
  });

  edges.forEach(([a, b]) => {
    const p1 = positions[a];
    const p2 = positions[b];
    if (!p1 || !p2) return;

    const line = createSVG("line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    line.setAttribute("stroke", "#111");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("marker-end", "url(#arrow)");

    svg.appendChild(line);
  });

  Object.keys(positions).forEach(node => {
    const { x, y } = positions[node];

    const g = createSVG("g");
    g.setAttribute("transform", `translate(${x},${y})`);

    const circle = createSVG("circle");
    circle.setAttribute("r", "18");
    circle.setAttribute("fill", "#2563eb");

    const text = createSVG("text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dy", "5");
    text.setAttribute("fill", "white");
    text.textContent = node;

    g.appendChild(circle);
    g.appendChild(text);

    svg.appendChild(g);
  });
}

/* =========================
   SAFE INPUT SHORTCUT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");

  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Tab" && this.value.trim() === "") {
        e.preventDefault();
        this.value = "A->B,A->C,B->D,C->E,E->F";
      }
    });
  }
});