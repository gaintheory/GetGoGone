import { createWorker } from 'tesseract.js';
import path from 'path';

async function testOCR() {
  console.log("Initializing Tesseract worker with explicit paths...");
  
  const workerPath = path.resolve(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js");
  const langPath = path.resolve(process.cwd());
  const cachePath = path.resolve(process.cwd());

  console.log("workerPath:", workerPath);
  console.log("langPath:", langPath);

  const worker = await createWorker('eng', 1, {
    workerPath,
    langPath,
    cachePath
  });
  
  console.log("Worker created successfully!");
  await worker.terminate();
}

testOCR().catch(err => {
  console.error("Worker creation failed:", err);
  process.exit(1);
});
