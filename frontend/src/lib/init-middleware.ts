// lib/init-middleware.js
export default function initMiddleware(middleware:any) {
    return (req:any, res:any) =>
      new Promise((resolve, reject) => {
        middleware(req, res, (result:any) =>
          result instanceof Error ? reject(result) : resolve(result)
        );
      });
  }
  