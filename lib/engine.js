// lib/engine.js

export const WEIGHTS = {
  maintenance: 0.30,
  contributors: 0.20,
  documentation: 0.15,
  security: 0.15,
  community: 0.20,
};

export function calculateScores(raw) {
  const maintenance = Math.min(100, Math.max(10, (raw.commitsLastMonth / 30) * 100));
  const contributors = Math.min(100, Math.max(10, (raw.contributorCount / 50) * 100));
  const documentation = (raw.hasReadme ? 60 : 0) + (raw.readmeLength > 2000 ? 20 : 10) + (raw.hasLicense ? 20 : 0);
  const security = (raw.hasLicense ? 40 : 0) + Math.max(0, 60 - (raw.openIssues * 0.5));
  const community = Math.min(100, (raw.stars / 10000) * 50 + (raw.forks / 2000) * 50);

  const overall = Math.round(
    (maintenance * WEIGHTS.maintenance) +
    (contributors * WEIGHTS.contributors) +
    (documentation * WEIGHTS.documentation) +
    (security * WEIGHTS.security) +
    (community * WEIGHTS.community)
  );

  let status = "Poor";
  let color = "#ef4444"; 
  if (overall >= 85) { status = "Excellent"; color = "#22c55e"; } 
  else if (overall >= 70) { status = "Good"; color = "#3b82f6"; }  
  else if (overall >= 50) { status = "Fair"; color = "#eab308"; }  

  return {
    overall,
    status,
    color,
    breakdown: [
      { subject: 'Maintenance', score: Math.round(maintenance) },
      { subject: 'Contributors', score: Math.round(contributors) },
      { subject: 'Documentation', score: Math.round(documentation) },
      { subject: 'Security', score: Math.round(security) },
      { subject: 'Community', score: Math.round(community) },
    ]
  };
}

export async function fetchRealGitHubData(repoPath) {
  const cleanPath = repoPath.replace('https://github.com/', '').trim();
  
  if (!cleanPath.includes('/')) {
    throw new Error("Invalid format! Use 'owner/repo' structure.");
  }

  const repoRes = await fetch(`https://api.github.com/repos/${cleanPath}`);
  if (!repoRes.ok) {
    if (repoRes.status === 404) throw new Error("Repository not found on GitHub!");
    if (repoRes.status === 403) throw new Error("GitHub API Rate limit hit! Try again later.");
    throw new Error("Failed to fetch repository records.");
  }
  const repoData = await repoRes.json();

  // NEW: Fetch contributor profiles to grab live avatars
  let avatars = [];
  try {
    const contributorsRes = await fetch(`https://api.github.com/repos/${cleanPath}/contributors?per_page=5`);
    if (contributorsRes.ok) {
      const contributorsData = await contributorsRes.json();
      if (Array.isArray(contributorsData)) {
        avatars = contributorsData.map(c => c.avatar_url).filter(Boolean);
      }
    }
  } catch (e) {}

  let hasReadme = false;
  let readmeLength = 0;
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${cleanPath}/readme`);
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      hasReadme = true;
      readmeLength = readmeData.size || 1000;
    }
  } catch (e) {}

  let commitsLastMonth = 5;
  try {
    const microsecsInMonth = 30 * 24 * 60 * 60 * 1000;
    const sinceDate = new Date(Date.now() - microsecsInMonth).toISOString();
    const commitsRes = await fetch(`https://api.github.com/repos/${cleanPath}/commits?since=${sinceDate}&per_page=100`);
    if (commitsRes.ok) {
      const commitsData = await commitsRes.json();
      commitsLastMonth = Array.isArray(commitsData) ? commitsData.length : 5;
    }
  } catch (e) {}

  return {
    name: repoData.full_name,
    commitsLastMonth: commitsLastMonth,
    contributorCount: repoData.subscribers_count || 15,
    hasReadme: hasReadme,
    readmeLength: readmeLength,
    hasLicense: !!repoData.license,
    openIssues: repoData.open_issues_count,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    avatars: avatars // Sent up to our UI dashboard mapping layer
  };
}
