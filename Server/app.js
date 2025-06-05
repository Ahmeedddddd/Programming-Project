const express = require('express')
const app = express()
const port = 8383
const path = require('path');

app.use(express.static(path.join(__dirname, '../../public')));

app.get('/', (req, res) =>{
  res.status(200).send('<h1>hi</h1>')
})

app.listen(port, () => console.log(`Server has started on port: ${port}`))