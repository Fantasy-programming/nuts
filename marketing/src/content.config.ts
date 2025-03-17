import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/data/blog" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string(),
    image: image(),
    tags: z.array(z.string()).default([]),
  }),
});

const page = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/data/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lastUpdate: z.date().optional(),
  })
})

export const collections = {
  'blog': blog,
  'page': page,
};
