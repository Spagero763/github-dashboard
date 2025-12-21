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

  const fetchData = async () => {
    const usernameInput = document.getElementById("username") as HTMLInputElement;
    const username = usernameInput.value.trim();
    if (!username) return alert("Enter a GitHub username");
    setLoading(true);

    try {
      const userRes = await fetch(`https://api.github.com/users/${username}`);
      const reposRes = await fetch(`https://api.github.com/users/${username}/repos`);
      const userData = await userRes.json();
      const reposData = await reposRes.json();

      setData({
        username: userData.login,
        avatar: userData.avatar_url,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        repos: reposData.map((repo: any) => ({
          name: repo.name,
          stars: repo.stargazers_count,
          url: repo.html_url,
        })),
      });
    } catch (err) {
      alert("Error fetching data");
      console.error(err);
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
          id="username"
          placeholder="GitHub username"
          className="border rounded-md p-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={fetchData}
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition"
        >
          Fetch Data
        </button>
      </div>

      {loading && <p className="text-center text-gray-500">Loading...</p>}

      {data && (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <img src={data.avatar} alt={data.username} className="w-20 h-20 rounded-full" />
            <div>
              <h2 className="text-2xl font-semibold">{data.username}</h2>
              <p className="text-gray-600">Public Repos: {data.publicRepos}</p>
              <p className="text-gray-600">Followers: {data.followers}</p>
            </div>
          </div>

          {/* Repo List */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Repos:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.repos.map((repo: any) => (
                <li
                  key={repo.name}
                  className="border p-2 rounded-md hover:shadow-lg transition cursor-pointer"
                >
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {repo.name}
                  </a>{" "}
                  ⭐ {repo.stars}
                </li>
              ))}
            </ul>
          </div>

          {/* Top Repos Chart */
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
