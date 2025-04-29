/**
 * Get commit hash
 */
const commit_available = !Number(process.env.IS_STABLE) && !!process.env.COMMIT_HASH;
const commit_hash = (commit_available && `'${process.env.COMMIT_HASH}'`) || undefined;

export default {
  'virtual:commit': `export const commit_hash = ${commit_hash}`
};
