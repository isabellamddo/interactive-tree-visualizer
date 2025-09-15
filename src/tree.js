export function buildTree(data) {
    const childrenMap = new Map();
    const allChildren = new Set();

    data.forEach(({ owner, name }) => {
        if (!childrenMap.has(owner)) {
            childrenMap.set(owner, []);
        }
        childrenMap.get(owner).push(name);
        allChildren.add(name);
    });

    const allOwners = [];
    for (const owner of childrenMap.keys()) {
        allOwners.push(owner);
    }

    const roots = [];
    for (const owner of allOwners) {
        if (!allChildren.has(owner)) {
            roots.push(owner);
        }
    }

    if (roots.length !== 1) {
        throw new Error(`Expected exactly 1 root node, found ${roots.length}`);
    }

    return null;
}