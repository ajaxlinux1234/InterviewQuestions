```typescript

interface Tree {
  name: string;
  parent: number | null;
  id: number
}
function arrToTree(arr: Tree[]) {
  const map: Record<string, Tree> = {};
  while(arr.length) {
    const item = arr.shift();
    map[item.id] = item
    if (item.parent && map[item.parent]) {
      if (!map[item.parent].children) {
        map[item.parent].children = []
      }
      map[item.parent].children.push(item)
    }
  }
  return Object.values(map).find(item => !item.parent)
}
```