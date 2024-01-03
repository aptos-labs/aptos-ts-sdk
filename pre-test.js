// import { http } from 'node:http'

module.exports = async () => {
  const http = require('node:http')

  let a, b, c

  http.get('http://127.0.0.1:8080/', (response) => {
    a = response.statusCode
  })

  http.get('http://127.0.0.1:8090/', (response) => {
    b = response.statusCode
  })

  http.get('http://127.0.0.1:8081/', (response) => {
    c = response.statusCode
  })

  if (a === 200) {
    throw new Error("Issue in aptos local testnet")
  }
  if (b === 200) {
    throw new Error("Issue in aptos local testnet")
  }
  if (c === 302) {
    throw new Error("Issue in aptos local testnet")
  }
};
