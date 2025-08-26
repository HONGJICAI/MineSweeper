const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// 配置
const config = {
  targetDir: path.join('src-tauri', 'target', 'release'),
  outputZip: path.join('src-tauri', 'target', 'release','steam.zip'),
  filesToInclude: [
    'MineSweeper.exe',
    'steam_api64.dll',
  ],
};

async function createZip() {
  try {
    // 确保输出目录存在
    const outputDir = path.dirname(config.outputZip);
    await fs.ensureDir(outputDir);

    // 创建 zip 文件
    const output = fs.createWriteStream(config.outputZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // 处理完成和错误
    output.on('close', () => {
      console.log(`Zip file created: ${config.outputZip} (${archive.pointer()} bytes)`);
    });
    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    // 添加文件到 zip（保持根目录结构）
    for (const file of config.filesToInclude) {
      const filePath = path.join(config.targetDir, file);
      if (await fs.pathExists(filePath)) {
        archive.file(filePath, { name: path.basename(file) });
        console.log(`Added: ${file}`);
      } else {
        console.warn(`Warning: File not found: ${filePath}`);
      }
    }

    // 如果需要添加目录
    // archive.directory(path.join(config.targetDir, 'resources'), 'resources');

    await archive.finalize();
  } catch (err) {
    console.error('Error creating zip:', err);
    process.exit(1);
  }
}

// 运行
createZip();