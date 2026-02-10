// import { useState, forwardRef, useImperativeHandle } from "react";
import {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import "./BPlusTree.css";

const ORDER = 3;

function createNode(isLeaf = false) {
  return {
    keys: [],
    children: [],
    isLeaf,
    parent: null,
    next: null,
  };
}

const BPlusTree = forwardRef((props, ref) => {
  const [root, setRoot] = useState(createNode(true));
  const [input, setInput] = useState("");

  const [searchKey, setSearchKey] = useState("");
  const [highlightPath, setHighlightPath] = useState(new Set());
  const [searchResult, setSearchResult] = useState(null);

  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [rangeKeys, setRangeKeys] = useState([]);

  const pendingRangeRef = useRef(null);

  /* ---------- PUBLIC API (used by App.js) ---------- */
  useImperativeHandle(
    ref,
    () => ({
      indexSearch: (key) => {
        searchInternal(key);
      },
      indexRangeScan: (from, to) => {
        console.log("indexRangeScan queued:", from, to);
        pendingRangeRef.current = { from, to };
      },

      bulkLoad: (keys) => {
        console.log("bulkLoad keys:", keys);
        let r = createNode(true);
        keys.forEach((k) => {
          r = insertInternal(r, k);
        });
        setRoot(r);
      },
    }),
    [root], // 🔥 THIS IS THE FIX
  );

  /* ---------- SEARCH ---------- */

  const searchInternal = (key) => {
    const path = [];
    let node = root;

    while (node) {
      path.push(node);
      if (node.isLeaf) break;

      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) i++;
      node = node.children[i];
    }

    animatePath(path, key);
  };

  const animatePath = (path, key) => {
    setHighlightPath(new Set());
    setSearchResult(null);
    setRangeKeys([]);

    path.forEach((node, i) => {
      setTimeout(() => {
        setHighlightPath((prev) => new Set([...prev, node]));

        if (i === path.length - 1) {
          const found = node.keys.includes(key);
          setSearchResult({ key, found });
        }
      }, i * 600);
    });
  };

  /* ---------- RANGE SCAN ---------- */

  const findStartLeaf = (key) => {
    let node = root;
    const path = [];

    while (!node.isLeaf) {
      path.push(node);
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) i++;
      node = node.children[i];
    }

    path.push(node);
    return { leaf: node, path };
  };

  const rangeScanInternal = (from, to) => {
    if (from > to) return;

    setHighlightPath(new Set());
    setRangeKeys([]);

    setSearchResult(null);

    const { leaf, path } = findStartLeaf(from);

    // Animate descent
    path.forEach((node, i) => {
      setTimeout(() => {
        setHighlightPath((prev) => new Set([...prev, node]));
      }, i * 500);
    });

    // Walk leaf linked list
    setTimeout(
      () => {
        let curr = leaf;
        let delay = 0;

        while (curr) {
          curr.keys.forEach((k) => {
            if (k > from && k <= to) {
              setTimeout(() => {
                setRangeKeys((prev) => {
                  if (prev.includes(k)) return prev;
                  const next = [...prev, k];
                  console.log("rangeKeys updated:", next);
                  return next;
                });
              }, delay);
              delay += 700;
            }
          });

          if (curr.keys.length && curr.keys[0] > to) break;
          curr = curr.next;
        }
      },
      path.length * 500 + 200,
    );
  };

  /* ---------- INSERT ---------- */

  const insert = () => {
    const key = Number(input);
    if (isNaN(key)) return;

    const newRoot = insertInternal(root, key);
    setRoot(newRoot);
    setInput("");
  };

  const insertInternal = (node, key) => {
    if (node.isLeaf) {
      node.keys.push(key);
      node.keys.sort((a, b) => a - b);

      if (node.keys.length >= ORDER) {
        return splitLeaf(node);
      }
      return getRoot(node);
    }

    let i = 0;
    while (i < node.keys.length && key >= node.keys[i]) i++;
    return insertInternal(node.children[i], key);
  };

  const splitLeaf = (leaf) => {
    const mid = Math.ceil(leaf.keys.length / 2);
    const right = createNode(true);

    right.keys = leaf.keys.splice(mid);
    right.next = leaf.next;
    leaf.next = right;

    right.parent = leaf.parent;
    const promotedKey = right.keys[0];

    if (!leaf.parent) {
      const newRoot = createNode(false);
      newRoot.keys = [promotedKey];
      newRoot.children = [leaf, right];

      leaf.parent = newRoot;
      right.parent = newRoot;
      return newRoot;
    }

    return insertIntoParent(leaf.parent, promotedKey, right);
  };

  const insertIntoParent = (parent, key, rightChild) => {
    let idx = 0;
    while (idx < parent.keys.length && key >= parent.keys[idx]) idx++;

    parent.keys.splice(idx, 0, key);
    parent.children.splice(idx + 1, 0, rightChild);
    rightChild.parent = parent;

    if (parent.keys.length >= ORDER) {
      return splitInternal(parent);
    }

    return getRoot(parent);
  };

  const splitInternal = (node) => {
    const mid = Math.floor(node.keys.length / 2);
    const right = createNode(false);

    const promotedKey = node.keys[mid];

    right.keys = node.keys.splice(mid + 1);
    right.children = node.children.splice(mid + 1);
    right.children.forEach((c) => (c.parent = right));

    node.keys.splice(mid);
    right.parent = node.parent;

    if (!node.parent) {
      const newRoot = createNode(false);
      newRoot.keys = [promotedKey];
      newRoot.children = [node, right];

      node.parent = newRoot;
      right.parent = newRoot;
      return newRoot;
    }

    return insertIntoParent(node.parent, promotedKey, right);
  };

  const getRoot = (node) => {
    while (node.parent) node = node.parent;
    return node;
  };
  useEffect(() => {
    if (!pendingRangeRef.current) return;

    const { from, to } = pendingRangeRef.current;
    pendingRangeRef.current = null;

    console.log("Executing rangeScan AFTER root commit:", from, to);
    rangeScanInternal(from, to);
  }, [root]);

  return (
    <div>
      <h3>B+ Tree Index Explorer</h3>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Insert key"
      />
      <button onClick={insert}>Insert</button>

      <div style={{ marginTop: 20 }}>
        <TreeNode
          node={root}
          highlightPath={highlightPath}
          searchResult={searchResult}
          rangeKeys={rangeKeys}
        />
      </div>
    </div>
  );
});

export default BPlusTree;

function TreeNode({ node, highlightPath, searchResult, rangeKeys }) {
  const isActive = highlightPath.has(node);

  return (
    <div
      className="node"
      style={{
        border: isActive ? "2px solid #f39c12" : "1px solid #555",
        boxShadow: isActive ? "0 0 12px #f39c12" : "none",
      }}
    >
      <div className="keys">
        {node.keys.map((k, i) => {
          let bg = "#555";
          let shadow = "none";

          // single-key search
          if (searchResult && k === searchResult.key) {
            bg = searchResult.found ? "#2ecc71" : "#e74c3c";
          }

          // range scan highlight
          // console.log("rangeScanInternal START:", from, to);

          if (rangeKeys.includes(k)) {
            bg = "#3498db";
            shadow = "0 0 12px #3498db";
            console.log("Checking key:", k);
          }

          return (
            <span
              key={i}
              className="key"
              style={{
                background: bg,
                boxShadow: shadow,
              }}
            >
              {k}
            </span>
          );
        })}
      </div>

      {!node.isLeaf && (
        <div className="children">
          {node.children.map((child, i) => (
            <TreeNode
              key={i}
              node={child}
              highlightPath={highlightPath}
              searchResult={searchResult}
              rangeKeys={rangeKeys}
            />
          ))}
        </div>
      )}
    </div>
  );
}
