# Explicit manual rollback fixture: always returns HTTP 503, no external calls.
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd
USER 1000:1000
EXPOSE 3000
CMD ["node", "-e", "require('http').createServer((req,res)=>{res.writeHead(503);res.end('rollback fixture')}).listen(3000,'0.0.0.0')"]
