export async function getCurrentMacRelease(supabase) {
  const { data, error } = await supabase
    .storage
    .from('releases')
    .download('latest-mac.yml');

  if (error || !data) {
    throw new Error(`Failed to load latest-mac.yml: ${error?.message || 'missing release metadata'}`);
  }

  const latestYaml = await data.text();
  const versionMatch = latestYaml.match(/^version:\s*([^\n\r]+)/m);
  if (!versionMatch) {
    throw new Error('Could not parse version from latest-mac.yml');
  }

  const version = versionMatch[1].trim();
  const dmgName = `LoveLattice-${version}-arm64.dmg`;

  return {
    version,
    dmgName
  };
}
