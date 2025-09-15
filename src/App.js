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
    // Form for csv upload
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




    // <div className="App">
    //   <header className="App-header">
    //     <img src={logo} className="App-logo" alt="logo" />
    //     <p>
    //       Edit <code>src/App.js</code> and save to reload.
    //     </p>
    //     <a
    //       className="App-link"
    //       href="https://reactjs.org"
    //       target="_blank"
    //       rel="noopener noreferrer"
    //     >
    //       Learn React
    //     </a>
    //   </header>
    // </div>
  );
}

export default App;
