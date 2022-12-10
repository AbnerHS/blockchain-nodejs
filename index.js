const express = require('express')
var cors = require('cors')
const crypto = require("crypto")
const { response } = require('express')
const app = express()
app.use(express.json())
app.use(cors())
const port = 8080

var chain = []
var index = 0

const proof_of_work = async (data) => {
  var hash = ""
  var proof = 1
  while (!is_hash_valid(hash)){
    var block = `${JSON.stringify(data)}:${hash}:${proof}`;
    var hash = await digestMessage(block)
    proof += 1
  }
  console.log(`hash ${index} ready`)
  index++
  return {proof, hash}
}

const is_hash_valid = (hash) => {
  return hash.startsWith("0000");
}


const get_index = () => {
  let index = 0;
  chain.forEach(block => {
    block.blocks.forEach(() => {
      index++
    })
  })
  return index;
}

const get_last_hash = () => {
  let last_hash = ''
  chain.forEach(block => {
    block.blocks.forEach(item => {
      if(index - 1 == item.index){
        last_hash = item.hash
      }
    })
  })
  return last_hash
}

async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}


async function add_block(cpf, valor, funcao){
  let last_hash = get_last_hash();
  var timestamp = new Date().toISOString(); 
  var data = {
    "cpf": cpf, 
    "blocks": [
      {
        "index": get_index(),
        "valor": valor, 
        "funcao": funcao,
        "timestamp": timestamp,
        "previous_hash": '',
        "proof": 0,
      }
    ]
  };
  const response = await proof_of_work(data);
  var cpfIndex = chain.map((chain) => chain.cpf).indexOf(cpf);
  if(cpfIndex == -1){
    data['blocks'][0]['hash'] = response.hash;
    data['blocks'][0]['proof'] = response.proof;
    data['blocks'][0]['previous_hash'] = last_hash
    chain.push(data);
  } else {
    chain[cpfIndex].blocks.push({
      "index": get_index(),
      "valor": valor, 
      "funcao": funcao,
      "timestamp": timestamp,
      "previous_hash": last_hash,
      "proof": response.proof,
      "hash": response.hash
    });
  }
  
  return true
}

app.post('/add_block', async function(req, res) {
    var cpf = req.body.cpf
    var valor = req.body.valor
    var funcao = req.body.funcao
    if(await add_block(cpf, valor, funcao)){
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
        soma += parseFloat(block.valor.replace(",","."))
      if(block.funcao == 'saque')
        soma -= parseFloat(block.valor.replace(",","."))
    })
    chain.saldo = soma
    return chain;
  })
  res.send(chain)
});

app.post('/clean_chain', function (req, res) {
  chain = []
  last_hash = ''
  last_proof = 0
  index = 0
  res.sendStatus(200);
})
  
app.listen(port, () => {
  console.log(`Exemplo app node rodando no endereço http://localhost:${port}`)
});