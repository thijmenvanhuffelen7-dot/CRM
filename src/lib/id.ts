let counter = 0;
/** Short unique id with a readable prefix, e.g. "t_lx2k9a0f3b". */
export const uid = (prefix = "id") => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
