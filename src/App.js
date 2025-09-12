import logo from './logo.svg';
import './App.css';
import * as d3 from 'd3';
import React, { useState } from 'react';

function App() {
  console.log('D3 imported successfully:', typeof d3.select);

  const [file, setFile] = useState();
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState('');

  const fileReader = new FileReader();

  const validateHeaders = (csvText) => {
    const lines = csvText.split('\n');
    if (lines.length == 0) {
      return { valid: false, error: 'No owner, name column headers found.' }
    }

    const headers = lines[0].split(',').map(h => h.trim());

    if (headers.length !== 2) {
      return { valid: false, error: 'Data does not have exactly 2 columns. Should have "owner,header".' }
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
  const handoleOnSubmit = (e) => {
    e.preventDefault();

    if (file) {
      fileReader.onload = function (event) {
        const csvOutput = event.target.result;

        const validation = validateHeaders(csvOutput);

        // Shows user error message if data doesn't pass validation
        if (!validation.valid) {
          setError(validation.error);
          return;
        }

        // Clear errors if valid data
        setError('');

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
        <button onClick={(e) => { handoleOnSubmit(e) }}>Upload</button>
      </form>

      {error && (
        <div style={{ color: 'red', margin: '10px' }}>
          {error}
          </div>
      )}
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
