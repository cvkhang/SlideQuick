export interface Template {
  id: string;
  name: string;
  thumbnailUrl?: string;
  colors: string[];
  fontFamily: string;
  tags: string;
  isStandard: boolean;
  style: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
  };
  createdAt: string;
}

// Re-exporting these if they were supposed to be here,
// allows AppContext to import from here without breaking if I overwrite/create index.ts
// But since I don't know the exact shape, I might cause issues if I redefine them poorly.
// I will just append or create new file.
// Since existing file was NOT found, I am creating it.
// I should probably also define Project/Slide/User if they are missing to prevent errors,
// but I don't want to shadow real definitions if they exist elsewhere (e.g. implicitly).
// I will assume for now I am just adding Template.
// If the app breaks because I created index.ts which shadows something else, I'll revert.
