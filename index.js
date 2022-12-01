const express = require('express')
var cors = require('cors')
const crypto = require("crypto")
const app = express()
app.use(express.json())
app.use(cors())
const port = 8080

var chain = []
var last_hash = ''
var last_proof = 0
var index = 0

const proof_of_work = async (data) => {
  var hash = ""
  var proof = 1
  while (!is_hash_valid(hash)){
    var block = `${JSON.stringify(data)}:${last_hash}:${proof}`;
    var hash = await digestMessage(block)
    proof += 1
  }
  last_proof = proof
  last_hash = hash
  index++
  return hash
}

const is_hash_valid = (hash) => {
  return hash.startsWith("0000");
}

async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}


async function add_block(cpf, valor, funcao){
  var timestamp = new Date().toISOString(); 
  var data = {
    "cpf": cpf, 
    "blocks": [
      {
        "index": index,
        "valor": valor, 
        "funcao": funcao,
        "timestamp": timestamp,
        "previous_hash": last_hash,
        "proof": last_proof,
      }
    ]
  };
  var cpfIndex = chain.map((chain) => chain.cpf).indexOf(cpf);
  if(cpfIndex == -1){
    chain.push(data);
  } else {
    chain[cpfIndex].blocks.push({
      "index": index,
      "valor": valor, 
      "funcao": funcao,
      "timestamp": timestamp,
      "previous_hash": last_hash,
      "proof": last_proof
    });
  }
  await proof_of_work(data);
  return true
}

app.post('/add_block', function(req, res) {
    var cpf = req.body.cpf
    var valor = req.body.valor
    var funcao = req.body.funcao
    if(add_block(cpf, valor, funcao)){
      res.sendStatus(200)
    } else {
      res.sendStatus(500)
    }    
});

app.get('/get_chain', function (req, res) {
  chain.map((chain) => {
    var soma = 0;
    chain.blocks.forEach((block) => {
      if(block.funcao == 'deposito')
        soma += parseInt(block.valor)
      if(block.funcao == 'saque')
        soma -= parseInt(block.valor)
    })
    chain.saldo = soma
    console.log(chain);
    return chain;
  })
  res.send(chain)
});

app.post('/clean_chain', function (req, res) {
  chain = []
  res.sendStatus(200);
})
  
app.listen(port, () => {
  console.log(`Exemplo app node rodando no endereço http://localhost:${port}`)
});