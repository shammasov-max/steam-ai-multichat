import fs from 'fs';
import fastq from 'fastq';

// Type definitions
export type MaFileData = {
  readonly account_name: string;
  readonly [key: string]: unknown;
};

export type MaFileMap = {
  readonly [accountName: string]: MaFileData;
};

export type DirectoryPath = string;

// Get maFile files from directory
export const getMaFiles = (directoryPath: DirectoryPath): Promise<readonly string[]> => {
  return new Promise((resolve) => {
    fs.readdir(directoryPath, (error, files) => {
      if (error) {
        resolve([]);
      } else {
        const maFileList = files.filter(file => 
          file.search(/\.maFile/i) !== -1
        );
        resolve(maFileList);
      }
    });
  });
};

// Read and parse maFile data
export const readMaFiles = async (directoryPath: DirectoryPath): Promise<MaFileMap> => {
  const maFileMap: MaFileMap = {};
  
  if (typeof directoryPath !== "string") {
    return {};
  }

  const maFileList = await getMaFiles(directoryPath);
  
  const processMaFile = async (filename: string): Promise<void> => {
    const filePath = `${directoryPath}/${filename}`;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const maFileData: MaFileData = JSON.parse(fileContent);
    const accountName = maFileData.account_name.toLowerCase();
    maFileMap[accountName] = maFileData;
  };

  const queue = fastq.promise(processMaFile, 300);
  
  maFileList.forEach(filename => queue.push(filename));
  await queue.drained();
  
  return maFileMap;
};

