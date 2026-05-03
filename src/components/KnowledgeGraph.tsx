import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { Minus, Plus } from 'lucide-react';
import type { GraphData } from '../types';

interface GraphProps {
  graph: GraphData | null;
  includeMemory: boolean;
  includeRelationships: boolean;
  loading: boolean;
  onToggleIncludeMemory: (value: boolean) => void;
  onToggleIncludeRelationships: (value: boolean) => void;
  onDocumentClick: (documentId: string) => void;
}

const nodeColors: Record<string, string> = {
  user: '#0f172a',
  knowledge_base: '#3b82f6',
  document: '#10b981',
  memory_entry: '#f59e0b',
};

export function KnowledgeGraph({
  graph,
  includeMemory,
  includeRelationships,
  loading,
  onToggleIncludeMemory,
  onToggleIncludeRelationships,
  onDocumentClick,
}: GraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomBehavior = useMemo(() => d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 4]), []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !graph || graph.nodes.length === 0) {
      return;
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current).attr('viewBox', [0, 0, width, height]);
    const g = svg.append('g');

    zoomBehavior.on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoomBehavior);

    const nodes = graph.nodes.map((node) => ({ ...node }));
    const links = graph.edges.map((edge) => ({ ...edge }));

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(links as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
          .id((d: any) => d.id)
          .distance((link: any) => (link.edge_type === 'related' ? 120 : 70)),
      )
      .force('charge', d3.forceManyBody().strength(graph.include_memory ? -180 : -260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((node: any) => (node.node_type === 'memory_entry' ? 18 : 28)));

    const link = g
      .append('g')
      .attr('stroke-opacity', 0.45)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (edge) => (edge.edge_type === 'related' ? '#3b82f6' : '#cbd5e1'))
      .attr('stroke-width', (edge) => (edge.edge_type === 'related' ? 1.2 : 0.8));

    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', (item) => (item.node_type === 'document' ? 'pointer' : 'grab'))
      .on('click', (_, item) => {
        if (item.node_type === 'document') {
          onDocumentClick(item.entity_id);
        }
      })
      .call(drag(simulation) as never);

    node
      .append('circle')
      .attr('r', (item) => (item.node_type === 'memory_entry' ? 5 : item.node_type === 'document' ? 8 : 10))
      .attr('fill', (item) => nodeColors[item.node_type] ?? '#94a3b8')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    node
      .append('text')
      .text((item) => item.label)
      .attr('x', (item) => (item.node_type === 'memory_entry' ? 10 : 14))
      .attr('y', 4)
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', '#1e293b')
      .attr('pointer-events', 'none')
      .style('opacity', (item) => (item.node_type === 'memory_entry' && !includeMemory ? 0 : 0.78))
      .style('display', () => (graph.nodes.length < 36 ? 'block' : 'none'));

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function drag(simulationRef: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
      function dragstarted(event: d3.D3DragEvent<SVGGElement, d3.SimulationNodeDatum, d3.SimulationNodeDatum>) {
        if (!event.active) {
          simulationRef.alphaTarget(0.3).restart();
        }
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGGElement, d3.SimulationNodeDatum, d3.SimulationNodeDatum>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGGElement, d3.SimulationNodeDatum, d3.SimulationNodeDatum>) {
        if (!event.active) {
          simulationRef.alphaTarget(0);
        }
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag<SVGGElement, d3.SimulationNodeDatum>().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [graph, includeMemory, onDocumentClick, zoomBehavior]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-50">
      <header className="absolute top-6 left-6 z-10 max-w-md">
        <h2 className="text-xl font-semibold tracking-tight">Knowledge Graph</h2>
        <p className="mt-1 text-xs text-brand-sub">
          Nodes and edges are loaded from the backend graph projection for the active knowledge base.
        </p>
      </header>

      <div className="absolute top-6 right-6 z-10 flex items-center gap-3 rounded-2xl border border-brand-line bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm">
        <label className="flex items-center gap-2 text-xs font-semibold text-brand-sub">
          <input type="checkbox" checked={includeMemory} onChange={(event) => onToggleIncludeMemory(event.target.checked)} />
          Memory
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-brand-sub">
          <input
            type="checkbox"
            checked={includeRelationships}
            onChange={(event) => onToggleIncludeRelationships(event.target.checked)}
          />
          Relationships
        </label>
      </div>

      {!graph || graph.nodes.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="text-lg font-semibold tracking-tight text-brand-ink">
            {loading ? 'Loading graph projection...' : 'No graph data available'}
          </p>
          <p className="mt-3 max-w-md text-sm leading-7 text-brand-sub">
            Upload and index documents first, then open this view to explore the projected graph.
          </p>
        </div>
      ) : (
        <svg ref={svgRef} className="h-full w-full" />
      )}

      {graph ? (
        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
          <div className="rounded-xl border border-brand-line bg-white/85 p-3 shadow-sm backdrop-blur-md">
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-brand-sub">Node Types</p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(graph.node_type_counts).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 px-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: nodeColors[type] ?? '#94a3b8' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink">
                    {type} · {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col overflow-hidden rounded-xl border border-brand-line bg-white/85 p-1 shadow-sm backdrop-blur-md">
            <button
              onClick={() => d3.select(svgRef.current).transition().call(zoomBehavior.scaleBy as never, 1.2)}
              className="p-2 text-brand-sub transition-colors hover:bg-slate-100"
            >
              <Plus size={14} />
            </button>
            <div className="mx-2 h-px bg-brand-line" />
            <button
              onClick={() => d3.select(svgRef.current).transition().call(zoomBehavior.scaleBy as never, 0.8)}
              className="p-2 text-brand-sub transition-colors hover:bg-slate-100"
            >
              <Minus size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
