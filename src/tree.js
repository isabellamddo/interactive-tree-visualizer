export function buildTree(data) {

    const childrenMap = new Map();
    const allChildren = new Set();
    const allOwners = [];

    data.forEach(({ owner, name }) => {
        if (!childrenMap.has(owner)) {
            childrenMap.set(owner, []);
        }
        childrenMap.get(owner).push(name);
        allChildren.add(name);
    });

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
        throw new Error(`Found ${roots.length} root nodes. There should only be 1.`);
    }

    let nodeIDCounter = 0;
    function buildNode(nodeName, parentID = null, depth = 0) {

        console.log(`${nodeName},${depth}`);

        const nodeId = nodeIDCounter++;
        

        const children = childrenMap.get(nodeName) || [];

        return {
            id: nodeId,
            name: nodeName,
            parentID: parentID,
            children: children.map(childName => 
                buildNode(childName, nodeId, depth + 1)
            )
        };
    }

    return buildNode(roots[0]);
}
