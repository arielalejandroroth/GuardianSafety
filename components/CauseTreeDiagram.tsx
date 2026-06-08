import React, { useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import { NumberedTreeNode } from '../types';

interface Connector {
  path: string;
  yConnector?: { x: number; y: number };
}

/**
 * Parses a string with an indented list into a tree structure using a robust,
 * multi-step, relative indentation algorithm. This approach is highly resilient
 * to inconsistent indentation styles from AI models.
 *
 * How it works:
 * 1. Normalizes line endings and finds the first line that looks like a list item,
 *    effectively ignoring any introductory sentences or paragraphs from the AI.
 * 2. It then strictly filters for lines that begin with a list marker, discarding
 *    any intermittent paragraphs or non-list text that could corrupt the structure.
 * 3. It calculates the minimum indentation across the entire clean list block. This baseline
 *    makes the parser immune to cases where the whole response is indented.
 * 4. Iterates through each line, calculating its indentation relative to this baseline.
 * 5. Uses a standard stack-based algorithm (`parentStack`) to build the hierarchy. For each node,
 *    it finds the correct parent by popping nodes with greater or equal indentation from the stack.
 */
const parseToNumberedTree = (text: string): NumberedTreeNode[] => {
    if (!text || !text.trim()) return [];

    const getIndent = (line: string): number => {
        // First, replace all tabs with 2 spaces to handle mixed indentation
        const normalizedLine = line.replace(/\t/g, '  ');
        // Then, find the index of the first non-whitespace character.
        return normalizedLine.search(/\S|$/);
    };

    const allLines = text
        .replace(/\r\n/g, '\n') // Handle windows line endings
        .split('\n');

    // Find the start of the actual list, ignoring potential introductory sentences.
    const firstListLineIndex = allLines.findIndex(line => line.trim().match(/^[-*•\d\.)]/));
    
    if (firstListLineIndex === -1) {
        console.warn("Could not find a list in the cause tree analysis text.");
        return [];
    }

    // Strictly filter for lines that are part of the list, ignoring anything else.
    const listLines = allLines
        .slice(firstListLineIndex)
        .filter(line => line.trim().match(/^[-*•\d\.)]/));

    if (listLines.length === 0) return [];
    
    // Find the minimum indentation of the list itself to use as a baseline.
    const minIndent = Math.min(...listLines.map(getIndent));

    let counter = 0;
    const rootNodes: NumberedTreeNode[] = [];
    const parentStack: { node: NumberedTreeNode; indent: number }[] = [];

    listLines.forEach(line => {
        // Normalize indent relative to the minimum indent of the block.
        const indent = getIndent(line) - minIndent;

        const nodeText = line.trim().replace(/^[-*•\d\.)]+\s*/, '').trim();

        if (!nodeText) return; // Skip lines that are only bullets/whitespace

        counter++;
        const newNode: NumberedTreeNode = { id: counter, text: nodeText, children: [] };

        // Find the correct parent in the stack by popping nodes with greater or equal indentation.
        while (parentStack.length > 0 && indent <= parentStack[parentStack.length - 1].indent) {
            parentStack.pop();
        }

        if (parentStack.length > 0) {
            // The last node in the stack is the parent.
            parentStack[parentStack.length - 1].node.children.push(newNode);
        } else {
            // No parent in the stack, this is a root node.
            rootNodes.push(newNode);
        }

        // Push the new node onto the stack to act as a potential parent for subsequent nodes.
        parentStack.push({ node: newNode, indent });
    });
    
    return rootNodes;
};


// Recursive component to render the tree structure with only numbers
const RecursiveTree: React.FC<{
  nodes: NumberedTreeNode[];
  setNodeRef: (id: number, el: HTMLDivElement | null) => void;
}> = ({ nodes, setNodeRef }) => {
  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="children-container">
      {nodes.map(node => (
        <div key={node.id} className="tree-diagram-graphical">
          <div className="tree-node-wrapper" ref={el => setNodeRef(node.id, el)}>
             <div className="tree-node-graphical">
              {node.id}
            </div>
          </div>
          {node.children.length > 0 && (
            <RecursiveTree nodes={node.children} setNodeRef={setNodeRef} />
          )}
        </div>
      ))}
    </div>
  );
};

// Component to render the legend
const Legend: React.FC<{ tree: NumberedTreeNode[] }> = ({ tree }) => {
    const legendItems: { id: number; text: string }[] = useMemo(() => {
        const items: { id: number; text: string }[] = [];
        const collectLegendItems = (nodes: NumberedTreeNode[]) => {
            nodes.forEach(node => {
                items.push({ id: node.id, text: node.text });
                if (node.children.length > 0) {
                    collectLegendItems(node.children);
                }
            });
        };
        collectLegendItems(tree);
        items.sort((a,b) => a.id - b.id);
        return items;
    }, [tree]);


    return (
        <div className="tree-legend">
            <h3 className="font-semibold text-lg text-slate-800 mb-4">Referencias</h3>
            <ol>
                {legendItems.map(item => (
                    <li key={item.id}>
                        <span className="legend-number">{item.id}</span>
                        <span className="legend-text">{item.text}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};


const CauseTreeDiagram: React.FC<{ analysisText: string }> = ({ analysisText }) => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const nodeRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  
  const treeData = useMemo(() => parseToNumberedTree(analysisText), [analysisText]);
  
  const setNodeRef = useCallback((id: number, el: HTMLDivElement | null) => {
    if (el) {
      nodeRefs.current.set(id, el);
    } else {
      nodeRefs.current.delete(id);
    }
  }, []);

  useLayoutEffect(() => {
    // A timeout is used to ensure all child nodes have been rendered and their refs populated before calculating connector positions.
    const timer = setTimeout(() => {
        const newConnectors: Connector[] = [];
        const containerEl = containerRef.current;
        
        // Ensure the container and refs are ready
        if (!containerEl || nodeRefs.current.size === 0) {
            setConnectors([]);
            return;
        };

        const containerRect = containerEl.getBoundingClientRect();

        const calculateConnections = (nodes: NumberedTreeNode[]) => {
          nodes.forEach(parent => {
            if (parent.children.length > 0) {
              const parentEl = nodeRefs.current.get(parent.id);
              if (!parentEl) return;
              
              const parentRect = parentEl.getBoundingClientRect();
              const parentCoords = {
                  x: parentRect.left - containerRect.left,
                  y: parentRect.top - containerRect.top,
                  width: parentRect.width,
                  height: parentRect.height,
              };

              const endX = parentCoords.x;
              const endY = parentCoords.y + parentCoords.height / 2;
              
              let firstChildY = Infinity;
              let lastChildY = -Infinity;

              parent.children.forEach(child => {
                const childEl = nodeRefs.current.get(child.id);
                if(childEl) {
                    const childRect = childEl.getBoundingClientRect();
                    const childY = (childRect.top - containerRect.top) + childRect.height / 2;
                    firstChildY = Math.min(firstChildY, childY);
                    lastChildY = Math.max(lastChildY, childY);
                }
              });
              
              const midX = endX - 20;

              if (isFinite(firstChildY) && isFinite(lastChildY)) {
                if (parent.children.length > 1) {
                  const childrenYCenter = (firstChildY + lastChildY) / 2;
                  newConnectors.push({ path: `M ${midX} ${firstChildY} L ${midX} ${lastChildY}` });
                  newConnectors.push({
                    path: `M ${midX} ${childrenYCenter} L ${endX} ${endY}`,
                    yConnector: { x: midX - 4, y: childrenYCenter + 5 }
                  });

                  parent.children.forEach(child => {
                      const childEl = nodeRefs.current.get(child.id);
                      if (childEl) {
                          const childRect = childEl.getBoundingClientRect();
                          const startX = childRect.right - containerRect.left;
                          const startY = (childRect.top - containerRect.top) + childRect.height / 2;
                          newConnectors.push({ path: `M ${startX} ${startY} L ${midX} ${startY}` });
                      }
                  });
                } else {
                   const childEl = nodeRefs.current.get(parent.children[0].id);
                   if (childEl) {
                      const childRect = childEl.getBoundingClientRect();
                      const startX = childRect.right - containerRect.left;
                      const startY = (childRect.top - containerRect.top) + childRect.height / 2;
                      newConnectors.push({ path: `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}` });
                   }
                }
              }
              calculateConnections(parent.children);
            }
          });
        };
        
        calculateConnections(treeData);
        setConnectors(newConnectors);
    }, 100); // A small delay is crucial here.

    return () => clearTimeout(timer);

  }, [treeData]);

  if (!treeData || treeData.length === 0) {
    return <div className="text-center p-4 text-slate-500">No hay datos para mostrar el diagrama. El texto de análisis podría estar vacío o en un formato no reconocido.</div>;
  }

  return (
    <div className="cause-tree-container-graphical">
      <div className="tree-diagram-container" ref={containerRef}>
        <svg className="svg-connectors">
            {connectors.map((c, i) => (
                <g key={i}>
                    <path d={c.path} />
                    {c.yConnector && (
                        <text x={c.yConnector.x} y={c.yConnector.y} className="connector-y">Y</text>
                    )}
                </g>
            ))}
        </svg>
        <RecursiveTree nodes={treeData} setNodeRef={setNodeRef} />
      </div>
      <Legend tree={treeData} />
    </div>
  );
};

export default CauseTreeDiagram;
