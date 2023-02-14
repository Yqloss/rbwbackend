const http = require('http');
const url = require('url');

const port=8888;

http.createServer((request,response)=>{
    let reqUrl=url.parse(request.url,true).pathname;
    console.log(reqUrl);
    let params = url.parse(request.url, true).query;
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(`Data is ${params.data}`);
}).listen(port);

console.log(`Server running on 127.0.0.1:${port}`);