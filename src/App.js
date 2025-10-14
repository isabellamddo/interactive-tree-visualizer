import logo from './logo.svg';
import TreeVisualization from './TreeVisualization';
import './App.css';
import * as d3 from 'd3';
import React, { useState } from 'react';
import { buildTree } from './tree.js';

function App() {
  console.log('D3 imported', typeof d3.select);

  const [file, setFile] = useState();
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default sidebar is open 

  const fileReader = new FileReader();

  const validateHeaders = (csvText) => {
    const lines = csvText.split('\n');
    if (lines.length === 0) {
      return { valid: false, error: 'No owner, name column headers found.' }
    }

    const headers = lines[0].split(',').map(h => h.trim());

    if (headers.length !== 2) {
      return { valid: false, error: 'Data does not have exactly 2 columns. Should have "owner,name".' }
    }

    if (!headers.includes('owner')) {
      return { valid: false, error: 'Missing "owner" column.' }
    }

    if (!headers.includes('name')) {
      return { valid: false, error: 'Missing "name" column.' }
    }

    return { valid: true }
  }

  // User selected a file
  const handleOnChange = (e) => {
    setFile(e.target.files[0]);
  };

  // User uploaded file
  const handleOnSubmit = (e) => {
    e.preventDefault();

    if (file) {
      fileReader.onload = function (event) {
        const csvOutput = event.target.result;

        const validation = validateHeaders(csvOutput);

        if (!validation.valid) {
          setError(validation.error);
          return;
        }

        setError('');

        // Convert CSV to data format
        const csvData = csvOutput.split('\n');
        const csvLines = [];
        for (const line of csvData) {
          if (line.trim() !== '') { // Non empty input
            csvLines.push(line);
          }
        }

        const headerRow = csvLines[0];
        const headerNames = headerRow.split(',');
        const headers = [];

        for (const header of headerNames) {
          headers.push(header.trim());
        }
        const data = [];

        for (let i = 1; i < csvLines.length; i++) {
          const values = csvLines[i].split(',').map(v => v.trim());
          data.push({
            owner: values[headers.indexOf('owner')],
            name: values[headers.indexOf('name')]
          });
        }

        const parentChild = new Map();
        data.forEach(({ owner, name }) => {
          parentChild.set(name, owner);
        });

        console.log('Owners:', [...new Set(data.map(d => d.owner))].length);
        console.log('Names:', [...new Set(data.map(d => d.name))].length);

        try {
          const tree = buildTree(data);
          setTreeData(tree);
          console.log('Tree built:', tree);
        } catch (err) {
          setError(err.message);
        }
      };

      fileReader.readAsText(file);
    }
  };
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <button
        style={{
          position: 'fixed',
          left: sidebarOpen ? '320px' : '0',
          top: '20px',
          backgroundColor: '#34495e',
          color: 'white',
          fontWeight: 'bold',
          padding: '10px 15px',
          transition: 'left 0.3s ease',
          zIndex: 1000,
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '\u2716':'\u2261'}
      </button>
      <div style={{
        width: sidebarOpen ? '320px' : '0',
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: sidebarOpen ? '20px' : '0',
        transition: '0.3s ease',
      }}>
        <div style={{
          opacity: sidebarOpen ? 1 : 0,
          transition: '0.3s ease'
        }}>
          <h1>Sidebar</h1>
          <p>test</p>
        </div>
      </div>
      {/* Form for csv upload */}
      <div style={{
        flex: 1,
        backgroundColor: '#ecf0f1',
        overflow: 'auto',
        padding: '20px'
      }}>
        <div style={{ textAlign: "center" }}>
          <h1>Upload CSV</h1>
          <form>
            <input type={"file"} id={"csvFileInput"} accept={'.csv'} onChange={handleOnChange} />
            <button onClick={(e) => { handleOnSubmit(e) }}>Upload</button>
          </form>

          {error && (
            <div style={{ color: 'red', margin: '10px' }}>
              {error}
            </div>
          )}
          {treeData && <TreeVisualization treeData={treeData} />}
        </div>
      </div>
    </div>
  );
}

export default App;
