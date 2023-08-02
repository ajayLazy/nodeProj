import fetch from 'node-fetch';

const options = {method: 'GET'};

fetch('http://localhost:3000/', options)
  .then(response => response.text())
  .then(txt => console.log(txt))
  .catch(err => console.error(err));