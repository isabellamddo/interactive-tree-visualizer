import logo from './logo.svg';
import './App.css';
import * as d3 from 'd3';
import React, { useState } from 'react';

function App() {
  console.log('D3 imported successfully:', typeof d3.select);

  const [file, setFile] = useState();

  const fileReader = new FileReader();

  const handleOnChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handoleOnSubmit = (e) => {
    e.preventDefault();

    if (file) {
      fileReader.onload = function (event) {
        const csvOutput = event.target.result;
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
