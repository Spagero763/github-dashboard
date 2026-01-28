"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const BarChartComponent = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } = mod;
      return function WrappedBarChart({ data }: any) {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stars" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        );
      };
    }),
  { ssr: false }
);

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [sortBy, setSortBy] = useState<"stars" | "forks" | "name">("stars");
  const [repoFilter, setRepoFilter] = useState("");

  const sortedRepos = data?.repos
    ? [...data.repos]
        .filter((r: any) => r.name.toLowerCase().includes(repoFilter.toLowerCase()))
        .sort((a: any, b: any) => {
          if (sortBy === "name") return a.name.localeCompare(b.name);
          return b[sortBy] - a[sortBy];
        })
    : [];

  const fetchData = async () => {
    if (!username.trim()) {
      setError("Please enter a GitHub username");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const userRes = await fetch(`https://api.github.com/users/${username}`);
      
      if (!userRes.ok) {
        if (userRes.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to fetch user data");
      }
      
      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
      const userData = await userRes.json();
      const reposData = await reposRes.json();

      setData({
        username: userData.login,
        avatar: userData.avatar_url,
        bio: userData.bio,
        location: userData.location,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        repos: reposData.map((repo: any) => ({
          name: repo.name,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          url: repo.html_url,
        })),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setData(null);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-center">GitHub Activity Dashboard</h1>
      <p className="text-center text-gray-600 mb-6">
        Enter a GitHub username to see their profile and top repos.
      </p>

      <div className="flex justify-center gap-3 mb-6">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
          placeholder="GitHub username"
          className="border rounded-md p-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch Data"}
        </button>
      </div>

      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      {loading && <p className="text-center text-gray-500">Loading...</p>}

      {data && (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <img src={data.avatar} alt={data.username} className="w-20 h-20 rounded-full" />
            <div>
              <h2 className="text-2xl font-semibold">{data.username}</h2>
              {data.bio && <p className="text-gray-500 text-sm">{data.bio}</p>}
              {data.location && <p className="text-gray-500 text-sm">📍 {data.location}</p>}
              <div className="flex gap-4 mt-2">
                <span className="text-gray-600">Repos: {data.publicRepos}</span>
                <span className="text-gray-600">Followers: {data.followers}</span>
                <span className="text-gray-600">Following: {data.following}</span>
              </div>
            </div>
          </div>

          {/* Repo List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-semibold">Repositories ({data.repos.length})</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="stars">Sort by Stars</option>
                <option value="forks">Sort by Forks</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedRepos.map((repo: any) => (
                <li
                  key={repo.name}
                  className="border p-3 rounded-md hover:shadow-lg transition"
                >
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    {repo.name}
                  </a>
                  <div className="flex gap-3 text-sm text-gray-500 mt-1">
                    <span>⭐ {repo.stars}</span>
                    <span>🍴 {repo.forks}</span>
                    {repo.language && <span className="text-gray-600">{repo.language}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          
          <div>
            <h3 className="text-xl font-semibold mb-2">Top 5 Repos by Stars</h3>
            <BarChartComponent
              data={data.repos.sort((a: any, b: any) => b.stars - a.stars).slice(0, 5)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
