const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'bin', 'native');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targetExe = path.join(outDir, 'WallyAttacher.exe');
const sourceCs = path.join(__dirname, '..', 'electron', 'wallpaper', 'native', 'Program.cs');

console.log('Building WallyAttacher.exe native helper...');

const cscPaths = [
  'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
  'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe'
];

let built = false;

for (const csc of cscPaths) {
  if (fs.existsSync(csc)) {
    try {
      console.log(`Using C# compiler at ${csc}...`);
      const cmd = `"${csc}" /nologo /target:exe /platform:x64 /out:"${targetExe}" "${sourceCs}"`;
      execSync(cmd, { stdio: 'inherit' });
      built = true;
      console.log('Successfully built WallyAttacher.exe using csc!');
      break;
    } catch (err) {
      console.warn('csc compilation attempt failed:', err.message);
    }
  }
}

if (!built) {
  try {
    console.log('Attempting dotnet build...');
    const projPath = path.join(__dirname, '..', 'electron', 'wallpaper', 'native', 'WallyAttacher.csproj');
    execSync(`dotnet build "${projPath}" -c Release -o "${outDir}"`, { stdio: 'inherit' });
    built = true;
    console.log('Successfully built WallyAttacher.exe using dotnet!');
  } catch (err) {
    console.error('All compilation methods failed.');
    process.exit(1);
  }
}
