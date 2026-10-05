export type Recipe = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  categoryId: number | null;
  score: number;
  author: string | null; // username, null = curated
  authorId: string | null;
  isCurated: boolean;
  imageUrl: string | null;
  tone: number; // only picks the placeholder plate colors
  createdAt: number;
  ingredients: string[];
  steps: string[];
};