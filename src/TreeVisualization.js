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


  // End helper functions

  const svgRef = useRef();

  useEffect(() => {
    if (!treeData) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear old diagrams


    const width = window.innerWidth - 40;
    const height = 1200;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    svg.attr("width", width);
    svg.attr("height", height);

    const mainGroup = svg.append("g");
    mainGroup.attr("transform", `translate(${margin.left},${margin.top})`);

    const treemap = d3.tree();
    const layoutWidth = width - margin.left - margin.right;
    const layoutHeight = height - margin.top - margin.bottom;
    treemap.size([layoutWidth, layoutHeight]);


    // Passing in helper function will apply the fcuntion to each item in treeData
    const root = d3.hierarchy(treeData, getChildren);

    // Adds coordinates to all nodes for positioning starting with root node working down
    const treeWithPositions = treemap(root);

    // Descendants orders nodes, root is always first
    const allNodes = treeWithPositions.descendants();
    const allLinks = treeWithPositions.descendants().slice(1); // Don't include root in nodes tha tneed links

    for (const node of allNodes) {
      node.y = node.depth * 200; // 200px between each level
    }

    // LINKS
    const linkSelection = mainGroup.selectAll('path.link');
    const linkData = linkSelection.data(allLinks);
    const linkPaths = linkData.enter().append('path');

    // Style the lines
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

    const rectangles = nodeGroups.append('rect');
    rectangles.attr('width', 120);
    rectangles.attr('height', 35);
    rectangles.attr('x', -60); // Align center 
    rectangles.attr('y', -17.5);
    rectangles.style('fill', '#cae9f5');

    nodeGroups.attr('class', 'node');
    function positionNode(node) {
      return `translate(${node.x},${node.y})`;
    }

    nodeGroups.attr('transform', positionNode);

    const textLabels = nodeGroups.append('text');
    textLabels.attr('text-anchor', 'middle');
    textLabels.attr('dy', '0.35em'); // Vertical centering
    textLabels.text(getNodeName);

  }, [treeData]);


  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Tree Visualization</h2>
      <div style={{ border: "1px solid #ccc", height: "600px", overflow: "auto" }}>
        <svg ref={svgRef} ></svg>
      </div>
    </div>
  );
};

export default TreeVisualization;