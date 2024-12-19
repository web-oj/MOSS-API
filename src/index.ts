import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3000;

export type Submission = {
  handle: string;
  code: string;
}

async function main() {
  app.use(bodyParser.json());
  app.use(cors());

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.post('/moss', (req, res) => {
    // get array of code
    const submissions = req.body.submissions as Submission[];
    console.log(submissions);
    const currentDir = __dirname;
    const time = new Date().getTime();
    const dir = path.join(currentDir, time.toString());
    for (const submission of submissions) {
      const code = Buffer.from(submission.code, 'base64').toString();
      const filePath = path.join(dir, `${submission.handle}.cpp`);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }  
      try {
        fs.writeFileSync(filePath, code);
      } catch (error) {
        console.error(`Error writing file: ${error}`);
      }
    }
    const mossScriptPath = path.join(currentDir, 'moss');
    exec(`chmod ug+x ${mossScriptPath}`, (chmodError) => {
      if (chmodError) {
        console.error(`Error setting execution permissions for moss script: ${chmodError.message}`);
        return;
      }

      // Run MOSS
      const command = `perl ${mossScriptPath} -l cc ${dir}/*.cpp`;
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running MOSS: ${error.message}`);
          return;
        }
        console.log(`MOSS output: ${stdout}`);
        if (stderr) {
          console.error(`MOSS stderr: ${stderr}`);
        }

        const output = stdout.toString();
        console.log(`MOSS output: ${output}`);
        if (stderr) {
          console.error(`MOSS stderr: ${stderr}`);
        }
    
        // Extract the result link
        const resultLinkMatch = output.match(/http:\/\/moss\.stanford\.edu\/results\/\d+\/\d+/);
        if (resultLinkMatch) {
          const resultLink = resultLinkMatch[0];
          console.log(`MOSS result link: ${resultLink}`);
          return res.send(resultLink);
        } else {
          console.error('MOSS result link not found in the output.');
        }    
      });
    });
  });

  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}

main();