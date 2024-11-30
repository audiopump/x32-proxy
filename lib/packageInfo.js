import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default JSON.parse(
  await fs.readFile(
    path.join(__dirname, '../package.json')
  )
);