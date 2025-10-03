import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const TreeVisualization = ({ treeData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const updateRef = useRef(null);
  const [maxDepth, setMaxDepth] = useState(0);

  // Helper functions
  function getChildren(nodeData) {
    return nodeData.children;
  }

  function getNodeName(node) {
    return node.data.name;
  }

  function createLink(childNode, parentNode) {
    const childX = childNode.x;
    const childY = childNode.y;
    const parentX = parentNode.x;
    const parentY = parentNode.y;

    // M: move to
    // L: draw line to
    return `M${childX},${childY} L${parentX},${parentY}`;
  }

  function getNodeColor(node) {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    return colors[node.depth % colors.length];
  }

  function positionNode(node) {
    return `translate(${node.x},${node.y})`;
  }

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  function expand(d) {
    if (d._children) {
      d.children = d._children;
      d._children = null;
    }
    if (d.children) {
      d.children.forEach(expand);
    }
  }

  // End helper functions

  // React refs
  const svgRef = useRef();
  const rootRef = useRef(null);

  // Tree structure
  useEffect(() => {
    if (!treeData) return;
    let i = 0;

    // Container for diagram
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear old diagrams

    const containerWidth = 1200;
    const containerHeight = 800;
    const width = 4000;
    const height = 3000;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    svg.attr("width", containerWidth).attr("height", containerHeight);

    const zoom = d3.zoom()
      .scaleExtent([0.05, 5])
      .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
      });
    svg.call(zoom);

    const mainGroup = svg.append("g");

    // Tree layout
    const treemap = d3.tree();
    const layoutWidth = width - margin.left - margin.right;
    const layoutHeight = height - margin.top - margin.bottom;
    treemap.size([layoutWidth, layoutHeight]);

    const root = d3.hierarchy(treeData, getChildren);
    rootRef.current = root;

    // Collapse all nodes initially
    if (root.children) root.children.forEach(collapse);

    function update(source) {
      const treeWithPositions = treemap(root);
      const allNodes = treeWithPositions.descendants();
      const allLinks = treeWithPositions.links();
      let currentMaxDepth = 0;
      for (const node of allNodes) {
        if (node.depth > currentMaxDepth) {
          currentMaxDepth = node.depth;
        }
      }
      setMaxDepth(currentMaxDepth);

      // Descendants orders nodes
      for (const node of allNodes) {
        node.y = node.depth * 150 + margin.top;
        node.x = node.x + margin.left;
      }

      // Staggering to condense diagram
      const nodesByLevel = {};
      for (const node of allNodes) {
        if (!nodesByLevel[node.depth]) nodesByLevel[node.depth] = [];
        nodesByLevel[node.depth].push(node);
      }
      Object.keys(nodesByLevel).forEach(level => {
        const levelNodes = nodesByLevel[level];
        levelNodes.forEach((node, index) => {
          node.y += (index % 3) * 15 - 15;
        });
      });

      // LINKS
      const linkSelection = mainGroup.selectAll('path.link')
        .data(allLinks, d => d.id || (d.id = ++i));

      linkSelection.enter()
        .insert('path', 'g')
        .attr('class', 'link')
        .style('fill', 'none')
        .style('stroke', '#999')
        .style('stroke-width', '1.5px')
        .style('opacity', 0.6)
        .attr('d', d => createLink(d.target, d.source));

      linkSelection
        .attr('d', d => createLink(d.target, d.source));

      linkSelection.exit().remove();

      // NODES
      const nodeSelection = mainGroup.selectAll('g.node')
        .data(allNodes, d => d.id || (d.id = ++i));

      const nodeEnter = nodeSelection.enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.x0 || width / 2},${source.y0 || margin.top})`)
        .style('cursor', 'pointer')
        .on('click', click);

      // Text and rectangle
      nodeEnter.each(function (node) {
        const nodeGroup = d3.select(this).append('g').attr('class', 'text-group');
        const text = nodeGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .style('font-family', 'Arial, sans-serif')
          .style('font-size', '11px')
          .text(getNodeName(node));

        const bbox = text.node().getBBox();
        const paddingX = 15;
        const paddingY = 10;

        const canExpand = node.children || node._children;

        if (canExpand) {
          // Ellipse for expandable nodes
          const ellipse = nodeGroup.append('ellipse')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('rx', (bbox.width + paddingX * 2) / 2)
            .attr('ry', (bbox.height + paddingY * 2) / 2)
            .style('fill', getNodeColor(node))
            .style('stroke', '#333')
            .style('stroke-width', '1.5px');

          ellipse.lower();
        } else { // Rectangle for non expandable nodes
          const rect = nodeGroup.append('rect')
            .attr('x', bbox.x - paddingX)
            .attr('y', bbox.y - paddingY)
            .attr('width', bbox.width + paddingX * 2)
            .attr('height', bbox.height + paddingY * 2)
            .style('fill', getNodeColor(node))
            .style('stroke', '#333')
            .style('stroke-width', '1px');

          rect.lower();
        }
      });

      nodeSelection.merge(nodeEnter)
        .transition().duration(500)
        .attr('transform', positionNode);

      nodeSelection.exit().remove();

      allNodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
    }

    updateRef.current = update;

    // Handle click
    function click(event, d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

    root.x0 = width / 2;
    root.y0 = margin.top;
    update(root);

    const initialScale = 0.3;
    const initialTranslateX = containerWidth / 2 - (width / 2) * initialScale;
    const initialTranslateY = 50;
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(initialTranslateX, initialTranslateY)
      .scale(initialScale));

    rootRef.current.expand = expand;
    rootRef.current.collapse = collapse;

  }, [treeData]);

  const toggleExpandCollapse = () => {
    if (!rootRef.current || !updateRef.current) return;
    const root = rootRef.current;

    if (isExpanded) {
      if (root.children) {
        root.children.forEach(child => {
          root.collapse(child);
        });
      }
    } else {
      root.expand(root);
    }

    updateRef.current(root);
    setIsExpanded(!isExpanded);
  };

  // Legend data
  const legendColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];

  const Legend = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '40px',
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#edededff',
      borderRadius: '8px',
      fontSize: '14px'
    }}>
      <div>
        <strong>Colors by Level:</strong>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
          {legendColors.slice(0, maxDepth + 1).map((color, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: color,
                border: '1px solid #333',
                borderRadius: '3px'
              }}></div>
              <span>Level {index}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // React render
  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Tree Visualization</h2>
      <button onClick={toggleExpandCollapse}>
        {isExpanded ? "Collapse All" : "Expand All"}
      </button>
      <Legend />
      <p style={{ fontSize: "14px", color: "#666" }}>
        Click nodes to expand/collapse
      </p>
      <div style={{ border: "2px solid #ccc", borderRadius: "8px", overflow: "hidden", background: "#fafafa" }}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default TreeVisualization;