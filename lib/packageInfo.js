import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default JSON.parse(
  await fs.readFile(
    path.join(__dirname, '../package.json')
  )
);