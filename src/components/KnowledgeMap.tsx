import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { Compass, CheckCircle2, Clock, ZoomIn, ZoomOut, RotateCcw, Trophy, ChevronRight, X, Play, Check, Zap, Info, Search } from "lucide-react";
import { Lesson, UserProgress } from "../types";

export interface KnowledgeNode extends d3.SimulationNodeDatum {
  id: string;
  lessonId?: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  summary: string;
  completed: boolean;
  isCustom?: boolean;
  order: number;
  level: number;
  prerequisites: string[]; // IDs of prerequisite nodes
  color: string;
  iconText: string;
}

export interface KnowledgeLink extends d3.SimulationLinkDatum<KnowledgeNode> {
  source: string | KnowledgeNode;
  target: string | KnowledgeNode;
  isCompletedPath: boolean;
}

interface KnowledgeMapProps {
  lessons: Lesson[];
  progress: UserProgress;
  onSelectLesson: (lesson: Lesson) => void;
  onNavigateTab: (tab: string) => void;
  onToggleLessonComplete?: (lessonId: string) => void;
}

// Predefined curriculum knowledge tree to combine with user's lessons
const BASE_CURRICULUM_NODES: Omit<KnowledgeNode, "x" | "y" | "vx" | "vy" | "index">[] = [
  // Môn Toán
  {
    id: "math-1",
    lessonId: "sample-1",
    title: "Vũ trụ số tự nhiên (N và N*)",
    subject: "Toán Học",
    grade: "Lớp 6",
    topic: "Số học và Đại số",
    summary: "Hiểu bản chất tập hợp số tự nhiên N và N*, biểu diễn số trên tia số.",
    completed: true,
    order: 1,
    level: 1,
    prerequisites: [],
    color: "#2563eb",
    iconText: "ℕ"
  },
  {
    id: "math-2",
    title: "Phép tính số tự nhiên và lũy thừa",
    subject: "Toán Học",
    grade: "Lớp 6",
    topic: "Số học và Đại số",
    summary: "Quy tắc nhân, chia cùng cơ số, thứ tự thực hiện các phép toán phức hợp.",
    completed: false,
    order: 2,
    level: 2,
    prerequisites: ["math-1"],
    color: "#2563eb",
    iconText: "aⁿ"
  },
  {
    id: "math-3",
    title: "Dấu hiệu chia hết và số nguyên tố",
    subject: "Toán Học",
    grade: "Lớp 6",
    topic: "Lý thuyết số",
    summary: "Nhận biết chia hết cho 2, 3, 5, 9; sàng nguyên tố Eratosthenes.",
    completed: false,
    order: 3,
    level: 3,
    prerequisites: ["math-2"],
    color: "#2563eb",
    iconText: "⋮"
  },
  {
    id: "math-4",
    title: "ƯCLN, BCNN và bài toán ứng dụng",
    subject: "Toán Học",
    grade: "Lớp 6",
    topic: "Lý thuyết số",
    summary: "Thuật toán tìm ước chung lớn nhất, bội chung nhỏ nhất giải toán thực tế.",
    completed: false,
    order: 4,
    level: 4,
    prerequisites: ["math-3"],
    color: "#2563eb",
    iconText: "ƯC"
  },
  {
    id: "math-5",
    title: "Hình học trực quan: tam giác đều và lục giác",
    subject: "Toán Học",
    grade: "Lớp 6",
    topic: "Hình học",
    summary: "Tính đối xứng, tính chất cạnh và góc của các hình đa giác đều.",
    completed: false,
    order: 5,
    level: 3,
    prerequisites: ["math-2"],
    color: "#2563eb",
    iconText: "△"
  },

  // Môn Khoa học tự nhiên
  {
    id: "sci-1",
    lessonId: "sample-2",
    title: "Chu trình nước trong tự nhiên",
    subject: "Khoa học tự nhiên",
    grade: "Lớp 6",
    topic: "Trái Đất và Môi trường",
    summary: "Quá trình bay hơi, ngưng tụ, tạo mây và mưa luân chuyển năng lượng.",
    completed: false,
    order: 1,
    level: 1,
    prerequisites: [],
    color: "#0d9488",
    iconText: "H₂O"
  },
  {
    id: "sci-2",
    title: "Các thể của chất và sự chuyển thể",
    subject: "Khoa học tự nhiên",
    grade: "Lớp 6",
    topic: "Vật lý và Hóa chất",
    summary: "Rắn, lỏng, khí và các chuyển hóa thăng hoa, đông đặc, nóng chảy.",
    completed: false,
    order: 2,
    level: 2,
    prerequisites: ["sci-1"],
    color: "#0d9488",
    iconText: "RLK"
  },
  {
    id: "sci-3",
    title: "Oxygen và không khí quanh ta",
    subject: "Khoa học tự nhiên",
    grade: "Lớp 6",
    topic: "Hóa học cơ bản",
    summary: "Thành phần khí quyển, vai trò của O2 đối với sự sống và sự cháy.",
    completed: false,
    order: 3,
    level: 3,
    prerequisites: ["sci-2"],
    color: "#0d9488",
    iconText: "O₂"
  },
  {
    id: "sci-4",
    title: "Tế bào - đơn vị cơ bản của sự sống",
    subject: "Khoa học tự nhiên",
    grade: "Lớp 6",
    topic: "Sinh học tế bào",
    summary: "Cấu tạo tế bào nhân sơ và nhân thực, màng sinh chất và nhân di truyền.",
    completed: false,
    order: 4,
    level: 3,
    prerequisites: ["sci-2"],
    color: "#0d9488",
    iconText: "TB"
  },

  // Môn Tiếng Anh
  {
    id: "eng-1",
    title: "My New School & Present Simple",
    subject: "Tiếng Anh",
    grade: "Lớp 6",
    topic: "Grammar & Vocab",
    summary: "Thì Hiện tại đơn, thói quen học tập và từ vựng đồ dùng trường lớp.",
    completed: true,
    order: 1,
    level: 1,
    prerequisites: [],
    color: "#4f46e5",
    iconText: "EN1"
  },
  {
    id: "eng-2",
    title: "My House & Prepositions of Place",
    subject: "Tiếng Anh",
    grade: "Lớp 6",
    topic: "Grammar & Spatial",
    summary: "Giới từ chỉ vị trí (in, on, under, behind, next to) và mô tả phòng ốc.",
    completed: false,
    order: 2,
    level: 2,
    prerequisites: ["eng-1"],
    color: "#4f46e5",
    iconText: "EN2"
  },
  {
    id: "eng-3",
    title: "My Friends & Personality Adjectives",
    subject: "Tiếng Anh",
    grade: "Lớp 6",
    topic: "Communication",
    summary: "Tính từ miêu tả tính cách, ngoại hình và thì Hiện tại tiếp diễn chỉ hoạt động.",
    completed: false,
    order: 3,
    level: 3,
    prerequisites: ["eng-2"],
    color: "#4f46e5",
    iconText: "EN3"
  },

  // Môn Tin Học & Tư Duy Số
  {
    id: "cs-1",
    title: "Thông tin và xử lý dữ liệu số",
    subject: "Tin Học",
    grade: "Lớp 6",
    topic: "Kỹ thuật số",
    summary: "Cách máy tính số hóa văn bản, hình ảnh và âm thanh thành dãy bit 0 và 1.",
    completed: true,
    order: 1,
    level: 1,
    prerequisites: [],
    color: "#0891b2",
    iconText: "0/1"
  },
  {
    id: "cs-2",
    title: "Mạng máy tính và thế giới Internet",
    subject: "Tin Học",
    grade: "Lớp 6",
    topic: "Mạng và Web",
    summary: "Cấu trúc mạng LAN, WAN và kỹ năng tìm kiếm thông tin an toàn trên mạng.",
    completed: false,
    order: 2,
    level: 2,
    prerequisites: ["cs-1"],
    color: "#0891b2",
    iconText: "NET"
  },
  {
    id: "cs-3",
    title: "Thuật toán và sơ đồ khối cơ bản",
    subject: "Tin Học",
    grade: "Lớp 6",
    topic: "Tư duy lập trình",
    summary: "Xây dựng các bước giải quyết vấn đề tuần tự, rẽ nhánh và lặp.",
    completed: false,
    order: 3,
    level: 3,
    prerequisites: ["cs-1", "math-2"],
    color: "#0891b2",
    iconText: "ALG"
  }
];

export default function KnowledgeMap({
  lessons,
  progress,
  onSelectLesson,
  onNavigateTab,
  onToggleLessonComplete
}: KnowledgeMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "path">("graph");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [onlyCompletedLinks, setOnlyCompletedLinks] = useState<boolean>(false);

  // Merge predefined nodes with lessons from state/user library
  const { allNodes, allLinks } = useMemo(() => {
    const lessonCompletionMap = new Map<string, boolean>();
    lessons.forEach(l => {
      lessonCompletionMap.set(l.id, l.completed);
      // So khớp không phân biệt hoa thường: bài đã lưu có thể còn tiêu đề viết hoa kiểu cũ.
      const t = l.title.toLowerCase();
      if (t.includes("vũ trụ số tự nhiên")) lessonCompletionMap.set("sample-1", l.completed);
      if (t.includes("giọt nước") || t.includes("chu trình nước")) lessonCompletionMap.set("sample-2", l.completed);
    });

    const nodes: KnowledgeNode[] = BASE_CURRICULUM_NODES.map(node => {
      const isCompleted = node.lessonId 
        ? (lessonCompletionMap.get(node.lessonId) ?? node.completed)
        : node.completed;

      return {
        ...node,
        completed: isCompleted
      };
    });

    // Append any user-created lessons that are not already in curriculum
    lessons.forEach((l, idx) => {
      const alreadyIncluded = nodes.some(n => n.lessonId === l.id || n.title.toLowerCase() === l.title.toLowerCase());
      if (!alreadyIncluded) {
        let subject = "Môn học khác";
        let color = "#2563eb";
        if (l.bookName.toLowerCase().includes("toán")) { subject = "Toán Học"; color = "#2563eb"; }
        else if (l.bookName.toLowerCase().includes("khoa học")) { subject = "Khoa học tự nhiên"; color = "#0d9488"; }
        else if (l.bookName.toLowerCase().includes("anh")) { subject = "Tiếng Anh"; color = "#4f46e5"; }
        else if (l.bookName.toLowerCase().includes("tin")) { subject = "Tin Học"; color = "#0891b2"; }

        const subjectNodes = nodes.filter(n => n.subject === subject);
        const lastInSubject = subjectNodes.length > 0 ? subjectNodes[subjectNodes.length - 1].id : "math-1";

        nodes.push({
          id: `custom-lesson-${l.id}`,
          lessonId: l.id,
          title: l.title,
          subject: subject,
          grade: l.grade || "Lớp 6",
          topic: l.topic || "Bài học nâng cao",
          summary: l.notes || l.content.slice(0, 120) + "...",
          completed: l.completed,
          isCustom: true,
          order: 10 + idx,
          level: 4,
          prerequisites: [lastInSubject],
          color: color,
          iconText: "BÀI"
        });
      }
    });

    // Build links from prerequisites
    const links: KnowledgeLink[] = [];
    nodes.forEach(node => {
      node.prerequisites.forEach(prereqId => {
        const sourceNode = nodes.find(n => n.id === prereqId);
        if (sourceNode) {
          links.push({
            source: prereqId,
            target: node.id,
            isCompletedPath: sourceNode.completed && node.completed
          });
        }
      });
    });

    return { allNodes: nodes, allLinks: links };
  }, [lessons]);

  // Filtered nodes and links based on UI controls
  const { filteredNodes, filteredLinks } = useMemo(() => {
    let nodes = allNodes;

    if (selectedSubject !== "all") {
      nodes = nodes.filter(n => n.subject === selectedSubject);
    }

    if (statusFilter === "completed") {
      nodes = nodes.filter(n => n.completed);
    } else if (statusFilter === "pending") {
      nodes = nodes.filter(n => !n.completed);
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      nodes = nodes.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.topic.toLowerCase().includes(q) || 
        n.subject.toLowerCase().includes(q)
      );
    }

    const visibleNodeIds = new Set(nodes.map(n => n.id));
    let links = allLinks.filter(l => {
      const sId = typeof l.source === "object" ? (l.source as KnowledgeNode).id : l.source;
      const tId = typeof l.target === "object" ? (l.target as KnowledgeNode).id : l.target;
      return visibleNodeIds.has(sId) && visibleNodeIds.has(tId);
    });

    if (onlyCompletedLinks) {
      links = links.filter(l => l.isCompletedPath);
    }

    return { filteredNodes: nodes, filteredLinks: links };
  }, [allNodes, allLinks, selectedSubject, statusFilter, searchKeyword, onlyCompletedLinks]);

  // Map Statistics
  const stats = useMemo(() => {
    const total = allNodes.length;
    const completed = allNodes.filter(n => n.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const subjects = Array.from(new Set(allNodes.map(n => n.subject)));
    return { total, completed, percentage, subjects };
  }, [allNodes]);

  // Zoom behavior reference
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Render D3 Graph
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = Math.max(540, window.innerHeight * 0.62);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "overflow-hidden select-none cursor-grab active:cursor-grabbing");

    // Defs for gradients, glow, arrowheads
    const defs = svg.append("defs");

    // Completed Glow Filter
    const filter = defs.append("filter")
      .attr("id", "glow-completed")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Standard arrow marker
    defs.append("marker")
      .attr("id", "arrow-normal")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 26)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L9,0L0,4")
      .attr("fill", "#94a3b8");

    // Completed arrow marker
    defs.append("marker")
      .attr("id", "arrow-completed")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L9,0L0,4")
      .attr("fill", "#2563eb");

    // CSS Keyframes for completed pathways
    defs.append("style").text(`
      @keyframes pulseCompletedPath {
        0%, 100% { stroke-opacity: 0.85; stroke-width: 3px; }
        50% { stroke-opacity: 1; stroke-width: 4px; }
      }
      @keyframes flowDashes {
        from { stroke-dashoffset: 24; }
        to { stroke-dashoffset: 0; }
      }
      .completed-link-pulse {
        animation: pulseCompletedPath 2.5s ease-in-out infinite;
      }
      .completed-link-flow {
        animation: flowDashes 1.4s linear infinite;
      }
    `);

    // Main zoom container group
    const g = svg.append("g").attr("class", "main-zoom-group");

    // Configure D3 Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Background grid dots for clean spatial readability
    const gridPattern = defs.append("pattern")
      .attr("id", "grid-dots")
      .attr("width", 24)
      .attr("height", 24)
      .attr("patternUnits", "userSpaceOnUse");
    gridPattern.append("circle")
      .attr("cx", 2)
      .attr("cy", 2)
      .attr("r", 1)
      .attr("fill", "#cbd5e1")
      .attr("opacity", 0.75);

    g.append("rect")
      .attr("x", -width * 2)
      .attr("y", -height * 2)
      .attr("width", width * 5)
      .attr("height", height * 5)
      .attr("fill", "url(#grid-dots)");

    // Clone data for simulation
    const simulationNodes: KnowledgeNode[] = filteredNodes.map(d => ({ ...d }));
    const simulationLinks: KnowledgeLink[] = filteredLinks.map(d => ({ ...d }));

    // Force Simulation
    const simulation = d3.forceSimulation<KnowledgeNode>(simulationNodes)
      .force("link", d3.forceLink<KnowledgeNode, KnowledgeLink>(simulationLinks)
        .id(d => d.id)
        .distance(110)
      )
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(48).iterations(2));

    // Links Layer
    const linkGroup = g.append("g").attr("class", "links-layer");

    // Glow underlay for completed links between finished lessons
    const completedGlow = linkGroup.selectAll("line.completed-glow")
      .data(simulationLinks.filter(d => d.isCompletedPath))
      .enter()
      .append("line")
      .attr("class", "completed-glow")
      .attr("stroke", "#60a5fa")
      .attr("stroke-width", 6)
      .attr("stroke-opacity", 0.35)
      .attr("filter", "url(#glow-completed)");

    // Base links
    const link = linkGroup.selectAll("line.base-link")
      .data(simulationLinks)
      .enter()
      .append("line")
      .attr("class", d => d.isCompletedPath ? "base-link completed-link-pulse" : "base-link")
      .attr("stroke", d => d.isCompletedPath ? "#2563eb" : "#94a3b8")
      .attr("stroke-width", d => d.isCompletedPath ? 3.2 : 1.75)
      .attr("stroke-dasharray", d => d.isCompletedPath ? "none" : "4,4")
      .attr("marker-end", d => d.isCompletedPath ? "url(#arrow-completed)" : "url(#arrow-normal)")
      .attr("opacity", d => d.isCompletedPath ? 0.95 : 0.7);

    // Flowing animated dashes along completed paths
    const completedFlow = linkGroup.selectAll("line.completed-flow")
      .data(simulationLinks.filter(d => d.isCompletedPath))
      .enter()
      .append("line")
      .attr("class", "completed-flow completed-link-flow")
      .attr("stroke", "#dbeafe")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,14")
      .attr("opacity", 0.9);

    // Nodes Layer
    const nodeGroup = g.append("g").attr("class", "nodes-layer");

    const node = nodeGroup.selectAll<SVGGElement, KnowledgeNode>("g")
      .data(simulationNodes)
      .enter()
      .append("g")
      .attr("class", "knowledge-node cursor-pointer")
      .call(
        d3.drag<SVGGElement, KnowledgeNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (_event, d) => {
        setSelectedNode(d);
      });

    // 1. Outer halo for completed nodes
    node.each(function(d) {
      const elem = d3.select(this);

      if (d.completed) {
        elem.append("circle")
          .attr("r", 28)
          .attr("fill", "none")
          .attr("stroke", "#60a5fa")
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.45)
          .attr("class", "animate-pulse");
      }
    });

    // 2. Base circle
    node.append("circle")
      .attr("r", 22)
      .attr("fill", d => d.completed ? "#2563eb" : "#ffffff")
      .attr("stroke", d => d.completed ? "#1d4ed8" : "#64748b")
      .attr("stroke-width", 2.2)
      .attr("filter", d => d.completed ? "url(#glow-completed)" : "none")
      .attr("class", "transition-transform duration-200 hover:scale-110");

    // 3. Monogram / Academic Symbol inside node
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-family", "JetBrains Mono, Be Vietnam Pro, monospace")
      .attr("font-size", d => d.completed ? "12px" : "10.5px")
      .attr("font-weight", "700")
      .attr("fill", d => d.completed ? "#ffffff" : "#1e293b")
      .text(d => d.completed ? "✓" : d.iconText);

    // 4. Completed check badge indicator
    node.each(function(d) {
      if (d.completed) {
        const elem = d3.select(this);
        elem.append("circle")
          .attr("cx", 16)
          .attr("cy", -16)
          .attr("r", 7.5)
          .attr("fill", "#0e7f62")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5);

        elem.append("text")
          .attr("x", 16)
          .attr("y", -16)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", "8.5px")
          .attr("font-weight", "800")
          .attr("fill", "#ffffff")
          .text("✓");
      }
    });

    // 4.5. Tooltip on node for hover/tap full title reveal
    node.append("title")
      .text(d => `${d.title} · ${d.subject} (${d.grade})\nCấp độ: ${d.level} | ${d.completed ? "Đã hoàn thành ✓" : "Chưa học"}\n${d.summary}`);

    // 5. Label Background Pill & Text
    const labelGroup = node.append("g")
      .attr("transform", "translate(0, 33)");

    labelGroup.append("rect")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("fill", "rgba(255, 255, 255, 0.96)")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1)
      .attr("y", -10)
      .attr("height", 20);

    const labels = labelGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-family", "Be Vietnam Pro, system-ui, sans-serif")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", "#0f172a")
      .text(d => d.title.length > 26 ? d.title.slice(0, 24) + "…" : d.title);

    // Size background pill to text width dynamically
    labels.each(function() {
      const bbox = (this as SVGTextContentElement).getBBox();
      const parentG = d3.select((this as SVGElement).parentNode as SVGGElement);
      parentG.select("rect")
        .attr("x", -bbox.width / 2 - 8)
        .attr("width", bbox.width + 16);
    });

    // Simulation tick handler
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as KnowledgeNode).x || 0)
        .attr("y1", d => (d.source as KnowledgeNode).y || 0)
        .attr("x2", d => (d.target as KnowledgeNode).x || 0)
        .attr("y2", d => (d.target as KnowledgeNode).y || 0);

      completedGlow
        .attr("x1", d => (d.source as KnowledgeNode).x || 0)
        .attr("y1", d => (d.source as KnowledgeNode).y || 0)
        .attr("x2", d => (d.target as KnowledgeNode).x || 0)
        .attr("y2", d => (d.target as KnowledgeNode).y || 0);

      completedFlow
        .attr("x1", d => (d.source as KnowledgeNode).x || 0)
        .attr("y1", d => (d.source as KnowledgeNode).y || 0)
        .attr("x2", d => (d.target as KnowledgeNode).x || 0)
        .attr("y2", d => (d.target as KnowledgeNode).y || 0);

      node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Initial gentle zoom fit
    svg.transition().duration(600).call(
      zoom.transform,
      d3.zoomIdentity.translate(0, 0).scale(1)
    );

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks]);

  // Handle Zoom controls
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity
      );
    }
  };

  // Action when user clicks "Ôn tập bài này"
  const handleOpenSelectedLesson = () => {
    if (!selectedNode) return;

    const found = lessons.find(l => 
      l.id === selectedNode.lessonId || 
      l.title.toLowerCase() === selectedNode.title.toLowerCase() ||
      (selectedNode.lessonId === "sample-1" && l.title.toLowerCase().includes("vũ trụ số tự nhiên")) ||
      (selectedNode.lessonId === "sample-2" && /giọt nước|chu trình nước/.test(l.title.toLowerCase()))
    );

    if (found) {
      onSelectLesson(found);
    } else {
      onNavigateTab("review");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* 1. Unified Academic Header & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
              <Compass className="w-4 h-4 text-blue-600 animate-spin-slow" />
              <span>Lộ trình liên kết kiến thức THCS</span>
            </div>
            <h1 className="font-display font-bold text-xl md:text-2xl text-slate-900 tracking-tight">
              Bản đồ tri thức và Lộ trình học tập
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Chạm vào từng mốc kiến thức trên bản đồ để xem bài học tiên quyết, tóm tắt cốt lõi và mở bài học tương ứng.
            </p>
          </div>

          {/* Mastery Progress Summary */}
          <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-3 shrink-0 w-full sm:w-auto">
            <div className="relative w-13 h-13 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600 transition-all duration-1000 ease-out"
                  strokeDasharray={`${stats.percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono font-bold text-xs text-slate-900 tabular-nums">
                {stats.percentage}%
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tiến trình làm chủ</p>
              <h4 className="font-mono font-bold text-base text-slate-900 tabular-nums">
                {stats.completed} / {stats.total} <span className="text-xs font-sans font-normal text-slate-500">mốc kiến thức</span>
              </h4>
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã mở khóa lộ trình</span>
              </p>
            </div>
          </div>
        </div>

        {/* Integrated Filter & Search Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Subject Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedSubject("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedSubject === "all"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              Tất cả môn ({allNodes.length})
            </button>
            {stats.subjects.map(subj => (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedSubject === subj
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                }`}
              >
                {subj} ({allNodes.filter(n => n.subject === subj).length})
              </button>
            ))}
          </div>

          {/* Status Filter & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "all" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "completed" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Đã học ({stats.completed})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "pending" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chưa học ({stats.total - stats.completed})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOnlyCompletedLinks(prev => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                onlyCompletedLinks
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
              title="Chỉ hiển thị các tuyến liên kết giữa những bài học đã hoàn thành"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Tuyến đã hoàn thành</span>
              <span className="sm:hidden">Tuyến đã học</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                aria-label="Tìm mốc tri thức" placeholder="Tìm mốc tri thức..."
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-40 md:w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Interactive D3 Map Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive D3 Canvas (8 or 12 Cols) */}
        <div className={`${selectedNode ? "lg:col-span-8" : "lg:col-span-12"} transition-all duration-300`}>
          <div 
            ref={containerRef}
            className="bg-[#f8fafc] rounded-2xl p-2 border border-slate-200/90 shadow-2xs relative overflow-hidden"
          >
            {/* Overlay Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Phóng to bản đồ"
                aria-label="Phóng to bản đồ"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Thu nhỏ bản đồ"
                aria-label="Thu nhỏ bản đồ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Đặt lại góc nhìn"
                aria-label="Đặt lại góc nhìn"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Stage Legend */}
            <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 border border-blue-700" />
                <span>Đã hoàn thành</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border-2 border-slate-500" />
                <span>Chưa học (Chạm để xem)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-600" />
                <span>Lộ trình đã nối</span>
              </div>
            </div>

            {/* SVG Canvas for D3 */}
            <svg ref={svgRef} className="w-full min-h-[540px] md:min-h-[600px] rounded-xl" />
          </div>
        </div>

        {/* Node Inspector Drawer (4 Cols when a node is selected) */}
        {selectedNode && (
          <div className="lg:col-span-4 space-y-4 animate-scale-up">
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-5 sticky top-20">
              {/* Header with Close */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedNode.subject}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {selectedNode.grade}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 leading-snug pt-0.5">
                    {selectedNode.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label="Đóng chi tiết mốc tri thức"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-3.5 rounded-xl flex items-center gap-3 border ${
                selectedNode.completed 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                  selectedNode.completed ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                }`}>
                  {selectedNode.completed ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-medium">Trạng thái bài học</p>
                  <h5 className="font-semibold text-xs md:text-sm truncate">
                    {selectedNode.completed ? "Đã nắm vững kiến thức này" : "Chưa hoàn thành — Sẵn sàng học"}
                  </h5>
                </div>
              </div>

              {/* Core Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tóm tắt nội dung cốt lõi</span>
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  {selectedNode.summary}
                </p>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Cấp độ lộ trình:</span>
                  <span className="text-slate-900 font-semibold font-mono">Bậc {selectedNode.level}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Chuyên đề:</span>
                  <span className="text-slate-900 font-semibold">{selectedNode.topic}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleOpenSelectedLesson}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{selectedNode.completed ? "Ôn tập lại bài học này" : "Bắt đầu học bài này"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab("quiz")}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-blue-600" />
                  <span>Làm bài trắc nghiệm củng cố</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Recommended Next Milestones */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Gợi ý bài học tiếp theo</h3>
              <p className="text-xs text-slate-500">Các mốc kiến thức tiếp nối trực tiếp từ những bài em đã hoàn thành</p>
            </div>
          </div>
        </div>

        <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0">
          {allNodes.filter(n => !n.completed).slice(0, 3).map((milestone) => (
            <div
              key={milestone.id}
              onClick={() => setSelectedNode(milestone)}
              className="snap-start shrink-0 w-[280px] md:w-auto p-4 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-blue-400 transition-all cursor-pointer group flex flex-col justify-between space-y-3 hover:shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                    {milestone.subject}
                  </span>
                  <span className="text-xs font-mono text-slate-500">Bậc {milestone.level}</span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 pt-0.5">
                  {milestone.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {milestone.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-xs font-semibold text-blue-600">
                <span>Định vị trên bản đồ</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
