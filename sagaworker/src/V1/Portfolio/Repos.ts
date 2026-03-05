import { Bool, OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../../types/";

const GithubRepo = z.object({
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
              success: Bool(),
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
              success: Bool(),
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

    
    const allMatchingRepos: z.infer<typeof GithubRepo>[] = [];
    let githubPage = 1;

    while (true) {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&page=${githubPage}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "cloudflare-worker",
            Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        return c.json(
          { success: false, error: `GitHub API error: ${response.statusText}` },
          500
        );
      }

      const repos: any[] = await response.json();
      if (repos.length === 0) break;

      const matched = repos.filter((repo) =>
        repo.topics?.includes(tag.toLowerCase())
      );

      allMatchingRepos.push(...matched.map((repo) => ({
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
      })));

      if (repos.length < 100) break;
      githubPage++;
    }

    const enriched = await Promise.all(
        allMatchingRepos.map(async (repo) => {
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
            ...repo,
            languages: Object.keys(langData),
            };
        })
    );


    
    const total = enriched.length;
    const start = (page - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    const paginatedRepos = enriched.slice(start, end);

    return c.json({
      success: true,
      result: paginatedRepos,
      meta: {
        page,
        per_page: PER_PAGE,
        total,
        has_more: end < total,
      },
    });
  }
}