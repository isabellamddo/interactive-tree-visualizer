import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TreeVisualization = ({ treeData }) => {
  // Helper functions
  function getChildren(nodeData) {
    return nodeData.children;
  }


  // End helper functions

  const svgRef = useRef();

  useEffect(() => {
    if (!treeData) return;
    const svg = d3.select(svgRef.current);

    const width = window.innerWidth - 40;
    const height = 1200;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    svg.attr("width", width);
    svg.attr("height", height);

    const treemap = d3.tree();

    // Passing in helper function will apply the fcuntion to each item in treeData
    const root = d3.hierarchy(treeData, getChildren);

    // Adds coordinates to all nodes for positioning starting with root node working down
    const treeWithPositions = treemap(root);
  });



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