import z from "zod";


export const GithubRepo = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.string(),
  topics: z.array(z.string()),
  private: z.boolean(),
  stargazers_count: z.number(),
  open_issues_count: z.number(),
  updated_at: z.string(),
  languages: z.array(z.string()),
});