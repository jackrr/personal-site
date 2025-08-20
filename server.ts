#!/usr/bin/env bun

const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    let filePath = url.pathname;
    
    // Default to index.html for directory requests
    if (filePath === '/' || filePath.endsWith('/')) {
      filePath += 'index.html';
    }
    
    // Add .html extension if no extension provided
    if (!filePath.includes('.')) {
      filePath += '.html';
    }
    
    const file = Bun.file(`./dist${filePath}`);
    
    return file.exists().then(exists => {
      if (exists) {
        return new Response(file);
      } else {
        // Try without .html extension
        const fileWithoutExt = Bun.file(`./dist${url.pathname}`);
        return fileWithoutExt.exists().then(existsWithoutExt => {
          if (existsWithoutExt) {
            return new Response(fileWithoutExt);
          } else {
            return new Response("Not Found", { status: 404 });
          }
        });
      }
    });
  },
});

console.log(`Server running at http://localhost:${server.port}/`);