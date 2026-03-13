export interface ProjectChange {
  projectName: string;
  path: string;
  impacted: boolean;
  changedFolders: string[];
  tagPrefix: string;
}
  