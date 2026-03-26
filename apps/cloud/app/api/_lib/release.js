const GITHUB_API_RELEASES_LATEST = 'https://api.github.com/repos/JoshPark1/LoveLattice/releases/latest';

export async function getCurrentMacRelease() {
  const response = await fetch(GITHUB_API_RELEASES_LATEST, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'LoveLattice-Cloud'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to load latest GitHub release: HTTP ${response.status}`);
  }

  const release = await response.json();
  const tagName = release.tag_name;
  const version = typeof tagName === 'string' ? tagName.replace(/^v/, '').trim() : '';

  if (!version) {
    throw new Error('Could not parse version from latest GitHub release');
  }

  const dmgName = `LoveLattice-${version}-arm64.dmg`;
  const dmgAsset = Array.isArray(release.assets)
    ? release.assets.find((asset) => asset?.name === dmgName)
    : null;

  if (!dmgAsset?.browser_download_url) {
    throw new Error(`Latest GitHub release is missing ${dmgName}`);
  }

  return {
    version,
    dmgName,
    downloadUrl: dmgAsset.browser_download_url
  };
}
