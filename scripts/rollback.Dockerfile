# Explicit manual rollback fixture: always returns HTTP 503, no external calls.
FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d
USER 1000:1000
EXPOSE 3000
CMD ["node", "-e", "require('http').createServer((req,res)=>{res.writeHead(503);res.end('rollback fixture')}).listen(3000,'0.0.0.0')"]
