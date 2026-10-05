import { supabase } from '../lib/supabase';
import { Recipe } from '../types/recipe';
import { decode } from 'base64-arraybuffer';

export type Category = { id: number; name: string };

type Row = {
  id: string; title: string; description: string | null; ingredients: string[]; steps: string[];
  image_url: string | null; category_id: number | null; author_id: string | null;
  is_curated: boolean; created_at: string; category_name: string | null;
  author_username: string | null; score: number;
};

function toRecipe(r: Row): Recipe {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category_name ?? 'Other',
    categoryId: r.category_id,
    score: r.score,
    author: r.author_username,
    authorId: r.author_id,
    isCurated: r.is_curated,
    imageUrl: r.image_url,
    tone: parseInt(r.id.slice(0, 2), 16) % 5,
    createdAt: Date.parse(r.created_at),
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? [],
  };
}

const view = () => supabase.from('recipe_scores').select('*');

async function list(query: PromiseLike<{ data: any; error: { message: string } | null }>) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(toRecipe);
}

// ---------- reading ----------
export const fetchTop = (from: number, to: number) =>
  list(view().order('score', { ascending: false }).order('id').range(from, to));

export const fetchPicks = (from: number, to: number) =>
  list(view().eq('is_curated', true).order('score', { ascending: false }).order('id').range(from, to));

export function fetchByCategory(name: string, sort: 'top' | 'new', from: number, to: number) {
  const q = view().eq('category_name', name);
  const sorted = sort === 'top'
    ? q.order('score', { ascending: false })
    : q.order('created_at', { ascending: false });
  return list(sorted.order('id').range(from, to));
}

export function searchRecipes(text: string) {
  const t = text.replace(/[%,()]/g, ' ').trim();
  return list(
    view()
      .or(`title.ilike.%${t}%,category_name.ilike.%${t}%`)
      .order('score', { ascending: false })
      .limit(20)
  );
}

export const fetchMine = (userId: string) =>
  list(view().eq('author_id', userId).order('created_at', { ascending: false }));

export async function fetchRecipe(id: string): Promise<Recipe | null> {
  const { data, error } = await view().eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecipe(data as Row) : null;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('id, name').order('id');
  if (error) throw new Error(error.message);
  return data as Category[];
}

// ---------- voting ----------
export async function getMyVote(recipeId: string, userId: string): Promise<0 | 1 | -1> {
  const { data } = await supabase
    .from('votes')
    .select('value')
    .eq('recipe_id', recipeId)
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.value ?? 0) as 0 | 1 | -1;
}

// value 0 removes the vote
export async function saveVote(recipeId: string, userId: string, value: 0 | 1 | -1) {
  const { error } =
    value === 0
      ? await supabase.from('votes').delete().eq('recipe_id', recipeId).eq('user_id', userId)
      : await supabase
          .from('votes')
          .upsert({ recipe_id: recipeId, user_id: userId, value }, { onConflict: 'recipe_id,user_id' });
  if (error) throw new Error(error.message);
}

// ---------- writing ----------
async function uploadImage(base64: string, userId: string): Promise<string> {
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('recipe-images')
    .upload(path, decode(base64), { contentType: 'image/jpeg' });
  if (error) throw new Error(error.message);
  return supabase.storage.from('recipe-images').getPublicUrl(path).data.publicUrl;
}

export async function updateRecipe(
  id: string,
  input: {
    title: string;
    description: string;
    categoryId: number;
    ingredients: string[];
    steps: string[];
    imageBase64: string | null; // a newly picked photo
    removeImage: boolean;       // the user removed the old photo
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please log in again.');

  const patch: Record<string, unknown> = {
    title: input.title,
    description: input.description || null,
    category_id: input.categoryId,
    ingredients: input.ingredients,
    steps: input.steps,
  };
  if (input.imageBase64) patch.image_url = await uploadImage(input.imageBase64, user.id);
  else if (input.removeImage) patch.image_url = null;

  const { data, error } = await supabase.from('recipes').update(patch).eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('You can only edit your own recipes.');
}

export async function createRecipe(input: {
  title: string;
  description: string;
  categoryId: number;
  ingredients: string[];
  steps: string[];
  imageBase64: string | null
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please log in again.');

  const image_url = input.imageBase64 ? await uploadImage(input.imageBase64, user.id) : null;
  
  const { error } = await supabase.from('recipes').insert({
    title: input.title,
    description: input.description || null,
    category_id: input.categoryId,
    ingredients: input.ingredients,
    steps: input.steps,
    image_url,
    author_id: user.id,
    is_curated: false,
  });
  if (error) throw new Error(error.message);
}

export async function deleteRecipe(id: string) {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}