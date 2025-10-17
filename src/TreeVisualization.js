import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const TreeVisualization = ({ treeData }) => {


  const [isExpanded, setIsExpanded] = useState(false); // For entire diagram
  const [maxDepth, setMaxDepth] = useState(0); // Dynamic legend
  const updateRef = useRef(null); // Update function can be called externally
  const [sideBarOpen, setSidebarOpen] = useState(true);
  // References
  const svgRef = useRef();
  const rootRef = useRef(null); // D3 hierarchy root

  //////////////////////
  // Helper functions //
  //////////////////////

  // Array of children
  function getChildren(nodeData) {
    return nodeData.children;
  }

  function getNodeName(node) {
    return node.data.name;
  }

  // Svg path between child and parent
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
  // Depth of the tree including collapsed nodes
  function getFullDepth(node) {
    if (!node.children && !node._children) return 0;
    const children = node.children || node._children || [];
    let maxChildDepth = 0;
    for (let i = 0; i < children.length; i++) {
      const childDepth = getFullDepth(children[i]);
      if (childDepth > maxChildDepth) maxChildDepth = childDepth;
    }
    return maxChildDepth + 1;
  }


  ////////////////////
  // Tree Rendering //
  ////////////////////

  let fullDepth = 0;
  if (treeData !== null) {
    fullDepth = getFullDepth(treeData);
  }


  useEffect(() => {
    if (!treeData) return;
    let nodeIDCounter = 0;

    // Enables use of update function
    const root = d3.hierarchy(treeData, getChildren);
    rootRef.current = root;
    setMaxDepth(getFullDepth(treeData));

    // Container for diagram
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear old diagrams

    const containerWidth = 1200;
    const containerHeight = 800;
    const width = 4000;
    const height = 3000;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    // Group for ALL nodes and links
    const mainGroup = svg.append("g");

    svg.attr("width", containerWidth).attr("height", containerHeight);

    // Zoom and pan
    const zoom = d3.zoom()
      .scaleExtent([0.05, 5]) // 5-500% zoom
      .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Tree layout
    const treemap = d3.tree();
    const layoutWidth = width - margin.left - margin.right;
    const layoutHeight = height - margin.top - margin.bottom;
    treemap.size([layoutWidth, layoutHeight]);

    // Collapse all nodes initially
    if (root.children) root.children.forEach(collapse);

    /////////////////////
    // Update Function //
    /////////////////////

    function update(source) {
      const treeWithPositions = treemap(root);
      const allNodes = treeWithPositions.descendants(); // Node array
      const allLinks = treeWithPositions.links(); // Link objects array

      // NODE POSITIONING
      for (const node of allNodes) {
        node.y = node.depth * 150 + margin.top; // Vretical spacing based on depth
        node.x = node.x + margin.left;
      }

      // Staggering to condense diagram
      const nodesByLevel = {};
      for (const node of allNodes) {
        if (!nodesByLevel[node.depth]) nodesByLevel[node.depth] = [];
        nodesByLevel[node.depth].push(node);
      }

      // LINK ANIMATIONS
      const linkSelection = mainGroup.selectAll('path.link')
        .data(allLinks, d => `${d.source.data.name}-${d.target.data.name}`);

      // Enter new links at parent's previous position
      const linkEnter = linkSelection.enter()
        .insert('path', 'g')
        .attr('class', 'link')
        .style('fill', 'none')
        .style('stroke', '#999')
        .style('stroke-width', '1.5px')
        .style('opacity', 0.6)
        .attr('d', d => {
          const o = { x: source.x0 || source.x, y: source.y0 || source.y };
          return `M${o.x},${o.y}L${o.x},${o.y}`;
        });

      // Update existing links
      const linkUpdate = linkEnter.merge(linkSelection);

      linkUpdate.transition()
        .duration(500)
        .attr('d', d => {
          return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
        });

      // Remove exiting links
      linkSelection.exit().transition()
        .duration(500)
        .attr('d', d => {
          const o = { x: source.x, y: source.y };
          return `M${o.x},${o.y}L${o.x},${o.y}`;
        })
        .style('opacity', 0)
        .remove();

      // NODE ANIMATIONS
      const nodeSelection = mainGroup.selectAll('g.node')
        .data(allNodes, d => d.id || (d.id = ++nodeIDCounter));

      //  Enter new links at parent's previous position
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

        // Measure text size to fit in shape
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

          ellipse.lower(); // Set behinf text
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

      // Update existing node positions with transition
      const nodeUpdate = nodeEnter.merge(nodeSelection);
      nodeUpdate.transition()
        .duration(500)
        .attr('transform', d => `translate(${d.x},${d.y})`);

      // Remove exiting nodes
      const nodeExit = nodeSelection.exit().transition()
        .duration(500)
        .attr('transform', d => `translate(${source.x},${source.y})`)
        .remove();

      nodeExit.select('.text-group rect, .text-group ellipse').style('opacity', 0);
      nodeExit.select('text').style('fill-opacity', 0);

      // Save positions for next update
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

    // Initialize tree and zoom scale
    root.x0 = width / 2;
    root.y0 = margin.top;
    update(root);

    const initialScale = 0.3;
    const initialTranslateX = containerWidth / 2 - (width / 2) * initialScale;
    const initialTranslateY = 50;
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(initialTranslateX, initialTranslateY)
      .scale(initialScale));

    // Attach helpers for button
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
      padding: '15px',
      borderRadius: '8px',
      fontSize: '14px'
    }}>
      <div>
        <strong>Node Shapes:</strong>
        <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="30" height="20">
              <ellipse cx="15" cy="10" rx="14" ry="9" fill="#87ceeb" stroke="#333" strokeWidth="1" />
            </svg>
            <span>Can expand/collapse</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="30" height="20">
              <rect x="2" y="2" width="26" height="16" fill="#87ceeb" stroke="#333" strokeWidth="1" />
            </svg>
            <span>Leaf node (no children)</span>
          </div>
        </div>
      </div>
      <div>
        <strong>Colors by Level:</strong>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
          {legendColors.slice(0, maxDepth).map((color, index) => (
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
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: '60px', marginBottom: '4px' }}>{`\u{1F332}`}</div>
        <h2 style={{ fontSize: '36px', margin: '0', color: '#2c3e50' }}>Interactive Tree Visualizer</h2>
      </div>

      <Legend />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px',
        gap: '15px'
      }}>
        <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
          Click nodes to expand/collapse
        </p>
        <button
          onClick={toggleExpandCollapse}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '5px'
          }}
        >
          {isExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>
      <div style={{ border: "2px solid #ccc", borderRadius: "8px", overflow: "hidden", background: "#fafafa" }}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default TreeVisualization;