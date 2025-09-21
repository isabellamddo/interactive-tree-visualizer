import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TreeVisualization = ({ treeData }) => {
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
    const pathString = `M${childX},${childY} L${parentX},${parentY}`;

    return pathString;

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

  const svgRef = useRef();

  useEffect(() => {
    if (!treeData) return;

    let i = 0;

    // Container for diagram
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear old diagrams


    const width = window.innerWidth - 40;
    const height = 1200;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    svg.attr("width", width);
    svg.attr("height", height);

    const mainGroup = svg.append("g");
    mainGroup.attr("transform", `translate(${margin.left},${margin.top})`);

    // Drag and zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Tree structure
    const treemap = d3.tree();
    const layoutWidth = width - margin.left - margin.right;
    const layoutHeight = height - margin.top - margin.bottom;
    treemap.size([layoutWidth, layoutHeight]);

    const root = d3.hierarchy(treeData, getChildren);


    // Collapse and expand
    root.children.forEach(collapse);

    // Adds coordinates to all nodes for positioning starting with root
    const treeWithPositions = treemap(root);

    // Descendants orders nodes
    const allNodes = treeWithPositions.descendants();
    const allLinks = treeWithPositions.descendants().slice(1); // Don't include root in nodes tha tneed links

    for (const node of allNodes) {
      node.y = node.depth * 150 + margin.top;
      node.x = node.x + margin.left;
    }

    mainGroup.selectAll('path.link')
      .data(allLinks, d => d.id || (d.id = ++i))
      .join('path')
      .attr('class', 'link')
      .style('stroke', '#000')
      .attr('d', d => createLink(d, d.parent));

    // Staggering to condense diagram
    const nodesByLevel = {};
    for (const node of allNodes) {
      if (!nodesByLevel[node.depth]) {
        nodesByLevel[node.depth] = [];
      }

      nodesByLevel[node.depth].push(node);
    }

    const levelKeys = Object.keys(nodesByLevel);
    for (const level of levelKeys) {
      const levelNodes = nodesByLevel[level];

      for (let index = 0; index < levelNodes.length; index++) {
        const node = levelNodes[index];

        const staggerOffset = (index % 3) * 20 - 20;
        node.y = node.y + staggerOffset;
      }
    }

    // LINKS
    const linkSelection = mainGroup.selectAll('path.link');
    const linkData = linkSelection.data(allLinks);
    const linkPaths = linkData.enter().append('path');

    linkPaths.attr('class', 'link');
    linkPaths.style('stroke', '#000000ff');
    linkPaths.attr('d', function (linkNode) {
      return createLink(linkNode, linkNode.parent);
    });

    // NODES
    const nodeSelection = mainGroup.selectAll('g.node');
    const nodeData = nodeSelection.data(allNodes);

    // Create group element for each node to make moving rectangle and text together easier
    const nodeGroups = nodeData.enter().append('g');

    nodeGroups.attr('class', 'node');

    nodeGroups.on('click', function (event, d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if (d._children) {
        d.children = d._children;
        d._children = null;
      }


      const treeWithPositions = treemap(root);
      const allNodes = treeWithPositions.descendants();
      const allLinks = treeWithPositions.descendants().slice(1);

      for (const node of allNodes) {
        node.y = node.depth * 150 + margin.top;
        node.x = node.x + margin.left;
      }

    });

    nodeGroups.style('cursor', 'pointer');

    nodeGroups.attr('transform', positionNode);

    // TEXT
    const textGroups = nodeGroups.append('g').attr('class', 'text-group');

    textGroups.each(function (node) {
      const nodeGroup = d3.select(this);
      const name = getNodeName(node);
      const maxWidth = 120;

      const text = nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .style('font-family', 'Arial, sans-serif')
        .style('font-size', '11px')
        .style('pointer-events', 'none');

      const words = name.split(/\s+/);

      text.text(name);

      // Wrap text if to long
      if (text.node().getComputedTextLength() > maxWidth) {
        text.text(null);

        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1;

        let tspan = text.append('tspan')
          .attr('x', 0)
          .attr('dy', '0.35em');

        words.forEach(word => {
          line.push(word);
          tspan.text(line.join(' '));

          if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            lineNumber++;
            tspan = text.append('tspan')
              .attr('x', 0)
              .attr('dy', lineHeight + 'em')
              .text(word);
          }
        });

        // Vertically center multi-line text
        const totalLines = lineNumber + 1;
        const firstTspan = text.select('tspan');
        firstTspan.attr('dy', `${-totalLines * 0.3 + 0.35}em`);
      }

      // RECTANGLES
      const rect = nodeGroup.append('rect');
      const bbox = text.node().getBBox();

      const paddingX = 15;
      const paddingY = 10;

      rect.attr('x', bbox.x - paddingX)
        .attr('y', bbox.y - paddingY)
        .attr('width', bbox.width + paddingX * 2)
        .attr('height', bbox.height + paddingY * 2)
        .style('fill', getNodeColor(node))
        .style('stroke', '#333')
        .style('stroke-width', '1px');

      rect.lower();
    });

  }, [treeData]);

  // React
  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Tree Visualization</h2>
      <p style={{ fontSize: "14px", color: "#666" }}>
        Click nodes to expand/collapse
      </p>
      <div style={{ border: "1px solid #ccc", height: "600px", overflow: "auto" }}>
        <svg ref={svgRef} ></svg>
      </div>
    </div>
  );
};

export default TreeVisualization;