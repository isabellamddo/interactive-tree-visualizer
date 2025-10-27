import logo from './logo.svg';
import TreeVisualization from './TreeVisualization';
import './App.css';
import * as d3 from 'd3';
import React, { useState, useEffect } from 'react';
import { buildTree } from './tree.js';
const exampleCSVs = {
  "US Counties": "/uscounties_clean_small.csv"
}

function App() {
  console.log('D3 imported', typeof d3.select);

  const [file, setFile] = useState();
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default sidebar is open 
  const [uploadAttempted, setUploadAttempted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [isFileHovered, setIsFileHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [selectedExample, setSelectedExample] = useState("");
  const [successFade, setSuccessFade] = useState(false);

  useEffect(() => {
    if (uploadAttempted && !file) {
      // Start fade out after 2 seconds
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 2000);

      // Remove completely after 4 seconds
      const removeTimer = setTimeout(() => {
        setUploadAttempted(false);
        setFadeOut(false);
      }, 4000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }

    if (treeData && !error) {
      setSuccessFade(false); // Reset fade

      const fadeTimer = setTimeout(() => {
        setSuccessFade(true);
      }, 2000);

      return () => {
        clearTimeout(fadeTimer);
      };
    }
  }, [uploadAttempted, file, treeData, error]);

  // For example datasets
  useEffect(() => {
    if (selectedExample) {
      fetch(exampleCSVs[selectedExample])
        .then(response => response.text())
        .then(csvOutput => {
          // Same code from handleOnSubmit
          const validation = validateHeaders(csvOutput);

          if (!validation.valid) {
            setError(validation.error);
            return;
          }

          setError('');

          const csvData = csvOutput.split('\n');
          const csvLines = [];
          for (const line of csvData) {
            if (line.trim() !== '') {
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

          console.log('Owners:', [...new Set(data.map(d => d.owner))].length);
          console.log('Names:', [...new Set(data.map(d => d.name))].length);

          try {
            const tree = buildTree(data);
            setTreeData(tree);
            console.log('Tree built:', tree);
          } catch (err) {
            setError(err.message);
          }
        })
        .catch(err => {
          setError('Could not load example');
        });
    }
  }, [selectedExample]);

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
    setUploadAttempted(true);

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
          left: sidebarOpen ? '295px' : '0',
          top: '20px',
          backgroundColor: '#3498db',
          border: '2px solid #ffffffff',
          borderRadius: '2px',
          color: 'white',
          fontWeight: 'bold',
          padding: '10px 15px',
          transition: 'left 0.3s ease',
          zIndex: 1000,
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '\u2716' : '\u2261'}
      </button>
      <div style={{
        width: sidebarOpen ? '320px' : '0',
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: sidebarOpen ? '20px' : '0',
        transition: '0.3s ease',
        overflowY: 'auto',
        height: '100%'
      }}>
        <div style={{
          opacity: sidebarOpen ? 1 : 0,
          transition: '0.3s ease',
        }}>
          <h1>Upload CSV</h1>
          <form>
            <label
              htmlFor="csvFileInput"
              style={{
                padding: '15px',
                borderRadius: '5px',
                cursor: 'pointer',
                border: '2px solid #3498db',
                textAlign: 'center',
                display: 'block',
                marginBottom: '15px',
                backgroundColor: isFileHovered ? '#34495e' : 'transparent'
              }}
              onMouseEnter={() => setIsFileHovered(true)}
              onMouseLeave={() => setIsFileHovered(false)}
            >
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{`\u{1F4C1}`}</div>
              <div style={{}}>
                {file ? file.name : 'Click to select CSV file'}
              </div>
            </label>
            <input
              type="file"
              id="csvFileInput"
              accept=".csv"
              onChange={handleOnChange}
              style={{ display: 'none' }}
            />
            <button
              onClick={(e) => { handleOnSubmit(e) }}
              style={{
                color: 'white',
                border: '2px solid #3498db',
                padding: '12px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                width: '100%',
                backgroundColor: isButtonHovered ? '#3498db87' : '#3498db'
              }}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
            >
              Upload & Visualize
            </button>
          </form>

          {error && (
            <div style={{ color: 'red', margin: '10px' }}>
              {error}
            </div>
          )}

          {!file && uploadAttempted && (
            <div style={{
              backgroundColor: '#eb4f3e95',
              color: 'white',
              padding: '8px',
              borderRadius: '5px',
              marginTop: '10px',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid #eb4f3eff',
              opacity: fadeOut ? 0 : 1,
              transition: 'opacity 1s ease'
            }}>
              Must select a CSV file to upload!
            </div>
          )}

          {treeData && !error && (
            <div style={{
              backgroundColor: '#27ae5f9f',
              color: 'white',
              padding: '8px',
              borderRadius: '5px',
              marginTop: successFade ? 0 : '10px',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid #27ae5eff',
              opacity: successFade ? 0 : 1,
              transition: 'opacity 2s ease',
              position: successFade ? 'absolute' : 'static',
              visibility: successFade ? 'hidden' : 'visible',
              pointerEvents: 'none'
            }}>
              Tree successfully generated!
            </div>
          )}

          {treeData && successFade && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setTreeData(null);
                setFile(null);
                setSelectedExample("");
                setError('');
                setSuccessFade(false);
              }}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                padding: '8px',
                borderRadius: '5px',
                marginTop: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                textAlign: 'center',
                border: '1px solid #c0392b',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Clear Tree
            </button>
          )}

          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#34495e',
            borderRadius: '5px',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            <strong>CSV Format:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px', fontSize: '14px' }}>
              <li>Must have 2 columns</li>
              <li>First row should be headers: owner, name</li>
              <li>Each row represents a parent-child relationship</li>
              <li>The visualizer can only plot up to 60 nodes without overlap</li>
            </ul>
            <div style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
              Example:<br />
              owner,name<br />
              root,child1<br />
              root,child2
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', display: 'block', marginTop: '10px', marginBottom: '8px' }}>
              <strong>Try an example:</strong>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.keys(exampleCSVs).map(name => (
                <button
                  key={name}
                  onClick={() => setSelectedExample(name)}
                  style={{
                    backgroundColor: '#34495e',
                    color: 'white',
                    border: '2px solid #3498db',
                    padding: '10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
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

          {treeData ? (
            <TreeVisualization treeData={treeData} />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#7f8c8d',
              textAlign: 'center',
              gap: '20px'
            }}>
              <div style={{ fontSize: '80px' }}>{`\u{1F332}`}</div>
              <h2 style={{ fontSize: '48px', margin: '0' }}>Interactive Tree Visualizer</h2>
              <p style={{ fontSize: '18px', margin: '0' }}>
                Upload a CSV file and click "Upload & Visualize" to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
