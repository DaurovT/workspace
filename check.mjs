import { Project } from 'ts-morph';
const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/**/*.tsx");
console.log(project.getSourceFiles().length);
