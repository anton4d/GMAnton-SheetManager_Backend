import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, GithubRepo } from "@Types";



export class GithubTaggedRepos extends OpenAPIRoute {
  schema = {
    tags: ["V1/Github", "get"],
    summary: "Get repos from your GitHub user filtered by a specific topic/tag",
    request: {
      query: z.object({
        page: z.coerce.number().min(1).default(1).optional(),
      }),
    },
    responses: {
      "200": {
        description: "Returns 6 repos matching the configured tag",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              result: GithubRepo.array(),
              meta: z.object({
                page: z.number(),
                per_page: z.number(),
                total: z.number(),
                has_more: z.boolean(),
              }),
            }),
          },
        },
      },
      "500": {
        description: "Missing environment secrets or GitHub API error",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
  const username = c.env.GITHUB_USERNAME;
  const tag = c.env.GITHUB_TAG;

  if (!username || !tag) {
    return c.json(
      { success: false, error: "Missing required secrets: GITHUB_USERNAME or GITHUB_TAG" },
      500
    );
  }

  const data = await this.getValidatedData<typeof this.schema>();
  const page = data.query.page ?? 1;
  const PER_PAGE = 6;

  
  const searchRes = await fetch(
    `https://api.github.com/search/repositories?q=user:${username}+topic:${tag}&sort=updated&order=desc&per_page=${PER_PAGE}&page=${page}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "cloudflare-worker",
        Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
      },
    }
  );

  if (!searchRes.ok) {
    return c.json(
      { success: false, error: `GitHub API error: ${searchRes.statusText}` },
      500
    );
  }

  const searchData: any = await searchRes.json();
  const repos = searchData.items ?? [];
  const total = searchData.total_count ?? 0;

  
  const enriched = await Promise.all(
    repos.map(async (repo: any) => {
      const langRes = await fetch(
        `https://api.github.com/repos/${username}/${repo.name}/languages`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "cloudflare-worker",
            Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
          },
        }
      );
      const langData = langRes.ok ? await langRes.json() : {};
      return {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        topics: repo.topics ?? [],
        private: repo.private,
        open_issues_count: repo.open_issues_count,
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at,
        languages: Object.keys(langData),
      };
    })
  );

  return c.json({
    success: true,
    result: enriched,
    meta: {
      page,
      per_page: PER_PAGE,
      total,
      has_more: page * PER_PAGE < total,
    },
  });
}
}