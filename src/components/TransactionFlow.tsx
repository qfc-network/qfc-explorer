'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api-client';
import type { FlowNode, FlowLink } from '@/lib/api-types';
import { shortenHash, formatWeiToQfc } from '@/lib/format';

interface FlowData {
  nodes: FlowNode[];
  links: FlowLink[];
}

interface LayoutNode {
  address: string;
  label?: string;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutLink {
  source: LayoutNode;
  target: LayoutNode;
  value: string;
  token?: string;
  type: 'native' | 'erc20' | 'internal';
  thickness: number;
  sourceY: number;
  targetY: number;
}

const LINK_COLORS: Record<string, string> = {
  native: '#4fc3f7',
  erc20: '#ab47bc',
  internal: '#78909c',
};

const NODE_BG = '#1e293b';
const NODE_TEXT = '#e2e8f0';
const NODE_WIDTH = 140;
const NODE_HEIGHT = 40;
const NODE_PADDING_Y = 16;
const COLUMN_GAP = 200;
const PADDING_X = 20;
const PADDING_Y = 30;

export default function TransactionFlow({ txHash }: { txHash: string }) {
  const [data, setData] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    value: string;
    token?: string;
    type: string;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function fetchFlow() {
      try {
        setLoading(true);
        const base = getApiBaseUrl();
        const isExternal = base.includes(':3001') ||
          (process.env.NEXT_PUBLIC_API_URL || '').length > 0;
        const url = isExternal
          ? `${base}/txs/${txHash}/flow`
          : `${base}/api/txs/${txHash}/flow`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch flow data');
        const json = await res.json() as { ok: boolean; data?: FlowData };
        if (!cancelled && json.ok && json.data) {
          setData(json.data);
        } else if (!cancelled) {
          setError('No flow data available');
        }
      } catch {
        if (!cancelled) setError('Failed to load flow data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFlow();
    return () => { cancelled = true; };
  }, [txHash]);

  const computeLayout = useCallback(
    (flowData: FlowData, containerWidth: number) => {
      const { nodes, links } = flowData;
      if (nodes.length === 0 || links.length === 0) return null;

      // Build adjacency info
      const sourceSet = new Set<string>();
      const targetSet = new Set<string>();
      for (const link of links) {
        sourceSet.add(link.source);
        targetSet.add(link.target);
      }

      // Classify nodes into columns
      const nodeMap = new Map<string, FlowNode>();
      for (const n of nodes) nodeMap.set(n.address, n);

      // Sources: appear as source but never as target
      // Sinks: appear as target but never as source
      // Intermediate: both
      const pureSource = new Set<string>();
      const pureSink = new Set<string>();
      const intermediate = new Set<string>();

      for (const addr of new Set([...sourceSet, ...targetSet])) {
        const isSrc = sourceSet.has(addr);
        const isTgt = targetSet.has(addr);
        if (isSrc && !isTgt) pureSource.add(addr);
        else if (isTgt && !isSrc) pureSink.add(addr);
        else intermediate.add(addr);
      }

      // If no pure sources, pick the "from" of the first link
      if (pureSource.size === 0 && links.length > 0) {
        const first = links[0].source;
        intermediate.delete(first);
        pureSource.add(first);
      }

      // Assign columns
      const columnAssignment = new Map<string, number>();
      for (const addr of pureSource) columnAssignment.set(addr, 0);
      for (const addr of intermediate) columnAssignment.set(addr, 1);
      for (const addr of pureSink) columnAssignment.set(addr, 2);

      // If only 2 unique addresses (simple transfer), use columns 0 and 2
      if (intermediate.size === 0 && pureSource.size > 0 && pureSink.size > 0) {
        for (const addr of pureSink) columnAssignment.set(addr, 2);
      }

      // If all addresses ended up in the same column, spread them
      const columns = new Set(columnAssignment.values());
      if (columns.size === 1) {
        const addrs = [...columnAssignment.keys()];
        addrs.forEach((addr, i) => columnAssignment.set(addr, i));
      }

      // Group by column
      const colGroups = new Map<number, string[]>();
      for (const [addr, col] of columnAssignment) {
        if (!colGroups.has(col)) colGroups.set(col, []);
        colGroups.get(col)!.push(addr);
      }

      const numCols = Math.max(...colGroups.keys()) + 1;
      const availableWidth = Math.max(containerWidth - PADDING_X * 2, 400);
      const colWidth = numCols > 1
        ? (availableWidth - NODE_WIDTH) / (numCols - 1)
        : availableWidth;

      // Build layout nodes
      const layoutNodes = new Map<string, LayoutNode>();

      for (const [col, addrs] of colGroups) {
        const totalHeight =
          addrs.length * NODE_HEIGHT + (addrs.length - 1) * NODE_PADDING_Y;
        const startY = PADDING_Y;

        addrs.forEach((addr, i) => {
          const x = PADDING_X + col * Math.min(colWidth, COLUMN_GAP);
          const y = startY + i * (NODE_HEIGHT + NODE_PADDING_Y);
          const node = nodeMap.get(addr);
          layoutNodes.set(addr, {
            address: addr,
            label: node?.label,
            column: col,
            x,
            y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
          });
        });
      }

      // Build layout links
      // Track vertical offsets per node for stacking links
      const sourceOffsets = new Map<string, number>();
      const targetOffsets = new Map<string, number>();

      // Compute max value for relative thickness
      const values = links.map((l) => {
        try {
          return Number(BigInt(l.value));
        } catch {
          return 0;
        }
      });
      const maxVal = Math.max(...values, 1);

      const layoutLinks: LayoutLink[] = [];

      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const sourceNode = layoutNodes.get(link.source);
        const targetNode = layoutNodes.get(link.target);
        if (!sourceNode || !targetNode) continue;

        const relVal = values[i] / maxVal;
        const thickness = Math.max(2, Math.min(20, relVal * 20));

        const sOff = sourceOffsets.get(link.source) || 0;
        const tOff = targetOffsets.get(link.target) || 0;

        const sourceY = sourceNode.y + NODE_HEIGHT / 2 + sOff;
        const targetY = targetNode.y + NODE_HEIGHT / 2 + tOff;

        sourceOffsets.set(link.source, sOff + thickness + 2);
        targetOffsets.set(link.target, tOff + thickness + 2);

        layoutLinks.push({
          source: sourceNode,
          target: targetNode,
          value: link.value,
          token: link.token,
          type: link.type,
          thickness,
          sourceY,
          targetY,
        });
      }

      // Compute total SVG height
      let maxY = 0;
      for (const node of layoutNodes.values()) {
        maxY = Math.max(maxY, node.y + NODE_HEIGHT);
      }
      const svgHeight = Math.max(200, Math.min(600, maxY + PADDING_Y * 2));

      // Compute total SVG width
      let maxX = 0;
      for (const node of layoutNodes.values()) {
        maxX = Math.max(maxX, node.x + NODE_WIDTH);
      }
      const svgWidth = maxX + PADDING_X;

      return {
        nodes: [...layoutNodes.values()],
        links: layoutLinks,
        width: svgWidth,
        height: svgHeight,
      };
    },
    []
  );

  // Responsive container width
  const [containerWidth, setContainerWidth] = useState(800);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
        <span className="ml-2 text-sm text-slate-400">Loading flow data...</span>
      </div>
    );
  }

  if (error || !data || data.links.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No flow data available
      </div>
    );
  }

  const layout = computeLayout(data, containerWidth);
  if (!layout) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No flow data available
      </div>
    );
  }

  function handleNodeClick(address: string) {
    router.push(`/address/${address}`);
  }

  function handleLinkHover(
    e: React.MouseEvent,
    link: LayoutLink
  ) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 10,
      value: link.value,
      token: link.token,
      type: link.type,
    });
  }

  function handleLinkLeave() {
    setTooltip(null);
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-6 rounded" style={{ background: LINK_COLORS.native, opacity: 0.6 }} />
          Native Transfer
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-6 rounded" style={{ background: LINK_COLORS.erc20, opacity: 0.6 }} />
          Token Transfer
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-6 rounded" style={{ background: LINK_COLORS.internal, opacity: 0.6 }} />
          Internal Call
        </span>
        <span className="ml-auto text-slate-600">Click address to view details</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width="100%"
        height={layout.height}
        className="select-none"
        style={{ minWidth: layout.width }}
      >
        {/* Links */}
        {layout.links.map((link, i) => {
          const x1 = link.source.x + link.source.width;
          const y1 = link.sourceY;
          const x2 = link.target.x;
          const y2 = link.targetY;
          const midX = (x1 + x2) / 2;

          // For self-referencing or same-column links, use an arc
          const isSameCol = link.source.column === link.target.column;
          const path = isSameCol
            ? `M ${x1},${y1} C ${x1 + 60},${y1 - 40} ${x2 + 60},${y2 - 40} ${x2},${y2}`
            : `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;

          return (
            <g key={`link-${i}`}>
              {/* Invisible wider path for easier hover */}
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(link.thickness, 12)}
                onMouseMove={(e) => handleLinkHover(e, link)}
                onMouseLeave={handleLinkLeave}
                className="cursor-pointer"
              />
              <path
                d={path}
                fill="none"
                stroke={LINK_COLORS[link.type] || LINK_COLORS.native}
                strokeWidth={link.thickness}
                strokeOpacity={0.3}
                strokeLinecap="round"
                onMouseMove={(e) => handleLinkHover(e, link)}
                onMouseLeave={handleLinkLeave}
                className="cursor-pointer transition-opacity hover:stroke-opacity-60"
                style={{ pointerEvents: 'none' }}
              />
              {/* Arrow at target */}
              <polygon
                points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
                fill={LINK_COLORS[link.type] || LINK_COLORS.native}
                fillOpacity={0.5}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {layout.nodes.map((node) => (
          <g
            key={node.address}
            onClick={() => handleNodeClick(node.address)}
            className="cursor-pointer"
          >
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx={8}
              ry={8}
              fill={NODE_BG}
              stroke="#334155"
              strokeWidth={1}
              className="transition-all hover:stroke-cyan-400/50"
            />
            <text
              x={node.x + node.width / 2}
              y={node.y + (node.label ? node.height / 2 - 5 : node.height / 2 + 1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={NODE_TEXT}
              fontSize={11}
              fontFamily="monospace"
            >
              {shortenHash(node.address, 4, 4)}
            </text>
            {node.label && (
              <text
                x={node.x + node.width / 2}
                y={node.y + node.height / 2 + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#94a3b8"
                fontSize={9}
              >
                {node.label.length > 16 ? node.label.slice(0, 16) + '...' : node.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: LINK_COLORS[tooltip.type] }}
            />
            <span className="text-slate-300">
              {tooltip.type === 'native'
                ? 'Native Transfer'
                : tooltip.type === 'erc20'
                ? 'Token Transfer'
                : 'Internal Call'}
            </span>
          </div>
          <div className="mt-1 text-white">
            {tooltip.type === 'erc20' && tooltip.token
              ? `${formatWeiToQfc(tooltip.value)} ${tooltip.token}`
              : `${formatWeiToQfc(tooltip.value)} QFC`}
          </div>
        </div>
      )}
    </div>
  );
}
