#!/usr/bin/env bun

const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    let filePath = url.pathname;
    
    // Default to index.html for directory requests
    if (filePath === '/' || filePath.endsWith('/')) {
      filePath += 'index.html';
    } else if (!filePath.includes('.')) {
      // For paths like /updates or /photos, try the directory first
      const dirIndexPath = `${filePath}/index.html`;
      const dirIndexFile = Bun.file(`./dist${dirIndexPath}`);
      
      return dirIndexFile.exists().then(dirExists => {
        if (dirExists) {
          return new Response(dirIndexFile);
        } else {
          // Try adding .html extension
          const htmlPath = `${filePath}.html`;
          const htmlFile = Bun.file(`./dist${htmlPath}`);
          
          return htmlFile.exists().then(htmlExists => {
            if (htmlExists) {
              return new Response(htmlFile);
            } else {
              return new Response("Not Found", { status: 404 });
            }
          });
        }
      });
    }
    
    const file = Bun.file(`./dist${filePath}`);
    
    return file.exists().then(exists => {
      if (exists) {
        return new Response(file);
      } else {
        return new Response("Not Found", { status: 404 });
      }
    });
  },
});

console.log(`Server running at http://localhost:${server.port}/`);